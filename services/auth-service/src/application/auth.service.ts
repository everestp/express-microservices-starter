import { ConflictError, NotFoundError } from "@starter/errors";
import type {
  AccessTokenIssuer,
  PasswordHasher,
  RefreshTokenRotation,
  UserRepository,
} from "../domain/auth.port.js";
import { toPublicUser } from "../domain/user.js";

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly passwords: PasswordHasher,
    private readonly tokens: AccessTokenIssuer,
    private readonly refreshTokens: RefreshTokenRotation,
  ) {}

  async register(email: string, password: string) {
    if (await this.users.findByEmail(email))
      throw new ConflictError("Account already exists");
    const user = await this.users.create(
      email,
      await this.passwords.hash(password),
    );
    return toPublicUser(user);
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user || !(await this.passwords.verify(user.passwordHash, password))) {
      throw new NotFoundError("Email or password is incorrect");
    }
    const [accessToken, refreshToken] = await Promise.all([
      this.tokens.signAccessToken(user.id),
      this.refreshTokens.issue(user.id),
    ]);
    return { accessToken, refreshToken };
  }

  async refresh(token: string) {
    const rotated = await this.refreshTokens.rotate(token);
    if (!rotated)
      throw new NotFoundError("Refresh token is invalid or has been reused");
    return {
      accessToken: await this.tokens.signAccessToken(rotated.userId),
      refreshToken: rotated.replacement,
    };
  }
}

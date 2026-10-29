import type { User } from "./user.js";

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  create(email: string, passwordHash: string): Promise<User>;
}

export interface PasswordHasher {
  hash(value: string): Promise<string>;
  verify(hash: string, value: string): Promise<boolean>;
}

export interface AccessTokenIssuer {
  signAccessToken(userId: string): Promise<string>;
}

export interface RefreshTokenRotation {
  issue(userId: string): Promise<string>;
  rotate(
    token: string,
  ): Promise<{ userId: string; replacement: string } | null>;
}

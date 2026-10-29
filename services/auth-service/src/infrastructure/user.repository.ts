import type { Pool } from "pg";
import type { UserRepository } from "../domain/auth.port.js";
import type { User } from "../domain/user.js";

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
  };
}

export function createUserRepository(pool: Pool): UserRepository {
  return {
    async findByEmail(email) {
      const result = await pool.query<UserRow>(
        "SELECT id, email, password_hash, created_at FROM users WHERE email = $1",
        [email],
      );
      return result.rows[0] ? mapUser(result.rows[0]) : null;
    },
    async create(email, passwordHash) {
      const result = await pool.query<UserRow>(
        `INSERT INTO users (email, password_hash) VALUES ($1, $2)
         RETURNING id, email, password_hash, created_at`,
        [email, passwordHash],
      );
      return mapUser(result.rows[0]!);
    },
  };
}

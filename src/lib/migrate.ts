import { getPool } from "./db";
import { env } from "./env";

/** 启动时自动建表（幂等） */
export async function ensureTables() {
  const p = env.tablePrefix();
  const pool = getPool();

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS \`${p}users\` (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      email       VARCHAR(255) NOT NULL UNIQUE,
      password    VARCHAR(255) NOT NULL,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

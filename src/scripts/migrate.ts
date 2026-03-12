/**
 * 数据库迁移脚本
 *
 * pnpm db:migrate          → 本地 (.env.local.env → .env)
 * pnpm db:migrate:dev      → 远程 dev (.env.development.env → .env)
 * pnpm db:migrate:prod     → 远程 prod (.env.production.env → .env)
 */
import { resolve } from "path";
import { existsSync } from "fs";
import { config } from "dotenv";

const envFileMap: Record<string, string> = {
  local: ".env.local.env",
  development: ".env.development.env",
  production: ".env.production.env",
};

const target = process.argv[2] || "local";
const envFile = envFileMap[target];

if (!envFile) {
  console.error("❌ 未知环境:", target);
  process.exit(1);
}

const root = resolve(__dirname, "../..");
const envPath = resolve(root, envFile);
const fallbackPath = resolve(root, ".env");

// 优先加载环境文件，不存在则 fallback 到 .env
if (existsSync(envPath)) {
  config({ path: envPath, override: true });
  console.log(`📄 使用 ${envFile}`);
} else if (existsSync(fallbackPath)) {
  config({ path: fallbackPath, override: true });
  console.log(`⚠️  ${envFile} 不存在，使用 .env`);
} else {
  console.error(`❌ ${envFile} 和 .env 都不存在`);
  process.exit(1);
}

console.log(`📦 环境: ${target}`);
console.log(
  `🔗 ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
);

async function main() {
  const { ensureTables } = await import("../lib/migrate");
  const { getPool } = await import("../lib/db");

  await ensureTables();
  console.log("✅ 迁移完成");

  const pool = getPool();
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ 迁移失败:", err);
  process.exit(1);
});

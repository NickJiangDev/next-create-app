/**
 * Vercel Token 读取工具
 *
 * 从 .env.vercel 文件读取 VERCEL_TOKEN
 */
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { parse } from "dotenv";

const root = resolve(__dirname, "../..");

export function getVercelToken(): string {
  const tokenFile = resolve(root, ".env.vercel");
  if (existsSync(tokenFile)) {
    const parsed = parse(readFileSync(tokenFile, "utf-8"));
    if (parsed.VERCEL_TOKEN) {
      return parsed.VERCEL_TOKEN;
    }
  }

  console.error("❌ 找不到 VERCEL_TOKEN");
  console.error("   请创建 .env.vercel 文件写入 VERCEL_TOKEN=xxx");
  process.exit(1);
}

/**
 * Vercel 环境变量同步脚本
 *
 * 读取 .env.production.env（fallback .env），同步到 Vercel production。
 * 已存在的变量会先删除再重新添加。
 *
 * 用法:
 *   VERCEL_TOKEN=xxx pnpm vercel:sync
 *   或配置 .env.vercel 后直接 pnpm vercel:sync
 */
import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { parse } from "dotenv";
import { getVercelToken } from "./vercel-token";

const root = resolve(__dirname, "../..");
const token = getVercelToken();

// 读取配置
const prodEnvFile = resolve(root, ".env.production.env");
const fallbackEnvFile = resolve(root, ".env");

let envSource: string;
if (existsSync(prodEnvFile)) {
  envSource = prodEnvFile;
  console.log("📄 使用 .env.production.env");
} else if (existsSync(fallbackEnvFile)) {
  envSource = fallbackEnvFile;
  console.log("⚠️  .env.production.env 不存在，使用 .env");
} else {
  console.error("❌ 找不到配置文件");
  process.exit(1);
}

const local = parse(readFileSync(envSource, "utf-8"));

// 获取 Vercel 上已有的变量名列表
console.log("🔍 读取 Vercel production 环境变量...\n");

function getExistingKeys(): Set<string> {
  try {
    const output = execSync(
      `npx -y vercel env ls production --token ${token}`,
      { cwd: root, encoding: "utf-8" },
    );
    const keys = new Set<string>();
    for (const line of output.split("\n")) {
      const trimmed = line.trim();
      // 跳过表头和空行
      if (
        !trimmed ||
        trimmed.startsWith(">") ||
        trimmed.includes("Environment") ||
        trimmed.includes("───")
      )
        continue;
      const key = trimmed.split(/\s+/)[0];
      if (key && /^[A-Z_][A-Z0-9_]*$/.test(key)) {
        keys.add(key);
      }
    }
    return keys;
  } catch {
    return new Set();
  }
}

const existingKeys = getExistingKeys();

// 分类
const toAdd: string[] = [];
const toUpdate: string[] = [];

for (const [key, value] of Object.entries(local)) {
  if (!value) continue;
  if (existingKeys.has(key)) {
    toUpdate.push(key);
  } else {
    toAdd.push(key);
  }
}

if (toAdd.length === 0 && toUpdate.length === 0) {
  console.log("✅ 无需同步");
  process.exit(0);
}

console.log("📋 变更清单:");
for (const k of toAdd) console.log(`  + ${k} (新增)`);
for (const k of toUpdate) console.log(`  ~ ${k} (更新)`);
console.log();

function upsertEnv(key: string, value: string) {
  try {
    // 先尝试删除（忽略不存在的情况）
    try {
      execSync(
        `npx -y vercel env rm ${key} production --yes --token ${token}`,
        { cwd: root, stdio: "pipe" },
      );
    } catch {
      // 不存在也没关系
    }
    // 再添加
    execSync(
      `printf '%s' '${value.replace(/'/g, "'\\''")}' | npx -y vercel env add ${key} production --token ${token}`,
      { cwd: root, stdio: "pipe" },
    );
    console.log(`  ✅ ${key}`);
  } catch (err) {
    console.error(`  ❌ ${key}: ${err}`);
  }
}

for (const key of [...toAdd, ...toUpdate]) {
  upsertEnv(key, local[key]);
}

console.log("\n✅ 同步完成！如需生效请重新部署: pnpm vercel:deploy");

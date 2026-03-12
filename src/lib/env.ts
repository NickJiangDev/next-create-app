/** 集中读取环境变量，严禁在其他文件直接 process.env */

function required(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
}

export const env = {
  databaseUrl: () => required("DATABASE_URL"),
  tablePrefix: () => process.env.DB_TABLE_PREFIX || "nca_",
  jwt: {
    secret: () => required("JWT_SECRET"),
  },
  ai: {
    apiKey: () => required("AI_API_KEY"),
    baseUrl: () => required("AI_BASE_URL"),
    model: () => process.env.AI_MODEL || "qwen-plus",
  },
} as const;

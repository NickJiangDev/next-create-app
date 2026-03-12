import { ensureTables } from "./migrate";

let initialized = false;

/** 应用级初始化（仅执行一次） */
export async function initApp() {
  if (initialized) return;
  await ensureTables();
  initialized = true;
}

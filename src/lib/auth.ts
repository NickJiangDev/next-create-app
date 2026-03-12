import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { env } from "./env";

export interface JwtPayload {
  userId: number;
  email: string;
}

const TOKEN_NAME = "token";
const EXPIRES_IN = "7d";

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwt.secret(), { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwt.secret()) as JwtPayload;
}

/** 从 cookie 读取并验证当前用户，失败返回 null */
export async function currentUser(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

/** 设置 token cookie（供 API route 使用） */
export function tokenCookieHeader(token: string) {
  return `${TOKEN_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`;
}

/** 清除 token cookie */
export function clearTokenCookieHeader() {
  return `${TOKEN_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

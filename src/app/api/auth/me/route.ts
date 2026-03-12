import { NextResponse } from "next/server";
import { currentUser, clearTokenCookieHeader } from "@/lib/auth";
import { queryRows } from "@/lib/db";
import { env } from "@/lib/env";
import type { RowDataPacket } from "mysql2/promise";

export async function GET() {
  const payload = await currentUser();
  if (!payload) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // 校验用户在当前数据库中是否存在
  const p = env.tablePrefix();
  const rows = await queryRows<RowDataPacket>(
    `SELECT id, email FROM \`${p}users\` WHERE id = ? AND email = ? LIMIT 1`,
    [payload.userId, payload.email],
  );

  if (rows.length === 0) {
    // 用户在当前库不存在，清除 cookie
    const res = NextResponse.json({ user: null }, { status: 401 });
    res.headers.set("Set-Cookie", clearTokenCookieHeader());
    return res;
  }

  return NextResponse.json({
    user: { userId: payload.userId, email: payload.email },
  });
}

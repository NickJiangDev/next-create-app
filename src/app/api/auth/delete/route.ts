import { NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { env } from "@/lib/env";
import { currentUser, clearTokenCookieHeader } from "@/lib/auth";
import { initApp } from "@/lib/init";

export async function DELETE() {
  await initApp();
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const p = env.tablePrefix();
    await execute(`DELETE FROM \`${p}users\` WHERE id = ?`, [user.userId]);

    const res = NextResponse.json({ ok: true });
    res.headers.set("Set-Cookie", clearTokenCookieHeader());
    return res;
  } catch (err) {
    console.error("delete account error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

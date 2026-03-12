import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { queryRows } from "@/lib/db";
import { env } from "@/lib/env";
import { loginSchema } from "@/lib/schema";
import { signToken, tokenCookieHeader } from "@/lib/auth";
import { initApp } from "@/lib/init";
import type { RowDataPacket } from "mysql2/promise";

interface UserRow extends RowDataPacket {
  id: number;
  password: string;
}

export async function POST(req: Request) {
  await initApp();
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }
    const { email, password } = parsed.data;
    const p = env.tablePrefix();

    const rows = await queryRows<UserRow>(
      `SELECT id, password FROM \`${p}users\` WHERE email = ? LIMIT 1`,
      [email],
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
    }

    const token = signToken({ userId: user.id, email });
    const res = NextResponse.json({ ok: true });
    res.headers.set("Set-Cookie", tokenCookieHeader(token));
    return res;
  } catch (err) {
    console.error("login error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

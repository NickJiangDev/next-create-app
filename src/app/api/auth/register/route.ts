import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { queryRows, execute } from "@/lib/db";
import { env } from "@/lib/env";
import { registerSchema } from "@/lib/schema";
import { signToken, tokenCookieHeader } from "@/lib/auth";
import { initApp } from "@/lib/init";
import type { RowDataPacket } from "mysql2/promise";

interface UserRow extends RowDataPacket {
  id: number;
}

export async function POST(req: Request) {
  await initApp();
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }
    const { email, password } = parsed.data;
    const p = env.tablePrefix();

    const existing = await queryRows<UserRow>(
      `SELECT id FROM \`${p}users\` WHERE email = ? LIMIT 1`,
      [email],
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await execute(
      `INSERT INTO \`${p}users\` (email, password) VALUES (?, ?)`,
      [email, hash],
    );

    const token = signToken({ userId: result.insertId, email });
    const res = NextResponse.json({ ok: true });
    res.headers.set("Set-Cookie", tokenCookieHeader(token));
    return res;
  } catch (err) {
    console.error("register error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

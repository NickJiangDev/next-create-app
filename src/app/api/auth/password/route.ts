import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { queryRows, execute } from "@/lib/db";
import { env } from "@/lib/env";
import { changePasswordSchema } from "@/lib/schema";
import { currentUser } from "@/lib/auth";
import { initApp } from "@/lib/init";
import type { RowDataPacket } from "mysql2/promise";

interface PwdRow extends RowDataPacket {
  password: string;
}

export async function PUT(req: Request) {
  await initApp();
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }
    const { oldPassword, newPassword } = parsed.data;
    const p = env.tablePrefix();

    const rows = await queryRows<PwdRow>(
      `SELECT password FROM \`${p}users\` WHERE id = ? LIMIT 1`,
      [user.userId],
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const match = await bcrypt.compare(oldPassword, rows[0].password);
    if (!match) {
      return NextResponse.json({ error: "旧密码错误" }, { status: 400 });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await execute(`UPDATE \`${p}users\` SET password = ? WHERE id = ?`, [
      hash,
      user.userId,
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("change password error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

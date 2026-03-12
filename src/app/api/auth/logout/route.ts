import { NextResponse } from "next/server";
import { clearTokenCookieHeader } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", clearTokenCookieHeader());
  return res;
}

import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });

  try {
    const [user] = await getDb()`
      SELECT account_id AS "accountId", email, name, password_hash AS "passwordHash"
      FROM users WHERE email = ${email} LIMIT 1
    `;
    if (!user || !(await compare(password, user.passwordHash as string))) {
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }
    const sessionUser = { accountId: user.accountId as string, email: user.email as string, name: user.name as string };
    await createSession(sessionUser);
    return NextResponse.json(sessionUser);
  } catch (error) {
    console.error("Account sign in failed:", error);
    return NextResponse.json({ error: "Sign in is unavailable. Check your database configuration." }, { status: 503 });
  }
}
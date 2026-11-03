import { randomInt } from "node:crypto";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { createSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { name?: unknown; email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter valid account details." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (name.length < 2 || name.length > 60 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 72) {
    return NextResponse.json({ error: "Add a name, valid email, and password of 8 to 72 characters." }, { status: 400 });
  }

  try {
    const passwordHash = await hash(password, 12);
    const accountId = `G-${randomInt(1_000_000_000_000, 10_000_000_000_000)}`;
    const [user] = await getDb()`
      INSERT INTO users (account_id, name, email, password_hash)
      VALUES (${accountId}, ${name}, ${email}, ${passwordHash})
      RETURNING account_id AS "accountId", email, name
    `;
    await createSession(user as { accountId: string; email: string; name: string });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    console.error("Account registration failed:", error);
    return NextResponse.json({ error: "Account setup is unavailable. Check your database configuration." }, { status: 503 });
  }
}
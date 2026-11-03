import { NextResponse } from "next/server";
import { readSession } from "@/lib/session";

export async function GET() {
  const user = await readSession();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  return NextResponse.json(user);
}
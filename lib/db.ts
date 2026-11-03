import { neon } from "@neondatabase/serverless";

export function getDb() {
  if (!process.env.DATABASE_URL) throw new Error("Database is not configured. Add DATABASE_URL to your environment.");
  return neon(process.env.DATABASE_URL);
}
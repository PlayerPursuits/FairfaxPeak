import { NextResponse } from "next/server";
import { sendNewsletters } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

/**
 * Triggered by a scheduler (see vercel.json). Daily runs always send the daily
 * digest; the weekly digest goes out on Mondays unless ?frequency= is given.
 * Requires `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const requested = new URL(req.url).searchParams.get("frequency")?.toUpperCase();
  const frequencies: ("DAILY" | "WEEKLY")[] =
    requested === "DAILY" || requested === "WEEKLY" ? [requested] : new Date().getDay() === 1 ? ["DAILY", "WEEKLY"] : ["DAILY"];

  const results = [];
  for (const f of frequencies) results.push(await sendNewsletters(f));
  return NextResponse.json({ results });
}

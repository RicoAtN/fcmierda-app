import { NextResponse } from "next/server";

export type PlayerStats = {
  player_id: number;
  match_played: number;
  goals: number;
  assists: number;
  clean_sheets: number;
};

// If you have real data, populate it here (ids must match the strings in TeamPage)
const data: PlayerStats[] = [];

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ data });
}
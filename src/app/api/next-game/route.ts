import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "next-game.json");

export async function GET() {
  const data = await fs.readFile(filePath, "utf-8");
  return NextResponse.json(JSON.parse(data));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  await fs.writeFile(filePath, JSON.stringify(body, null, 2));
  return NextResponse.json({ success: true });
}
import { get } from "@vercel/blob";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get("pathname");
  if (!pathname) {
    return NextResponse.json({ error: "Missing pathname" }, { status: 400 });
  }

  try {
    const result = await get(pathname, {
      access: "private",
    });

    if (!result) {
      return new NextResponse("Not found", { status: 404 });
    }

    return new NextResponse(result.stream, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": result.blob.contentType || "image/png",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: any) {
    console.error("GET /api/blob error:", err);
    return new NextResponse("Error fetching blob", { status: 500 });
  }
}

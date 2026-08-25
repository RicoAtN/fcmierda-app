import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";

export const runtime = "nodejs";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

async function cleanupOldBlob(photoUrl: string) {
  if (!photoUrl || !process.env.BLOB_READ_WRITE_TOKEN) return;
  try {
    if (photoUrl.includes("/api/blob?pathname=")) {
      const urlObj = new URL(photoUrl, "http://localhost");
      const pathname = urlObj.searchParams.get("pathname");
      if (pathname) {
        await del(pathname);
      }
    } else if (
      photoUrl.includes(".blob.vercel-storage.com") ||
      photoUrl.startsWith("players/")
    ) {
      await del(photoUrl);
    }
  } catch (err) {
    console.warn("Notice: could not delete old blob:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const oldPhotoUrl = (formData.get("oldPhotoUrl") as string | null) || "";
    const playerName = (formData.get("playerName") as string | null) || "player";

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { success: false, error: "No image file provided." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Please upload a JPEG, PNG, WebP, AVIF, or GIF image.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: "File size exceeds the 5MB limit. Please choose a smaller photo.",
        },
        { status: 400 }
      );
    }

    // Clean up previous photo blob if it exists
    if (oldPhotoUrl) {
      await cleanupOldBlob(oldPhotoUrl);
    }

    // Determine extension
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const sanitizedName = playerName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 30);
    const filename = `players/${sanitizedName}-${Date.now()}.${ext}`;

    // 1. If Vercel Blob token is configured, upload to Vercel Blob
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        // Try public store first
        const blob = await put(filename, file, {
          access: "public",
          addRandomSuffix: true,
        });

        return NextResponse.json({
          success: true,
          url: blob.url,
          source: "vercel-blob-public",
        });
      } catch (pubErr: any) {
        // If the store is configured with private access, use access: "private"
        if (
          pubErr?.message?.includes("private access") ||
          pubErr?.message?.includes("private store") ||
          pubErr?.name === "BlobError"
        ) {
          const blob = await put(filename, file, {
            access: "private",
            addRandomSuffix: true,
          });

          // Serve private blob via internal streaming endpoint
          const serveUrl = `/api/blob?pathname=${encodeURIComponent(blob.pathname)}`;

          return NextResponse.json({
            success: true,
            url: serveUrl,
            source: "vercel-blob-private",
          });
        }
        throw pubErr;
      }
    }

    // 2. Local Fallback (Base64 data URL) if Vercel Blob token is not configured
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      source: "fallback-data-url",
      notice:
        "Saved via local fallback. Add BLOB_READ_WRITE_TOKEN on Vercel to store on Vercel Blob CDN.",
    });
  } catch (err: any) {
    console.error("Player photo upload error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to upload photo." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { photoUrl } = await req.json();

    if (photoUrl) {
      await cleanupOldBlob(photoUrl);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Player photo delete error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to delete photo blob." },
      { status: 500 }
    );
  }
}

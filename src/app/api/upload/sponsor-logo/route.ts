import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";

export const runtime = "nodejs";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

async function cleanupOldBlob(logoUrl: string) {
  if (!logoUrl || !process.env.BLOB_READ_WRITE_TOKEN) return;
  try {
    if (logoUrl.includes("/api/blob?pathname=")) {
      const urlObj = new URL(logoUrl, "http://localhost");
      const pathname = urlObj.searchParams.get("pathname");
      if (pathname) {
        await del(pathname);
      }
    } else if (
      logoUrl.includes(".blob.vercel-storage.com") ||
      logoUrl.startsWith("sponsors/")
    ) {
      await del(logoUrl);
    }
  } catch (err) {
    console.warn("Notice: could not delete old sponsor logo blob:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const oldLogoUrl = (formData.get("oldLogoUrl") as string | null) || "";
    const sponsorName = (formData.get("sponsorName") as string | null) || "sponsor";

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
          error: "Invalid file type. Please upload a JPEG, PNG, WebP, AVIF, SVG, or GIF image.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: "File size exceeds 5MB limit. Please upload a smaller image.",
        },
        { status: 400 }
      );
    }

    // Clean up previous logo blob if it exists
    if (oldLogoUrl) {
      await cleanupOldBlob(oldLogoUrl);
    }

    // Determine extension
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const sanitizedName = sponsorName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 30);
    const filename = `sponsors/${sanitizedName}-${Date.now()}.${ext}`;

    // 1. Upload to Vercel Blob if token configured
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
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
        // If the store requires private access
        if (
          pubErr?.message?.includes("private access") ||
          pubErr?.message?.includes("private store") ||
          pubErr?.name === "BlobError"
        ) {
          const blob = await put(filename, file, {
            access: "private",
            addRandomSuffix: true,
          });

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

    // Fallback if no token (e.g. local dev without env)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = `data:${file.type};base64,${buffer.toString("base64")}`;

    return NextResponse.json({
      success: true,
      url: base64Data,
      source: "data-url-fallback",
    });
  } catch (err: any) {
    console.error("Sponsor logo upload error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to upload image. Please try again.",
      },
      { status: 500 }
    );
  }
}

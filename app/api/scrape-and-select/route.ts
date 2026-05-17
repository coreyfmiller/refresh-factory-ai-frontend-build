import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { selectBestImages } from "@/lib/image-selector";

export const maxDuration = 180;
export const dynamic = "force-dynamic";

async function downloadAndUpload(imageUrl: string, name: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RefreshFactory/1.0)" },
      redirect: "follow",
    });
    if (!res.ok) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 1000) return null; // Skip tiny images

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const filename = `${name}.${ext}`;

    const blob = await put(filename, buffer, { access: "public", contentType });
    return blob.url;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

    // Step 1: Scrape
    console.log("[scrape-and-select] Scraping:", url);
    const scrapeRes = await fetch(`${request.nextUrl.origin}/api/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!scrapeRes.ok) {
      return NextResponse.json({ error: "Scrape failed" }, { status: 500 });
    }

    const scrapeData = await scrapeRes.json();

    // Step 2: Select best images
    const curated = selectBestImages(scrapeData.images);
    console.log("[scrape-and-select] Selected:", {
      hero: !!curated.hero,
      about: !!curated.about,
      gallery: curated.gallery.length,
    });

    // Step 3: Upload to Vercel Blob
    const uploaded: { hero: string | null; about: string | null; gallery: string[] } = {
      hero: null,
      about: null,
      gallery: [],
    };

    if (curated.hero) {
      uploaded.hero = await downloadAndUpload(curated.hero, "hero");
      console.log("[scrape-and-select] Hero uploaded:", !!uploaded.hero);
    }

    if (curated.about) {
      uploaded.about = await downloadAndUpload(curated.about, "about");
      console.log("[scrape-and-select] About uploaded:", !!uploaded.about);
    }

    for (let i = 0; i < curated.gallery.length; i++) {
      const blobUrl = await downloadAndUpload(curated.gallery[i], `gallery-${i + 1}`);
      if (blobUrl) uploaded.gallery.push(blobUrl);
    }

    console.log("[scrape-and-select] Gallery uploaded:", uploaded.gallery.length);

    return NextResponse.json({
      success: true,
      original: curated,
      uploaded,
      title: scrapeData.title,
    });
  } catch (error) {
    console.error("[scrape-and-select] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}

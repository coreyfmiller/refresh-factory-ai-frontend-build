import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { selectBestImages } from "@/lib/image-selector";

export const maxDuration = 180;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

    const browserlessKey = process.env.BROWSERLESS_API_KEY;
    if (!browserlessKey) return NextResponse.json({ error: "Not configured" }, { status: 500 });

    // Step 1: Scrape to get image list with context
    console.log("[scrape-and-select] Scraping:", url);
    const scrapeRes = await fetch(`${request.nextUrl.origin}/api/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!scrapeRes.ok) return NextResponse.json({ error: "Scrape failed" }, { status: 500 });
    const scrapeData = await scrapeRes.json();

    // Step 2: Select best images
    const curated = selectBestImages(scrapeData.images);
    console.log("[scrape-and-select] Selected:", { hero: !!curated.hero, about: !!curated.about, gallery: curated.gallery.length });

    // Step 3: Use Browserless to download images as base64 (bypasses CDN auth)
    const imagesToDownload: { url: string; name: string }[] = [];
    if (curated.hero) imagesToDownload.push({ url: curated.hero, name: "hero" });
    if (curated.about) imagesToDownload.push({ url: curated.about, name: "about" });
    curated.gallery.forEach((u, i) => imagesToDownload.push({ url: u, name: `gallery-${i + 1}` }));

    // Download all images via Browserless (it has the session/cookies)
    const downloadRes = await fetch(
      `https://production-sfo.browserless.io/function?token=${browserlessKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: `
            export default async function ({ page }) {
              const urls = ${JSON.stringify(imagesToDownload.map(i => i.url))};
              const results = [];

              for (const imgUrl of urls) {
                try {
                  const response = await page.evaluate(async (url) => {
                    try {
                      const res = await fetch(url);
                      if (!res.ok) return null;
                      const blob = await res.blob();
                      return new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                      });
                    } catch {
                      return null;
                    }
                  }, imgUrl);
                  results.push(response);
                } catch {
                  results.push(null);
                }
              }

              return { results, type: "application/json" };
            }
          `,
        }),
      }
    );

    const uploaded: { hero: string | null; about: string | null; gallery: string[] } = {
      hero: null,
      about: null,
      gallery: [],
    };

    if (downloadRes.ok) {
      const downloadData = await downloadRes.json();
      const results: (string | null)[] = downloadData.results || [];

      for (let i = 0; i < imagesToDownload.length; i++) {
        const dataUrl = results[i];
        if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) continue;

        try {
          // Parse data URL
          const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (!matches) continue;

          const contentType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, "base64");

          if (buffer.length < 1000) continue; // Skip tiny

          const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
          const filename = `${imagesToDownload[i].name}.${ext}`;

          // Upload to Vercel Blob
          const blob = await put(filename, buffer, { access: "public", contentType });
          const blobUrl = blob.url;

          // Assign to the right slot
          if (imagesToDownload[i].name === "hero") uploaded.hero = blobUrl;
          else if (imagesToDownload[i].name === "about") uploaded.about = blobUrl;
          else uploaded.gallery.push(blobUrl);

          console.log(`[scrape-and-select] Uploaded ${filename}: ${blobUrl}`);
        } catch (e) {
          console.error(`[scrape-and-select] Failed to upload ${imagesToDownload[i].name}:`, e);
        }
      }
    } else {
      console.error("[scrape-and-select] Browserless download failed:", await downloadRes.text());
    }

    console.log("[scrape-and-select] Final:", { hero: !!uploaded.hero, about: !!uploaded.about, gallery: uploaded.gallery.length });

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

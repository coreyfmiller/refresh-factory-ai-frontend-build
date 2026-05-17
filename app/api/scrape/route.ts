import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

function resolveUrl(base: string, relative: string | undefined | null): string {
  if (!relative) return "";
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}

async function scrapePageImages(pageUrl: string, browserlessKey: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://production-sfo.browserless.io/function?token=${browserlessKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: `
            export default async function ({ page }) {
              await page.goto("${pageUrl}", { waitUntil: "networkidle2", timeout: 15000 });
              await page.evaluate(async () => {
                const delay = (ms) => new Promise(r => setTimeout(r, ms));
                const height = document.body.scrollHeight;
                for (let i = 0; i <= height; i += Math.floor(height / 4)) {
                  window.scrollTo(0, i);
                  await delay(250);
                }
              });
              await new Promise(r => setTimeout(r, 1000));
              const images = await page.evaluate(() => {
                const imgs = new Set();
                document.querySelectorAll("img").forEach((el) => {
                  const src = el.src || el.dataset.src || el.dataset.lazySrc;
                  if (src && !src.includes("data:image/svg") && !src.includes("1x1") && src.startsWith("http")) {
                    imgs.add(src);
                  }
                  const srcset = el.getAttribute("srcset");
                  if (srcset) {
                    const parts = srcset.split(",").map(s => s.trim().split(/\\s+/)[0]).filter(Boolean);
                    parts.forEach(p => { if (p.startsWith("http")) imgs.add(p); });
                  }
                });
                document.querySelectorAll("[style*='background']").forEach((el) => {
                  const match = el.style.backgroundImage?.match(/url\\(['"]?([^'"\\)]+)['"]?\\)/);
                  if (match && match[1].startsWith("http")) imgs.add(match[1]);
                });
                document.querySelectorAll("[data-background], [data-bg], [data-image]").forEach((el) => {
                  const bg = el.getAttribute("data-background") || el.getAttribute("data-bg") || el.getAttribute("data-image");
                  if (bg && bg.startsWith("http")) imgs.add(bg);
                });
                document.querySelectorAll("picture source").forEach((el) => {
                  const srcset = el.getAttribute("srcset");
                  if (srcset) {
                    const parts = srcset.split(",").map(s => s.trim().split(/\\s+/)[0]).filter(Boolean);
                    parts.forEach(p => { if (p.startsWith("http")) imgs.add(p); });
                  }
                });
                return Array.from(imgs);
              });
              return { images, type: "application/json" };
            }
          `,
        }),
      }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.images || [];
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

    const browserlessKey = process.env.BROWSERLESS_API_KEY;
    if (!browserlessKey) {
      return NextResponse.json({ error: "Scraper not configured" }, { status: 500 });
    }

    console.log("[scrape] Starting:", url);

    // Step 1: Scrape the main page (with scroll)
    const mainResponse = await fetch(
      `https://production-sfo.browserless.io/function?token=${browserlessKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: `
            export default async function ({ page }) {
              await page.goto("${url}", { waitUntil: "networkidle2", timeout: 20000 });
              await page.evaluate(async () => {
                const delay = (ms) => new Promise(r => setTimeout(r, ms));
                const height = document.body.scrollHeight;
                for (let i = 0; i <= height; i += Math.floor(height / 5)) {
                  window.scrollTo(0, i);
                  await delay(300);
                }
                window.scrollTo(0, 0);
              });
              await new Promise(r => setTimeout(r, 1500));

              const images = await page.evaluate(() => {
                const imgs = new Set();
                document.querySelectorAll("img").forEach((el) => {
                  const src = el.src || el.dataset.src || el.dataset.lazySrc;
                  if (src && !src.includes("data:image/svg") && !src.includes("1x1") && src.startsWith("http")) {
                    imgs.add(src);
                  }
                  const srcset = el.getAttribute("srcset");
                  if (srcset) {
                    const candidates = srcset.split(",").map(s => s.trim().split(/\\s+/));
                    candidates.sort((a, b) => (parseInt(b[1]) || 0) - (parseInt(a[1]) || 0));
                    if (candidates[0] && candidates[0][0].startsWith("http")) imgs.add(candidates[0][0]);
                  }
                });
                document.querySelectorAll("[style*='background']").forEach((el) => {
                  const match = el.style.backgroundImage?.match(/url\\(['"]?([^'"\\)]+)['"]?\\)/);
                  if (match && match[1].startsWith("http")) imgs.add(match[1]);
                });
                document.querySelectorAll("[data-background], [data-bg], [data-image]").forEach((el) => {
                  const bg = el.getAttribute("data-background") || el.getAttribute("data-bg") || el.getAttribute("data-image");
                  if (bg && bg.startsWith("http")) imgs.add(bg);
                });
                document.querySelectorAll("picture source").forEach((el) => {
                  const srcset = el.getAttribute("srcset");
                  if (srcset) {
                    const parts = srcset.split(",").map(s => s.trim().split(/\\s+/)[0]);
                    parts.forEach(p => { if (p.startsWith("http")) imgs.add(p); });
                  }
                });
                return Array.from(imgs);
              });

              // Get internal links
              const internalLinks = await page.evaluate((baseUrl) => {
                const links = new Set();
                const base = new URL(baseUrl);
                document.querySelectorAll("a[href]").forEach((a) => {
                  try {
                    const href = new URL(a.getAttribute("href"), baseUrl);
                    if (href.hostname === base.hostname && href.pathname !== base.pathname && !href.hash) {
                      links.add(href.href);
                    }
                  } catch {}
                });
                return Array.from(links).slice(0, 5);
              }, "${url}");

              // Get logos
              const logos = await page.evaluate(() => {
                const found = new Set();
                document.querySelectorAll('img[class*="logo"], img[alt*="logo"], img[id*="logo"], [class*="logo"] img, header img').forEach((el) => {
                  if (el.src && el.src.startsWith("http")) found.add(el.src);
                });
                return Array.from(found);
              });

              const title = document.title || "";

              const html = await page.content();
              return { images, internalLinks, logos, title, html, type: "application/json" };
            }
          `,
        }),
      }
    );

    if (!mainResponse.ok) {
      const err = await mainResponse.text();
      console.error("[scrape] Main page failed:", err);
      return NextResponse.json({ error: "Failed to scrape main page" }, { status: 500 });
    }

    const mainData = await mainResponse.json();
    const allImages = new Set<string>(mainData.images || []);
    const logos: string[] = mainData.logos || [];
    const title: string = mainData.title || "";
    const internalLinks: string[] = mainData.internalLinks || [];

    console.log(`[scrape] Main page: ${allImages.size} images, ${internalLinks.length} internal links`);

    // Step 2: Scrape internal pages for more images
    if (internalLinks.length > 0) {
      const subResults = await Promise.all(
        internalLinks.slice(0, 5).map((link) => scrapePageImages(link, browserlessKey))
      );
      for (const pageImages of subResults) {
        for (const img of pageImages) {
          allImages.add(img);
        }
      }
      console.log(`[scrape] After sub-pages: ${allImages.size} total images`);
    }

    // Also parse HTML with cheerio for anything missed
    if (mainData.html) {
      const $ = cheerio.load(mainData.html);
      $("img").each((_, el) => {
        const src = $(el).attr("src") || $(el).attr("data-src");
        if (src) {
          const resolved = resolveUrl(url, src);
          if (resolved.startsWith("http") && !resolved.includes("data:image/svg")) {
            allImages.add(resolved);
          }
        }
      });
    }

    const images = [...allImages].slice(0, 30);

    console.log(`[scrape] Final: ${images.length} images, ${logos.length} logos`);

    return NextResponse.json({
      images,
      logos: [...new Set(logos)].slice(0, 5),
      title,
      imageCount: images.length,
    });
  } catch (error) {
    console.error("[scrape] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scrape failed" },
      { status: 500 }
    );
  }
}

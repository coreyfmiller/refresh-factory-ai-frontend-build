import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

interface ScrapedImage {
  url: string;
  context: string; // "hero" | "about" | "gallery" | "services" | "header" | "team" | "unknown"
  nearText: string; // nearby heading or alt text
  page: string; // which URL it was found on
}

function resolveUrl(base: string, relative: string | undefined | null): string {
  if (!relative) return "";
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}

function guessContext(el: cheerio.Element, $: cheerio.CheerioAPI): { context: string; nearText: string } {
  // Walk up the DOM to find context clues
  let current = $(el);
  let context = "unknown";
  let nearText = "";

  for (let i = 0; i < 5; i++) {
    const parent = current.parent();
    if (!parent.length) break;

    const parentClass = (parent.attr("class") || "").toLowerCase();
    const parentId = (parent.attr("id") || "").toLowerCase();
    const combined = `${parentClass} ${parentId}`;

    if (combined.match(/hero|banner|slider|carousel|jumbotron/)) { context = "hero"; break; }
    if (combined.match(/about|owner|team|bio|founder/)) { context = "about"; break; }
    if (combined.match(/gallery|portfolio|projects|work|photos/)) { context = "gallery"; break; }
    if (combined.match(/service|feature|offer|what-we/)) { context = "services"; break; }
    if (combined.match(/header|nav|logo|brand/)) { context = "header"; break; }
    if (combined.match(/testimonial|review|client/)) { context = "testimonial"; break; }
    if (combined.match(/footer/)) { context = "footer"; break; }

    current = parent;
  }

  // Get nearby heading text
  const closestSection = $(el).closest("section, [class*='section'], [class*='block'], [class*='row']");
  const heading = closestSection.find("h1, h2, h3").first().text().trim();
  nearText = heading || $(el).attr("alt") || "";

  return { context, nearText };
}

async function scrapePageWithContext(pageUrl: string, browserlessKey: string): Promise<{ images: ScrapedImage[]; html: string }> {
  try {
    const response = await fetch(
      `https://production-sfo.browserless.io/function?token=${browserlessKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: `
            export default async function ({ page }) {
              await page.goto("${pageUrl}", { waitUntil: "networkidle2", timeout: 20000 });
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
              const html = await page.content();
              return { html, type: "application/json" };
            }
          `,
        }),
      }
    );
    if (!response.ok) return { images: [], html: "" };
    const data = await response.json();
    return { images: [], html: data.html || "" };
  } catch {
    return { images: [], html: "" };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

    const browserlessKey = process.env.BROWSERLESS_API_KEY;
    if (!browserlessKey) return NextResponse.json({ error: "Scraper not configured" }, { status: 500 });

    console.log("[scrape] Starting:", url);

    // Scrape main page
    const mainResult = await scrapePageWithContext(url, browserlessKey);
    if (!mainResult.html) {
      return NextResponse.json({ error: "Failed to load page" }, { status: 500 });
    }

    const $ = cheerio.load(mainResult.html);
    const allImages: ScrapedImage[] = [];
    const seenUrls = new Set<string>();

    // Extract images with context from main page
    $("img").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src") || $(el).attr("data-lazy-src");
      if (!src || src.includes("data:image/svg") || src.includes("1x1")) return;
      const resolved = resolveUrl(url, src);
      if (!resolved.startsWith("http") || seenUrls.has(resolved)) return;
      seenUrls.add(resolved);

      const { context, nearText } = guessContext(el, $);
      allImages.push({ url: resolved, context, nearText, page: url });
    });

    // Background images
    $("[style*='background-image'], [style*='background:']").each((_, el) => {
      const style = $(el).attr("style") || "";
      const match = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
      if (!match) return;
      const resolved = resolveUrl(url, match[1]);
      if (!resolved.startsWith("http") || seenUrls.has(resolved)) return;
      seenUrls.add(resolved);

      const { context, nearText } = guessContext(el, $);
      allImages.push({ url: resolved, context: context === "unknown" ? "hero" : context, nearText, page: url });
    });

    // Data attributes
    $("[data-background], [data-bg], [data-image]").each((_, el) => {
      const bg = $(el).attr("data-background") || $(el).attr("data-bg") || $(el).attr("data-image");
      if (!bg) return;
      const resolved = resolveUrl(url, bg);
      if (!resolved.startsWith("http") || seenUrls.has(resolved)) return;
      seenUrls.add(resolved);

      const { context, nearText } = guessContext(el, $);
      allImages.push({ url: resolved, context, nearText, page: url });
    });

    // Srcset
    $("img[srcset], picture source[srcset]").each((_, el) => {
      const srcset = $(el).attr("srcset");
      if (!srcset) return;
      const candidates = srcset.split(",").map(s => {
        const parts = s.trim().split(/\s+/);
        return { url: parts[0], size: parseInt(parts[1]) || 1 };
      });
      candidates.sort((a, b) => b.size - a.size);
      if (candidates[0]?.url) {
        const resolved = resolveUrl(url, candidates[0].url);
        if (resolved.startsWith("http") && !seenUrls.has(resolved)) {
          seenUrls.add(resolved);
          const { context, nearText } = guessContext(el, $);
          allImages.push({ url: resolved, context, nearText, page: url });
        }
      }
    });

    // Get internal links
    const internalLinks: string[] = [];
    const base = new URL(url);
    $("a[href]").each((_, el) => {
      try {
        const href = new URL($(el).attr("href") || "", url);
        if (href.hostname === base.hostname && href.pathname !== base.pathname && !href.hash) {
          if (!internalLinks.includes(href.href)) internalLinks.push(href.href);
        }
      } catch {}
    });

    // Scrape internal pages
    console.log(`[scrape] Found ${internalLinks.length} internal links, scraping up to 5...`);
    const subPages = internalLinks.slice(0, 5);
    for (const subUrl of subPages) {
      const subResult = await scrapePageWithContext(subUrl, browserlessKey);
      if (!subResult.html) continue;

      const sub$ = cheerio.load(subResult.html);
      sub$("img").each((_, el) => {
        const src = sub$(el).attr("src") || sub$(el).attr("data-src") || sub$(el).attr("data-lazy-src");
        if (!src || src.includes("data:image/svg") || src.includes("1x1")) return;
        const resolved = resolveUrl(subUrl, src);
        if (!resolved.startsWith("http") || seenUrls.has(resolved)) return;
        seenUrls.add(resolved);

        const { context, nearText } = guessContext(el, sub$);
        allImages.push({ url: resolved, context, nearText, page: subUrl });
      });
    }

    // Extract logos
    const logos: string[] = [];
    $('img[class*="logo"], img[alt*="logo"], img[id*="logo"], [class*="logo"] img, header img').each((_, el) => {
      const src = $(el).attr("src");
      if (src) {
        const resolved = resolveUrl(url, src);
        if (resolved.startsWith("http")) logos.push(resolved);
      }
    });

    const title = $("title").text().trim();

    console.log(`[scrape] Done: ${allImages.length} images with context`);

    return NextResponse.json({
      images: allImages.slice(0, 30),
      logos: [...new Set(logos)].slice(0, 5),
      title,
      imageCount: allImages.length,
    });
  } catch (error) {
    console.error("[scrape] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scrape failed" },
      { status: 500 }
    );
  }
}

import * as cheerio from "cheerio";

export interface ScrapedData {
  url: string;
  title: string;
  description: string;
  ogImage: string | null;
  favicon: string | null;
  logos: string[];
  images: string[];
  colors: string[];
  fonts: string[];
  headings: { level: number; text: string }[];
  navLinks: string[];
  heroText: string | null;
  heroSubtext: string | null;
  socialLinks: string[];
  metaTags: Record<string, string>;
  bodyText: string;
  screenshot: Buffer | null;
}

function resolveUrl(base: string, relative: string | undefined | null): string {
  if (!relative) return "";
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}

async function takeScreenshot(url: string): Promise<Buffer | null> {
  const browserlessKey = process.env.BROWSERLESS_API_KEY;
  if (!browserlessKey) return null;

  try {
    const response = await fetch(
      `https://production-sfo.browserless.io/screenshot?token=${browserlessKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          options: {
            fullPage: true,
            type: "png",
          },
          gotoOptions: {
            waitUntil: "networkidle2",
            timeout: 15000,
          },
          viewport: {
            width: 1440,
            height: 900,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("[scraper] Screenshot failed:", response.status, await response.text());
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
  } catch (error) {
    console.error("[scraper] Screenshot error:", error);
    return null;
  }
}

async function scrapeContent(url: string): Promise<{ html: string; styles: { colors: string[]; fonts: string[] } }> {
  const browserlessKey = process.env.BROWSERLESS_API_KEY;
  if (!browserlessKey) {
    // Fallback: simple fetch
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    return { html: await response.text(), styles: { colors: [], fonts: [] } };
  }

  // Use Browserless /function endpoint to get HTML + computed styles
  const response = await fetch(
    `https://production-sfo.browserless.io/function?token=${browserlessKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: `
          export default async function ({ page }) {
            await page.goto("${url}", { waitUntil: "networkidle2", timeout: 15000 });
            await new Promise(r => setTimeout(r, 2000));

            const styles = await page.evaluate(() => {
              const colors = new Set();
              const fonts = new Set();
              const elements = document.querySelectorAll("*");

              elements.forEach((el) => {
                const style = window.getComputedStyle(el);
                const bgColor = style.backgroundColor;
                const textColor = style.color;
                const fontFamily = style.fontFamily;

                if (bgColor && bgColor !== "rgba(0, 0, 0, 0)" && bgColor !== "transparent") {
                  colors.add(bgColor);
                }
                if (textColor) {
                  colors.add(textColor);
                }
                if (fontFamily) {
                  const primary = fontFamily.split(",")[0].trim().replace(/['"]/g, "");
                  if (primary && !primary.includes("inherit")) {
                    fonts.add(primary);
                  }
                }
              });

              return {
                colors: Array.from(colors).slice(0, 20),
                fonts: Array.from(fonts).slice(0, 10),
              };
            });

            const html = await page.content();
            return { html, styles, type: "application/json" };
          }
        `,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[scraper] Function endpoint failed:", response.status, errorText);
    // Fallback to simple scrape endpoint
    const scrapeResponse = await fetch(
      `https://production-sfo.browserless.io/scrape?token=${browserlessKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          elements: [{ selector: "html" }],
          gotoOptions: { waitUntil: "networkidle2", timeout: 15000 },
        }),
      }
    );

    if (!scrapeResponse.ok) {
      // Final fallback: plain fetch
      const plainResponse = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      return { html: await plainResponse.text(), styles: { colors: [], fonts: [] } };
    }

    const scrapeData = await scrapeResponse.json();
    const html = scrapeData.data?.[0]?.results?.[0]?.html || "";
    return { html, styles: { colors: [], fonts: [] } };
  }

  const data = await response.json();
  return {
    html: data.html || "",
    styles: data.styles || { colors: [], fonts: [] },
  };
}

export async function scrapeWebsite(url: string): Promise<ScrapedData> {
  // Run screenshot and content scrape in parallel
  const [screenshot, { html, styles }] = await Promise.all([
    takeScreenshot(url),
    scrapeContent(url),
  ]);

  const $ = cheerio.load(html);

  // Extract meta tags
  const metaTags: Record<string, string> = {};
  $("meta").each((_, el) => {
    const name =
      $(el).attr("name") || $(el).attr("property") || $(el).attr("http-equiv");
    const content = $(el).attr("content");
    if (name && content) {
      metaTags[name] = content;
    }
  });

  // Extract title
  const title =
    $("title").text() || metaTags["og:title"] || metaTags["twitter:title"] || "";

  // Extract description
  const description =
    metaTags["description"] ||
    metaTags["og:description"] ||
    metaTags["twitter:description"] ||
    "";

  // Extract OG image
  const ogImage = metaTags["og:image"]
    ? resolveUrl(url, metaTags["og:image"])
    : null;

  // Extract favicon
  const favicon = resolveUrl(
    url,
    $('link[rel="icon"]').attr("href") ||
      $('link[rel="shortcut icon"]').attr("href") ||
      "/favicon.ico"
  );

  // Extract logos
  const logos: string[] = [];
  $(
    'img[class*="logo"], img[alt*="logo"], img[id*="logo"], [class*="logo"] img, header img'
  ).each((_, el) => {
    const src = $(el).attr("src");
    if (src) logos.push(resolveUrl(url, src));
  });

  // Extract images (top 20)
  const images: string[] = [];
  $("img").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src") || $(el).attr("data-lazy-src");
    if (src && !src.includes("data:image/svg") && !src.includes("1x1")) {
      images.push(resolveUrl(url, src));
    }

    // Parse srcset — grab the largest resolution
    const srcset = $(el).attr("srcset");
    if (srcset) {
      const candidates = srcset.split(",").map((s) => {
        const parts = s.trim().split(/\s+/);
        const imgUrl = parts[0];
        const descriptor = parts[1] || "1x";
        const size = parseInt(descriptor) || 1;
        return { url: imgUrl, size };
      });
      // Sort by size descending, take the largest
      candidates.sort((a, b) => b.size - a.size);
      if (candidates[0]?.url) {
        images.push(resolveUrl(url, candidates[0].url));
      }
    }
  });

  // Parse <picture> and <source> elements
  $("picture source").each((_, el) => {
    const srcset = $(el).attr("srcset");
    if (srcset) {
      const candidates = srcset.split(",").map((s) => {
        const parts = s.trim().split(/\s+/);
        return { url: parts[0], size: parseInt(parts[1]) || 1 };
      });
      candidates.sort((a, b) => b.size - a.size);
      if (candidates[0]?.url) {
        images.push(resolveUrl(url, candidates[0].url));
      }
    }
  });

  // Background images from inline styles
  $("[style*='background-image'], [style*='background:']").each((_, el) => {
    const style = $(el).attr("style") || "";
    const match = style.match(/url\(['"]?([^'")\s]+)['"]?\)/);
    if (match && !match[1].includes("data:image/svg")) {
      images.push(resolveUrl(url, match[1]));
    }
  });

  // data-background and other common lazy-load attributes
  $("[data-background], [data-bg], [data-image]").each((_, el) => {
    const bg = $(el).attr("data-background") || $(el).attr("data-bg") || $(el).attr("data-image");
    if (bg && !bg.includes("data:image/svg")) {
      images.push(resolveUrl(url, bg));
    }
  });

  // Extract headings
  const headings: { level: number; text: string }[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const level = parseInt(el.tagName.replace("h", ""));
    const text = $(el).text().trim();
    if (text) headings.push({ level, text });
  });

  // Extract navigation links
  const navLinks: string[] = [];
  $("nav a, header a, [role='navigation'] a").each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length < 50) navLinks.push(text);
  });

  // Extract hero text
  const heroText = $("h1").first().text().trim() || null;
  const heroSubtext =
    $("h1").first().next("p, span, h2").text().trim() ||
    $("[class*='hero'] p, [class*='banner'] p").first().text().trim() ||
    null;

  // Extract social links
  const socialLinks: string[] = [];
  const socialPatterns = [
    "facebook",
    "twitter",
    "instagram",
    "linkedin",
    "youtube",
    "tiktok",
    "github",
  ];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (socialPatterns.some((p) => href.includes(p))) {
      socialLinks.push(href);
    }
  });

  // Extract body text
  const bodyText = $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 3000);

  return {
    url,
    title,
    description,
    ogImage,
    favicon,
    logos: [...new Set(logos)].slice(0, 5),
    images: [...new Set(images)].slice(0, 20),
    colors: styles.colors,
    fonts: styles.fonts,
    headings: headings.slice(0, 20),
    navLinks: [...new Set(navLinks)].slice(0, 15),
    heroText,
    heroSubtext,
    socialLinks: [...new Set(socialLinks)],
    metaTags,
    bodyText,
    screenshot,
  };
}

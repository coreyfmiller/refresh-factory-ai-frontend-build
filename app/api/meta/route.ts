import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

    // Use Browserless to get fully rendered HTML
    const browserlessKey = process.env.BROWSERLESS_API_KEY;
    let html = "";

    if (browserlessKey) {
      const res = await fetch(
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
                  for (let i = 0; i <= document.body.scrollHeight; i += 500) {
                    window.scrollTo(0, i);
                    await delay(200);
                  }
                });
                await new Promise(r => setTimeout(r, 1000));
                const content = await page.content();
                return { html: content, type: "application/json" };
              }
            `,
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        html = data.html || "";
      }
    }

    // Fallback to simple fetch
    if (!html) {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; RefreshFactory/1.0)" },
        redirect: "follow",
      });
      html = await res.text();
    }

    const $ = cheerio.load(html);

    // Extract everything
    const title = $("title").text().trim();
    const metaDesc = $('meta[name="description"]').attr("content") || $('meta[property="og:description"]').attr("content") || "";

    // Headings
    const headings: string[] = [];
    $("h1, h2, h3").each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 100) headings.push(text);
    });

    // Navigation links
    const navLinks: string[] = [];
    $("nav a, header a, [role='navigation'] a").each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 40 && !navLinks.includes(text)) navLinks.push(text);
    });

    // Phone numbers
    const phoneRegex = /(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g;
    const bodyText = $("body").text();
    const phones = bodyText.match(phoneRegex) || [];
    const phone = phones[0] || null;

    // Email
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = bodyText.match(emailRegex) || [];
    const email = emails[0] || null;

    // Address (look for common patterns)
    const address = $('[class*="address"], [itemprop="address"], address').first().text().trim() || null;

    // Images count
    const imageCount = $("img").length;

    // Services/features (look for list items in service-like sections)
    const services: string[] = [];
    $("h2, h3").each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 3 && text.length < 60 && !text.includes("©")) {
        services.push(text);
      }
    });

    // Social links
    const socialLinks: string[] = [];
    const socialPatterns = ["facebook", "instagram", "twitter", "linkedin", "youtube", "tiktok"];
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      if (socialPatterns.some((p) => href.includes(p)) && !socialLinks.includes(href)) {
        socialLinks.push(href);
      }
    });

    // Body text excerpt
    const excerpt = bodyText.replace(/\s+/g, " ").trim().slice(0, 500);

    return NextResponse.json({
      title,
      description: metaDesc,
      headings: headings.slice(0, 10),
      navLinks: navLinks.slice(0, 10),
      phone,
      email,
      address,
      imageCount,
      services: services.slice(0, 8),
      socialLinks: socialLinks.slice(0, 5),
      excerpt,
    });
  } catch (error) {
    console.error("[meta] Error:", error);
    return NextResponse.json({
      title: "",
      description: "",
      headings: [],
      navLinks: [],
      phone: null,
      email: null,
      address: null,
      imageCount: 0,
      services: [],
      socialLinks: [],
      excerpt: "",
    });
  }
}

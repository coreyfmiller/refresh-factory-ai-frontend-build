import { NextRequest, NextResponse } from "next/server";
import { scrapeWebsite } from "@/lib/audit/scraper";
import { analyzeWithGemini } from "@/lib/audit/analyzer";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Step 1: Scrape the website
    console.log("[audit] Starting scrape for:", url);
    let scrapedData;
    try {
      scrapedData = await scrapeWebsite(url);
      console.log("[audit] Scrape complete. Title:", scrapedData.title);
    } catch (scrapeError) {
      console.error("[audit] Scrape failed:", scrapeError);
      return NextResponse.json(
        { error: `Scraping failed: ${scrapeError instanceof Error ? scrapeError.message : "Unknown error"}` },
        { status: 500 }
      );
    }

    // Step 2: Analyze with Gemini (classifies images + writes v0 prompt)
    console.log("[audit] Starting Gemini analysis...");
    let analysis;
    try {
      analysis = await analyzeWithGemini(scrapedData);
      console.log("[audit] Analysis complete. Business:", analysis.businessName);
    } catch (analysisError) {
      console.error("[audit] Analysis failed:", analysisError);
      return NextResponse.json(
        { error: `AI analysis failed: ${analysisError instanceof Error ? analysisError.message : "Unknown error"}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      scraped: {
        url: scrapedData.url,
        title: scrapedData.title,
        description: scrapedData.description,
        images: scrapedData.images,
        logos: scrapedData.logos,
        fonts: scrapedData.fonts,
        colors: scrapedData.colors,
        navLinks: scrapedData.navLinks,
        headings: scrapedData.headings,
        heroText: scrapedData.heroText,
        heroSubtext: scrapedData.heroSubtext,
        socialLinks: scrapedData.socialLinks,
        screenshot: scrapedData.screenshot
          ? `data:image/png;base64,${scrapedData.screenshot.toString("base64")}`
          : null,
      },
      analysis,
    });
  } catch (error) {
    console.error("[audit] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

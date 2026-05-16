import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ title: "", description: "" });

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RefreshFactory/1.0)" },
      redirect: "follow",
    });

    const html = await res.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);

    return NextResponse.json({
      title: titleMatch?.[1]?.trim() || "",
      description: descMatch?.[1]?.trim() || "",
    });
  } catch {
    return NextResponse.json({ title: "", description: "" });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { v0 } from "v0-sdk";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const prompt = `Build a modern, professional version of this website: ${url}

Keep their branding, text content, and business information. Make it look clean, modern, and professional. Use their own imagery where appropriate. Use the business name as text in the header instead of a logo image. Use a fixed header with a solid background color that matches the site's color scheme — not transparent. The header should always show the business name and navigation links. If the business has multiple project or work photos, use a hero image carousel to showcase them.`;

    console.log("[generate] Sending to v0:", url);

    let chat;
    try {
      chat = await v0.chats.create({ message: prompt });
    } catch (v0Error) {
      console.error("[generate] v0 SDK error:", v0Error);
      const msg = v0Error instanceof Error ? v0Error.message : String(v0Error);
      return NextResponse.json({ error: `v0 generation failed: ${msg}` }, { status: 502 });
    }

    console.log("[generate] Chat created:", chat.id);

    const demoUrl = chat.latestVersion?.demoUrl || null;
    const files = chat.latestVersion?.files || [];

    if (!demoUrl) {
      return NextResponse.json({ error: "v0 did not return a preview URL. Try again." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      chatId: chat.id,
      demoUrl,
      files: files.map((f) => ({ name: f.name, content: f.content })),
    });
  } catch (error) {
    console.error("[generate] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed unexpectedly" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { v0 } from "v0-sdk";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const prompt = `Build a modern, professional version of this website: ${url}

Keep their branding, logo, text content, and business information. Make it look clean, modern, and professional. Use high-quality imagery where appropriate.`;

    console.log("[generate] Sending to v0:", url);

    const chat = await v0.chats.create({ message: prompt });

    console.log("[generate] Chat created:", chat.id);

    const demoUrl = chat.latestVersion?.demoUrl || null;
    const files = chat.latestVersion?.files || [];

    return NextResponse.json({
      success: true,
      chatId: chat.id,
      demoUrl,
      files: files.map((f) => ({ name: f.name, content: f.content })),
    });
  } catch (error) {
    console.error("[generate] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}

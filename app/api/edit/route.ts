import { NextRequest, NextResponse } from "next/server";
import { v0 } from "v0-sdk";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { chatId, message } = await request.json();

    if (!chatId || !message) {
      return NextResponse.json(
        { error: "chatId and message are required" },
        { status: 400 }
      );
    }

    console.log("[edit] Sending follow-up to chat:", chatId);
    console.log("[edit] Message:", message.slice(0, 200));

    const response = await v0.chats.sendMessage({
      chatId,
      message,
    });

    const files = response.latestVersion?.files || [];
    const generatedCode = files
      .map((file) => `// === ${file.name} ===\n${file.content}`)
      .join("\n\n");

    const demoUrl = response.latestVersion?.demoUrl || null;

    console.log("[edit] Updated. Files:", files.length);

    return NextResponse.json({
      success: true,
      demoUrl,
      files: files.map((f) => ({ name: f.name, content: f.content })),
      generatedCode: generatedCode || null,
    });
  } catch (error) {
    console.error("[edit] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Edit failed" },
      { status: 500 }
    );
  }
}

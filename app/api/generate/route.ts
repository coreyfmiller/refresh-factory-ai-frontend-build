import { NextRequest, NextResponse } from "next/server";
import { v0 } from "v0-sdk";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { v0Prompt, customInstructions, skipImages } = await request.json();

    if (!v0Prompt) {
      return NextResponse.json({ error: "v0Prompt is required" }, { status: 400 });
    }

    // If skipImages, remove any image URLs from the prompt so v0 uses its own
    let prompt = v0Prompt;
    if (skipImages) {
      prompt = prompt
        .replace(/Use this logo[^.]*\./gi, "")
        .replace(/Use this hero image[^.]*\./gi, "")
        .replace(/Logo:[^\n]*/gi, "")
        .replace(/Hero image[^\n]*/gi, "")
        .replace(/https?:\/\/[^\s"')]+\.(jpg|jpeg|png|svg|webp|gif)[^\s"')]*\s*/gi, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    // Append custom instructions if provided
    const finalPrompt = customInstructions
      ? `${prompt}\n\nAdditional requirements: ${customInstructions}`
      : prompt;

    console.log("[generate] Sending to v0:", finalPrompt.slice(0, 200) + "...");

    // Create a chat with v0 SDK
    const chat = await v0.chats.create({
      message: finalPrompt,
    });

    console.log("[generate] Chat created:", chat.id);

    // Extract generated files
    const files = chat.latestVersion?.files || [];
    const generatedCode = files
      .map((file) => `// === ${file.name} ===\n${file.content}`)
      .join("\n\n");

    const demoUrl = chat.latestVersion?.demoUrl || null;

    return NextResponse.json({
      success: true,
      chatId: chat.id,
      demoUrl,
      files: files.map((f) => ({ name: f.name, content: f.content })),
      generatedCode: generatedCode || "No code generated",
    });
  } catch (error) {
    console.error("[generate] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}

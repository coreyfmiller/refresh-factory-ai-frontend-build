import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 15;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { repoFullName, filePath } = await request.json();

    if (!repoFullName || !filePath) {
      return NextResponse.json(
        { error: "repoFullName and filePath are required" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `https://api.github.com/repos/${repoFullName}/contents/${filePath}`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!res.ok) {
      throw new Error(`Failed to read file: ${await res.text()}`);
    }

    const data = await res.json();
    const content = Buffer.from(data.content, "base64").toString("utf-8");

    return NextResponse.json({
      success: true,
      path: filePath,
      content,
      sha: data.sha,
    });
  } catch (error) {
    console.error("[editor/get-file] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to read file" },
      { status: 500 }
    );
  }
}

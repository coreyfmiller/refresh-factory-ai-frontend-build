import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const repoFullName = formData.get("repoFullName") as string | null;

    if (!file || !repoFullName) {
      return NextResponse.json(
        { error: "file and repoFullName are required" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name.toLowerCase().replace(/[^a-z0-9.-]/g, "-");
    const filePath = `public/images/${filename}`;

    // Check if file already exists to get SHA
    let sha: string | undefined;
    const existingRes = await fetch(
      `https://api.github.com/repos/${repoFullName}/contents/${filePath}`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    if (existingRes.ok) {
      const existing = await existingRes.json();
      sha = existing.sha;
    }

    // Push to repo
    const res = await fetch(
      `https://api.github.com/repos/${repoFullName}/contents/${filePath}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          message: `Upload image: ${filename}`,
          content: buffer.toString("base64"),
          ...(sha ? { sha } : {}),
        }),
      }
    );

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Failed to upload: ${error}`);
    }

    return NextResponse.json({
      success: true,
      filename,
      path: `/images/${filename}`,
    });
  } catch (error) {
    console.error("[editor/upload-image] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}

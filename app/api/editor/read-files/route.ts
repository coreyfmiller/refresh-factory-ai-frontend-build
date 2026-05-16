import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { repoFullName } = await request.json();

    if (!repoFullName) {
      return NextResponse.json({ error: "repoFullName is required" }, { status: 400 });
    }

    // Get the file tree from the repo
    const treeRes = await fetch(
      `https://api.github.com/repos/${repoFullName}/git/trees/main?recursive=1`,
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!treeRes.ok) {
      throw new Error(`Failed to read repo tree: ${await treeRes.text()}`);
    }

    const tree = await treeRes.json();

    // Filter to only code files (not images, not node_modules)
    const codeFiles = tree.tree
      .filter((item: { type: string; path: string }) =>
        item.type === "blob" &&
        !item.path.startsWith("public/images/") &&
        !item.path.includes("node_modules") &&
        (item.path.endsWith(".tsx") ||
          item.path.endsWith(".ts") ||
          item.path.endsWith(".css") ||
          item.path.endsWith(".json") ||
          item.path.endsWith(".mjs") ||
          item.path.endsWith(".js"))
      )
      .map((item: { path: string; sha: string }) => ({
        path: item.path,
        sha: item.sha,
      }));

    return NextResponse.json({ success: true, files: codeFiles });
  } catch (error) {
    console.error("[editor/read-files] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to read files" },
      { status: 500 }
    );
  }
}

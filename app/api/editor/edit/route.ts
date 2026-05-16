import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { repoFullName, instruction, images, fileList } = await request.json();

    if (!repoFullName || !instruction) {
      return NextResponse.json(
        { error: "repoFullName and instruction are required" },
        { status: 400 }
      );
    }

    // Step 1: Ask Gemini which files need to be edited
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const planPrompt = `You are editing a Next.js website. The user wants to make this change:

"${instruction}"

${images?.length ? `Images to use (already in public/images/):\n${images.map((img: string) => `- /images/${img}`).join("\n")}` : ""}

Here are the files in the project:
${fileList.map((f: { path: string }) => `- ${f.path}`).join("\n")}

Which file(s) need to be edited to fulfill this request? Respond ONLY with a JSON array of file paths, nothing else. Example: ["components/gallery.tsx", "app/page.tsx"]`;

    const planResult = await model.generateContent(planPrompt);
    const planText = planResult.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let filesToEdit: string[];
    try {
      filesToEdit = JSON.parse(planText);
    } catch {
      // If parsing fails, try to find the most relevant file
      filesToEdit = fileList
        .filter((f: { path: string }) => f.path.endsWith(".tsx") && !f.path.includes("layout"))
        .slice(0, 2)
        .map((f: { path: string }) => f.path);
    }

    console.log("[editor/edit] Files to edit:", filesToEdit);

    // Step 2: Fetch the content of those files
    const fileContents: { path: string; content: string; sha: string }[] = [];

    for (const filePath of filesToEdit) {
      const res = await fetch(
        `https://api.github.com/repos/${repoFullName}/contents/${filePath}`,
        {
          headers: {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        fileContents.push({
          path: filePath,
          content: Buffer.from(data.content, "base64").toString("utf-8"),
          sha: data.sha,
        });
      }
    }

    if (fileContents.length === 0) {
      return NextResponse.json(
        { error: "Could not find the files to edit" },
        { status: 400 }
      );
    }

    // Step 3: Send files to Gemini for editing
    const editPrompt = `You are editing a Next.js website. Apply this change:

"${instruction}"

${images?.length ? `Use these image paths (they exist in public/images/):\n${images.map((img: string) => `- /images/${img}`).join("\n")}` : ""}

Here are the current files:

${fileContents.map((f) => `=== ${f.path} ===\n${f.content}`).join("\n\n")}

Return the COMPLETE updated file contents. Respond with JSON only (no markdown fences):
{
  "files": [
    {"path": "file/path.tsx", "content": "complete file content here"}
  ]
}

Rules:
- Return the FULL file content, not just the changed parts
- Only include files that actually changed
- Keep all existing imports and functionality intact
- Use proper Next.js/React patterns`;

    const editResult = await model.generateContent(editPrompt);
    const editText = editResult.response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let editedFiles: { path: string; content: string }[];
    try {
      const parsed = JSON.parse(editText);
      editedFiles = parsed.files;
    } catch {
      console.error("[editor/edit] Failed to parse Gemini edit response:", editText.slice(0, 500));
      return NextResponse.json(
        { error: "AI failed to generate valid edits. Try rephrasing your instruction." },
        { status: 500 }
      );
    }

    // Step 4: Push updated files to GitHub
    const updatedFiles: string[] = [];

    for (const editedFile of editedFiles) {
      // Get the current SHA for the file
      const existing = fileContents.find((f) => f.path === editedFile.path);
      const sha = existing?.sha;

      // If it's a new file or existing file, push it
      const pushRes = await fetch(
        `https://api.github.com/repos/${repoFullName}/contents/${editedFile.path}`,
        {
          method: "PUT",
          headers: {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github.v3+json",
          },
          body: JSON.stringify({
            message: `Edit: ${instruction.slice(0, 50)}`,
            content: Buffer.from(editedFile.content).toString("base64"),
            ...(sha ? { sha } : {}),
          }),
        }
      );

      if (pushRes.ok) {
        updatedFiles.push(editedFile.path);
      } else {
        console.error(`[editor/edit] Failed to push ${editedFile.path}:`, await pushRes.text());
      }
    }

    console.log("[editor/edit] Updated files:", updatedFiles);

    return NextResponse.json({
      success: true,
      updatedFiles,
      message: `Updated ${updatedFiles.length} file(s). Vercel will auto-deploy in ~30 seconds.`,
    });
  } catch (error) {
    console.error("[editor/edit] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Edit failed" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

interface ImageToSave {
  url: string;
  type: string;
  description?: string;
}

interface FileToCommit {
  path: string;
  content: string | Buffer;
  encoding: "utf-8" | "base64";
}

async function downloadImage(url: string): Promise<{ buffer: Buffer; extension: string } | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      redirect: "follow",
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "";
    let extension = "jpg";
    if (contentType.includes("png")) extension = "png";
    else if (contentType.includes("svg")) extension = "svg";
    else if (contentType.includes("webp")) extension = "webp";
    else if (contentType.includes("gif")) extension = "gif";
    else if (url.match(/\.(png|jpg|jpeg|svg|webp|gif)/i)) {
      const match = url.match(/\.(png|jpg|jpeg|svg|webp|gif)/i);
      if (match) extension = match[1].toLowerCase();
      if (extension === "jpeg") extension = "jpg";
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 500 || buffer.length > 10_000_000) return null;

    return { buffer, extension };
  } catch {
    return null;
  }
}

function getImageFilename(type: string, index: number, extension: string): string {
  switch (type) {
    case "logo": return `logo.${extension}`;
    case "hero": return `hero.${extension}`;
    case "team": return `team-${index + 1}.${extension}`;
    case "product": return `product-${index + 1}.${extension}`;
    case "testimonial": return `testimonial-${index + 1}.${extension}`;
    case "gallery": return `gallery-${index + 1}.${extension}`;
    case "icon": return `icon-${index + 1}.${extension}`;
    default: return `image-${index + 1}.${extension}`;
  }
}

// Push all files in a single atomic commit using the Git Trees API
async function pushAllFiles(
  fullName: string,
  filesToCommit: FileToCommit[],
  commitMessage: string
): Promise<void> {
  const token = process.env.GITHUB_TOKEN!;
  const headers = {
    Authorization: `token ${token}`,
    "Content-Type": "application/json",
    Accept: "application/vnd.github.v3+json",
  };

  // 1. Get the current HEAD SHA
  const refRes = await fetch(
    `https://api.github.com/repos/${fullName}/git/ref/heads/main`,
    { headers }
  );
  if (!refRes.ok) {
    throw new Error(`Failed to get HEAD ref: ${await refRes.text()}`);
  }
  const refData = await refRes.json();
  const headSha = refData.object.sha;

  // 2. Create blobs for each file
  const treeItems: { path: string; mode: string; type: string; sha: string }[] = [];

  for (const file of filesToCommit) {
    const blobContent = file.encoding === "base64"
      ? (file.content as Buffer).toString("base64")
      : Buffer.from(file.content as string, "utf-8").toString("base64");

    const blobRes = await fetch(
      `https://api.github.com/repos/${fullName}/git/blobs`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          content: blobContent,
          encoding: "base64",
        }),
      }
    );

    if (!blobRes.ok) {
      console.error(`[github] Failed to create blob for ${file.path}`);
      continue;
    }

    const blob = await blobRes.json();
    treeItems.push({
      path: file.path,
      mode: "100644",
      type: "blob",
      sha: blob.sha,
    });
  }

  if (treeItems.length === 0) {
    throw new Error("No files to commit");
  }

  // 3. Create a new tree
  const treeRes = await fetch(
    `https://api.github.com/repos/${fullName}/git/trees`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        base_tree: headSha,
        tree: treeItems,
      }),
    }
  );

  if (!treeRes.ok) {
    throw new Error(`Failed to create tree: ${await treeRes.text()}`);
  }
  const tree = await treeRes.json();

  // 4. Create a commit
  const commitRes = await fetch(
    `https://api.github.com/repos/${fullName}/git/commits`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: commitMessage,
        tree: tree.sha,
        parents: [headSha],
      }),
    }
  );

  if (!commitRes.ok) {
    throw new Error(`Failed to create commit: ${await commitRes.text()}`);
  }
  const commit = await commitRes.json();

  // 5. Update the ref to point to the new commit
  const updateRefRes = await fetch(
    `https://api.github.com/repos/${fullName}/git/refs/heads/main`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ sha: commit.sha }),
    }
  );

  if (!updateRefRes.ok) {
    throw new Error(`Failed to update ref: ${await updateRefRes.text()}`);
  }

  console.log(`[github] Committed ${treeItems.length} files in one atomic commit`);
}

export async function POST(request: NextRequest) {
  try {
    const { projectName, files, brandName, images, logoUrl, heroUrl } = await request.json();

    if (!projectName || !files?.length) {
      return NextResponse.json(
        { error: "projectName and files are required" },
        { status: 400 }
      );
    }

    const repoName = projectName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-");

    // Try to create the repository — if it already exists, we'll update it
    const createRepoRes = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        name: repoName,
        description: `Modern rebuild of ${brandName} — generated by RefreshFactory.ai`,
        private: false,
        auto_init: true,
      }),
    });

    let fullName: string;
    let repoUrl: string;

    if (createRepoRes.ok) {
      const repo = await createRepoRes.json();
      fullName = repo.full_name;
      repoUrl = repo.html_url;
      console.log("[github] Repo created:", fullName);
      await new Promise((r) => setTimeout(r, 3000)); // Wait for GitHub to initialize
    } else {
      const owner = process.env.GITHUB_OWNER || "coreyfmiller";
      fullName = `${owner}/${repoName}`;
      repoUrl = `https://github.com/${fullName}`;
      console.log("[github] Repo already exists, updating:", fullName);
    }

    // Build the complete file list: v0 files + scaffold + images
    const allFilesToCommit: FileToCommit[] = [];

    // Download logo and hero images if provided, save to public/images/
    const urlReplacements: { from: string; to: string }[] = [];

    if (logoUrl) {
      console.log("[github] Downloading logo from:", logoUrl);
      const result = await downloadImage(logoUrl);
      if (result) {
        const logoFilename = `logo.${result.extension}`;
        // Save to both public/images/ and public/ root to cover all cases
        allFilesToCommit.push({
          path: `public/images/${logoFilename}`,
          content: result.buffer,
          encoding: "base64",
        });
        allFilesToCommit.push({
          path: `public/${logoFilename}`,
          content: result.buffer,
          encoding: "base64",
        });
        urlReplacements.push({ from: logoUrl, to: `/images/${logoFilename}` });
        console.log("[github] Downloaded logo:", logoFilename, `(${result.buffer.length} bytes)`);
      } else {
        console.error("[github] Failed to download logo from:", logoUrl);
      }
    }

    if (heroUrl) {
      console.log("[github] Downloading hero from:", heroUrl);
      const result = await downloadImage(heroUrl);
      if (result) {
        const heroFilename = `hero.${result.extension}`;
        // Save to both public/images/ and public/ root to cover all cases
        allFilesToCommit.push({
          path: `public/images/${heroFilename}`,
          content: result.buffer,
          encoding: "base64",
        });
        allFilesToCommit.push({
          path: `public/${heroFilename}`,
          content: result.buffer,
          encoding: "base64",
        });
        urlReplacements.push({ from: heroUrl, to: `/images/${heroFilename}` });
        console.log("[github] Downloaded hero:", heroFilename, `(${result.buffer.length} bytes)`);
      } else {
        console.error("[github] Failed to download hero from:", heroUrl);
      }
    }

    // Add v0-generated files (filter out tailwind.config which conflicts with v4)
    // Replace external image URLs with local paths
    for (const file of files) {
      if (!file.name || !file.content) continue;
      if (file.name === "tailwind.config.ts" || file.name === "tailwind.config.js") continue;

      let content = file.content;
      for (const replacement of urlReplacements) {
        // Try exact match first
        content = content.replaceAll(replacement.from, replacement.to);
        // Also try URL-encoded version
        content = content.replaceAll(encodeURI(replacement.from), replacement.to);
        // Try without protocol
        const withoutProtocol = replacement.from.replace(/^https?:\/\//, "");
        content = content.replaceAll(withoutProtocol, replacement.to);
      }

      // Also find any remaining blob.vercel-storage.com URLs and replace with local path
      content = content.replace(
        /https?:\/\/[^"'\s)]+\.blob\.vercel-storage\.com\/[^"'\s)]+/g,
        (match) => {
          // Extract filename from blob URL
          const parts = match.split("/");
          const rawName = parts[parts.length - 1].split("?")[0];
          const cleanName = rawName.replace(/[^a-z0-9.-]/gi, "-").toLowerCase();
          return `/images/${cleanName}`;
        }
      );

      allFilesToCommit.push({
        path: file.name,
        content,
        encoding: "utf-8",
      });
    }

    // Determine scaffold files needed
    const fileNames = new Set(files.map((f: { name: string }) => f.name));

    if (!fileNames.has("next.config.mjs") && !fileNames.has("next.config.js") && !fileNames.has("next.config.ts")) {
      allFilesToCommit.push({
        path: "next.config.mjs",
        content: `/** @type {import('next').NextConfig} */\nconst nextConfig = {\n  typescript: {\n    ignoreBuildErrors: true,\n  },\n  images: {\n    unoptimized: true,\n  },\n}\n\nexport default nextConfig\n`,
        encoding: "utf-8",
      });
    }

    if (!fileNames.has("tsconfig.json")) {
      allFilesToCommit.push({
        path: "tsconfig.json",
        content: JSON.stringify({
          compilerOptions: {
            target: "ES2017",
            lib: ["dom", "dom.iterable", "esnext"],
            allowJs: true,
            skipLibCheck: true,
            strict: true,
            noEmit: true,
            esModuleInterop: true,
            module: "esnext",
            moduleResolution: "bundler",
            resolveJsonModule: true,
            isolatedModules: true,
            jsx: "preserve",
            incremental: true,
            plugins: [{ name: "next" }],
            paths: { "@/*": ["./*"] },
          },
          include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
          exclude: ["node_modules"],
        }, null, 2) + "\n",
        encoding: "utf-8",
      });
    }

    if (!fileNames.has("postcss.config.mjs") && !fileNames.has("postcss.config.js")) {
      allFilesToCommit.push({
        path: "postcss.config.mjs",
        content: `/** @type {import('postcss-load-config').Config} */\nconst config = {\n  plugins: {\n    "@tailwindcss/postcss": {},\n  },\n}\n\nexport default config\n`,
        encoding: "utf-8",
      });
    }

    if (!fileNames.has(".gitignore")) {
      allFilesToCommit.push({
        path: ".gitignore",
        content: "node_modules\n.next\n.env*.local\n",
        encoding: "utf-8",
      });
    }

    if (!fileNames.has("lib/utils.ts") && !fileNames.has("lib/utils.js")) {
      allFilesToCommit.push({
        path: "lib/utils.ts",
        content: `import { type ClassValue, clsx } from "clsx"\nimport { twMerge } from "tailwind-merge"\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs))\n}\n`,
        encoding: "utf-8",
      });
    }

    if (!fileNames.has("package.json")) {
      allFilesToCommit.push({
        path: "package.json",
        content: JSON.stringify({
          name: repoName,
          version: "0.1.0",
          private: true,
          scripts: {
            dev: "next dev",
            build: "next build",
            start: "next start",
          },
          dependencies: {
            next: "^14",
            react: "^18",
            "react-dom": "^18",
            "lucide-react": "^0.400",
            tailwindcss: "^4",
            "@tailwindcss/postcss": "^4",
            "class-variance-authority": "^0.7",
            clsx: "^2",
            "tailwind-merge": "^2",
            autoprefixer: "^10",
            postcss: "^8",
            typescript: "^5",
            "@types/node": "^20",
            "@types/react": "^18",
            "@types/react-dom": "^18",
          },
        }, null, 2) + "\n",
        encoding: "utf-8",
      });
    }

    // Add README
    allFilesToCommit.push({
      path: "README.md",
      content: `# ${brandName}\n\nModern website rebuild generated by [RefreshFactory.ai](https://auto-agency-three.vercel.app).\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## Images\n\nAll scraped images are saved in \`public/images/\`.\n`,
      encoding: "utf-8",
    });

    // Download images
    const imageList: ImageToSave[] = images || [];
    const typeCounts: Record<string, number> = {};
    let savedImages = 0;

    if (imageList.length > 0) {
      console.log(`[github] Downloading ${imageList.length} images...`);
      for (const img of imageList) {
        const result = await downloadImage(img.url);
        if (!result) continue;

        const type = img.type || "other";
        typeCounts[type] = typeCounts[type] || 0;
        const filename = getImageFilename(type, typeCounts[type], result.extension);
        typeCounts[type]++;

        allFilesToCommit.push({
          path: `public/images/${filename}`,
          content: result.buffer,
          encoding: "base64",
        });
        savedImages++;
      }
      console.log(`[github] Downloaded ${savedImages}/${imageList.length} images`);
    }

    // Push everything in one atomic commit
    console.log(`[github] Pushing ${allFilesToCommit.length} files...`);
    await pushAllFiles(fullName, allFilesToCommit, `Site generated by RefreshFactory.ai`);

    return NextResponse.json({
      success: true,
      url: repoUrl,
      fullName,
      repoName,
      filesPushed: allFilesToCommit.length,
      imagesSaved: savedImages,
    });
  } catch (error) {
    console.error("[github] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "GitHub push failed" },
      { status: 500 }
    );
  }
}

"use client"

import { useState } from "react"
import { NavHeader } from "@/components/nav-header"
import { useProjectStore } from "@/lib/store"
import { Github, ExternalLink, Download, Loader2, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"

export default function DeployPage() {
  const {
    auditResult,
    githubUrl,
    deploymentUrl,
    isPushingToGit,
    isDeploying,
    pushToGitHub,
    deployToVercel,
  } = useProjectStore()

  const [projectName, setProjectName] = useState("")

  const defaultProjectName = auditResult?.analysis.businessName
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-") || "my-project"

  const handlePush = async () => {
    await pushToGitHub(projectName || defaultProjectName)
  }

  const handleDeploy = async () => {
    await deployToVercel(projectName || defaultProjectName)
  }

  const handleOpenInKiro = () => {
    const repoName = (projectName || defaultProjectName).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-")
    const batContent = `@echo off\r\ncd /d "%USERPROFILE%\\Desktop\\Projects"\r\nif not exist "${repoName}" (\r\n  git clone ${githubUrl}.git\r\n) else (\r\n  cd ${repoName}\r\n  git pull\r\n  cd ..\r\n)\r\nkiro "${repoName}"\r\n`
    const blob = new Blob([batContent], { type: "application/bat" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `open-${repoName}-in-kiro.bat`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <NavHeader />

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-8">
        <div>
          <p className="font-mono text-xs text-neutral-500 uppercase tracking-widest mb-2">
            Deploy
          </p>
          <h2 className="font-mono text-2xl font-bold text-neutral-900">
            Ship to Production
          </h2>
          <p className="font-sans text-sm text-neutral-600 mt-2">
            Push your generated site to GitHub and deploy to Vercel.
          </p>
        </div>

        {/* Project Name */}
        <div className="bg-white border border-neutral-300 p-6">
          <label className="font-mono text-xs text-neutral-500 uppercase tracking-wider block mb-2">
            Project Name
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder={defaultProjectName}
            className="w-full px-4 py-3 border border-neutral-300 bg-neutral-50 font-mono text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500"
          />
        </div>

        {/* Step 1: GitHub */}
        <div className={`bg-white border p-6 ${githubUrl ? "border-[#16A34A]" : "border-neutral-300"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 flex items-center justify-center ${githubUrl ? "bg-[#16A34A]" : "bg-neutral-900"}`}>
                {githubUrl ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Github className="w-4 h-4 text-white" />}
              </div>
              <div>
                <p className="font-mono text-sm font-medium text-neutral-900">Push to GitHub</p>
                <p className="font-mono text-xs text-neutral-500">Creates a repository with all generated files + images</p>
              </div>
            </div>
            <motion.button
              whileTap={{ x: 1, y: 1 }}
              onClick={handlePush}
              disabled={isPushingToGit}
              className="px-4 py-2 bg-neutral-900 text-white font-mono text-xs uppercase tracking-wider hover:bg-neutral-800 disabled:opacity-50"
            >
              {isPushingToGit ? <Loader2 className="w-4 h-4 animate-spin" /> : githubUrl ? "Re-push" : "Push"}
            </motion.button>
          </div>
          {githubUrl && (
            <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 font-mono text-xs text-[#16A34A] hover:underline">
              {githubUrl} <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Step 2: Vercel */}
        <div className={`bg-white border p-6 ${deploymentUrl ? "border-[#16A34A]" : !githubUrl ? "border-neutral-200 opacity-50" : "border-neutral-300"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 flex items-center justify-center ${deploymentUrl ? "bg-[#16A34A]" : "bg-neutral-900"}`}>
                {deploymentUrl ? <CheckCircle2 className="w-4 h-4 text-white" /> : <ExternalLink className="w-4 h-4 text-white" />}
              </div>
              <div>
                <p className="font-mono text-sm font-medium text-neutral-900">Deploy to Vercel</p>
                <p className="font-mono text-xs text-neutral-500">Creates a Vercel project with Elastic Build Machines</p>
              </div>
            </div>
            <motion.button
              whileTap={{ x: 1, y: 1 }}
              onClick={handleDeploy}
              disabled={isDeploying || !githubUrl}
              className="px-4 py-2 bg-neutral-900 text-white font-mono text-xs uppercase tracking-wider hover:bg-neutral-800 disabled:opacity-50"
            >
              {isDeploying ? <Loader2 className="w-4 h-4 animate-spin" /> : deploymentUrl ? "Re-deploy" : "Deploy"}
            </motion.button>
          </div>
          {deploymentUrl && (
            <a href={deploymentUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 font-mono text-xs text-[#16A34A] hover:underline">
              {deploymentUrl} <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Step 3: Open in Kiro */}
        {githubUrl && (
          <div className="bg-white border border-neutral-300 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-neutral-900 flex items-center justify-center">
                  <Download className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-mono text-sm font-medium text-neutral-900">Open in Kiro</p>
                  <p className="font-mono text-xs text-neutral-500">Download a script that clones the repo and opens it in Kiro</p>
                </div>
              </div>
              <motion.button
                whileTap={{ x: 1, y: 1 }}
                onClick={handleOpenInKiro}
                className="px-4 py-2 border border-neutral-300 bg-white text-neutral-700 font-mono text-xs uppercase tracking-wider hover:bg-neutral-50"
              >
                Download .bat
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

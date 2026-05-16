"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Github, ExternalLink, Loader2, RefreshCw, Download } from "lucide-react"
import { useProjectStore } from "@/lib/store"

interface ActionBarProps {
  visible: boolean
}

export function ActionBar({ visible }: ActionBarProps) {
  const {
    currentStep,
    auditResult,
    demoUrl,
    githubUrl,
    deploymentUrl,
    isPushingToGit,
    isDeploying,
    pushToGitHub,
    deployToVercel,
    startGeneration,
    regenerate,
    reset,
  } = useProjectStore()

  const [projectName, setProjectName] = useState("")

  if (!visible) return null

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

  const handleGenerate = async () => {
    await startGeneration()
  }

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="fixed bottom-0 left-0 right-0 z-50"
    >
      <div className="bg-white border-t border-neutral-300 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {currentStep === "workspace" && demoUrl && (
                <>
                  <span className="w-2 h-2 bg-[#16A34A] rounded-full" />
                  <span className="font-mono text-sm text-neutral-600">
                    Preview Ready
                  </span>
                </>
              )}
              {currentStep === "reviewing" && (
                <>
                  <span className="w-2 h-2 bg-[#D97706] rounded-full" />
                  <span className="font-mono text-sm text-neutral-600">
                    Audit Complete — Ready to Generate
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Review Assets */}
              {currentStep === "reviewing" && (
                <Link
                  href="/review"
                  className="flex items-center gap-2 px-4 py-2 border border-neutral-300 bg-white font-mono text-sm text-neutral-700 hover:bg-neutral-50 active:translate-x-px active:translate-y-px transition-transform"
                >
                  Review Assets
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              {/* Generate */}
              {currentStep === "reviewing" && (
                <motion.button
                  whileTap={{ x: 1, y: 1 }}
                  onClick={handleGenerate}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] font-mono text-sm text-white hover:bg-[#1d4ed8]"
                >
                  Generate
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              )}

              {/* Workspace actions */}
              {currentStep === "workspace" && (
                <>
                  {/* Project name */}
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder={defaultProjectName}
                    className="px-3 py-2 border border-neutral-300 bg-white font-mono text-xs text-neutral-700 w-40 focus:outline-none focus:border-neutral-500"
                  />

                  {/* Push to GitHub */}
                  <motion.button
                    whileTap={{ x: 1, y: 1 }}
                    onClick={handlePush}
                    disabled={isPushingToGit}
                    className={`flex items-center gap-2 px-3 py-2 border font-mono text-xs transition-colors ${
                      githubUrl
                        ? "border-[#16A34A] text-[#16A34A] bg-white"
                        : "border-neutral-300 text-neutral-600 bg-white hover:bg-neutral-50"
                    } disabled:opacity-50`}
                  >
                    {isPushingToGit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Github className="w-4 h-4" />}
                    {isPushingToGit ? "Pushing..." : githubUrl ? "Pushed" : "Push"}
                  </motion.button>

                  {/* Deploy */}
                  <motion.button
                    whileTap={{ x: 1, y: 1 }}
                    onClick={handleDeploy}
                    disabled={isDeploying || !githubUrl}
                    className={`flex items-center gap-2 px-3 py-2 border font-mono text-xs transition-colors ${
                      deploymentUrl
                        ? "border-[#16A34A] text-[#16A34A] bg-white"
                        : "border-neutral-300 text-neutral-600 bg-white hover:bg-neutral-50"
                    } disabled:opacity-50`}
                  >
                    {isDeploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                    {isDeploying ? "Deploying..." : deploymentUrl ? "Deployed" : "Deploy"}
                  </motion.button>

                  {/* Open in Kiro */}
                  {githubUrl && (
                    <motion.button
                      whileTap={{ x: 1, y: 1 }}
                      onClick={() => {
                        const repoName = (projectName || defaultProjectName).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-")
                        const batContent = `@echo off\r\ncd /d "%USERPROFILE%\\Desktop\\Projects"\r\nif not exist "${repoName}" (\r\n  git clone ${githubUrl}.git\r\n) else (\r\n  cd ${repoName}\r\n  git pull\r\n  cd ..\r\n)\r\nkiro "${repoName}"\r\n`
                        const blob = new Blob([batContent], { type: "application/bat" })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement("a")
                        a.href = url
                        a.download = `open-${repoName}-in-kiro.bat`
                        a.click()
                        URL.revokeObjectURL(url)
                      }}
                      className="flex items-center gap-2 px-3 py-2 border border-neutral-300 bg-white font-mono text-xs text-neutral-600 hover:bg-neutral-50"
                    >
                      <Download className="w-4 h-4" />
                      Kiro
                    </motion.button>
                  )}

                  <div className="h-6 w-px bg-neutral-300 mx-1" />

                  {/* Regenerate */}
                  <motion.button
                    whileTap={{ x: 1, y: 1 }}
                    onClick={regenerate}
                    className="flex items-center gap-2 px-3 py-2 border border-neutral-300 bg-white font-mono text-xs text-neutral-600 hover:bg-neutral-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Redo
                  </motion.button>
                </>
              )}
            </div>
          </div>

          {/* Status links */}
          {(githubUrl || deploymentUrl || demoUrl) && (
            <div className="flex items-center gap-4 mt-2 pt-2 border-t border-neutral-200">
              {demoUrl && (
                <a href={demoUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-[#2563EB] hover:underline">
                  Preview ↗
                </a>
              )}
              {githubUrl && (
                <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-neutral-500 hover:underline">
                  GitHub ↗
                </a>
              )}
              {deploymentUrl && (
                <a href={deploymentUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-[#16A34A] hover:underline">
                  Live Site ↗
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

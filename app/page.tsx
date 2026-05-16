"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Loader2, RefreshCw, Github, ExternalLink, Download, RotateCcw } from "lucide-react"
import { useProjectStore } from "@/lib/store"

const SCAN_MESSAGES = [
  "Connecting to target domain...",
  "Analyzing site structure...",
  "Extracting brand identity...",
  "Cataloging content assets...",
  "Mapping navigation hierarchy...",
  "Evaluating design patterns...",
  "Processing typography stack...",
  "Scanning media library...",
  "Compiling component inventory...",
  "Preparing rebuild specification...",
]

const GENERATE_MESSAGES = [
  "Initializing AI design engine...",
  "Generating responsive layouts...",
  "Building component architecture...",
  "Applying modern design system...",
  "Optimizing for performance...",
  "Rendering final output...",
]

export default function HomePage() {
  const {
    step,
    error,
    targetUrl,
    siteMeta,
    builds,
    activeBuildIndex,
    githubUrl,
    deploymentUrl,
    isPushing,
    isDeploying,
    startBuild,
    tryAnother,
    selectBuild,
    pushToGitHub,
    deployToVercel,
    setTargetUrl,
    reset,
  } = useProjectStore()

  const [url, setUrl] = useState("")
  const [logs, setLogs] = useState<string[]>([])
  const [projectName, setProjectName] = useState("")
  const logRef = useRef<HTMLDivElement>(null)

  const activeBuild = builds[activeBuildIndex]

  // Animate log messages during scanning/generating
  useEffect(() => {
    if (step === "scanning" || step === "generating") {
      const messages = step === "scanning" ? SCAN_MESSAGES : GENERATE_MESSAGES
      setLogs([])
      let i = 0
      const interval = setInterval(() => {
        if (i < messages.length) {
          setLogs((prev) => [...prev, messages[i]])
          i++
        }
      }, step === "scanning" ? 400 : 2000)
      return () => clearInterval(interval)
    }
  }, [step])

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logs])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    let normalized = url.trim()
    if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`
    setTargetUrl(normalized)
    setUrl("")
    startBuild()
  }

  const isWorking = step === "scanning" || step === "generating"

  // Preview mode — maximize the iframe
  if (step === "preview" && activeBuild) {
    return (
      <div className="h-screen flex flex-col bg-[#F8F9FA]">
        {/* Thin toolbar */}
        <div className="flex-shrink-0 border-b border-neutral-300 bg-white px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="RF" className="h-6 w-auto" />
              <span className="font-mono text-sm text-neutral-900 font-medium">
                {siteMeta?.title || targetUrl}
              </span>
              <span className="font-mono text-xs text-neutral-400">
                Build {activeBuildIndex + 1} of {builds.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Build selector */}
              {builds.length > 1 && (
                <div className="flex items-center gap-1 mr-2">
                  {builds.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => selectBuild(i)}
                      className={`w-6 h-6 font-mono text-xs border ${
                        i === activeBuildIndex
                          ? "bg-neutral-900 text-white border-neutral-900"
                          : "bg-white text-neutral-500 border-neutral-300 hover:bg-neutral-50"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}

              {/* Try Another */}
              <button
                onClick={tryAnother}
                disabled={isWorking}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 bg-white font-mono text-xs text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try Another
              </button>

              {/* Push to GitHub */}
              <button
                onClick={() => pushToGitHub(projectName || siteMeta?.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "project")}
                disabled={isPushing}
                className={`flex items-center gap-1.5 px-3 py-1.5 border font-mono text-xs ${
                  githubUrl ? "border-[#16A34A] text-[#16A34A]" : "border-neutral-300 text-neutral-600 hover:bg-neutral-50"
                } bg-white disabled:opacity-50`}
              >
                {isPushing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Github className="w-3.5 h-3.5" />}
                {githubUrl ? "Pushed" : "Push"}
              </button>

              {/* Deploy */}
              <button
                onClick={() => deployToVercel(projectName || siteMeta?.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "project")}
                disabled={isDeploying || !githubUrl}
                className={`flex items-center gap-1.5 px-3 py-1.5 border font-mono text-xs ${
                  deploymentUrl ? "border-[#16A34A] text-[#16A34A]" : "border-neutral-300 text-neutral-600 hover:bg-neutral-50"
                } bg-white disabled:opacity-50`}
              >
                {isDeploying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                {deploymentUrl ? "Live" : "Deploy"}
              </button>

              {/* Open in Kiro */}
              {githubUrl && (
                <button
                  onClick={() => {
                    const name = (projectName || siteMeta?.title || "project").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-")
                    const bat = `@echo off\r\ncd /d "%USERPROFILE%\\Desktop\\Projects"\r\nif not exist "${name}" (git clone ${githubUrl}.git) else (cd ${name} & git pull & cd ..)\r\nkiro "${name}"\r\n`
                    const blob = new Blob([bat], { type: "application/bat" })
                    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `open-in-kiro.bat`; a.click()
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 bg-white font-mono text-xs text-neutral-600 hover:bg-neutral-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  Kiro
                </button>
              )}

              <div className="w-px h-5 bg-neutral-300 mx-1" />

              {/* New project */}
              <button onClick={reset} className="flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs text-neutral-400 hover:text-neutral-600">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Links row */}
          {(githubUrl || deploymentUrl) && (
            <div className="flex items-center gap-4 mt-1 pt-1 border-t border-neutral-100">
              {githubUrl && <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-neutral-400 hover:text-[#2563EB]">{githubUrl}</a>}
              {deploymentUrl && <a href={deploymentUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] text-[#16A34A] hover:underline">{deploymentUrl}</a>}
            </div>
          )}
        </div>

        {/* Full-screen iframe */}
        <div className="flex-1">
          <iframe
            src={activeBuild.demoUrl}
            className="w-full h-full border-0"
            title="Preview"
          />
        </div>
      </div>
    )
  }

  // Input + scanning/generating mode
  return (
    <main className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-2xl space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <img src="/logo.png" alt="RefreshFactory.ai" className="h-10 w-auto" />
          <span className="font-mono text-lg font-medium tracking-tight text-neutral-900">
            RefreshFactory.ai
          </span>
        </div>

        {/* Tagline */}
        <p className="text-center font-sans text-neutral-600">
          Paste a URL. Get a modern rebuild in minutes.
        </p>

        {/* Input */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white border border-neutral-300 p-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-neutral-400 text-sm pl-3 select-none">$&gt;</span>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="barrettqualitybuilders.ca"
                disabled={isWorking}
                className="flex-1 bg-transparent font-mono text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none py-3 disabled:opacity-50"
              />
              <motion.button
                type="submit"
                disabled={!url.trim() || isWorking}
                whileTap={{ x: 1, y: 1 }}
                className="px-6 py-2.5 bg-neutral-900 text-white font-mono text-sm uppercase tracking-wider disabled:opacity-30 hover:bg-neutral-800"
              >
                {isWorking ? "Working" : "Build"}
              </motion.button>
            </div>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-white border border-red-300 p-3">
            <span className="font-mono text-xs text-red-600">{error}</span>
          </div>
        )}

        {/* Log output */}
        {isWorking && (
          <div className="bg-white border border-neutral-300 p-4">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neutral-200">
              <span className="font-mono text-xs text-neutral-500 uppercase tracking-wider">
                {step === "scanning" ? "Scanning" : "Generating"}
              </span>
              <Loader2 className="w-3 h-3 text-[#D97706] animate-spin" />
            </div>
            <div ref={logRef} className="h-40 overflow-y-auto font-mono text-xs leading-relaxed">
              {logs.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-2 mb-1"
                >
                  <span className="text-neutral-400 select-none">[{String(i + 1).padStart(2, "0")}]</span>
                  <span className="text-neutral-700">{log}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

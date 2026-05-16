"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Loader2, RefreshCw, Github, ExternalLink, Download, RotateCcw, Check } from "lucide-react"
import { useProjectStore } from "@/lib/store"

const SCAN_MESSAGES = [
  "Connecting to target domain...",
  "Analyzing site structure...",
  "Extracting brand identity...",
  "Cataloging content assets...",
  "Mapping navigation hierarchy...",
  "Evaluating design patterns...",
  "Processing typography stack...",
  "Compiling business summary...",
]

const GENERATE_MESSAGES = [
  "Initializing AI design engine...",
  "Generating responsive layouts...",
  "Building component architecture...",
  "Applying modern design system...",
  "Optimizing for performance...",
  "Rendering final output...",
]

// Pipeline steps component
function PipelineSteps({ currentStep }: { currentStep: string }) {
  const steps = [
    { id: "scanning", label: "Scan" },
    { id: "summary", label: "Review" },
    { id: "generating", label: "Generate" },
    { id: "preview", label: "Live" },
  ]

  const order = ["idle", "scanning", "summary", "generating", "preview"]
  const currentIndex = order.indexOf(currentStep)

  return (
    <div className="flex items-center justify-center gap-1 mb-8">
      {steps.map((step, i) => {
        const stepIndex = order.indexOf(step.id)
        const isComplete = stepIndex < currentIndex
        const isActive = step.id === currentStep
        return (
          <div key={step.id} className="flex items-center">
            {i > 0 && (
              <div className={`w-8 h-px mx-1 ${isComplete ? "bg-[#16A34A]" : "bg-neutral-300"}`} />
            )}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 border font-mono text-xs uppercase tracking-wider ${
              isComplete ? "bg-white border-[#16A34A] text-[#16A34A]" :
              isActive ? "bg-neutral-900 border-neutral-900 text-white" :
              "bg-white border-neutral-300 text-neutral-400"
            }`}>
              {isComplete && <Check className="w-3 h-3" />}
              {step.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

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
    acceptAndGenerate,
    tryAnother,
    selectBuild,
    pushToGitHub,
    deployToVercel,
    setTargetUrl,
    reset,
  } = useProjectStore()

  const [url, setUrl] = useState("")
  const [logs, setLogs] = useState<string[]>([])
  const logRef = useRef<HTMLDivElement>(null)

  const activeBuild = builds[activeBuildIndex]

  // Animate log messages
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

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
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

  // ===== PREVIEW MODE =====
  if (step === "preview" && activeBuild) {
    return (
      <div className="h-screen flex flex-col bg-[#F8F9FA]">
        {/* Toolbar */}
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
              {builds.length > 1 && (
                <div className="flex items-center gap-1 mr-2">
                  {builds.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => selectBuild(i)}
                      className={`w-6 h-6 font-mono text-xs border ${
                        i === activeBuildIndex ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-500 border-neutral-300 hover:bg-neutral-50"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}

              <button onClick={tryAnother} disabled={isWorking} className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 bg-white font-mono text-xs text-neutral-600 hover:bg-neutral-50 disabled:opacity-50">
                <RefreshCw className="w-3.5 h-3.5" /> Try Another
              </button>

              <button onClick={() => pushToGitHub(siteMeta?.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "project")} disabled={isPushing} className={`flex items-center gap-1.5 px-3 py-1.5 border font-mono text-xs bg-white disabled:opacity-50 ${githubUrl ? "border-[#16A34A] text-[#16A34A]" : "border-neutral-300 text-neutral-600 hover:bg-neutral-50"}`}>
                {isPushing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Github className="w-3.5 h-3.5" />}
                {githubUrl ? "Pushed" : "Push"}
              </button>

              <button onClick={() => deployToVercel(siteMeta?.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "project")} disabled={isDeploying || !githubUrl} className={`flex items-center gap-1.5 px-3 py-1.5 border font-mono text-xs bg-white disabled:opacity-50 ${deploymentUrl ? "border-[#16A34A] text-[#16A34A]" : "border-neutral-300 text-neutral-600 hover:bg-neutral-50"}`}>
                {isDeploying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                {deploymentUrl ? "Live" : "Deploy"}
              </button>

              {githubUrl && (
                <button onClick={() => {
                  const name = (siteMeta?.title || "project").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-")
                  const bat = `@echo off\r\ncd /d "%USERPROFILE%\\Desktop\\Projects"\r\nif not exist "${name}" (git clone ${githubUrl}.git) else (cd ${name} & git pull & cd ..)\r\nkiro "${name}"\r\n`
                  const blob = new Blob([bat], { type: "application/bat" })
                  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "open-in-kiro.bat"; a.click()
                }} className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 bg-white font-mono text-xs text-neutral-600 hover:bg-neutral-50">
                  <Download className="w-3.5 h-3.5" /> Kiro
                </button>
              )}

              <div className="w-px h-5 bg-neutral-300 mx-1" />
              <button onClick={reset} className="p-1.5 text-neutral-400 hover:text-neutral-600">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Full iframe */}
        <div className="flex-1">
          <iframe src={activeBuild.demoUrl} className="w-full h-full border-0" title="Preview" />
        </div>
      </div>
    )
  }

  // ===== INPUT / SCANNING / SUMMARY / GENERATING MODE =====
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

        {/* Pipeline steps - show when past idle */}
        {step !== "idle" && <PipelineSteps currentStep={step} />}

        {/* Tagline - only on idle */}
        {step === "idle" && (
          <p className="text-center font-sans text-neutral-600">
            Paste a URL. Get a modern rebuild in minutes.
          </p>
        )}

        {/* Input - show on idle */}
        {step === "idle" && (
          <form onSubmit={handleSubmit}>
            <div className="bg-white border border-neutral-300 p-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-neutral-400 text-sm pl-3 select-none">$&gt;</span>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="barrettqualitybuilders.ca"
                  className="flex-1 bg-transparent font-mono text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none py-3"
                />
                <motion.button
                  type="submit"
                  disabled={!url.trim()}
                  whileTap={{ x: 1, y: 1 }}
                  className="px-6 py-2.5 bg-neutral-900 text-white font-mono text-sm uppercase tracking-wider disabled:opacity-30 hover:bg-neutral-800"
                >
                  Build
                </motion.button>
              </div>
            </div>
          </form>
        )}

        {/* Error */}
        {error && (
          <div className="bg-white border border-red-300 p-3 flex items-center justify-between">
            <span className="font-mono text-xs text-red-600">{error}</span>
            <button onClick={reset} className="font-mono text-xs text-neutral-500 hover:text-neutral-900">Reset</button>
          </div>
        )}

        {/* Scanning log */}
        {step === "scanning" && (
          <div className="bg-white border border-neutral-300 p-4">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neutral-200">
              <span className="font-mono text-xs text-neutral-500 uppercase tracking-wider">Scanning</span>
              <Loader2 className="w-3 h-3 text-[#D97706] animate-spin" />
            </div>
            <div ref={logRef} className="h-32 overflow-y-auto font-mono text-xs leading-relaxed">
              {logs.map((log, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2 mb-1">
                  <span className="text-neutral-400 select-none">[{String(i + 1).padStart(2, "0")}]</span>
                  <span className="text-neutral-700">{log}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {step === "summary" && (
          <div className="space-y-6">
            <div className="bg-white border border-neutral-300 p-6">
              <p className="font-mono text-xs text-neutral-500 uppercase tracking-widest mb-4">Site Summary</p>
              <div className="space-y-3 font-mono text-sm">
                <div>
                  <span className="text-neutral-500">URL:</span>
                  <span className="ml-2 text-neutral-900">{targetUrl}</span>
                </div>
                {siteMeta?.title && (
                  <div>
                    <span className="text-neutral-500">Title:</span>
                    <span className="ml-2 text-neutral-900">{siteMeta.title}</span>
                  </div>
                )}
                {siteMeta?.description && (
                  <div>
                    <span className="text-neutral-500">Description:</span>
                    <span className="ml-2 text-neutral-900">{siteMeta.description}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button onClick={reset} className="font-mono text-xs text-neutral-500 hover:text-neutral-900 uppercase tracking-wider">
                ← Start Over
              </button>
              <motion.button
                whileTap={{ x: 1, y: 1 }}
                onClick={acceptAndGenerate}
                className="px-6 py-2.5 bg-neutral-900 text-white font-mono text-sm uppercase tracking-wider hover:bg-neutral-800"
              >
                Accept & Generate →
              </motion.button>
            </div>
          </div>
        )}

        {/* Generating log */}
        {step === "generating" && (
          <div className="bg-white border border-neutral-300 p-4">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neutral-200">
              <span className="font-mono text-xs text-neutral-500 uppercase tracking-wider">Generating</span>
              <Loader2 className="w-3 h-3 text-[#D97706] animate-spin" />
            </div>
            <div ref={logRef} className="h-32 overflow-y-auto font-mono text-xs leading-relaxed">
              {logs.map((log, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2 mb-1">
                  <span className="text-neutral-400 select-none">[{String(i + 1).padStart(2, "0")}]</span>
                  <span className="text-neutral-700">{log}</span>
                </motion.div>
              ))}
            </div>
            <p className="mt-3 font-mono text-[10px] text-neutral-400">This typically takes 2-3 minutes...</p>
          </div>
        )}
      </div>
    </main>
  )
}

"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Loader2, RefreshCw, Github, ExternalLink, Download, RotateCcw, ArrowRight, Sparkles } from "lucide-react"
import { useProjectStore } from "@/lib/store"

const SCAN_MESSAGES = [
  "Resolving DNS...",
  "Connecting to server...",
  "Parsing HTML structure...",
  "Extracting brand assets...",
  "Mapping content hierarchy...",
  "Analyzing navigation...",
  "Scanning media library...",
  "Processing typography...",
  "Identifying services...",
  "Compiling report...",
  "Done.",
]

const GENERATE_MESSAGES = [
  "Initializing design engine...",
  "Analyzing brand identity...",
  "Generating layouts...",
  "Building components...",
  "Applying design system...",
  "Rendering sections...",
  "Optimizing responsive...",
  "Compiling build...",
]

// Pipeline
function Pipeline({ currentStep }: { currentStep: string }) {
  const steps = [
    { id: "scanning", label: "Scan" },
    { id: "summary", label: "Review" },
    { id: "generating", label: "Build" },
    { id: "preview", label: "Live" },
  ]
  const order = ["idle", "scanning", "summary", "generating", "preview"]
  const currentIndex = order.indexOf(currentStep)

  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((step, i) => {
        const stepIndex = order.indexOf(step.id)
        const isComplete = stepIndex < currentIndex
        const isActive = step.id === currentStep
        return (
          <div key={step.id} className="flex items-center">
            {i > 0 && (
              <div className="w-8 h-px relative">
                <div className="absolute inset-0 bg-[#27272A]" />
                {isComplete && (
                  <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} className="absolute inset-0 bg-[#10B981] origin-left" />
                )}
              </div>
            )}
            <div className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest border transition-all ${
              isComplete ? "border-[#10B981]/50 text-[#10B981] bg-[#10B981]/5" :
              isActive ? "border-[#3B82F6] text-[#3B82F6] bg-[#3B82F6]/5 shadow-[0_0_12px_rgba(59,130,246,0.15)]" :
              "border-[#27272A] text-[#52525B] bg-transparent"
            }`}>
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
    step, error, targetUrl, siteMeta, builds, activeBuildIndex,
    githubUrl, deploymentUrl, isPushing, isDeploying,
    startBuild, acceptAndGenerate, tryAnother, selectBuild,
    pushToGitHub, deployToVercel, setTargetUrl, reset,
  } = useProjectStore()

  const [url, setUrl] = useState("")
  const [logs, setLogs] = useState<string[]>([])
  const logRef = useRef<HTMLDivElement>(null)
  const activeBuild = builds[activeBuildIndex]

  useEffect(() => {
    if (step !== "idle" && step !== "preview" && !targetUrl) reset()
  }, [step, targetUrl, reset])

  useEffect(() => {
    if (step === "scanning" || step === "generating") {
      const messages = step === "scanning" ? SCAN_MESSAGES : GENERATE_MESSAGES
      setLogs([])
      let i = 0
      const interval = setInterval(() => {
        if (i < messages.length) { setLogs((prev) => [...prev, messages[i]]); i++ }
      }, step === "scanning" ? 350 : 1800)
      return () => clearInterval(interval)
    }
  }, [step])

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, [logs])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    let normalized = url.trim()
    if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`
    setTargetUrl(normalized)
    setUrl("")
    startBuild()
  }

  // ===== PREVIEW =====
  if (step === "preview" && activeBuild) {
    return (
      <div className="h-screen flex flex-col bg-[#0A0A0B]">
        <div className="flex-shrink-0 border-b border-[#27272A] bg-[#0A0A0B] px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="RF" className="h-5 w-auto cursor-pointer opacity-70 hover:opacity-100 transition-opacity" onClick={reset} />
              <div className="w-px h-4 bg-[#27272A]" />
              <span className="font-mono text-xs text-[#A1A1AA] truncate max-w-[200px]">{siteMeta?.title || targetUrl}</span>
              {builds.length > 1 && (
                <div className="flex items-center gap-0.5 ml-2">
                  {builds.map((_, i) => (
                    <button key={i} onClick={() => selectBuild(i)}
                      className={`w-5 h-5 font-mono text-[10px] border transition-all ${i === activeBuildIndex ? "bg-[#3B82F6] text-white border-[#3B82F6]" : "bg-transparent text-[#52525B] border-[#27272A] hover:border-[#3B82F6]/50"}`}
                    >{i + 1}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={tryAnother} className="flex items-center gap-1 px-2.5 py-1.5 border border-[#27272A] font-mono text-[10px] text-[#A1A1AA] hover:text-white hover:border-[#3B82F6]/50 transition-all uppercase tracking-wider">
                <RefreshCw className="w-3 h-3" /> Rebuild
              </button>
              <button onClick={() => pushToGitHub(siteMeta?.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "project")} disabled={isPushing}
                className={`flex items-center gap-1 px-2.5 py-1.5 border font-mono text-[10px] uppercase tracking-wider transition-all disabled:opacity-40 ${githubUrl ? "border-[#10B981]/50 text-[#10B981]" : "border-[#27272A] text-[#A1A1AA] hover:text-white hover:border-[#3B82F6]/50"}`}>
                {isPushing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Github className="w-3 h-3" />}
                {githubUrl ? "Done" : "Git"}
              </button>
              <button onClick={() => deployToVercel(siteMeta?.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "project")} disabled={isDeploying || !githubUrl}
                className={`flex items-center gap-1 px-2.5 py-1.5 border font-mono text-[10px] uppercase tracking-wider transition-all disabled:opacity-40 ${deploymentUrl ? "border-[#10B981]/50 text-[#10B981]" : "border-[#27272A] text-[#A1A1AA] hover:text-white hover:border-[#3B82F6]/50"}`}>
                {isDeploying ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
                {deploymentUrl ? "Live" : "Deploy"}
              </button>
              {githubUrl && (
                <button onClick={() => {
                  const name = (siteMeta?.title || "project").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-")
                  const bat = `@echo off\r\ncd /d "%USERPROFILE%\\Desktop\\Projects"\r\nif not exist "${name}" (git clone ${githubUrl}.git) else (cd ${name} & git pull & cd ..)\r\nkiro "${name}"\r\n`
                  const blob = new Blob([bat], { type: "application/bat" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "open-in-kiro.bat"; a.click()
                }} className="flex items-center gap-1 px-2.5 py-1.5 border border-[#27272A] font-mono text-[10px] text-[#A1A1AA] hover:text-white hover:border-[#3B82F6]/50 transition-all uppercase tracking-wider">
                  <Download className="w-3 h-3" /> Kiro
                </button>
              )}
              <div className="w-px h-4 bg-[#27272A] mx-0.5" />
              <button onClick={reset} className="p-1.5 text-[#52525B] hover:text-white transition-colors" title="New project">
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <iframe src={activeBuild.demoUrl} className="w-full h-full border-0" title="Preview" />
        </div>
      </div>
    )
  }

  // ===== MAIN FLOW =====
  return (
    <main className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.04),transparent_70%)]" />
      </div>

      <div className="w-full max-w-xl space-y-10 relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center gap-5">
          <img src="/logo.png" alt="RefreshFactory.ai" className="h-12 w-auto cursor-pointer" onClick={reset} />
          {step === "idle" && (
            <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-center font-sans text-sm text-[#71717A]">
              Paste a URL. Get a modern rebuild in minutes.
            </motion.p>
          )}
          {step !== "idle" && <Pipeline currentStep={step} />}
        </div>

        {/* Input */}
        {step === "idle" && (
          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="relative bg-[#141416] border border-[#27272A] rounded-lg p-1 shadow-[0_0_30px_rgba(59,130,246,0.03)]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[#3B82F6] text-sm pl-3 select-none">→</span>
                <input
                  type="text" value={url} onChange={(e) => setUrl(e.target.value)}
                  placeholder="yoursite.com" autoFocus
                  className="flex-1 bg-transparent font-mono text-sm text-white placeholder:text-[#52525B] focus:outline-none py-3"
                />
                <motion.button type="submit" disabled={!url.trim()} whileTap={{ scale: 0.98 }}
                  className="px-5 py-2.5 bg-[#3B82F6] text-white font-mono text-xs uppercase tracking-wider rounded disabled:opacity-30 hover:bg-[#2563EB] transition-colors">
                  Build
                </motion.button>
              </div>
            </div>
          </motion.form>
        )}

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#141416] border border-[#EF4444]/20 rounded-lg p-5 space-y-3">
            <p className="font-mono text-sm text-white">Generation timed out</p>
            <p className="font-sans text-xs text-[#71717A]">The AI took longer than expected. Your progress is saved.</p>
            <div className="flex items-center gap-3 pt-1">
              <motion.button whileTap={{ scale: 0.98 }} onClick={acceptAndGenerate}
                className="px-4 py-2 bg-[#3B82F6] text-white font-mono text-xs uppercase tracking-wider rounded hover:bg-[#2563EB] transition-colors">
                Try Again
              </motion.button>
              <button onClick={reset} className="font-mono text-xs text-[#52525B] hover:text-[#A1A1AA] uppercase tracking-wider">Reset</button>
            </div>
          </motion.div>
        )}

        {/* Scanning */}
        {step === "scanning" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#141416] border border-[#27272A] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#F59E0B] glow-pulse" />
              <span className="font-mono text-[10px] text-[#71717A] uppercase tracking-widest">Scanning {targetUrl}</span>
            </div>
            <div ref={logRef} className="h-36 overflow-y-auto font-mono text-xs leading-relaxed">
              {logs.map((log, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.1 }} className="flex gap-2 mb-0.5">
                  <span className="text-[#3B82F6] select-none">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[#A1A1AA]">{log}</span>
                </motion.div>
              ))}
              <span className="inline-block w-1.5 h-3.5 bg-[#3B82F6] cursor-blink ml-5" />
            </div>
          </motion.div>
        )}

        {/* Summary */}
        {step === "summary" && siteMeta && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="bg-[#141416] border border-[#27272A] rounded-lg p-6 space-y-5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
                <span className="font-mono text-[10px] text-[#52525B] uppercase tracking-widest">Analysis Complete</span>
              </div>

              <div>
                <p className="font-sans text-lg text-white font-medium">{siteMeta.title || targetUrl}</p>
                {siteMeta.summary && (
                  <p className="font-sans text-sm text-[#A1A1AA] mt-2 leading-relaxed">{siteMeta.summary}</p>
                )}
              </div>

              {/* Data grid */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#27272A]">
                {siteMeta.phone && (
                  <div className="bg-[#0A0A0B] rounded p-3">
                    <span className="font-mono text-[9px] text-[#52525B] uppercase tracking-widest block mb-1">Phone</span>
                    <span className="font-mono text-xs text-white">{siteMeta.phone}</span>
                  </div>
                )}
                {siteMeta.email && (
                  <div className="bg-[#0A0A0B] rounded p-3">
                    <span className="font-mono text-[9px] text-[#52525B] uppercase tracking-widest block mb-1">Email</span>
                    <span className="font-mono text-xs text-white">{siteMeta.email}</span>
                  </div>
                )}
                {(siteMeta.imageCount ?? 0) > 0 && (
                  <div className="bg-[#0A0A0B] rounded p-3">
                    <span className="font-mono text-[9px] text-[#52525B] uppercase tracking-widest block mb-1">Images</span>
                    <span className="font-mono text-xs text-white">{siteMeta.imageCount}</span>
                  </div>
                )}
                {(siteMeta.navLinks?.length ?? 0) > 0 && (
                  <div className="bg-[#0A0A0B] rounded p-3">
                    <span className="font-mono text-[9px] text-[#52525B] uppercase tracking-widest block mb-1">Pages</span>
                    <span className="font-mono text-xs text-white">{siteMeta.navLinks.length}</span>
                  </div>
                )}
              </div>

              {/* Nav links */}
              {(siteMeta.navLinks?.length ?? 0) > 0 && (
                <div className="pt-4 border-t border-[#27272A]">
                  <span className="font-mono text-[9px] text-[#52525B] uppercase tracking-widest block mb-2">Navigation</span>
                  <div className="flex flex-wrap gap-1.5">
                    {siteMeta.navLinks.map((link, i) => (
                      <span key={i} className="px-2 py-0.5 bg-[#0A0A0B] border border-[#27272A] rounded font-mono text-[10px] text-[#A1A1AA]">{link}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Services */}
              {(siteMeta.services?.length ?? 0) > 0 && (
                <div className="pt-4 border-t border-[#27272A]">
                  <span className="font-mono text-[9px] text-[#52525B] uppercase tracking-widest block mb-2">Services</span>
                  <div className="flex flex-wrap gap-1.5">
                    {siteMeta.services.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-[#3B82F6]/5 border border-[#3B82F6]/20 rounded font-mono text-[10px] text-[#3B82F6]">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Generate button */}
            <motion.button whileTap={{ scale: 0.98 }} onClick={acceptAndGenerate}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#3B82F6] text-white font-mono text-sm uppercase tracking-wider rounded-lg hover:bg-[#2563EB] transition-colors relative overflow-hidden">
              <div className="absolute inset-0 shimmer" />
              <span className="relative">Generate Modern Rebuild</span>
              <ArrowRight className="w-4 h-4 relative" />
            </motion.button>

            <button onClick={reset} className="w-full text-center font-mono text-[10px] text-[#52525B] hover:text-[#A1A1AA] uppercase tracking-wider transition-colors">
              Start Over
            </button>
          </motion.div>
        )}

        {/* Generating */}
        {step === "generating" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-[#141416] border border-[#27272A] rounded-lg p-8 text-center space-y-6">
              {/* Animated rings */}
              <div className="relative w-16 h-16 mx-auto">
                <motion.div className="absolute inset-0 rounded-full border border-[#3B82F6]/30" animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
                <motion.div className="absolute inset-2 rounded-full border border-[#3B82F6]/50" animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0.2, 0.7] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} />
                <div className="absolute inset-4 rounded-full bg-[#3B82F6]/10 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-sm bg-[#3B82F6]" />
                </div>
              </div>

              <div>
                <p className="font-sans text-sm text-white font-medium">Building your new site</p>
                <p className="font-sans text-xs text-[#71717A] mt-1">This takes 3–5 minutes. Sit tight.</p>
              </div>

              {/* Progress bar */}
              <div className="w-full h-0.5 bg-[#27272A] rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-[#3B82F6] to-[#6366F1] rounded-full" initial={{ width: "0%" }} animate={{ width: "85%" }} transition={{ duration: 200, ease: "linear" }} />
              </div>
            </div>

            {/* Terminal log */}
            <div className="bg-[#0A0A0B] border border-[#27272A] rounded-lg p-3">
              <div ref={logRef} className="h-20 overflow-y-auto font-mono text-[10px] leading-relaxed">
                {logs.map((log, i) => (
                  <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#52525B] mb-0.5">
                    <span className="text-[#3B82F6]">$</span> {log}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  )
}

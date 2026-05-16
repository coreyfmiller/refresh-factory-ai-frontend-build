"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Loader2, RefreshCw, Github, ExternalLink, Download, RotateCcw, Check, ArrowRight } from "lucide-react"
import { useProjectStore } from "@/lib/store"

const SCAN_MESSAGES = [
  "Connecting to target domain...",
  "Resolving DNS records...",
  "Analyzing HTML structure...",
  "Extracting brand identity...",
  "Cataloging content assets...",
  "Mapping navigation hierarchy...",
  "Evaluating design patterns...",
  "Processing typography stack...",
  "Scanning media library...",
  "Compiling business summary...",
  "Analysis complete.",
]

const GENERATE_MESSAGES = [
  "Initializing AI design engine...",
  "Analyzing brand guidelines...",
  "Generating responsive layouts...",
  "Building component architecture...",
  "Applying modern design system...",
  "Rendering hero section...",
  "Constructing navigation...",
  "Building service sections...",
  "Optimizing for mobile...",
  "Compiling final build...",
]

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
    <div className="flex items-center justify-center gap-1">
      {steps.map((step, i) => {
        const stepIndex = order.indexOf(step.id)
        const isComplete = stepIndex < currentIndex
        const isActive = step.id === currentStep
        return (
          <div key={step.id} className="flex items-center">
            {i > 0 && <div className={`w-6 h-px mx-0.5 ${isComplete ? "bg-[#16A34A]" : "bg-neutral-300"}`} />}
            <div className={`flex items-center gap-1 px-2.5 py-1 border font-mono text-[10px] uppercase tracking-wider ${
              isComplete ? "bg-white border-[#16A34A] text-[#16A34A]" :
              isActive ? "bg-neutral-900 border-neutral-900 text-white" :
              "bg-white border-neutral-200 text-neutral-400"
            }`}>
              {isComplete && <Check className="w-2.5 h-2.5" />}
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

  // Auto-reset broken state
  useEffect(() => {
    if (step !== "idle" && step !== "preview" && !targetUrl) reset()
  }, [step, targetUrl, reset])

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
      }, step === "scanning" ? 350 : 1500)
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

  // ===== PREVIEW MODE — full screen =====
  if (step === "preview" && activeBuild) {
    return (
      <div className="h-screen flex flex-col bg-[#F8F9FA]">
        <div className="flex-shrink-0 border-b border-neutral-300 bg-white px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="RF" className="h-5 w-auto cursor-pointer" onClick={reset} />
              <div className="w-px h-4 bg-neutral-200" />
              <span className="font-mono text-xs text-neutral-700 font-medium truncate max-w-[200px]">
                {siteMeta?.title || targetUrl}
              </span>
              {builds.length > 1 && (
                <div className="flex items-center gap-0.5 ml-2">
                  {builds.map((_, i) => (
                    <button key={i} onClick={() => selectBuild(i)}
                      className={`w-5 h-5 font-mono text-[10px] border ${i === activeBuildIndex ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-400 border-neutral-200 hover:border-neutral-400"}`}
                    >{i + 1}</button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button onClick={tryAnother} className="flex items-center gap-1 px-2.5 py-1.5 border border-neutral-200 bg-white font-mono text-[10px] text-neutral-600 hover:bg-neutral-50 uppercase tracking-wider">
                <RefreshCw className="w-3 h-3" /> Rebuild
              </button>
              <button onClick={() => pushToGitHub(siteMeta?.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "project")} disabled={isPushing}
                className={`flex items-center gap-1 px-2.5 py-1.5 border font-mono text-[10px] uppercase tracking-wider bg-white disabled:opacity-50 ${githubUrl ? "border-[#16A34A] text-[#16A34A]" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"}`}>
                {isPushing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Github className="w-3 h-3" />}
                {githubUrl ? "Done" : "Git"}
              </button>
              <button onClick={() => deployToVercel(siteMeta?.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "project")} disabled={isDeploying || !githubUrl}
                className={`flex items-center gap-1 px-2.5 py-1.5 border font-mono text-[10px] uppercase tracking-wider bg-white disabled:opacity-50 ${deploymentUrl ? "border-[#16A34A] text-[#16A34A]" : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"}`}>
                {isDeploying ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
                {deploymentUrl ? "Live" : "Deploy"}
              </button>
              {githubUrl && (
                <button onClick={() => {
                  const name = (siteMeta?.title || "project").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-")
                  const bat = `@echo off\r\ncd /d "%USERPROFILE%\\Desktop\\Projects"\r\nif not exist "${name}" (git clone ${githubUrl}.git) else (cd ${name} & git pull & cd ..)\r\nkiro "${name}"\r\n`
                  const blob = new Blob([bat], { type: "application/bat" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "open-in-kiro.bat"; a.click()
                }} className="flex items-center gap-1 px-2.5 py-1.5 border border-neutral-200 bg-white font-mono text-[10px] text-neutral-600 hover:bg-neutral-50 uppercase tracking-wider">
                  <Download className="w-3 h-3" /> Kiro
                </button>
              )}
              <div className="w-px h-4 bg-neutral-200 mx-0.5" />
              <button onClick={reset} className="p-1.5 text-neutral-400 hover:text-neutral-600" title="New project">
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
    <main className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl space-y-10">
        {/* Header — logo always clickable to reset */}
        <div className="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="RefreshFactory.ai" className="h-12 w-auto cursor-pointer" onClick={reset} />
          {step === "idle" && (
            <p className="text-center font-sans text-sm text-neutral-500">
              Paste a URL. Get a modern rebuild in minutes.
            </p>
          )}
          {step !== "idle" && <PipelineSteps currentStep={step} />}
        </div>

        {/* URL Input — only on idle */}
        {step === "idle" && (
          <form onSubmit={handleSubmit}>
            <div className="bg-white border border-neutral-300 p-1 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="font-mono text-neutral-400 text-sm pl-3 select-none">$&gt;</span>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="yoursite.com"
                  autoFocus
                  className="flex-1 bg-transparent font-mono text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none py-3"
                />
                <motion.button type="submit" disabled={!url.trim()} whileTap={{ x: 1, y: 1 }}
                  className="px-5 py-2.5 bg-neutral-900 text-white font-mono text-xs uppercase tracking-wider disabled:opacity-30 hover:bg-neutral-800">
                  Build
                </motion.button>
              </div>
            </div>
          </form>
        )}

        {/* Error */}
        {error && (
          <div className="bg-white border border-red-200 p-4 flex items-center justify-between">
            <span className="font-mono text-xs text-red-600">{error}</span>
            <button onClick={reset} className="font-mono text-xs text-neutral-500 hover:text-neutral-900 uppercase">Reset</button>
          </div>
        )}

        {/* Scanning */}
        {step === "scanning" && (
          <div className="bg-white border border-neutral-300 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Loader2 className="w-3.5 h-3.5 text-[#D97706] animate-spin" />
              <span className="font-mono text-xs text-neutral-500 uppercase tracking-wider">Scanning {targetUrl}</span>
            </div>
            <div ref={logRef} className="h-36 overflow-y-auto font-mono text-xs leading-relaxed">
              {logs.map((log, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }} className="flex gap-2 mb-0.5">
                  <span className="text-neutral-300 select-none">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-neutral-600">{log}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {step === "summary" && siteMeta && (
          <div className="space-y-6">
            <div className="bg-white border border-neutral-300 p-6 space-y-5">
              <p className="font-mono text-[10px] text-neutral-400 uppercase tracking-widest">Analysis Complete</p>

              {/* Title & Description */}
              <div>
                <p className="font-mono text-lg text-neutral-900 font-medium">{siteMeta.title || targetUrl}</p>
                {siteMeta.summary && (
                  <p className="font-sans text-sm text-neutral-700 mt-2 leading-relaxed">{siteMeta.summary}</p>
                )}
                <p className="font-mono text-[10px] text-neutral-400 mt-3">{targetUrl}</p>
              </div>

              {/* Key Info Grid */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-100">
                {siteMeta.phone && (
                  <div>
                    <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">Phone</span>
                    <span className="font-mono text-sm text-neutral-900">{siteMeta.phone}</span>
                  </div>
                )}
                {siteMeta.email && (
                  <div>
                    <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">Email</span>
                    <span className="font-mono text-sm text-neutral-900">{siteMeta.email}</span>
                  </div>
                )}
                {(siteMeta.imageCount ?? 0) > 0 && (
                  <div>
                    <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">Images Found</span>
                    <span className="font-mono text-sm text-neutral-900">{siteMeta.imageCount}</span>
                  </div>
                )}
                {(siteMeta.navLinks?.length ?? 0) > 0 && (
                  <div>
                    <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">Pages</span>
                    <span className="font-mono text-sm text-neutral-900">{siteMeta.navLinks.length}</span>
                  </div>
                )}
              </div>

              {/* Navigation */}
              {(siteMeta.navLinks?.length ?? 0) > 0 && (
                <div className="pt-4 border-t border-neutral-100">
                  <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider block mb-2">Navigation</span>
                  <div className="flex flex-wrap gap-1.5">
                    {siteMeta.navLinks.map((link, i) => (
                      <span key={i} className="px-2 py-0.5 bg-neutral-100 border border-neutral-200 font-mono text-[10px] text-neutral-700">{link}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Services/Sections */}
              {(siteMeta.services?.length ?? 0) > 0 && (
                <div className="pt-4 border-t border-neutral-100">
                  <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider block mb-2">Sections & Services</span>
                  <div className="flex flex-wrap gap-1.5">
                    {siteMeta.services.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-neutral-50 border border-neutral-200 font-mono text-[10px] text-neutral-600">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Social */}
              {(siteMeta.socialLinks?.length ?? 0) > 0 && (
                <div className="pt-4 border-t border-neutral-100">
                  <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider block mb-2">Social</span>
                  <div className="flex flex-wrap gap-2">
                    {siteMeta.socialLinks.map((link, i) => {
                      const platform = ["facebook", "instagram", "twitter", "linkedin", "youtube", "tiktok"].find(p => link.includes(p)) || "link"
                      return <span key={i} className="font-mono text-[10px] text-neutral-500 capitalize">{platform}</span>
                    })}
                  </div>
                </div>
              )}
            </div>

            <motion.button
              whileTap={{ x: 1, y: 1 }}
              onClick={acceptAndGenerate}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-neutral-900 text-white font-mono text-sm uppercase tracking-wider hover:bg-neutral-800"
            >
              Generate Modern Rebuild <ArrowRight className="w-4 h-4" />
            </motion.button>

            <button onClick={reset} className="w-full text-center font-mono text-[10px] text-neutral-400 hover:text-neutral-600 uppercase tracking-wider">
              Start Over
            </button>
          </div>
        )}

        {/* Generating */}
        {step === "generating" && (
          <div className="space-y-4">
            <div className="bg-white border border-neutral-300 p-8 text-center space-y-5">
              <div className="relative w-12 h-12 mx-auto">
                <Loader2 className="w-12 h-12 text-neutral-200 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 bg-neutral-900 rounded-sm" />
                </div>
              </div>
              <div>
                <p className="font-mono text-sm text-neutral-900 font-medium">Building your new site</p>
                <p className="font-sans text-xs text-neutral-500 mt-1">This typically takes 3–5 minutes. We&apos;ll show you the result as soon as it&apos;s ready.</p>
              </div>
              <div className="w-full h-0.5 bg-neutral-100 overflow-hidden rounded-full">
                <motion.div className="h-full bg-neutral-900 rounded-full" initial={{ width: "0%" }} animate={{ width: "85%" }} transition={{ duration: 200, ease: "linear" }} />
              </div>
            </div>

            <div className="bg-neutral-50 border border-neutral-200 p-3">
              <div ref={logRef} className="h-20 overflow-y-auto font-mono text-[10px] leading-relaxed">
                {logs.map((log, i) => (
                  <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-neutral-400 mb-0.5">
                    {log}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

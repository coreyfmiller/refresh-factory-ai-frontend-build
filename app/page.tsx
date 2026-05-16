"use client"

import { useState, useEffect } from "react"
import { CommandBar } from "@/components/command-bar"
import { PipelineVisualization, type PipelineStep } from "@/components/pipeline-visualization"
import { TypewriterLog } from "@/components/typewriter-log"
import { ActionBar } from "@/components/action-bar"
import { useProjectStore } from "@/lib/store"

export default function HomePage() {
  const {
    currentStep,
    error,
    auditResult,
    demoUrl,
    githubUrl,
    deploymentUrl,
    startAudit,
    setTargetUrl,
    customLogoUrl,
    setCustomLogoUrl,
    customHeroUrl,
    setCustomHeroUrl,
  } = useProjectStore()

  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingHero, setIsUploadingHero] = useState(false)

  // Map store state to pipeline steps
  const steps: PipelineStep[] = [
    { id: "audit", label: "Audit", status: getStatus("auditing") },
    { id: "review", label: "Review", status: getStatus("reviewing") },
    { id: "generate", label: "Generate", status: getStatus("generating") },
    { id: "live", label: "Live", status: getStatus("workspace") },
    { id: "github", label: "GitHub", status: githubUrl ? "complete" : currentStep === "workspace" ? "idle" : "idle" },
    { id: "vercel", label: "Vercel", status: deploymentUrl ? "complete" : currentStep === "workspace" ? "idle" : "idle" },
  ]

  function getStatus(stepKey: string): "idle" | "active" | "complete" {
    const order = ["idle", "auditing", "reviewing", "generating", "workspace"]
    const stepIndex = order.indexOf(stepKey)
    const currentIndex = order.indexOf(currentStep)
    if (currentStep === "error") return "idle"
    if (stepIndex < currentIndex) return "complete"
    if (stepIndex === currentIndex) return "active"
    return "idle"
  }

  // Build log messages based on current step
  const logs: string[] = []
  if (currentStep === "auditing") {
    logs.push("Initializing diagnostic scan...")
    logs.push("Connecting to target domain...")
    logs.push("Analyzing HTML structure...")
    logs.push("Extracting media assets...")
    logs.push("Running AI classification...")
  }
  if (auditResult) {
    logs.push(`Target: ${auditResult.scraped.url}`)
    logs.push(`Business: ${auditResult.analysis.businessName}`)
    logs.push(`Type: ${auditResult.analysis.businessType}`)
    logs.push(`Images found: ${auditResult.scraped.images.length}`)
    logs.push(`Services: ${auditResult.analysis.services?.join(", ") || "N/A"}`)
    logs.push("Audit complete.")
  }
  if (currentStep === "generating") {
    logs.push("Sending prompt to v0.app...")
    logs.push("Generating modern rebuild...")
    logs.push("This may take 2-3 minutes...")
  }
  if (demoUrl) {
    logs.push("Generation complete.")
    logs.push(`Preview: ${demoUrl}`)
  }
  if (error) {
    logs.push(`ERROR: ${error}`)
  }

  const handleSubmit = async (url: string) => {
    let normalizedUrl = url.trim()
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`
    }
    setTargetUrl(normalizedUrl)
    await startAudit()
  }

  const isProcessing = currentStep === "auditing" || currentStep === "generating"
  const isComplete = currentStep === "workspace" || currentStep === "reviewing"

  return (
    <main className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <header className="border-b border-neutral-300 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="RefreshFactory.ai" className="h-8 w-auto" />
              <span className="font-mono text-sm font-medium tracking-tight">
                RefreshFactory.ai
              </span>
            </div>
            <nav className="flex items-center gap-6">
              <a href="/test-v0" className="font-mono text-xs text-neutral-500 hover:text-neutral-900 uppercase tracking-wider">
                Test v0
              </a>
              <a href="#" className="font-mono text-xs text-neutral-500 hover:text-neutral-900 uppercase tracking-wider">
                Docs
              </a>
              <a href="#" className="font-mono text-xs text-neutral-500 hover:text-neutral-900 uppercase tracking-wider">
                Status
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="mb-12">
            <p className="font-mono text-xs text-neutral-500 uppercase tracking-widest mb-4">
              Automated Website Rebuilding Pipeline
            </p>
            <h1 className="font-mono text-3xl md:text-5xl font-bold text-neutral-900 leading-tight mb-6 text-balance">
              Transform Legacy Websites<br />
              Into Modern Applications
            </h1>
            <p className="font-sans text-lg text-neutral-600 max-w-2xl">
              High-precision diagnostics. Intelligent asset extraction. Seamless AI-powered
              rebuilding. Deploy to production in minutes.
            </p>
          </div>

          {/* Command Bar */}
          <div className="mb-12">
            <CommandBar onSubmit={handleSubmit} isProcessing={isProcessing} />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-8 bg-white border border-red-300 p-4">
              <span className="font-mono text-xs text-red-600">{error}</span>
            </div>
          )}

          {/* Pipeline Visualization */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-mono text-xs text-neutral-500 uppercase tracking-wider">
                Pipeline Status
              </span>
              {isProcessing && (
                <span className="font-mono text-xs text-[#D97706]">
                  [Running]
                </span>
              )}
              {currentStep === "workspace" && (
                <span className="font-mono text-xs text-[#16A34A]">
                  [Complete]
                </span>
              )}
            </div>
            <PipelineVisualization steps={steps} />
          </div>

          {/* Typewriter Log */}
          <TypewriterLog logs={logs} isActive={isProcessing} />

          {/* Audit Results - appears after audit completes */}
          {auditResult && (
            <div className="mt-12 space-y-8">
              {/* Business Identity */}
              <section>
                <p className="font-mono text-xs text-neutral-500 uppercase tracking-widest mb-4">
                  Business Identity
                </p>
                <div className="bg-white border border-neutral-300 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-mono text-xl font-bold text-neutral-900">
                      {auditResult.analysis.businessName}
                    </h2>
                    <span className="font-mono text-xs text-neutral-500 uppercase px-2 py-1 border border-neutral-300">
                      {auditResult.analysis.businessType}
                    </span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 font-mono text-sm">
                    {auditResult.analysis.tagline && (
                      <div><span className="text-neutral-500">Tagline:</span> <span className="text-neutral-900 ml-1">{auditResult.analysis.tagline}</span></div>
                    )}
                    <div><span className="text-neutral-500">Headline:</span> <span className="text-neutral-900 ml-1">{auditResult.analysis.headline}</span></div>
                    {auditResult.analysis.phoneNumber && (
                      <div><span className="text-neutral-500">Phone:</span> <span className="text-neutral-900 ml-1">{auditResult.analysis.phoneNumber}</span></div>
                    )}
                    {auditResult.analysis.services?.length > 0 && (
                      <div className="col-span-2">
                        <span className="text-neutral-500">Services:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {auditResult.analysis.services.map((s: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-neutral-100 border border-neutral-200 text-xs">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Identified Assets */}
              <section>
                <p className="font-mono text-xs text-neutral-500 uppercase tracking-widest mb-4">
                  AI-Identified Assets
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Logo */}
                  <div className="bg-white border border-neutral-300 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs text-neutral-500 uppercase tracking-wider">Logo</span>
                      {(customLogoUrl || auditResult.analysis.logoUrl) && (
                        <button onClick={() => setCustomLogoUrl(null)} className="font-mono text-[10px] text-neutral-400 hover:text-red-500">Clear</button>
                      )}
                    </div>
                    {(customLogoUrl || auditResult.analysis.logoUrl) ? (
                      <div className="h-24 bg-neutral-50 border border-neutral-200 flex items-center justify-center p-3">
                        <img src={customLogoUrl || auditResult.analysis.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                      </div>
                    ) : (
                      <div className="h-24 bg-neutral-50 border border-dashed border-neutral-300 flex items-center justify-center">
                        <span className="font-mono text-xs text-neutral-400">No logo</span>
                      </div>
                    )}
                    <label className="mt-3 flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-neutral-300 cursor-pointer hover:bg-neutral-50 transition-colors">
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const f = e.target.files?.[0]; if (!f) return
                        setIsUploadingLogo(true)
                        try {
                          const fd = new FormData(); fd.append("file", f)
                          const res = await fetch("/api/upload", { method: "POST", body: fd })
                          if (res.ok) { const d = await res.json(); setCustomLogoUrl(d.url) }
                        } catch {}
                        setIsUploadingLogo(false)
                      }} />
                      <span className="font-mono text-xs text-neutral-500">{isUploadingLogo ? "Uploading..." : "Upload or replace"}</span>
                    </label>
                  </div>

                  {/* Hero */}
                  <div className="bg-white border border-neutral-300 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs text-neutral-500 uppercase tracking-wider">Hero Image</span>
                      {(customHeroUrl || auditResult.analysis.heroImageUrl) && (
                        <button onClick={() => setCustomHeroUrl(null)} className="font-mono text-[10px] text-neutral-400 hover:text-red-500">Clear</button>
                      )}
                    </div>
                    {(customHeroUrl || auditResult.analysis.heroImageUrl) ? (
                      <div className="h-24 bg-neutral-50 border border-neutral-200 overflow-hidden">
                        <img src={customHeroUrl || auditResult.analysis.heroImageUrl} alt="Hero" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                      </div>
                    ) : (
                      <div className="h-24 bg-neutral-50 border border-dashed border-neutral-300 flex items-center justify-center">
                        <span className="font-mono text-xs text-neutral-400">No hero image</span>
                      </div>
                    )}
                    <label className="mt-3 flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-neutral-300 cursor-pointer hover:bg-neutral-50 transition-colors">
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const f = e.target.files?.[0]; if (!f) return
                        setIsUploadingHero(true)
                        try {
                          const fd = new FormData(); fd.append("file", f)
                          const res = await fetch("/api/upload", { method: "POST", body: fd })
                          if (res.ok) { const d = await res.json(); setCustomHeroUrl(d.url) }
                        } catch {}
                        setIsUploadingHero(false)
                      }} />
                      <span className="font-mono text-xs text-neutral-500">{isUploadingHero ? "Uploading..." : "Upload or replace"}</span>
                    </label>
                  </div>
                </div>
              </section>

              {/* All Media */}
              {auditResult.scraped.images.length > 0 && (
                <section>
                  <p className="font-mono text-xs text-neutral-500 uppercase tracking-widest mb-4">
                    All Media ({auditResult.scraped.images.length} items)
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {auditResult.scraped.images.map((img: string, i: number) => {
                      const classification = auditResult.analysis.allImages?.find((ai: { url: string; type: string }) => ai.url === img)
                      return (
                        <div key={i} className="relative">
                          <div className="aspect-square bg-white border border-neutral-300 overflow-hidden">
                            <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "" }} />
                          </div>
                          {classification && classification.type !== "other" && (
                            <span className="absolute bottom-0 left-0 right-0 bg-neutral-900/80 text-white font-mono text-[8px] text-center py-0.5 uppercase">
                              {classification.type}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 border-t border-neutral-300">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-mono text-xs text-neutral-500 uppercase tracking-widest mb-8">
            Capabilities
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              number="01"
              title="Deep Audit"
              description="Full-stack analysis of HTML, CSS, JavaScript, assets, and accessibility compliance."
            />
            <FeatureCard
              number="02"
              title="AI Extraction"
              description="Intelligent component detection and asset categorization powered by vision models."
            />
            <FeatureCard
              number="03"
              title="Modern Stack"
              description="Rebuilt with Next.js, TypeScript, and Tailwind CSS. Production-ready from day one."
            />
          </div>
        </div>
      </section>

      {/* Action Bar */}
      <ActionBar visible={isComplete} />

      {isComplete && <div className="h-24" />}
    </main>
  )
}

function FeatureCard({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div className="bg-white border border-neutral-300 p-6">
      <span className="font-mono text-xs text-neutral-400 mb-2 block">{number}</span>
      <h3 className="font-mono text-lg font-medium text-neutral-900 mb-2">{title}</h3>
      <p className="font-sans text-sm text-neutral-600 leading-relaxed">{description}</p>
    </div>
  )
}

"use client"

import { useEffect } from "react"
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
  } = useProjectStore()

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
              <div className="w-8 h-8 bg-neutral-900 flex items-center justify-center">
                <span className="font-mono text-white text-xs font-bold">RF</span>
              </div>
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

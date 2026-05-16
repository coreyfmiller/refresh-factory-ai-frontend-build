"use client"

import { NavHeader } from "@/components/nav-header"
import { useProjectStore } from "@/lib/store"
import { ExternalLink, Loader2, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

export default function GeneratePage() {
  const { currentStep, demoUrl, auditResult, regenerate } = useProjectStore()
  const router = useRouter()

  const isGenerating = currentStep === "generating"

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <NavHeader />

      <div className="flex-1 flex flex-col max-w-6xl mx-auto px-6 py-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="font-mono text-xs text-neutral-500 uppercase tracking-widest mb-1">
              {isGenerating ? "Generating..." : "Preview"}
            </p>
            <h2 className="font-mono text-lg font-bold text-neutral-900">
              {auditResult?.analysis.businessName || "Generated Site"}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {demoUrl && (
              <a
                href={demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 border border-neutral-300 bg-white font-mono text-xs text-neutral-600 hover:bg-neutral-50"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open in new tab
              </a>
            )}
            <motion.button
              whileTap={{ x: 1, y: 1 }}
              onClick={() => { regenerate(); router.push("/review") }}
              className="flex items-center gap-2 px-3 py-2 border border-neutral-300 bg-white font-mono text-xs text-neutral-600 hover:bg-neutral-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Regenerate
            </motion.button>
            {demoUrl && (
              <motion.button
                whileTap={{ x: 1, y: 1 }}
                onClick={() => router.push("/deploy")}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white font-mono text-xs uppercase tracking-wider hover:bg-neutral-800"
              >
                Continue to Deploy →
              </motion.button>
            )}
          </div>
        </div>

        {/* Preview */}
        {isGenerating ? (
          <div className="flex-1 bg-white border border-neutral-300 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-400 mx-auto" />
              <div>
                <p className="font-mono text-sm text-neutral-700">Generating with v0...</p>
                <p className="font-mono text-xs text-neutral-500 mt-1">This typically takes 2-3 minutes</p>
              </div>
            </div>
          </div>
        ) : demoUrl ? (
          <div className="flex-1 bg-white border border-neutral-300 overflow-hidden">
            <iframe
              src={demoUrl}
              className="w-full h-full min-h-[600px] border-0"
              title="Generated site preview"
            />
          </div>
        ) : (
          <div className="flex-1 bg-white border border-neutral-300 flex items-center justify-center">
            <p className="font-mono text-sm text-neutral-500">No preview available. Generate a site first.</p>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, Monitor, Tablet, Smartphone } from "lucide-react"

type Viewport = "desktop" | "tablet" | "mobile"

export default function ClientPreviewPage() {
  const params = useParams()
  const id = params.id as string

  const [demoUrl, setDemoUrl] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState("")
  const [viewport, setViewport] = useState<Viewport>("desktop")
  const [approved, setApproved] = useState(false)

  // Load build data from localStorage (shared with main app)
  useEffect(() => {
    const stored = localStorage.getItem("refreshfactory-v2")
    if (stored) {
      try {
        const data = JSON.parse(stored)
        const state = data.state
        const build = state?.builds?.find((b: { id: string }) => b.id === id)
        if (build) {
          setDemoUrl(build.demoUrl)
          setBusinessName(state.siteMeta?.title || "Your New Website")
        }
      } catch {}
    }
  }, [id])

  const viewportWidths: Record<Viewport, string> = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  }

  if (!demoUrl) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <p className="font-mono text-sm text-[#71717A]">Preview not found.</p>
      </div>
    )
  }

  if (approved) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 max-w-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#10B981]/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-[#10B981]" />
          </div>
          <h1 className="font-sans text-2xl text-white font-medium">Design Approved!</h1>
          <p className="font-sans text-sm text-[#A1A1AA] leading-relaxed">
            Thank you for approving your new website design. Our team will be in touch shortly to discuss next steps and get your site live.
          </p>
          <p className="font-mono text-xs text-[#52525B]">Reference: {id}</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-[#0B1120]">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[#27272A] bg-[#0B1120] px-6 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="RefreshFactory" className="h-5 w-auto opacity-70" />
            <div className="w-px h-4 bg-[#27272A]" />
            <span className="font-sans text-sm text-white font-medium">{businessName}</span>
            <span className="font-mono text-[10px] text-[#52525B] uppercase tracking-wider px-2 py-0.5 border border-[#27272A] rounded">Preview</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Viewport switcher */}
            <div className="flex items-center gap-0.5 mr-2">
              {([
                { key: "desktop" as Viewport, icon: Monitor },
                { key: "tablet" as Viewport, icon: Tablet },
                { key: "mobile" as Viewport, icon: Smartphone },
              ]).map(({ key, icon: Icon }) => (
                <button key={key} onClick={() => setViewport(key)}
                  className={`p-1.5 transition-colors ${viewport === key ? "text-white" : "text-[#52525B] hover:text-[#A1A1AA]"}`}>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* Approve button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setApproved(true)}
              className="px-5 py-2 bg-[#10B981] text-white font-mono text-xs uppercase tracking-wider rounded hover:bg-[#059669] transition-colors"
            >
              Approve Design
            </motion.button>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 flex items-start justify-center p-4 overflow-auto bg-[#080D18]">
        <motion.div
          animate={{ width: viewportWidths[viewport] }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="h-full bg-white rounded-lg overflow-hidden shadow-2xl shadow-black/50"
          style={{ maxWidth: "100%" }}
        >
          <iframe src={demoUrl} className="w-full h-full border-0" title="Preview" />
        </motion.div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-[#27272A] bg-[#0B1120] px-6 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <span className="font-mono text-[10px] text-[#52525B]">Powered by RefreshFactory.ai</span>
          <span className="font-mono text-[10px] text-[#52525B]">Click "Approve Design" when you're ready to proceed</span>
        </div>
      </div>
    </div>
  )
}

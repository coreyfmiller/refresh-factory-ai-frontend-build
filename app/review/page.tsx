"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { NavHeader } from "@/components/nav-header"
import { useProjectStore } from "@/lib/store"
import { Eye, Trash2, Upload, Loader2 } from "lucide-react"

export default function ReviewPage() {
  const router = useRouter()
  const {
    auditResult,
    customInstructions,
    setCustomInstructions,
    useScrapedImages,
    setUseScrapedImages,
    customLogoUrl,
    setCustomLogoUrl,
    customHeroUrl,
    setCustomHeroUrl,
    startGeneration,
    currentStep,
  } = useProjectStore()

  const [showPrompt, setShowPrompt] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingHero, setIsUploadingHero] = useState(false)
  const [dismissedLogo, setDismissedLogo] = useState(false)
  const [dismissedHero, setDismissedHero] = useState(false)

  if (!auditResult) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <NavHeader />
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <p className="font-mono text-sm text-neutral-500">No audit data. Go back and scan a URL first.</p>
        </div>
      </div>
    )
  }

  const { scraped, analysis } = auditResult

  const handleGenerate = async () => {
    await startGeneration()
    router.push("/generate")
  }

  const handleUpload = async (
    file: File,
    setUrl: (url: string | null) => void,
    setLoading: (v: boolean) => void
  ) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (res.ok) {
        const data = await res.json()
        setUrl(data.url)
      }
    } catch {}
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <NavHeader />

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Business Identity */}
        <section>
          <p className="font-mono text-xs text-neutral-500 uppercase tracking-widest mb-4">
            Business Identity
          </p>
          <div className="bg-white border border-neutral-300 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-mono text-xl font-bold text-neutral-900">
                {analysis.businessName}
              </h2>
              <span className="font-mono text-xs text-neutral-500 uppercase px-2 py-1 border border-neutral-300">
                {analysis.businessType}
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-6 font-mono text-sm">
              {analysis.tagline && <DataRow label="Tagline" value={analysis.tagline} />}
              <DataRow label="Headline" value={analysis.headline} />
              {analysis.subheadline && <DataRow label="Subheadline" value={analysis.subheadline} />}
              {analysis.phoneNumber && <DataRow label="Phone" value={analysis.phoneNumber} />}
              {analysis.services?.length > 0 && (
                <div className="col-span-2">
                  <span className="text-neutral-500">Services:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {analysis.services.map((s, i) => (
                      <span key={i} className="px-2 py-1 bg-neutral-100 border border-neutral-200 text-xs">
                        {s}
                      </span>
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
            Identified Assets
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Logo */}
            <div className="bg-white border border-neutral-300 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs text-neutral-500 uppercase tracking-wider">Logo</span>
                {(analysis.logoUrl && !dismissedLogo) && (
                  <button onClick={() => setDismissedLogo(true)} className="p-1 hover:bg-neutral-100">
                    <Trash2 className="w-3.5 h-3.5 text-neutral-400" />
                  </button>
                )}
              </div>
              {customLogoUrl ? (
                <div className="relative h-24 bg-neutral-50 border border-neutral-200 flex items-center justify-center p-2">
                  <img src={customLogoUrl} alt="Custom logo" className="max-h-full max-w-full object-contain" />
                  <button onClick={() => setCustomLogoUrl(null)} className="absolute top-1 right-1 p-1 bg-white border border-neutral-200 hover:bg-neutral-50">
                    <Trash2 className="w-3 h-3 text-neutral-400" />
                  </button>
                </div>
              ) : analysis.logoUrl && !dismissedLogo ? (
                <div className="h-24 bg-neutral-50 border border-neutral-200 flex items-center justify-center p-2">
                  <img src={analysis.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                </div>
              ) : (
                <div className="h-24 bg-neutral-50 border border-dashed border-neutral-300 flex items-center justify-center">
                  <span className="font-mono text-xs text-neutral-400">No logo</span>
                </div>
              )}
              <label className="mt-3 flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-neutral-300 cursor-pointer hover:bg-neutral-50 transition-colors">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, setCustomLogoUrl, setIsUploadingLogo) }} />
                <Upload className="w-3.5 h-3.5 text-neutral-400" />
                <span className="font-mono text-xs text-neutral-500">{isUploadingLogo ? "Uploading..." : "Upload logo"}</span>
              </label>
            </div>

            {/* Hero */}
            <div className="bg-white border border-neutral-300 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs text-neutral-500 uppercase tracking-wider">Hero Image</span>
                {(analysis.heroImageUrl && !dismissedHero) && (
                  <button onClick={() => setDismissedHero(true)} className="p-1 hover:bg-neutral-100">
                    <Trash2 className="w-3.5 h-3.5 text-neutral-400" />
                  </button>
                )}
              </div>
              {customHeroUrl ? (
                <div className="relative h-24 bg-neutral-50 border border-neutral-200 overflow-hidden">
                  <img src={customHeroUrl} alt="Custom hero" className="w-full h-full object-cover" />
                  <button onClick={() => setCustomHeroUrl(null)} className="absolute top-1 right-1 p-1 bg-white border border-neutral-200 hover:bg-neutral-50">
                    <Trash2 className="w-3 h-3 text-neutral-400" />
                  </button>
                </div>
              ) : analysis.heroImageUrl && !dismissedHero ? (
                <div className="h-24 bg-neutral-50 border border-neutral-200 overflow-hidden">
                  <img src={analysis.heroImageUrl} alt="Hero" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                </div>
              ) : (
                <div className="h-24 bg-neutral-50 border border-dashed border-neutral-300 flex items-center justify-center">
                  <span className="font-mono text-xs text-neutral-400">No hero image</span>
                </div>
              )}
              <label className="mt-3 flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-neutral-300 cursor-pointer hover:bg-neutral-50 transition-colors">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f, setCustomHeroUrl, setIsUploadingHero) }} />
                <Upload className="w-3.5 h-3.5 text-neutral-400" />
                <span className="font-mono text-xs text-neutral-500">{isUploadingHero ? "Uploading..." : "Upload hero"}</span>
              </label>
            </div>
          </div>
        </section>

        {/* All Media */}
        {scraped.images.length > 0 && (
          <section>
            <p className="font-mono text-xs text-neutral-500 uppercase tracking-widest mb-4">
              All Media ({scraped.images.length} items)
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {scraped.images.map((img, i) => {
                const classification = analysis.allImages?.find((ai) => ai.url === img)
                return (
                  <div key={i} className="relative group">
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

        {/* Options */}
        <section>
          <p className="font-mono text-xs text-neutral-500 uppercase tracking-widest mb-4">
            Generation Options
          </p>
          <div className="bg-white border border-neutral-300 p-6 space-y-6">
            {/* Image toggle */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setUseScrapedImages(!useScrapedImages)}
                className={`relative w-10 h-5 rounded-full transition-colors ${useScrapedImages ? "bg-neutral-900" : "bg-neutral-300"}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${useScrapedImages ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
              <div>
                <p className="font-mono text-sm text-neutral-900">
                  {useScrapedImages ? "Use scraped images" : "Let v0 generate images"}
                </p>
                <p className="font-mono text-xs text-neutral-500">
                  {useScrapedImages ? "Pass logo + hero to v0" : "v0 uses its own stock images"}
                </p>
              </div>
            </div>

            {/* v0 Prompt */}
            <div>
              <button onClick={() => setShowPrompt(!showPrompt)} className="flex items-center gap-2 font-mono text-xs text-neutral-500 uppercase tracking-wider hover:text-neutral-900">
                <Eye className="w-3.5 h-3.5" />
                {showPrompt ? "Hide" : "Preview"} v0 Prompt
              </button>
              {showPrompt && (
                <motion.pre
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 p-4 bg-neutral-50 border border-neutral-200 font-mono text-xs text-neutral-700 whitespace-pre-wrap overflow-auto max-h-48"
                >
                  {analysis.v0Prompt}
                </motion.pre>
              )}
            </div>

            {/* Custom Instructions */}
            <div>
              <label className="font-mono text-xs text-neutral-500 uppercase tracking-wider block mb-2">
                Custom Instructions
              </label>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g., Use a dark theme, Make it look more premium..."
                className="w-full h-24 p-3 bg-neutral-50 border border-neutral-200 font-mono text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 resize-none"
              />
            </div>
          </div>
        </section>

        {/* Generate Button */}
        <div className="flex justify-end">
          <motion.button
            whileTap={{ x: 1, y: 1 }}
            onClick={handleGenerate}
            disabled={currentStep === "generating"}
            className="flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white font-mono text-sm uppercase tracking-wider hover:bg-neutral-800 disabled:opacity-50"
          >
            {currentStep === "generating" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate with v0"
            )}
          </motion.button>
        </div>
      </div>
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-neutral-500">{label}:</span>
      <span className="ml-2 text-neutral-900">{value}</span>
    </div>
  )
}

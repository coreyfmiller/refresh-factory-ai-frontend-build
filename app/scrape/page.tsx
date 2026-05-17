"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Loader2, Image as ImageIcon, ArrowRight, RefreshCw, ExternalLink } from "lucide-react"

interface ScrapedImage {
  url: string;
  context: string;
  nearText: string;
  page: string;
}

interface ScrapeResult {
  images: ScrapedImage[];
  logos: string[];
  title: string;
}

interface UploadedImages {
  hero: string | null;
  about: string | null;
  gallery: string[];
}

type Step = "idle" | "scraping" | "review" | "generating" | "preview"

export default function ScrapePage() {
  const [url, setUrl] = useState("")
  const [step, setStep] = useState<Step>("idle")
  const [scrapeResult, setScrapeResult] = useState<ScrapeResult | null>(null)
  const [uploadedImages, setUploadedImages] = useState<UploadedImages | null>(null)
  const [demoUrl, setDemoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    let normalized = url.trim()
    if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`

    setStep("scraping")
    setError(null)
    setScrapeResult(null)
    setUploadedImages(null)
    setDemoUrl(null)

    try {
      // Scrape
      const scrapeRes = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalized }),
      })
      if (!scrapeRes.ok) throw new Error("Scrape failed")
      const scrapeData = await scrapeRes.json()
      setScrapeResult(scrapeData)

      // Select and upload
      const selectRes = await fetch("/api/scrape-and-select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalized }),
      })
      if (selectRes.ok) {
        const selectData = await selectRes.json()
        setUploadedImages(selectData.uploaded)
      }

      setStep("review")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed")
      setStep("idle")
    }
  }

  const handleGenerate = async () => {
    let normalized = url.trim()
    if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`

    setStep("generating")
    setError(null)

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalized, images: uploadedImages }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Generation failed")
      }
      const data = await res.json()
      setDemoUrl(data.demoUrl)
      setStep("preview")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed")
      setStep("review")
    }
  }

  const handleReset = () => {
    setStep("idle")
    setScrapeResult(null)
    setUploadedImages(null)
    setDemoUrl(null)
    setError(null)
  }

  // Preview mode — full screen
  if (step === "preview" && demoUrl) {
    return (
      <div className="h-screen flex flex-col bg-[#0B1120]">
        <div className="flex-shrink-0 border-b border-[#27272A] bg-[#0B1120] px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="RF" className="h-5 w-auto opacity-70 cursor-pointer" onClick={handleReset} />
              <div className="w-px h-4 bg-[#27272A]" />
              <span className="font-mono text-xs text-[#A1A1AA]">{scrapeResult?.title || url}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => { setStep("review"); setDemoUrl(null) }} className="flex items-center gap-1 px-2.5 py-1.5 border border-[#27272A] font-mono text-[10px] text-[#A1A1AA] hover:text-white hover:border-[#3B82F6]/50 transition-all uppercase tracking-wider">
                <RefreshCw className="w-3 h-3" /> Rebuild
              </button>
              <a href={demoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-2.5 py-1.5 border border-[#27272A] font-mono text-[10px] text-[#A1A1AA] hover:text-white hover:border-[#3B82F6]/50 transition-all uppercase tracking-wider">
                <ExternalLink className="w-3 h-3" /> Open
              </a>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <iframe src={demoUrl} className="w-full h-full border-0" title="Preview" />
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#0B1120] px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="RF" className="h-8 w-auto opacity-70 cursor-pointer" onClick={handleReset} />
          <span className="font-mono text-sm text-[#A1A1AA]">/ scrape & generate</span>
        </div>

        {/* Input */}
        <form onSubmit={handleScrape}>
          <div className="bg-[#141416] border border-[#27272A] rounded-lg p-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[#3B82F6] text-sm pl-3 select-none">→</span>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="gooseelectricltd.ca"
                disabled={step === "scraping" || step === "generating"}
                className="flex-1 bg-transparent font-mono text-sm text-white placeholder:text-[#52525B] focus:outline-none py-3 disabled:opacity-50"
              />
              <motion.button
                type="submit"
                disabled={!url.trim() || step === "scraping" || step === "generating"}
                whileTap={{ scale: 0.98 }}
                className="px-5 py-2.5 bg-[#3B82F6] text-white font-mono text-xs uppercase tracking-wider rounded disabled:opacity-30 hover:bg-[#2563EB] transition-colors"
              >
                {step === "scraping" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Scrape"}
              </motion.button>
            </div>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-[#141416] border border-[#EF4444]/20 rounded-lg p-4">
            <span className="font-mono text-xs text-[#EF4444]">{error}</span>
          </div>
        )}

        {/* Scraping state */}
        {step === "scraping" && (
          <div className="bg-[#141416] border border-[#27272A] rounded-lg p-8 text-center space-y-4">
            <Loader2 className="w-6 h-6 text-[#3B82F6] animate-spin mx-auto" />
            <p className="font-mono text-sm text-[#A1A1AA]">Scraping site and uploading images...</p>
            <p className="font-mono text-[10px] text-[#52525B]">This may take 30-60 seconds</p>
          </div>
        )}

        {/* Review: show images + generate button */}
        {step === "review" && scrapeResult && (
          <div className="space-y-6">
            {/* Uploaded images summary */}
            {uploadedImages && (
              <div className="bg-[#141416] border border-[#27272A] rounded-lg p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[#52525B] uppercase tracking-widest">Selected for v0</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {uploadedImages.hero && (
                    <div className="space-y-1">
                      <span className="font-mono text-[9px] text-[#3B82F6] uppercase">Hero</span>
                      <div className="aspect-video bg-[#0B1120] border border-[#3B82F6]/30 rounded overflow-hidden">
                        <img src={uploadedImages.hero} alt="Hero" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                  {uploadedImages.about && (
                    <div className="space-y-1">
                      <span className="font-mono text-[9px] text-[#8B5CF6] uppercase">About</span>
                      <div className="aspect-video bg-[#0B1120] border border-[#8B5CF6]/30 rounded overflow-hidden">
                        <img src={uploadedImages.about} alt="About" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                  {uploadedImages.gallery.slice(0, 4).map((img, i) => (
                    <div key={i} className="space-y-1">
                      <span className="font-mono text-[9px] text-[#10B981] uppercase">Gallery {i + 1}</span>
                      <div className="aspect-video bg-[#0B1120] border border-[#10B981]/30 rounded overflow-hidden">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  ))}
                </div>
                {uploadedImages.gallery.length > 4 && (
                  <span className="font-mono text-[10px] text-[#52525B]">+ {uploadedImages.gallery.length - 4} more gallery images</span>
                )}
              </div>
            )}

            {/* All scraped images */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon className="w-4 h-4 text-[#3B82F6]" />
                <span className="font-mono text-xs text-[#A1A1AA] uppercase tracking-wider">
                  All scraped ({scrapeResult.images.length})
                </span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-1.5">
                {scrapeResult.images.map((img, i) => (
                  <div key={i} className="relative">
                    <div className="aspect-square bg-[#141416] border border-[#27272A] rounded overflow-hidden">
                      <img src={img.url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                    </div>
                    {img.context !== "unknown" && (
                      <span className={`absolute top-0.5 left-0.5 px-1 py-0.5 font-mono text-[7px] uppercase rounded ${
                        img.context === "hero" ? "bg-[#3B82F6]/80 text-white" :
                        img.context === "about" ? "bg-[#8B5CF6]/80 text-white" :
                        img.context === "gallery" ? "bg-[#10B981]/80 text-white" :
                        "bg-[#52525B]/80 text-white"
                      }`}>{img.context}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerate}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#3B82F6] text-white font-mono text-sm uppercase tracking-wider rounded-lg hover:bg-[#2563EB] transition-colors"
            >
              Generate with v0 <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        )}

        {/* Generating */}
        {step === "generating" && (
          <div className="bg-[#141416] border border-[#27272A] rounded-lg p-8 text-center space-y-5">
            <div className="relative w-16 h-16 mx-auto">
              <motion.div className="absolute inset-0 rounded-full border border-[#3B82F6]/30" animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
              <motion.div className="absolute inset-2 rounded-full border border-[#3B82F6]/50" animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0.2, 0.7] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} />
              <div className="absolute inset-4 rounded-full bg-[#3B82F6]/10 flex items-center justify-center">
                <div className="w-3 h-3 rounded-sm bg-[#3B82F6]" />
              </div>
            </div>
            <div>
              <p className="font-sans text-sm text-white font-medium">Generating with your images...</p>
              <p className="font-sans text-xs text-[#71717A] mt-1">3-5 minutes. The AI is building your site with the selected photos.</p>
            </div>
            <div className="w-full h-0.5 bg-[#27272A] rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-[#3B82F6] to-[#6366F1] rounded-full" initial={{ width: "0%" }} animate={{ width: "85%" }} transition={{ duration: 200, ease: "linear" }} />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

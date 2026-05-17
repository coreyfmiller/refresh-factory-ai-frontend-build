"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Loader2, Download, Image as ImageIcon } from "lucide-react"

interface ScrapeResult {
  images: { url: string; context: string; nearText: string; page: string }[];
  logos: string[];
  title: string;
}

export default function ScrapePage() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ScrapeResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    let normalized = url.trim()
    if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalized }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Scrape failed")
      }

      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0B1120] px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="RF" className="h-8 w-auto opacity-70" />
          <span className="font-mono text-sm text-[#A1A1AA]">/ scrape</span>
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
                disabled={isLoading}
                className="flex-1 bg-transparent font-mono text-sm text-white placeholder:text-[#52525B] focus:outline-none py-3 disabled:opacity-50"
              />
              <motion.button
                type="submit"
                disabled={!url.trim() || isLoading}
                whileTap={{ scale: 0.98 }}
                className="px-5 py-2.5 bg-[#3B82F6] text-white font-mono text-xs uppercase tracking-wider rounded disabled:opacity-30 hover:bg-[#2563EB] transition-colors"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Scrape"}
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

        {/* Results */}
        {result && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#3B82F6]" />
                <span className="font-mono text-xs text-[#A1A1AA] uppercase tracking-wider">
                  {result.images.length} images found
                </span>
              </div>
              <span className="font-mono text-xs text-[#52525B]">{result.title}</span>
            </div>

            {/* Logos */}
            {result.logos.length > 0 && (
              <div>
                <span className="font-mono text-[9px] text-[#52525B] uppercase tracking-widest block mb-2">Logos</span>
                <div className="flex gap-3">
                  {result.logos.map((logo, i) => (
                    <div key={i} className="bg-[#141416] border border-[#27272A] rounded p-3 h-16 flex items-center justify-center">
                      <img src={logo} alt="Logo" className="max-h-full max-w-[120px] object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Image Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {result.images.map((img, i) => (
                <div key={i} className="relative group">
                  <div className="aspect-square bg-[#141416] border border-[#27272A] rounded overflow-hidden">
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = "" }}
                    />
                  </div>
                  {/* Context badge */}
                  {img.context !== "unknown" && (
                    <span className={`absolute top-1 left-1 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider rounded ${
                      img.context === "hero" ? "bg-[#3B82F6]/80 text-white" :
                      img.context === "about" ? "bg-[#8B5CF6]/80 text-white" :
                      img.context === "gallery" ? "bg-[#10B981]/80 text-white" :
                      img.context === "services" ? "bg-[#F59E0B]/80 text-black" :
                      img.context === "header" ? "bg-[#EF4444]/80 text-white" :
                      "bg-[#52525B]/80 text-white"
                    }`}>
                      {img.context}
                    </span>
                  )}
                  {/* Hover info */}
                  <div className="absolute inset-0 bg-[#0B1120]/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                    {img.nearText && <span className="font-mono text-[8px] text-[#A1A1AA] mb-1 line-clamp-2">{img.nearText}</span>}
                    <a href={img.url} target="_blank" rel="noopener noreferrer" className="font-mono text-[9px] text-[#3B82F6]">Open</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

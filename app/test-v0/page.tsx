"use client"

import { useState } from "react"
import { Send, Loader2, ExternalLink } from "lucide-react"

export default function TestV0Page() {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [demoUrl, setDemoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    setError(null)
    setDemoUrl(null)

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ v0Prompt: prompt }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Generation failed")
      }

      setDemoUrl(data.demoUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1400px] mx-auto space-y-4">
        <h1 className="text-2xl font-bold font-mono text-foreground">
          Test v0 <span className="text-muted-foreground text-sm font-normal">— raw prompt → preview</span>
        </h1>

        {/* Prompt Input */}
        <div className="flex gap-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Build a modern contractor website with a hero image, gallery section, services grid, and testimonials. Use stock images for all sections."
            className="flex-1 px-4 py-3 rounded-xl bg-secondary/50 border border-border/50 text-foreground placeholder:text-muted-foreground text-sm outline-none focus:border-primary/50 resize-none h-24"
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium text-sm flex items-center gap-2 disabled:opacity-60 self-end"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Generate
              </>
            )}
          </button>
        </div>

        {isGenerating && (
          <p className="text-sm text-muted-foreground">This takes 2-3 minutes...</p>
        )}

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {/* Preview */}
        {demoUrl && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Preview:</span>
              <a
                href={demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary flex items-center gap-1"
              >
                Open in new tab <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="rounded-xl overflow-hidden border border-border/50">
              <iframe
                src={demoUrl}
                className="w-full h-[700px] border-0"
                title="v0 preview"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

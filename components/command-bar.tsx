"use client"

import { useState } from "react"
import { motion } from "framer-motion"

interface CommandBarProps {
  onSubmit: (url: string) => void
  isProcessing: boolean
}

export function CommandBar({ onSubmit, isProcessing }: CommandBarProps) {
  const [url, setUrl] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url.trim() && !isProcessing) {
      onSubmit(url.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative bg-white border border-neutral-300 p-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-neutral-500 text-sm pl-3 select-none">
            {"$>"}
          </span>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="example.com"
            disabled={isProcessing}
            className="flex-1 bg-transparent font-mono text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none py-3 disabled:opacity-50"
          />
          <motion.button
            type="submit"
            disabled={!url.trim() || isProcessing}
            whileTap={{ x: 1, y: 1 }}
            transition={{ duration: 0.05 }}
            className="px-6 py-2.5 bg-neutral-900 text-white font-mono text-sm uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-800"
          >
            {isProcessing ? "Processing" : "Initialize"}
          </motion.button>
        </div>
      </div>
    </form>
  )
}

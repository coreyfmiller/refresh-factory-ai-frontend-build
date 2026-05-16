"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

interface TypewriterLogProps {
  logs: string[]
  isActive: boolean
}

export function TypewriterLog({ logs, isActive }: TypewriterLogProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="w-full bg-[#F4F4F5] border border-neutral-300 p-4">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neutral-300">
        <span className="font-mono text-xs text-neutral-500 uppercase tracking-wider">
          System Log
        </span>
        {isActive && (
          <span className="w-2 h-2 bg-[#D97706] rounded-full cursor-blink" />
        )}
      </div>
      <div
        ref={containerRef}
        className="h-48 overflow-y-auto font-mono text-xs leading-relaxed"
      >
        {logs.length === 0 ? (
          <span className="text-neutral-400">Awaiting input...</span>
        ) : (
          logs.map((log, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.1, ease: "easeOut" }}
              className="flex gap-2 mb-1"
            >
              <span className="text-neutral-400 select-none">
                [{String(index + 1).padStart(3, "0")}]
              </span>
              <span className="text-neutral-700">{log}</span>
            </motion.div>
          ))
        )}
        {isActive && (
          <span className="inline-block w-2 h-4 bg-[#D97706] cursor-blink ml-1" />
        )}
      </div>
    </div>
  )
}

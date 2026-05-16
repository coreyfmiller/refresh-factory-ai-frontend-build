"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"

export type PipelineStepStatus = "idle" | "active" | "complete"

export interface PipelineStep {
  id: string
  label: string
  status: PipelineStepStatus
}

interface PipelineVisualizationProps {
  steps: PipelineStep[]
}

export function PipelineVisualization({ steps }: PipelineVisualizationProps) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center justify-between min-w-[700px] gap-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <StepBox step={step} index={index} />
            {index < steps.length - 1 && <Connector status={step.status} />}
          </div>
        ))}
      </div>
    </div>
  )
}

function StepBox({ step, index }: { step: PipelineStep; index: number }) {
  const getStatusStyles = () => {
    switch (step.status) {
      case "idle":
        return "border-neutral-300 bg-white text-neutral-400"
      case "active":
        return "border-[#D97706] bg-white text-neutral-900 animate-pulse-amber"
      case "complete":
        return "border-[#16A34A] bg-white text-neutral-900"
      default:
        return "border-neutral-300 bg-white text-neutral-400"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.15, ease: "easeOut" }}
      className={`relative flex flex-col items-center justify-center w-full max-w-[140px] h-20 border px-3 py-2 ${getStatusStyles()}`}
    >
      <span className="font-mono text-xs uppercase tracking-wider mb-1">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="font-mono text-sm font-medium text-center leading-tight">
        {step.label}
      </span>
      
      {step.status === "active" && (
        <motion.span
          className="absolute bottom-2 right-2 w-2 h-4 bg-[#D97706]"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
      
      {step.status === "complete" && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.1, ease: "easeOut" }}
          className="absolute top-2 right-2"
        >
          <Check className="w-3.5 h-3.5 text-[#16A34A]" strokeWidth={3} />
        </motion.div>
      )}
    </motion.div>
  )
}

function Connector({ status }: { status: PipelineStepStatus }) {
  return (
    <div className="flex-1 h-px mx-1 relative">
      <div className="absolute inset-0 bg-neutral-300" />
      {status === "complete" && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="absolute inset-0 bg-[#16A34A] origin-left"
        />
      )}
    </div>
  )
}

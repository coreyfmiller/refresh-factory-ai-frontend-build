"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useProjectStore } from "@/lib/store"

const steps = [
  { id: "home", label: "Home", href: "/", minStep: "idle" },
  { id: "review", label: "Review", href: "/review", minStep: "reviewing" },
  { id: "generate", label: "Generate", href: "/generate", minStep: "generating" },
  { id: "deploy", label: "Deploy", href: "/deploy", minStep: "workspace" },
]

export function NavHeader() {
  const pathname = usePathname()
  const { currentStep } = useProjectStore()

  const stepOrder = ["idle", "auditing", "reviewing", "generating", "workspace", "error"]
  const currentIndex = stepOrder.indexOf(currentStep)

  function isStepAccessible(minStep: string) {
    const minIndex = stepOrder.indexOf(minStep)
    return currentIndex >= minIndex
  }

  return (
    <header className="border-b border-neutral-300 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="RefreshFactory.ai" className="h-7 w-auto" />
            <span className="font-mono text-sm font-medium tracking-tight">
              RefreshFactory.ai
            </span>
          </Link>

          {/* Pipeline nav */}
          <nav className="flex items-center gap-1">
            {steps.map((step, i) => {
              const isActive = pathname === step.href
              const accessible = isStepAccessible(step.minStep)
              return (
                <div key={step.id} className="flex items-center">
                  {i > 0 && <span className="mx-1 text-neutral-300 font-mono text-xs">→</span>}
                  {accessible ? (
                    <Link
                      href={step.href}
                      className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
                        isActive
                          ? "bg-neutral-900 text-white"
                          : "text-neutral-600 hover:bg-neutral-100"
                      }`}
                    >
                      {step.label}
                    </Link>
                  ) : (
                    <span className="px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-neutral-300 cursor-not-allowed">
                      {step.label}
                    </span>
                  )}
                </div>
              )
            })}
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/test-v0" className="font-mono text-xs text-neutral-500 hover:text-neutral-900 uppercase tracking-wider">
              Test
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

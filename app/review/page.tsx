"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Image as ImageIcon, Trash2, Users, Package, Layers } from "lucide-react"

type MediaCategory = "background" | "product" | "team" | "trash"

interface MediaItem {
  id: string
  url: string
  category: MediaCategory | null
}

const MOCK_SCRAPED_DATA = {
  title: "Legacy Corp Inc.",
  description: "A traditional business website built in 2015 with jQuery and Bootstrap.",
  fonts: ["Open Sans", "Roboto", "Arial"],
  colors: ["#1a1a1a", "#ffffff", "#007bff", "#28a745", "#ffc107"],
  technologies: ["jQuery 3.2.1", "Bootstrap 4.0", "PHP 7.2", "MySQL"],
}

const MOCK_MEDIA: MediaItem[] = [
  { id: "1", url: "/placeholder.svg?height=200&width=300", category: null },
  { id: "2", url: "/placeholder.svg?height=200&width=300", category: null },
  { id: "3", url: "/placeholder.svg?height=200&width=300", category: null },
  { id: "4", url: "/placeholder.svg?height=200&width=300", category: null },
  { id: "5", url: "/placeholder.svg?height=200&width=300", category: null },
  { id: "6", url: "/placeholder.svg?height=200&width=300", category: null },
]

const MOCK_PROMPT = `You are a senior frontend developer rebuilding a legacy website.

Source Analysis:
- Framework: jQuery + Bootstrap
- Backend: PHP with MySQL database
- Design: Corporate blue theme, serif headers

Requirements:
- Convert to Next.js 14 with App Router
- Use TypeScript and Tailwind CSS
- Implement responsive design patterns
- Preserve SEO metadata and URLs
- Optimize all images for web

Output:
- Component-based architecture
- Server-side rendering where beneficial
- Accessible UI patterns (WCAG 2.1 AA)`

export default function ReviewPage() {
  const [media, setMedia] = useState<MediaItem[]>(MOCK_MEDIA)
  const [selectedCategory, setSelectedCategory] = useState<MediaCategory | null>(null)
  const [customInstructions, setCustomInstructions] = useState("")

  const categoryFilters: { key: MediaCategory; label: string; icon: typeof ImageIcon }[] = [
    { key: "background", label: "Background", icon: Layers },
    { key: "product", label: "Product", icon: Package },
    { key: "team", label: "Team", icon: Users },
    { key: "trash", label: "Trash", icon: Trash2 },
  ]

  const toggleMediaCategory = (id: string, category: MediaCategory) => {
    setMedia((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, category: item.category === category ? null : category }
          : item
      )
    )
  }

  const filteredMedia = selectedCategory
    ? media.filter((m) => m.category === selectedCategory)
    : media

  return (
    <main className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <header className="border-b border-neutral-300 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 font-mono text-xs text-neutral-500 hover:text-neutral-900 uppercase tracking-wider"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
              <div className="h-4 w-px bg-neutral-300" />
              <span className="font-mono text-sm font-medium">Asset Review</span>
            </div>
            <Link
              href="/editor/demo"
              className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] font-mono text-sm text-white hover:bg-[#1d4ed8] active:translate-x-px active:translate-y-px transition-transform"
            >
              Continue to Editor
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Identity Grid */}
        <section className="mb-12">
          <p className="font-mono text-xs text-neutral-500 uppercase tracking-widest mb-4">
            Identity Analysis
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Raw Scraped Data */}
            <div className="bg-[#F4F4F5] border border-neutral-300 p-6">
              <h3 className="font-mono text-xs text-neutral-500 uppercase tracking-wider mb-4 pb-2 border-b border-neutral-300">
                Raw Scraped Data
              </h3>
              <div className="space-y-4 font-mono text-sm">
                <DataRow label="Title" value={MOCK_SCRAPED_DATA.title} />
                <DataRow label="Description" value={MOCK_SCRAPED_DATA.description} />
                <DataRow label="Fonts" value={MOCK_SCRAPED_DATA.fonts.join(", ")} />
                <div>
                  <span className="text-neutral-500">Colors:</span>
                  <div className="flex gap-2 mt-2">
                    {MOCK_SCRAPED_DATA.colors.map((color) => (
                      <div
                        key={color}
                        className="w-8 h-8 border border-neutral-300"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
                <DataRow label="Stack" value={MOCK_SCRAPED_DATA.technologies.join(" | ")} />
              </div>
            </div>

            {/* AI Reimagined Assets */}
            <div className="bg-white border border-neutral-300 p-6">
              <h3 className="font-mono text-xs text-[#2563EB] uppercase tracking-wider mb-4 pb-2 border-b border-neutral-300">
                AI Reimagined Assets
              </h3>
              <div className="space-y-4 font-mono text-sm">
                <DataRow label="Title" value="Legacy Corp — Modernized" />
                <DataRow label="Stack" value="Next.js 14 | TypeScript | Tailwind CSS" />
                <DataRow label="Fonts" value="Inter (UI) | JetBrains Mono (Code)" />
                <div>
                  <span className="text-neutral-500">Optimized Colors:</span>
                  <div className="flex gap-2 mt-2">
                    {["#171717", "#FFFFFF", "#2563EB", "#16A34A", "#D97706"].map((color) => (
                      <div
                        key={color}
                        className="w-8 h-8 border border-neutral-300 relative"
                        style={{ backgroundColor: color }}
                        title={color}
                      >
                        <span className="absolute -bottom-5 left-0 text-[9px] text-neutral-400">
                          {color}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-4">
                  <span className="text-neutral-500">Accessibility:</span>
                  <span className="ml-2 px-2 py-0.5 bg-[#16A34A] text-white text-xs">
                    WCAG 2.1 AA
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Media Grid */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <p className="font-mono text-xs text-neutral-500 uppercase tracking-widest">
              Media Assets ({media.length} items)
            </p>
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ x: 1, y: 1 }}
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 border font-mono text-xs uppercase tracking-wider transition-colors ${
                  selectedCategory === null
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50"
                }`}
              >
                All
              </motion.button>
              {categoryFilters.map((cat) => (
                <motion.button
                  key={cat.key}
                  whileTap={{ x: 1, y: 1 }}
                  onClick={() => setSelectedCategory(selectedCategory === cat.key ? null : cat.key)}
                  className={`px-3 py-1.5 border font-mono text-xs uppercase tracking-wider transition-colors ${
                    selectedCategory === cat.key
                      ? "bg-neutral-900 text-white border-neutral-900"
                      : "bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50"
                  }`}
                >
                  {cat.label}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {filteredMedia.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                onCategorySelect={(category) => toggleMediaCategory(item.id, category)}
                categoryFilters={categoryFilters}
              />
            ))}
          </div>
        </section>

        {/* Prompt Workspace */}
        <section>
          <p className="font-mono text-xs text-neutral-500 uppercase tracking-widest mb-4">
            Prompt Workspace
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {/* System Prompt */}
            <div className="bg-[#F4F4F5] border border-neutral-300 p-6">
              <h3 className="font-mono text-xs text-neutral-500 uppercase tracking-wider mb-4 pb-2 border-b border-neutral-300">
                System Prompt
              </h3>
              <pre className="font-mono text-xs text-neutral-700 whitespace-pre-wrap leading-relaxed overflow-auto max-h-64">
                {MOCK_PROMPT}
              </pre>
            </div>

            {/* Custom Instructions */}
            <div className="bg-white border border-neutral-300 p-6">
              <h3 className="font-mono text-xs text-[#2563EB] uppercase tracking-wider mb-4 pb-2 border-b border-neutral-300">
                Custom Instructions
              </h3>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Add your custom instructions here..."
                className="w-full h-56 bg-transparent font-mono text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none resize-none leading-relaxed"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
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

function MediaCard({
  item,
  onCategorySelect,
  categoryFilters,
}: {
  item: MediaItem
  onCategorySelect: (category: MediaCategory) => void
  categoryFilters: { key: MediaCategory; label: string; icon: typeof ImageIcon }[]
}) {
  const [showControls, setShowControls] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <div className="border border-neutral-300 bg-white overflow-hidden">
        <div className="aspect-video bg-neutral-100 relative">
          <img
            src={item.url}
            alt="Scraped media"
            className="w-full h-full object-cover"
          />
          {item.category && (
            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-neutral-900 text-white font-mono text-[9px] uppercase">
              {item.category}
            </div>
          )}
        </div>
      </div>
      
      {showControls && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
          className="absolute inset-0 bg-neutral-900/80 flex items-center justify-center gap-1 p-2"
        >
          {categoryFilters.map((cat) => {
            const Icon = cat.icon
            const isSelected = item.category === cat.key
            return (
              <motion.button
                key={cat.key}
                whileTap={{ x: 1, y: 1 }}
                onClick={() => onCategorySelect(cat.key)}
                className={`p-2 transition-colors ${
                  isSelected
                    ? "bg-white text-neutral-900"
                    : "bg-transparent text-white hover:bg-white/20"
                }`}
                title={cat.label}
              >
                <Icon className="w-4 h-4" />
              </motion.button>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}

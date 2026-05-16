"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  ChevronRight, 
  ChevronDown, 
  FileCode, 
  Folder, 
  FolderOpen,
  Send,
  Monitor,
  Tablet,
  Smartphone,
  ArrowLeft,
  RefreshCw,
  ExternalLink
} from "lucide-react"
import Link from "next/link"

type ViewportSize = "desktop" | "tablet" | "mobile"

interface FileNode {
  name: string
  type: "file" | "folder"
  children?: FileNode[]
  modified?: boolean
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

const MOCK_FILE_TREE: FileNode[] = [
  {
    name: "app",
    type: "folder",
    children: [
      { name: "layout.tsx", type: "file" },
      { name: "page.tsx", type: "file", modified: true },
      { name: "globals.css", type: "file" },
      {
        name: "components",
        type: "folder",
        children: [
          { name: "header.tsx", type: "file", modified: true },
          { name: "footer.tsx", type: "file" },
          { name: "hero.tsx", type: "file" },
        ],
      },
    ],
  },
  {
    name: "public",
    type: "folder",
    children: [
      { name: "logo.svg", type: "file" },
      { name: "favicon.ico", type: "file" },
    ],
  },
  { name: "package.json", type: "file" },
  { name: "tailwind.config.ts", type: "file" },
  { name: "tsconfig.json", type: "file" },
]

const MOCK_TERMINAL_LOGS = [
  "$ pnpm dev",
  "",
  "   ▲ Next.js 14.2.0",
  "   - Local:        http://localhost:3000",
  "   - Network:      http://192.168.1.100:3000",
  "",
  " ✓ Ready in 1.2s",
  " ○ Compiling /page ...",
  " ✓ Compiled /page in 324ms",
]

const MOCK_CHAT: ChatMessage[] = [
  {
    role: "user",
    content: "Can you update the header to use a sticky position?",
  },
  {
    role: "assistant",
    content: "I&apos;ve updated the header component to use `sticky top-0` with a z-index of 50. The header will now remain fixed at the top while scrolling.",
  },
  {
    role: "user",
    content: "Add a subtle shadow when scrolled",
  },
  {
    role: "assistant",
    content: "Done. I added a scroll listener that toggles `shadow-sm` on the header when `scrollY > 0`. The shadow provides visual separation without being too heavy.",
  },
]

export default function EditorPage() {
  const [viewport, setViewport] = useState<ViewportSize>("desktop")
  const [chatInput, setChatInput] = useState("")
  const [chat, setChat] = useState<ChatMessage[]>(MOCK_CHAT)

  const handleSendMessage = () => {
    if (!chatInput.trim()) return
    setChat([...chat, { role: "user", content: chatInput }])
    setChatInput("")
    // Simulate assistant response
    setTimeout(() => {
      setChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Processing your request. I&apos;ll analyze the codebase and implement the changes.",
        },
      ])
    }, 500)
  }

  const viewportWidths: Record<ViewportSize, string> = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  }

  return (
    <div className="h-screen flex flex-col bg-[#F8F9FA]">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-neutral-300 bg-white">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 font-mono text-xs text-neutral-500 hover:text-neutral-900 uppercase tracking-wider"
            >
              <ArrowLeft className="w-4 h-4" />
              Exit
            </Link>
            <div className="h-4 w-px bg-neutral-300" />
            <span className="font-mono text-sm font-medium">
              Workspace Editor
            </span>
            <span className="font-mono text-xs text-neutral-400">
              / demo-project
            </span>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ x: 1, y: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 border border-neutral-300 bg-white font-mono text-xs text-neutral-600 hover:bg-neutral-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Rebuild
            </motion.button>
            <motion.button
              whileTap={{ x: 1, y: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#2563EB] font-mono text-xs text-white hover:bg-[#1d4ed8]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Deploy
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Architect */}
        <div className="w-[400px] flex-shrink-0 border-r border-neutral-300 bg-white flex flex-col">
          {/* Terminal */}
          <div className="h-48 border-b border-neutral-300 flex flex-col">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-neutral-300 bg-[#F4F4F5]">
              <span className="font-mono text-xs text-neutral-500 uppercase tracking-wider">
                Terminal
              </span>
              <span className="w-2 h-2 bg-[#16A34A] rounded-full" />
            </div>
            <div className="flex-1 p-3 overflow-auto bg-neutral-900">
              <pre className="font-mono text-xs text-neutral-300 leading-relaxed">
                {MOCK_TERMINAL_LOGS.join("\n")}
              </pre>
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-neutral-300 bg-[#F4F4F5]">
              <span className="font-mono text-xs text-neutral-500 uppercase tracking-wider">
                AI Assistant
              </span>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {chat.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.1 }}
                  className={`${
                    msg.role === "user"
                      ? "ml-8 bg-[#F4F4F5] border border-neutral-300"
                      : "mr-8 bg-white border border-[#2563EB]/20"
                  } p-3`}
                >
                  <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">
                    {msg.role === "user" ? "You" : "Assistant"}
                  </span>
                  <p className="font-sans text-sm text-neutral-700 leading-relaxed">
                    {msg.content}
                  </p>
                </motion.div>
              ))}
            </div>
            <div className="p-4 border-t border-neutral-300">
              <div className="flex items-center gap-2 bg-[#F4F4F5] border border-neutral-300 p-1">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask the AI assistant..."
                  className="flex-1 bg-transparent font-mono text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none px-2 py-1.5"
                />
                <motion.button
                  whileTap={{ x: 1, y: 1 }}
                  onClick={handleSendMessage}
                  className="p-2 bg-neutral-900 text-white hover:bg-neutral-800"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* File Tree */}
          <div className="h-64 border-t border-neutral-300 flex flex-col">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-neutral-300 bg-[#F4F4F5]">
              <span className="font-mono text-xs text-neutral-500 uppercase tracking-wider">
                Files
              </span>
            </div>
            <div className="flex-1 overflow-auto p-2">
              <FileTree nodes={MOCK_FILE_TREE} />
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 flex flex-col bg-neutral-100">
          {/* Viewport Controls */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-300 bg-white">
            <div className="flex items-center gap-1">
              {(["desktop", "tablet", "mobile"] as ViewportSize[]).map((size) => {
                const icons: Record<ViewportSize, typeof Monitor> = {
                  desktop: Monitor,
                  tablet: Tablet,
                  mobile: Smartphone,
                }
                const Icon = icons[size]
                return (
                  <motion.button
                    key={size}
                    whileTap={{ x: 1, y: 1 }}
                    onClick={() => setViewport(size)}
                    className={`flex items-center gap-2 px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
                      viewport === size
                        ? "bg-neutral-900 text-white"
                        : "bg-white text-neutral-500 hover:bg-neutral-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {size}
                  </motion.button>
                )
              })}
            </div>
            <span className="font-mono text-xs text-neutral-400">
              {viewportWidths[viewport]}
            </span>
          </div>

          {/* Preview Frame */}
          <div className="flex-1 flex items-start justify-center p-6 overflow-auto">
            <motion.div
              animate={{ width: viewportWidths[viewport] }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="h-full bg-white border border-neutral-300 shadow-sm overflow-hidden"
              style={{ maxWidth: "100%" }}
            >
              <iframe
                src="/"
                className="w-full h-full border-0"
                title="Preview"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FileTree({ nodes, depth = 0 }: { nodes: FileNode[]; depth?: number }) {
  return (
    <div className="space-y-0.5">
      {nodes.map((node) => (
        <FileTreeNode key={node.name} node={node} depth={depth} />
      ))}
    </div>
  )
}

function FileTreeNode({ node, depth }: { node: FileNode; depth: number }) {
  const [isOpen, setIsOpen] = useState(depth < 2)
  const [flashModified, setFlashModified] = useState(false)

  // Simulate flash effect when modified
  const handleClick = () => {
    if (node.type === "folder") {
      setIsOpen(!isOpen)
    } else if (node.modified) {
      setFlashModified(true)
      setTimeout(() => setFlashModified(false), 300)
    }
  }

  return (
    <div>
      <motion.button
        whileTap={{ x: 1, y: 1 }}
        onClick={handleClick}
        className={`w-full flex items-center gap-1.5 px-2 py-1 hover:bg-neutral-100 text-left transition-colors ${
          flashModified ? "bg-amber-50" : ""
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {node.type === "folder" ? (
          <>
            {isOpen ? (
              <ChevronDown className="w-3 h-3 text-neutral-400 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-3 h-3 text-neutral-400 flex-shrink-0" />
            )}
            {isOpen ? (
              <FolderOpen className="w-4 h-4 text-[#D97706] flex-shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-[#D97706] flex-shrink-0" />
            )}
          </>
        ) : (
          <>
            <span className="w-3" />
            <FileCode className="w-4 h-4 text-[#2563EB] flex-shrink-0" />
          </>
        )}
        <span className="font-mono text-xs text-neutral-700 truncate">
          {node.name}
        </span>
        {node.modified && (
          <span className="w-1.5 h-1.5 bg-[#D97706] rounded-full ml-auto flex-shrink-0" />
        )}
      </motion.button>
      {node.type === "folder" && isOpen && node.children && (
        <FileTree nodes={node.children} depth={depth + 1} />
      )}
    </div>
  )
}

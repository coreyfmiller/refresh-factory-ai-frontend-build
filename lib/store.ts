"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AnalysisResult } from "./audit/analyzer";

export type PipelineStep = "idle" | "auditing" | "reviewing" | "generating" | "workspace" | "error";

export interface ScrapedInfo {
  url: string;
  title: string;
  description: string;
  images: string[];
  logos: string[];
  fonts: string[];
  colors: string[];
  navLinks: string[];
  headings: { level: number; text: string }[];
  heroText: string | null;
  heroSubtext: string | null;
  socialLinks: string[];
  screenshot: string | null;
}

export interface AuditResult {
  scraped: ScrapedInfo;
  analysis: AnalysisResult;
}

export interface GeneratedFile {
  name: string;
  content: string;
}

export interface ProjectState {
  // Pipeline state
  currentStep: PipelineStep;
  error: string | null;

  // Audit data
  targetUrl: string;
  auditResult: AuditResult | null;

  // Generation
  customInstructions: string;
  useScrapedImages: boolean;
  customLogoUrl: string | null;
  customHeroUrl: string | null;
  generatedCode: string | null;
  generatedFiles: GeneratedFile[];
  demoUrl: string | null;
  chatId: string | null;

  // Deploy state
  githubUrl: string | null;
  deploymentUrl: string | null;
  isDeploying: boolean;
  isPushingToGit: boolean;

  // Edit state
  editHistory: { message: string; timestamp: number }[];
  isEditing: boolean;

  // Actions
  setTargetUrl: (url: string) => void;
  startAudit: () => Promise<void>;
  setCustomInstructions: (instructions: string) => void;
  setUseScrapedImages: (use: boolean) => void;
  setCustomLogoUrl: (url: string | null) => void;
  setCustomHeroUrl: (url: string | null) => void;
  startGeneration: () => Promise<void>;
  sendEdit: (message: string) => Promise<void>;
  pushToGitHub: (projectName: string) => Promise<void>;
  deployToVercel: (projectName: string) => Promise<void>;
  regenerate: () => void;
  reset: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      currentStep: "idle",
      error: null,
      targetUrl: "",
      auditResult: null,
      customInstructions: "",
      useScrapedImages: true,
      customLogoUrl: null,
      customHeroUrl: null,
      generatedCode: null,
      generatedFiles: [],
      demoUrl: null,
      chatId: null,
      githubUrl: null,
      deploymentUrl: null,
      isDeploying: false,
      isPushingToGit: false,
      editHistory: [],
      isEditing: false,

      setTargetUrl: (url) => set({ targetUrl: url }),

      startAudit: async () => {
        const { targetUrl } = get();
        if (!targetUrl) return;

        set({ currentStep: "auditing", error: null });

        try {
          const response = await fetch("/api/audit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: targetUrl }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Audit failed");
          }

          const data = await response.json();
          set({
            auditResult: data,
            currentStep: "reviewing",
          });
        } catch (error) {
          set({
            currentStep: "error",
            error: error instanceof Error ? error.message : "Audit failed",
          });
        }
      },

      setCustomInstructions: (instructions) =>
        set({ customInstructions: instructions }),

      setUseScrapedImages: (use) => set({ useScrapedImages: use }),

      setCustomLogoUrl: (url) => set({ customLogoUrl: url }),

      setCustomHeroUrl: (url) => set({ customHeroUrl: url }),

      startGeneration: async () => {
        const { auditResult, customInstructions, useScrapedImages, customLogoUrl, customHeroUrl } = get();
        if (!auditResult) return;

        set({ currentStep: "generating", error: null });

        try {
          const response = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              v0Prompt: auditResult.analysis.v0Prompt,
              customInstructions: [
                customLogoUrl ? `Use this logo: ${customLogoUrl}` : "",
                customHeroUrl ? `Use this hero image: ${customHeroUrl}` : "",
                customInstructions,
              ].filter(Boolean).join(" ") || undefined,
              skipImages: !useScrapedImages,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Generation failed");
          }

          const data = await response.json();
          set({
            generatedCode: data.generatedCode,
            generatedFiles: data.files || [],
            demoUrl: data.demoUrl,
            chatId: data.chatId,
            currentStep: "workspace",
          });
        } catch (error) {
          set({
            currentStep: "error",
            error: error instanceof Error ? error.message : "Generation failed",
          });
        }
      },

      sendEdit: async (message: string) => {
        const { chatId } = get();
        if (!chatId) return;

        set({ isEditing: true, error: null });

        try {
          const response = await fetch("/api/edit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chatId, message }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Edit failed");
          }

          const data = await response.json();
          set((state) => ({
            generatedCode: data.generatedCode || state.generatedCode,
            generatedFiles: data.files || state.generatedFiles,
            demoUrl: data.demoUrl || state.demoUrl,
            isEditing: false,
            editHistory: [
              ...state.editHistory,
              { message, timestamp: Date.now() },
            ],
          }));
        } catch (error) {
          set({
            isEditing: false,
            error: error instanceof Error ? error.message : "Edit failed",
          });
        }
      },

      pushToGitHub: async (projectName: string) => {
        const { generatedFiles, auditResult, customLogoUrl, customHeroUrl } = get();
        if (!generatedFiles.length || !auditResult) return;

        set({ isPushingToGit: true, error: null });

        try {
          const images = auditResult.scraped.images.map((url) => {
            const classification = auditResult.analysis.allImages?.find(
              (ai) => ai.url === url
            );
            return {
              url,
              type: classification?.type || "other",
              description: classification?.description || "",
            };
          });

          const response = await fetch("/api/github", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectName,
              files: generatedFiles,
              brandName: auditResult.analysis.businessName,
              images,
              logoUrl: customLogoUrl || auditResult.analysis.logoUrl || null,
              heroUrl: customHeroUrl || auditResult.analysis.heroImageUrl || null,
            }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "GitHub push failed");
          }

          const data = await response.json();
          set({
            githubUrl: data.url,
            isPushingToGit: false,
          });
        } catch (error) {
          set({
            isPushingToGit: false,
            error: error instanceof Error ? error.message : "GitHub push failed",
          });
        }
      },

      deployToVercel: async (projectName: string) => {
        const { githubUrl } = get();
        if (!githubUrl) return;

        set({ isDeploying: true, error: null });

        try {
          const response = await fetch("/api/deploy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectName, githubUrl }),
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Deployment failed");
          }

          const data = await response.json();
          set({
            deploymentUrl: data.url,
            isDeploying: false,
          });
        } catch (error) {
          set({
            isDeploying: false,
            error: error instanceof Error ? error.message : "Deployment failed",
          });
        }
      },

      regenerate: () =>
        set({
          currentStep: "reviewing",
          error: null,
          generatedCode: null,
          generatedFiles: [],
          demoUrl: null,
          chatId: null,
          githubUrl: null,
          deploymentUrl: null,
          isDeploying: false,
          isPushingToGit: false,
          editHistory: [],
          isEditing: false,
        }),

      reset: () =>
        set({
          currentStep: "idle",
          error: null,
          targetUrl: "",
          auditResult: null,
          customInstructions: "",
          useScrapedImages: true,
          customLogoUrl: null,
          customHeroUrl: null,
          generatedCode: null,
          generatedFiles: [],
          demoUrl: null,
          chatId: null,
          githubUrl: null,
          deploymentUrl: null,
          isDeploying: false,
          isPushingToGit: false,
          editHistory: [],
          isEditing: false,
        }),
    }),
    {
      name: "refreshfactory-project",
      partialize: (state) => ({
        // Persist everything except transient loading states and the screenshot
        currentStep: state.currentStep,
        targetUrl: state.targetUrl,
        auditResult: state.auditResult
          ? {
              ...state.auditResult,
              scraped: {
                ...state.auditResult.scraped,
                screenshot: null, // Don't persist screenshot (too large)
              },
            }
          : null,
        customInstructions: state.customInstructions,
        useScrapedImages: state.useScrapedImages,
        customLogoUrl: state.customLogoUrl,
        customHeroUrl: state.customHeroUrl,
        generatedCode: state.generatedCode,
        generatedFiles: state.generatedFiles,
        demoUrl: state.demoUrl,
        chatId: state.chatId,
        githubUrl: state.githubUrl,
        deploymentUrl: state.deploymentUrl,
        editHistory: state.editHistory,
        error: state.error, // Persist error so it shows after refresh
      }),
    }
  )
);

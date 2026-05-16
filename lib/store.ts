"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppStep = "idle" | "scanning" | "generating" | "preview" | "error";

export interface Build {
  id: string;
  demoUrl: string;
  chatId: string;
  timestamp: number;
}

export interface ProjectState {
  // Flow state
  step: AppStep;
  error: string | null;

  // Input
  targetUrl: string;
  siteMeta: { title: string; description: string } | null;

  // Builds
  builds: Build[];
  activeBuildIndex: number;

  // Deploy
  githubUrl: string | null;
  deploymentUrl: string | null;
  isPushing: boolean;
  isDeploying: boolean;

  // Actions
  setTargetUrl: (url: string) => void;
  startBuild: () => Promise<void>;
  tryAnother: () => Promise<void>;
  selectBuild: (index: number) => void;
  pushToGitHub: (projectName: string) => Promise<void>;
  deployToVercel: (projectName: string) => Promise<void>;
  reset: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      step: "idle",
      error: null,
      targetUrl: "",
      siteMeta: null,
      builds: [],
      activeBuildIndex: 0,
      githubUrl: null,
      deploymentUrl: null,
      isPushing: false,
      isDeploying: false,

      setTargetUrl: (url) => set({ targetUrl: url }),

      startBuild: async () => {
        const { targetUrl } = get();
        if (!targetUrl) return;

        set({ step: "scanning", error: null });

        // Quick metadata fetch (for display theater)
        try {
          const metaRes = await fetch("/api/meta", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: targetUrl }),
          });
          if (metaRes.ok) {
            const meta = await metaRes.json();
            set({ siteMeta: meta });
          }
        } catch {}

        // Now generate with v0
        set({ step: "generating" });

        try {
          const res = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: targetUrl }),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Generation failed");
          }

          const data = await res.json();
          const newBuild: Build = {
            id: data.chatId,
            demoUrl: data.demoUrl,
            chatId: data.chatId,
            timestamp: Date.now(),
          };

          set((state) => ({
            builds: [...state.builds, newBuild],
            activeBuildIndex: state.builds.length,
            step: "preview",
          }));
        } catch (error) {
          set({
            step: "error",
            error: error instanceof Error ? error.message : "Generation failed",
          });
        }
      },

      tryAnother: async () => {
        const { targetUrl } = get();
        if (!targetUrl) return;

        set({ step: "generating", error: null });

        try {
          const res = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: targetUrl }),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Generation failed");
          }

          const data = await res.json();
          const newBuild: Build = {
            id: data.chatId,
            demoUrl: data.demoUrl,
            chatId: data.chatId,
            timestamp: Date.now(),
          };

          set((state) => ({
            builds: [...state.builds, newBuild],
            activeBuildIndex: state.builds.length,
            step: "preview",
          }));
        } catch (error) {
          set({
            step: "error",
            error: error instanceof Error ? error.message : "Generation failed",
          });
        }
      },

      selectBuild: (index) => set({ activeBuildIndex: index }),

      pushToGitHub: async (projectName: string) => {
        const { builds, activeBuildIndex } = get();
        const build = builds[activeBuildIndex];
        if (!build) return;

        set({ isPushing: true, error: null });

        try {
          const res = await fetch("/api/github", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectName, chatId: build.chatId }),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Push failed");
          }

          const data = await res.json();
          set({ githubUrl: data.url, isPushing: false });
        } catch (error) {
          set({
            isPushing: false,
            error: error instanceof Error ? error.message : "Push failed",
          });
        }
      },

      deployToVercel: async (projectName: string) => {
        const { githubUrl } = get();
        if (!githubUrl) return;

        set({ isDeploying: true, error: null });

        try {
          const res = await fetch("/api/deploy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectName, githubUrl }),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Deploy failed");
          }

          const data = await res.json();
          set({ deploymentUrl: data.url, isDeploying: false });
        } catch (error) {
          set({
            isDeploying: false,
            error: error instanceof Error ? error.message : "Deploy failed",
          });
        }
      },

      reset: () =>
        set({
          step: "idle",
          error: null,
          targetUrl: "",
          siteMeta: null,
          builds: [],
          activeBuildIndex: 0,
          githubUrl: null,
          deploymentUrl: null,
          isPushing: false,
          isDeploying: false,
        }),
    }),
    {
      name: "refreshfactory-v2",
      partialize: (state) => ({
        step: state.step,
        targetUrl: state.targetUrl,
        siteMeta: state.siteMeta,
        builds: state.builds,
        activeBuildIndex: state.activeBuildIndex,
        githubUrl: state.githubUrl,
        deploymentUrl: state.deploymentUrl,
      }),
    }
  )
);

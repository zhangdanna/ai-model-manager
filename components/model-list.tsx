"use client";

import type { AIModel } from "@/lib/types";
import { PROVIDERS } from "@/lib/types";

interface ModelListProps {
  models: AIModel[];
  onDelete: (id: string) => void;
}

export default function ModelList({ models, onDelete }: ModelListProps) {
  if (models.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center">
        <p className="text-zinc-400">暂无模型，请添加第一个模型</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {models.map((model) => {
        const providerLabel = PROVIDERS.find((p) => p.value === model.provider)?.label ?? model.provider;
        return (
          <div
            key={model.id}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{model.name}</h3>
                <span className="inline-block mt-1 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-zinc-600 dark:text-zinc-400">
                  {providerLabel}
                </span>
              </div>
              <button
                onClick={() => onDelete(model.id)}
                className="text-zinc-400 hover:text-red-500 transition-colors"
                title="删除"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>

            <div className="space-y-1.5 text-sm text-zinc-500">
              {model.endpoint && (
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">Endpoint:</span>
                  <span className="font-mono text-xs truncate">{model.endpoint}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">API Key:</span>
                <span className="font-mono text-xs">{model.apiKey ? "••••••••" : "未设置"}</span>
              </div>
              <div className="text-xs text-zinc-400">
                创建于 {new Date(model.createdAt).toLocaleDateString("zh-CN")}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
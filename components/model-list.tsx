"use client";

import { useState } from "react";
import type { AIModel } from "@/lib/types";
import { PROVIDERS } from "@/lib/types";

interface ModelListProps {
  models: AIModel[];
  onDelete: (id: string) => void;
  onEdit: (model: AIModel) => void;
}

export default function ModelList({ models, onDelete, onEdit }: ModelListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        const isExpanded = expandedId === model.id;

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
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(model)}
                  className="text-zinc-400 hover:text-blue-500 transition-colors p-1"
                  title="编辑"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : model.id)}
                  className="text-zinc-400 hover:text-zinc-600 transition-colors p-1"
                  title="查看详情"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {isExpanded ? (
                      <polyline points="18 15 12 9 6 15" />
                    ) : (
                      <polyline points="6 9 12 15 18 9" />
                    )}
                  </svg>
                </button>
                <button
                  onClick={() => onDelete(model.id)}
                  className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                  title="删除"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 基本信息 */}
            <div className="space-y-1 text-sm text-zinc-500">
              {model.modelId && (
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">Model:</span>
                  <span className="font-mono text-xs">{model.modelId}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">API Key:</span>
                <span className="font-mono text-xs text-zinc-300">••••••••</span>
              </div>
              <div className="text-xs text-zinc-400">
                创建于 {new Date(model.createdAt).toLocaleDateString("zh-CN")}
              </div>
            </div>

            {/* 展开详情 */}
            {isExpanded && (
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 space-y-1.5 text-sm text-zinc-500">
                {model.endpoint && (
                  <div>
                    <span className="text-zinc-400">Endpoint:</span>
                    <p className="font-mono text-xs break-all mt-0.5">{model.endpoint}</p>
                  </div>
                )}
                <div>
                  <span className="text-zinc-400">数据库 ID:</span>
                  <p className="font-mono text-xs break-all mt-0.5">{model.id}</p>
                </div>
                <div>
                  <span className="text-zinc-400">更新于:</span>
                  <p className="text-xs mt-0.5">{new Date(model.updatedAt).toLocaleString("zh-CN")}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
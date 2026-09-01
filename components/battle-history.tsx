"use client";

import { useState } from "react";
import type { BattleSummary } from "@/app/page";

interface BattleHistoryProps {
  battles: BattleSummary[];
}

export default function BattleHistory({ battles }: BattleHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (battles.length === 0) return null;

  return (
    <div className="w-full max-w-3xl">
      <h3 className="text-sm font-medium text-zinc-500 mb-3">最近对战</h3>
      <div className="space-y-2">
        {battles.map((b) => {
          const isExpanded = expandedId === b.id;
          const rounds = b.rounds ?? [];
          const roundCount = rounds.length;

          return (
            <div
              key={b.id}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden"
            >
              {/* 摘要行 */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : b.id)}
                className="w-full px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">
                      {b.modelA.name} vs {b.modelB.name}
                    </span>
                    {roundCount > 1 && (
                      <span className="shrink-0 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-zinc-500">
                        {roundCount} 轮
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <span className="text-xs text-zinc-400">
                      {new Date(b.createdAt).toLocaleString("zh-CN")}
                    </span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`text-zinc-400 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 truncate mt-1">
                  {b.prompt.length > 80
                    ? b.prompt.slice(0, 80) + "..."
                    : b.prompt}
                </p>
              </button>

              {/* 展开详情 */}
              {isExpanded && (
                <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-4 space-y-6 bg-zinc-50/50 dark:bg-zinc-900/50">
                  {rounds.map((round, i) => (
                    <div key={i} className="space-y-3">
                      {/* 轮次标题 */}
                      {rounds.length > 1 && (
                        <div className="text-xs font-medium text-zinc-400">
                          第 {i + 1} 轮
                        </div>
                      )}

                      {/* 用户消息 */}
                      <div className="flex justify-end">
                        <div className="max-w-[85%] rounded-xl bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5">
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {round.prompt}
                          </p>
                        </div>
                      </div>

                      {/* 模型响应 */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 bg-white dark:bg-zinc-950">
                          <div className="text-xs font-semibold text-zinc-500 mb-1.5">
                            {b.modelA.name}
                          </div>
                          <pre className="text-xs whitespace-pre-wrap font-sans text-zinc-700 dark:text-zinc-300">
                            {round.responseA || "(无响应)"}
                          </pre>
                        </div>
                        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 bg-white dark:bg-zinc-950">
                          <div className="text-xs font-semibold text-zinc-500 mb-1.5">
                            {b.modelB.name}
                          </div>
                          <pre className="text-xs whitespace-pre-wrap font-sans text-zinc-700 dark:text-zinc-300">
                            {round.responseB || "(无响应)"}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}

                  {rounds.length === 0 && (
                    <p className="text-sm text-zinc-400 text-center py-2">
                      暂无对话详情
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
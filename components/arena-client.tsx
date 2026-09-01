"use client";

import { useState, useEffect, useRef } from "react";
import type { AIModel } from "@/lib/types";
import { saveBattle } from "@/lib/actions";

/**
 * 流式调用 AI，逐块回调文本增量
 * AI SDK v7 createTextStreamResponse 返回纯文本流，直接读取即可
 */
async function streamChat(
  modelId: string,
  prompt: string,
  onDelta: (text: string) => void,
  signal: AbortSignal
): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      modelId,
      messages: [{ role: "user", content: prompt }],
    }),
    signal,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "调用失败");
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("无法读取响应流");

  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value, { stream: true });
    onDelta(text);
  }
}

export default function ArenaClient() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modelA, setModelA] = useState("");
  const [modelB, setModelB] = useState("");
  const [prompt, setPrompt] = useState("");
  const [resultA, setResultA] = useState("");
  const [resultB, setResultB] = useState("");
  const [errorA, setErrorA] = useState("");
  const [errorB, setErrorB] = useState("");
  const [streamingA, setStreamingA] = useState(false);
  const [streamingB, setStreamingB] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  // 加载可用模型列表
  useEffect(() => {
    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => {
        setModels(data);
        if (data.length >= 2) {
          setModelA(data[0].id);
          setModelB(data[1].id);
        } else if (data.length === 1) {
          setModelA(data[0].id);
          setModelB(data[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const selectedModelA = models.find((m) => m.id === modelA);
  const selectedModelB = models.find((m) => m.id === modelB);

  const isSending = streamingA || streamingB;

  const handleSend = async () => {
    if (!modelA || !modelB || !prompt.trim() || isSending) return;

    // 重置状态
    setResultA("");
    setResultB("");
    setErrorA("");
    setErrorB("");

    const controller = new AbortController();
    abortRef.current = controller;

    setStreamingA(true);
    setStreamingB(true);

    // 本地累积文本，用于最终保存
    let textA = "";
    let textB = "";

    // 并行调用两个模型
    const callA = streamChat(
      modelA,
      prompt,
      (text) => {
        textA += text;
        setResultA((prev) => prev + text);
      },
      controller.signal
    ).catch((err) => {
      if (err.name !== "AbortError") {
        setErrorA(err.message);
      }
    }).finally(() => setStreamingA(false));

    const callB = streamChat(
      modelB,
      prompt,
      (text) => {
        textB += text;
        setResultB((prev) => prev + text);
      },
      controller.signal
    ).catch((err) => {
      if (err.name !== "AbortError") {
        setErrorB(err.message);
      }
    }).finally(() => setStreamingB(false));

    await Promise.all([callA, callB]);

    // 对战完成后保存记录（使用本地累积的文本）
    if (!controller.signal.aborted) {
      saveBattle({
        prompt: prompt.trim(),
        modelAId: modelA,
        modelBId: modelB,
        resultA: textA,
        resultB: textB,
      }).catch((err) => console.error("保存对战记录失败:", err));
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">模型对战</h1>
          <p className="text-sm text-zinc-500 mt-1">加载中...</p>
        </div>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">模型对战</h1>
          <p className="text-sm text-zinc-500 mt-1">
            选择两个模型，输入相同的 Prompt，对比输出结果
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center">
          <p className="text-zinc-400">请先在「模型管理」中添加至少两个模型</p>
        </div>
      </div>
    );
  }

  if (models.length < 2) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">模型对战</h1>
          <p className="text-sm text-zinc-500 mt-1">
            选择两个模型，输入相同的 Prompt，对比输出结果
          </p>
        </div>
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center">
          <p className="text-zinc-400">
            当前只有 {models.length} 个模型，需要至少 2 个模型才能对战
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">模型对战</h1>
        <p className="text-sm text-zinc-500 mt-1">
          选择两个模型，输入相同的 Prompt，对比输出结果
        </p>
      </div>

      {/* 模型选择 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">模型 A</label>
          <select
            value={modelA}
            onChange={(e) => setModelA(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.provider})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">模型 B</label>
          <select
            value={modelB}
            onChange={(e) => setModelB(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.provider})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Prompt 输入 */}
      <div>
        <label className="block text-sm font-medium mb-1.5">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="输入你的 Prompt..."
          rows={3}
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
      </div>

      {/* 发送 / 停止按钮 */}
      <div className="flex gap-3">
        <button
          onClick={handleSend}
          disabled={!modelA || !modelB || !prompt.trim() || isSending}
          className="rounded-lg bg-foreground px-6 py-2.5 text-sm font-medium text-background hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isSending ? "调用中..." : "开始对战"}
        </button>
        {isSending && (
          <button
            onClick={handleStop}
            className="rounded-lg border border-red-300 dark:border-red-800 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            停止
          </button>
        )}
      </div>

      {/* 结果对比 */}
      {(resultA || resultB || errorA || errorB || isSending) && (
        <div className="grid grid-cols-2 gap-4">
          {/* 模型 A 结果 */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-sm font-semibold">
                {selectedModelA?.name}
              </span>
              <span className="text-xs text-zinc-400">
                {selectedModelA?.provider}
              </span>
              {streamingA && (
                <span className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </div>
            {errorA ? (
              <p className="text-sm text-red-500">{errorA}</p>
            ) : (
              <pre className="text-sm whitespace-pre-wrap font-sans text-zinc-700 dark:text-zinc-300">
                {resultA || (streamingA ? "..." : "")}
              </pre>
            )}
          </div>

          {/* 模型 B 结果 */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-sm font-semibold">
                {selectedModelB?.name}
              </span>
              <span className="text-xs text-zinc-400">
                {selectedModelB?.provider}
              </span>
              {streamingB && (
                <span className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              )}
            </div>
            {errorB ? (
              <p className="text-sm text-red-500">{errorB}</p>
            ) : (
              <pre className="text-sm whitespace-pre-wrap font-sans text-zinc-700 dark:text-zinc-300">
                {resultB || (streamingB ? "..." : "")}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
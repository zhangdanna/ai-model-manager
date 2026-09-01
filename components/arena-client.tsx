"use client";

import { useState, useEffect, useRef } from "react";
import type { AIModel } from "@/lib/types";
import { saveBattle, appendBattleRound } from "@/lib/actions";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ConversationRound {
  prompt: string;
  responseA: string;
  responseB: string;
}

/**
 * 流式调用 AI，逐块回调文本增量
 */
async function streamChat(
  modelId: string,
  messages: Message[],
  onDelta: (text: string) => void,
  signal: AbortSignal
): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ modelId, messages }),
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

  // 多轮对话状态
  const [historyA, setHistoryA] = useState<Message[]>([]);
  const [historyB, setHistoryB] = useState<Message[]>([]);
  const [rounds, setRounds] = useState<ConversationRound[]>([]);
  const [battleId, setBattleId] = useState<string | null>(null);

  // 当前轮次流式状态
  const [streamingA, setStreamingA] = useState(false);
  const [streamingB, setStreamingB] = useState(false);
  const [currentResponseA, setCurrentResponseA] = useState("");
  const [currentResponseB, setCurrentResponseB] = useState("");
  const [errorA, setErrorA] = useState("");
  const [errorB, setErrorB] = useState("");

  const abortRef = useRef<AbortController | null>(null);
  const resultEndRef = useRef<HTMLDivElement>(null);

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

  // 新对话：切换模型时重置
  const handleModelChange = (side: "A" | "B", id: string) => {
    if (side === "A") setModelA(id);
    else setModelB(id);
    resetConversation();
  };

  const resetConversation = () => {
    setHistoryA([]);
    setHistoryB([]);
    setRounds([]);
    setBattleId(null);
    setCurrentResponseA("");
    setCurrentResponseB("");
    setErrorA("");
    setErrorB("");
  };

  const selectedModelA = models.find((m) => m.id === modelA);
  const selectedModelB = models.find((m) => m.id === modelB);

  const isSending = streamingA || streamingB;
  const hasConversation = rounds.length > 0 || isSending;

  const handleSend = async () => {
    if (!modelA || !modelB || !prompt.trim() || isSending) return;

    const userMessage: Message = { role: "user", content: prompt.trim() };
    const newHistoryA = [...historyA, userMessage];
    const newHistoryB = [...historyB, userMessage];

    setHistoryA(newHistoryA);
    setHistoryB(newHistoryB);
    setPrompt("");
    setCurrentResponseA("");
    setCurrentResponseB("");
    setErrorA("");
    setErrorB("");

    const controller = new AbortController();
    abortRef.current = controller;

    setStreamingA(true);
    setStreamingB(true);

    let textA = "";
    let textB = "";

    const callA = streamChat(
      modelA,
      newHistoryA,
      (text) => {
        textA += text;
        setCurrentResponseA((prev) => prev + text);
      },
      controller.signal
    )
      .catch((err) => {
        if (err.name !== "AbortError") setErrorA(err.message);
      })
      .finally(() => setStreamingA(false));

    const callB = streamChat(
      modelB,
      newHistoryB,
      (text) => {
        textB += text;
        setCurrentResponseB((prev) => prev + text);
      },
      controller.signal
    )
      .catch((err) => {
        if (err.name !== "AbortError") setErrorB(err.message);
      })
      .finally(() => setStreamingB(false));

    await Promise.all([callA, callB]);

    if (!controller.signal.aborted) {
      // 将本轮对话追加到历史
      const assistantA: Message = { role: "assistant", content: textA };
      const assistantB: Message = { role: "assistant", content: textB };
      setHistoryA((prev) => [...prev, assistantA]);
      setHistoryB((prev) => [...prev, assistantB]);

      const newRound: ConversationRound = {
        prompt: userMessage.content,
        responseA: textA,
        responseB: textB,
      };
      setRounds((prev) => [...prev, newRound]);
      setCurrentResponseA("");
      setCurrentResponseB("");

      // 保存对战记录：首轮创建，后续追加
      if (battleId) {
        appendBattleRound(battleId, {
          prompt: userMessage.content,
          responseA: textA,
          responseB: textB,
        }).catch((err) => console.error("追加对战轮次失败:", err));
      } else {
        saveBattle({
          prompt: userMessage.content,
          modelAId: modelA,
          modelBId: modelB,
          resultA: textA,
          resultB: textB,
        })
          .then((result) => {
            if (result.battleId) setBattleId(result.battleId);
          })
          .catch((err) => console.error("保存对战记录失败:", err));
      }
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 滚动到底部
  useEffect(() => {
    resultEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [rounds, currentResponseA, currentResponseB]);

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">模型对战</h1>
          <p className="text-sm text-zinc-500 mt-1">
            选择两个模型，输入相同的 Prompt，对比输出结果。支持多轮追问。
          </p>
        </div>
        {hasConversation && (
          <button
            onClick={resetConversation}
            className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            新对话
          </button>
        )}
      </div>

      {/* 模型选择 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">模型 A</label>
          <select
            value={modelA}
            onChange={(e) => handleModelChange("A", e.target.value)}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.modelId || m.provider})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">模型 B</label>
          <select
            value={modelB}
            onChange={(e) => handleModelChange("B", e.target.value)}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.modelId || m.provider})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 对话历史 + 结果对比 */}
      <div className="space-y-6">
        {/* 已完成的轮次 */}
        {rounds.map((round, i) => (
          <div key={i} className="space-y-3">
            {/* 用户消息 */}
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-xl bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5">
                <p className="text-sm whitespace-pre-wrap">{round.prompt}</p>
              </div>
            </div>

            {/* 模型响应对比 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-xs font-semibold">
                    {selectedModelA?.name}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {selectedModelA?.modelId || selectedModelA?.provider}
                  </span>
                </div>
                <pre className="text-sm whitespace-pre-wrap font-sans text-zinc-700 dark:text-zinc-300">
                  {round.responseA}
                </pre>
              </div>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-xs font-semibold">
                    {selectedModelB?.name}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {selectedModelB?.modelId || selectedModelB?.provider}
                  </span>
                </div>
                <pre className="text-sm whitespace-pre-wrap font-sans text-zinc-700 dark:text-zinc-300">
                  {round.responseB}
                </pre>
              </div>
            </div>
          </div>
        ))}

        {/* 当前流式进行的轮次 */}
        {isSending && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-xl bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5">
                <p className="text-sm whitespace-pre-wrap">
                  {historyA.length > 0
                    ? historyA[historyA.length - 1].content
                    : ""}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-xs font-semibold">
                    {selectedModelA?.name}
                  </span>
                  {streamingA && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  )}
                </div>
                {errorA ? (
                  <p className="text-sm text-red-500">{errorA}</p>
                ) : (
                  <pre className="text-sm whitespace-pre-wrap font-sans text-zinc-700 dark:text-zinc-300">
                    {currentResponseA || "..."}
                  </pre>
                )}
              </div>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-xs font-semibold">
                    {selectedModelB?.name}
                  </span>
                  {streamingB && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  )}
                </div>
                {errorB ? (
                  <p className="text-sm text-red-500">{errorB}</p>
                ) : (
                  <pre className="text-sm whitespace-pre-wrap font-sans text-zinc-700 dark:text-zinc-300">
                    {currentResponseB || "..."}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={resultEndRef} />
      </div>

      {/* 追问输入 */}
      <div className="sticky bottom-0 bg-white dark:bg-zinc-950 pt-3 pb-1 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex gap-3 items-end">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              rounds.length === 0
                ? "输入你的 Prompt..."
                : "继续追问..."
            }
            rows={2}
            className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground resize-none"
          />
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleSend}
              disabled={!modelA || !modelB || !prompt.trim() || isSending}
              className="rounded-lg bg-foreground px-5 py-2 text-sm font-medium text-background hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSending ? "调用中..." : "发送"}
            </button>
            {isSending && (
              <button
                onClick={handleStop}
                className="rounded-lg border border-red-300 dark:border-red-800 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
              >
                停止
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
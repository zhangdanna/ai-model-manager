"use client";

import { useState } from "react";
import { PROVIDERS } from "@/lib/types";
import { createModel } from "@/lib/actions";

interface ModelFormProps {
  onSuccess: () => void;
}

export default function ModelForm({ onSuccess }: ModelFormProps) {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("openai");
  const [endpoint, setEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;

    setSubmitting(true);
    try {
      // Server Action：直接调用服务端函数，无需 fetch + URL
      const result = await createModel({
        name: name.trim(),
        provider,
        endpoint: endpoint.trim(),
        apiKey: apiKey.trim(),
      });

      if (result.error) {
        console.error(result.error);
        return;
      }

      // 重置表单
      setName("");
      setProvider("openai");
      setEndpoint("");
      setApiKey("");
      setShowForm(false);
      onSuccess(); // 通知父组件刷新列表
    } catch (err) {
      console.error("创建模型失败:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 transition-opacity"
      >
        + 添加模型
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 space-y-4 w-full  md:w-1/2 lg:w-1/2"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">新建模型</h3>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="text-sm text-zinc-400 hover:text-zinc-600"
        >
          取消
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">
          模型名称 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：GPT-4o"
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Provider</label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
        >
          {PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">API Endpoint</label>
        <input
          type="text"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          placeholder="https://api.openai.com/v1"
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-foreground"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {submitting ? "保存中..." : "保存"}
      </button>
    </form>
  );
}
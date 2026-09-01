"use client";

import { useState, useEffect, useCallback } from "react";
import type { AIModel } from "@/lib/types";
import { deleteModel } from "@/lib/actions";
import ModelForm from "@/components/model-form";
import ModelList from "@/components/model-list";

export default function ModelsClient() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);

  // 获取模型列表
  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch("/api/models");
      if (!res.ok) throw new Error("获取失败");
      const data = await res.json();
      setModels(data);
    } catch (err) {
      console.error("获取模型列表失败:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // 删除模型（Server Action）
  const handleDelete = async (id: string) => {
    const result = await deleteModel(id);
    if (result.error) {
      console.error(result.error);
      return;
    }
    setModels((prev) => prev.filter((m) => m.id !== id));
  };

  // 编辑模型
  const handleEdit = (model: AIModel) => {
    setEditingModel(model);
  };

  // 编辑完成
  const handleEditSuccess = () => {
    setEditingModel(null);
    fetchModels();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">模型管理</h1>
          <p className="text-sm text-zinc-500 mt-1">
            配置和管理你的 AI 模型
          </p>
        </div>
        <ModelForm
          onSuccess={handleEditSuccess}
          editingModel={editingModel}
          onCancelEdit={() => setEditingModel(null)}
        />
      </div>

      {loading ? (
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-12 text-center">
          <p className="text-zinc-400">加载中...</p>
        </div>
      ) : (
        <ModelList models={models} onDelete={handleDelete} onEdit={handleEdit} />
      )}
    </div>
  );
}
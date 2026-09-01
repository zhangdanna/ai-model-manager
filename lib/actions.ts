"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";

// Server Action：创建模型
export async function createModel(data: {
  name: string;
  modelId: string;
  provider: string;
  endpoint: string;
  apiKey: string;
}) {
  const session = await getSession();
  if (!session) return { error: "未登录" };

  if (!data.name || !data.provider) {
    return { error: "name 和 provider 为必填项" };
  }

  try {
    await prisma.aIModel.create({
      data: {
        name: data.name,
        modelId: data.modelId || "",
        provider: data.provider,
        endpoint: data.endpoint || "",
        apiKey: data.apiKey || "",
        userId: session.id,
      },
    });

    revalidatePath("/models");
    return { success: true };
  } catch (error) {
    console.error("createModel error:", error);
    return { error: "创建模型失败" };
  }
}

// Server Action：更新模型
export async function updateModel(
  id: string,
  data: {
    name: string;
    modelId: string;
    provider: string;
    endpoint: string;
    apiKey: string;
  }
) {
  const session = await getSession();
  if (!session) return { error: "未登录" };

  if (!data.name || !data.provider) {
    return { error: "name 和 provider 为必填项" };
  }

  try {
    const model = await prisma.aIModel.findUnique({ where: { id } });
    if (!model) return { error: "模型不存在" };
    if (model.userId !== session.id) return { error: "无权操作" };

    await prisma.aIModel.update({
      where: { id },
      data: {
        name: data.name,
        modelId: data.modelId || "",
        provider: data.provider,
        endpoint: data.endpoint || "",
        ...(data.apiKey ? { apiKey: data.apiKey } : {}),
      },
    });

    revalidatePath("/models");
    return { success: true };
  } catch (error) {
    console.error("updateModel error:", error);
    return { error: "更新模型失败" };
  }
}

// Server Action：创建对战记录（首轮）
export async function saveBattle(data: {
  prompt: string;
  modelAId: string;
  modelBId: string;
  resultA: string;
  resultB: string;
}) {
  const session = await getSession();
  if (!session) return { error: "未登录" };

  if (!data.prompt || !data.modelAId || !data.modelBId) {
    return { error: "prompt、modelAId、modelBId 为必填项" };
  }

  try {
    const firstRound = {
      prompt: data.prompt,
      responseA: data.resultA,
      responseB: data.resultB,
    };

    const battle = await prisma.battle.create({
      data: {
        prompt: data.prompt,
        modelAId: data.modelAId,
        modelBId: data.modelBId,
        resultA: data.resultA,
        resultB: data.resultB,
        rounds: [firstRound],
        userId: session.id,
      },
    });

    revalidatePath("/");
    return { success: true, battleId: battle.id };
  } catch (error) {
    console.error("saveBattle error:", error);
    return { error: "保存对战记录失败" };
  }
}

// Server Action：追加一轮到已有对战记录
export async function appendBattleRound(
  battleId: string,
  round: {
    prompt: string;
    responseA: string;
    responseB: string;
  }
) {
  const session = await getSession();
  if (!session) return { error: "未登录" };

  try {
    const battle = await prisma.battle.findUnique({ where: { id: battleId } });
    if (!battle) return { error: "对战记录不存在" };
    if (battle.userId !== session.id) return { error: "无权操作" };

    const existingRounds = (battle.rounds as Array<{
      prompt: string;
      responseA: string;
      responseB: string;
    }>) ?? [];

    await prisma.battle.update({
      where: { id: battleId },
      data: {
        rounds: [...existingRounds, round],
        resultA: battle.resultA + "\n\n---\n\n" + round.responseA,
        resultB: battle.resultB + "\n\n---\n\n" + round.responseB,
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("appendBattleRound error:", error);
    return { error: "追加对战轮次失败" };
  }
}

// Server Action：删除对战记录（仅限自己的）
export async function deleteBattle(id: string) {
  const session = await getSession();
  if (!session) return { error: "未登录" };

  try {
    const battle = await prisma.battle.findUnique({ where: { id } });
    if (!battle) return { error: "对战记录不存在" };
    if (battle.userId !== session.id) return { error: "无权操作" };

    await prisma.battle.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("deleteBattle error:", error);
    return { error: "删除对战记录失败" };
  }
}

// Server Action：删除模型（仅限自己的模型）
export async function deleteModel(id: string) {
  const session = await getSession();
  if (!session) return { error: "未登录" };

  try {
    const model = await prisma.aIModel.findUnique({ where: { id } });
    if (!model) return { error: "模型不存在" };
    if (model.userId !== session.id) return { error: "无权操作" };

    await prisma.aIModel.delete({ where: { id } });
    revalidatePath("/models");
    return { success: true };
  } catch (error) {
    console.error("deleteModel error:", error);
    return { error: "删除模型失败" };
  }
}
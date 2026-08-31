"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";

// Server Action：创建模型
export async function createModel(data: {
  name: string;
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
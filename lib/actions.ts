"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Server Action：创建模型
export async function createModel(data: {
  name: string;
  provider: string;
  endpoint: string;
  apiKey: string;
}) {
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
      },
    });

    // 刷新页面缓存，让列表重新获取数据
    revalidatePath("/models");

    return { success: true };
  } catch (error) {
    console.error("createModel error:", error);
    return { error: "创建模型失败" };
  }
}

// Server Action：删除模型
export async function deleteModel(id: string) {
  try {
    await prisma.aIModel.delete({ where: { id } });
    revalidatePath("/models");
    return { success: true };
  } catch (error) {
    console.error("deleteModel error:", error);
    return { error: "删除模型失败" };
  }
}
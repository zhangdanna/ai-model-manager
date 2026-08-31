import { streamText, createTextStreamResponse } from "ai";
import { createProviderForModel } from "@/lib/ai-service";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "未登录" }, { status: 401 });
    }

    const { modelId, messages } = await request.json();

    if (!modelId || !messages) {
      return Response.json(
        { error: "modelId 和 messages 为必填项" },
        { status: 400 }
      );
    }

    // 验证模型所有权
    const model = await prisma.aIModel.findUnique({ where: { id: modelId } });
    if (!model) {
      return Response.json({ error: "模型不存在" }, { status: 404 });
    }
    if (model.userId !== session.id) {
      return Response.json({ error: "无权使用该模型" }, { status: 403 });
    }

    const { provider, modelName } = await createProviderForModel(modelId);

    const result = streamText({
      model: provider,
      messages,
    });

    return createTextStreamResponse({ stream: result.textStream });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI 调用失败";
    console.error("POST /api/chat error:", error);
    return Response.json({ error: message }, { status: 500 });
  }
}
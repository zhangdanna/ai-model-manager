import { streamText, createTextStreamResponse } from "ai";
import { createProviderForModel } from "@/lib/ai-service";

export async function POST(request: Request) {
  try {
    const { modelId, messages } = await request.json();

    if (!modelId || !messages) {
      return Response.json(
        { error: "modelId 和 messages 为必填项" },
        { status: 400 }
      );
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
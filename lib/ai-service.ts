import { prisma } from "@/lib/prisma";
import { createOpenAI } from "@ai-sdk/openai";

/**
 * 根据数据库中的模型配置，创建对应的 AI Provider 实例
 * 所有 Provider 统一使用 createOpenAI（AI SDK v7 兼容方式）
 */
export async function createProviderForModel(modelId: string) {
  const model = await prisma.aIModel.findUnique({
    where: { id: modelId },
  });

  if (!model) {
    throw new Error(`模型不存在: ${modelId}`);
  }

  if (!model.apiKey) {
    throw new Error(`模型 "${model.name}" 未配置 API Key`);
  }

  const baseURL = model.endpoint || getDefaultEndpoint(model.provider);

  const modelName = model.modelId || model.name;

  const provider = createOpenAI({
    apiKey: model.apiKey,
    baseURL,
  })(modelName);

  return { provider, modelName };
}

function getDefaultEndpoint(provider: string): string {
  switch (provider) {
    case "deepseek":
      return "https://api.deepseek.com/v1";
    case "openai":
      return "https://api.openai.com/v1";
    default:
      return "https://api.openai.com/v1";
  }
}
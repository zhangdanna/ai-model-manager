import { prisma } from "@/lib/prisma";
import { createOpenAI, openai } from "@ai-sdk/openai";

/**
 * 根据数据库中的模型配置，创建对应的 AI Provider 实例
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

  // 根据 provider 类型创建不同的 Provider 实例
  switch (model.provider) {
    case "openai":
      return {
        provider: openai(model.name, { apiKey: model.apiKey }),
        modelName: model.name,
      };

    case "deepseek":
      // DeepSeek 兼容 OpenAI API
      return {
        provider: createOpenAI({
          apiKey: model.apiKey,
          baseURL: model.endpoint || "https://api.deepseek.com/v1",
        })(model.name),
        modelName: model.name,
      };

    case "azure":
      // Azure OpenAI 需要特殊处理，这里暂用 custom 方式
      return {
        provider: createOpenAI({
          apiKey: model.apiKey,
          baseURL: model.endpoint,
        })(model.name),
        modelName: model.name,
      };

    case "anthropic":
    case "google":
      // 这些 Provider 需要对应的 SDK，暂时用 OpenAI 兼容模式兜底
      // 如果 endpoint 是 OpenAI 兼容的，可以走 createOpenAI
      return {
        provider: createOpenAI({
          apiKey: model.apiKey,
          baseURL: model.endpoint || "https://api.openai.com/v1",
        })(model.name),
        modelName: model.name,
      };

    case "custom":
    default:
      // 自定义 endpoint，默认走 OpenAI 兼容协议
      return {
        provider: createOpenAI({
          apiKey: model.apiKey,
          baseURL: model.endpoint || "https://api.openai.com/v1",
        })(model.name),
        modelName: model.name,
      };
  }
}
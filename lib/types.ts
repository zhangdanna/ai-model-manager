export interface AIModel {
  id: string;
  name: string;
  modelId: string;
  provider: string;
  endpoint: string;
  apiKey?: string; // 仅表单可用，API 不返回
  createdAt: string;
  updatedAt: string;
}

export const PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "azure", label: "Azure OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google", label: "Google AI" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "custom", label: "自定义" },
] as const;
import { describe, it, expect } from "vitest";
import { getDefaultEndpoint } from "@/lib/ai-service";

describe("ai-service — getDefaultEndpoint", () => {
  it("deepseek 应返回 DeepSeek API 地址", () => {
    expect(getDefaultEndpoint("deepseek")).toBe("https://api.deepseek.com/v1");
  });

  it("openai 应返回 OpenAI API 地址", () => {
    expect(getDefaultEndpoint("openai")).toBe("https://api.openai.com/v1");
  });

  it("未知 provider 应回退到 OpenAI 地址", () => {
    expect(getDefaultEndpoint("unknown")).toBe("https://api.openai.com/v1");
    expect(getDefaultEndpoint("custom")).toBe("https://api.openai.com/v1");
  });
});
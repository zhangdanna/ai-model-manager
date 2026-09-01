import { describe, it, expect } from "vitest";
import { PROVIDERS } from "@/lib/types";

describe("types — PROVIDERS 常量", () => {
  it("应包含 6 个厂商", () => {
    expect(PROVIDERS).toHaveLength(6);
  });

  it("每个厂商应有 value 和 label 字段", () => {
    for (const p of PROVIDERS) {
      expect(p).toHaveProperty("value");
      expect(p).toHaveProperty("label");
      expect(typeof p.value).toBe("string");
      expect(typeof p.label).toBe("string");
    }
  });

  it("应包含 deepseek 和 openai", () => {
    const values = PROVIDERS.map((p) => p.value);
    expect(values).toContain("deepseek");
    expect(values).toContain("openai");
  });
});
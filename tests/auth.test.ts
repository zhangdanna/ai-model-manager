import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth";

describe("auth — 密码哈希与验证", () => {
  it("hashPassword 应返回非空字符串且不等于原文", async () => {
    const hash = await hashPassword("hello123");
    expect(hash).toBeTruthy();
    expect(hash).not.toBe("hello123");
  });

  it("verifyPassword 应正确验证匹配的密码", async () => {
    const hash = await hashPassword("mypassword");
    const valid = await verifyPassword("mypassword", hash);
    expect(valid).toBe(true);
  });

  it("verifyPassword 应对不匹配的密码返回 false", async () => {
    const hash = await hashPassword("correct");
    const valid = await verifyPassword("wrong", hash);
    expect(valid).toBe(false);
  });

  it("每次 hashPassword 应生成不同的哈希值（salt 随机）", async () => {
    const hash1 = await hashPassword("same");
    const hash2 = await hashPassword("same");
    expect(hash1).not.toBe(hash2);
  });
});
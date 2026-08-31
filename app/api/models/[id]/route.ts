import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// 获取当前用户，并验证模型所有权
async function getModelAndVerifyOwnership(id: string) {
  const session = await getSession();
  if (!session) return { error: "未登录", status: 401 };

  const model = await prisma.aIModel.findUnique({ where: { id } });
  if (!model) return { error: "模型不存在", status: 404 };
  if (model.userId !== session.id) return { error: "无权操作", status: 403 };

  return { model };
}

// GET /api/models/[id] — 获取单个模型
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getModelAndVerifyOwnership(id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.model);
  } catch (error) {
    console.error("GET /api/models/[id] error:", error);
    return NextResponse.json({ error: "获取模型失败" }, { status: 500 });
  }
}

// PUT /api/models/[id] — 更新模型
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getModelAndVerifyOwnership(id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const body = await request.json();
    const { name, provider, endpoint, apiKey } = body;

    const model = await prisma.aIModel.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(provider !== undefined && { provider }),
        ...(endpoint !== undefined && { endpoint }),
        ...(apiKey !== undefined && { apiKey }),
      },
    });

    return NextResponse.json(model);
  } catch (error) {
    console.error("PUT /api/models/[id] error:", error);
    return NextResponse.json({ error: "更新模型失败" }, { status: 500 });
  }
}

// DELETE /api/models/[id] — 删除模型
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getModelAndVerifyOwnership(id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await prisma.aIModel.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/models/[id] error:", error);
    return NextResponse.json({ error: "删除模型失败" }, { status: 500 });
  }
}
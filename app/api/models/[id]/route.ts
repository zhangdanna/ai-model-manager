import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/models/[id] — 获取单个模型
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const model = await prisma.aIModel.findUnique({ where: { id } });

    if (!model) {
      return NextResponse.json({ error: "模型不存在" }, { status: 404 });
    }

    return NextResponse.json(model);
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
    const body = await request.json();
    const { name, provider, endpoint, apiKey } = body;

    // 先检查是否存在
    const existing = await prisma.aIModel.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "模型不存在" }, { status: 404 });
    }

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

    const existing = await prisma.aIModel.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "模型不存在" }, { status: 404 });
    }

    await prisma.aIModel.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/models/[id] error:", error);
    return NextResponse.json({ error: "删除模型失败" }, { status: 500 });
  }
}
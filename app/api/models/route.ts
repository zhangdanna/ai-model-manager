import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET /api/models — 获取当前用户的模型
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const models = await prisma.aIModel.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        modelId: true,
        provider: true,
        endpoint: true,
        createdAt: true,
        updatedAt: true,
        // apiKey 不返回给客户端，仅在服务端使用
      },
    });
    return NextResponse.json(models);
  } catch (error) {
    console.error("GET /api/models error:", error);
    return NextResponse.json(
      { error: "获取模型列表失败" },
      { status: 500 }
    );
  }
}

// POST /api/models — 创建新模型
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = await request.json();
    const { name, provider, endpoint, apiKey } = body;

    if (!name || !provider) {
      return NextResponse.json(
        { error: "name 和 provider 为必填项" },
        { status: 400 }
      );
    }

    const model = await prisma.aIModel.create({
      data: {
        name,
        provider,
        endpoint: endpoint || "",
        apiKey: apiKey || "",
        userId: session.id,
      },
    });

    return NextResponse.json(
      { id: model.id, name: model.name, modelId: model.modelId, provider: model.provider, endpoint: model.endpoint, createdAt: model.createdAt, updatedAt: model.updatedAt },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/models error:", error);
    return NextResponse.json(
      { error: "创建模型失败" },
      { status: 500 }
    );
  }
}
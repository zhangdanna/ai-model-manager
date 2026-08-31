import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/models — 获取所有模型
export async function GET() {
  try {
    const models = await prisma.aIModel.findMany({
      orderBy: { createdAt: "desc" },
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
      },
    });

    return NextResponse.json(model, { status: 201 });
  } catch (error) {
    console.error("POST /api/models error:", error);
    return NextResponse.json(
      { error: "创建模型失败" },
      { status: 500 }
    );
  }
}
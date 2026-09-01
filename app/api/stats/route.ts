import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const [modelCount, battleCount, todayBattles, recentBattles] =
      await Promise.all([
        prisma.aIModel.count({ where: { userId: session.id } }),
        prisma.battle.count({ where: { userId: session.id } }),
        prisma.battle.count({
          where: {
            userId: session.id,
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          },
        }),
        prisma.battle.findMany({
          where: { userId: session.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            prompt: true,
            createdAt: true,
          },
        }),
      ]);

    return NextResponse.json({
      modelCount,
      battleCount,
      todayBattles,
      recentBattles,
    });
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json({ error: "获取统计失败" }, { status: 500 });
  }
}
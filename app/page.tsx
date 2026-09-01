import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BattleHistory from "@/components/battle-history";

export interface BattleRound {
  prompt: string;
  responseA: string;
  responseB: string;
}

export interface BattleSummary {
  id: string;
  prompt: string;
  createdAt: Date;
  modelA: { name: string };
  modelB: { name: string };
  rounds: BattleRound[];
}

export default async function HomePage() {
  const session = await getSession();

  let modelCount = 0;
  let battleCount = 0;
  let todayBattles = 0;
  let providerDistribution: { provider: string; count: number }[] = [];
  let recentBattles: BattleSummary[] = [];

  if (session) {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    [modelCount, battleCount, todayBattles, providerDistribution, recentBattles] =
      await Promise.all([
        prisma.aIModel.count({ where: { userId: session.id } }),
        prisma.battle.count({ where: { userId: session.id } }),
        prisma.battle.count({
          where: {
            userId: session.id,
            createdAt: { gte: todayStart },
          },
        }),
        // 按 provider 分组统计模型数量
        prisma.aIModel.groupBy({
          by: ["provider"],
          where: { userId: session.id },
          _count: { provider: true },
          orderBy: { _count: { provider: "desc" } },
        }).then((rows) =>
          rows.map((r) => ({ provider: r.provider, count: r._count.provider }))
        ),
        prisma.battle.findMany({
          where: { userId: session.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            prompt: true,
            createdAt: true,
            rounds: true,
            modelA: { select: { name: true } },
            modelB: { select: { name: true } },
          },
        }).then((battles) =>
          battles.map((b) => ({
            ...b,
            rounds: (b.rounds as unknown as BattleRound[]) ?? [],
          }))
        ),
      ]);
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-8 px-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          AI 模型竞技场
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-md">
          配置多个 AI 模型，发送 Prompt，对比不同模型的输出效果
        </p>
      </div>

      <div className="flex gap-4">
        <Link
          href="/models"
          className="rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90 transition-opacity"
        >
          管理模型
        </Link>
        <Link
          href="/arena"
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-6 py-3 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          开始对战
        </Link>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 w-full max-w-3xl">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 text-center">
          <div className="text-2xl font-bold">{modelCount}</div>
          <div className="text-sm text-zinc-500 mt-1">已配置模型</div>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 text-center">
          <div className="text-2xl font-bold">{battleCount}</div>
          <div className="text-sm text-zinc-500 mt-1">累计对战</div>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 text-center">
          <div className="text-2xl font-bold">{todayBattles}</div>
          <div className="text-sm text-zinc-500 mt-1">今日对战</div>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 text-center">
          <div className="text-2xl font-bold">
            {session ? session.name : "—"}
          </div>
          <div className="text-sm text-zinc-500 mt-1">当前用户</div>
        </div>
      </div>

      {/* 提供商分布 */}
      {providerDistribution.length > 0 && (
        <div className="w-full max-w-3xl">
          <h3 className="text-sm font-medium text-zinc-500 mb-3">
            模型提供商分布
          </h3>
          <div className="flex flex-wrap gap-2">
            {providerDistribution.map((p) => (
              <span
                key={p.provider}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 px-3 py-1 text-sm"
              >
                <span className="font-medium">{p.provider}</span>
                <span className="text-zinc-400">x{p.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 最近对战 */}
      <BattleHistory battles={recentBattles} />
    </div>
  );
}
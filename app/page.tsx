import Link from "next/link";

export default function HomePage() {
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 w-full max-w-2xl">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 text-center">
          <div className="text-2xl font-bold">0</div>
          <div className="text-sm text-zinc-500 mt-1">已配置模型</div>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 text-center">
          <div className="text-2xl font-bold">0</div>
          <div className="text-sm text-zinc-500 mt-1">对战次数</div>
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 text-center">
          <div className="text-2xl font-bold">0</div>
          <div className="text-sm text-zinc-500 mt-1">已保存结果</div>
        </div>
      </div>
    </div>
  );
}
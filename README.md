# AI 模型竞技场 (AI Model Arena)

Next.js 全栈 + AI 调用学习项目。配置多个 AI 模型，发送 Prompt，对比不同模型的输出效果。

## 技术栈

| 类别  | 技术                   | 版本        |
| --- | -------------------- | --------- |
| 框架  | Next.js (App Router) | 16.3.3    |
| 语言  | TypeScript           | 5.x       |
| 样式  | Tailwind CSS         | 4.x       |
| 数据库 | MySQL + Prisma       | 5.22.0    |
| 运行时 | Node.js              | >= 20.9.0 |

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 创建 MySQL 数据库（需要本地 MySQL 运行中）
# 连接信息在 .env 文件中配置

# 3. 初始化数据库
npx prisma generate
npx prisma migrate dev --name init

# 4. 启动开发服务器
npm run dev
```

打开 <http://localhost:3000> 查看效果。

## 项目结构

```
ai-model-manager/
├── app/                            # Next.js App Router 页面
│   ├── layout.tsx                  # 根布局（侧边栏 + 内容区）
│   ├── page.tsx                    # 首页（统计概览 Dashboard）
│   ├── globals.css                 # 全局样式 + Tailwind 配置
│   ├── models/
│   │   └── page.tsx                # 模型管理页（Server Component 入口）
│   ├── arena/
│   │   └── page.tsx                # 模型对战页（Server Component 入口）
│   └── api/
│       ├── chat/
│       │   └── route.ts            # POST /api/chat（流式 AI 调用）
│       └── models/
│           ├── route.ts            # GET /api/models（列表） + POST（创建）
│           └── [id]/
│               └── route.ts        # GET/PUT/DELETE /api/models/:id
│
├── components/                     # React 组件
│   ├── sidebar.tsx                 # 侧边栏导航（Client Component，usePathname）
│   ├── models-client.tsx           # 模型管理客户端逻辑（列表获取 + 删除）
│   ├── model-form.tsx              # 新建模型表单（Server Action 提交）
│   ├── model-list.tsx              # 模型卡片列表（展示 + 删除按钮）
│   └── arena-client.tsx            # 模型对战客户端（双模型流式对比）
│
├── lib/                            # 工具库 & 服务端逻辑
│   ├── prisma.ts                   # Prisma 客户端单例（防热重载重复创建）
│   ├── actions.ts                  # Server Actions（createModel、deleteModel）
│   ├── ai-service.ts               # AI Provider 工厂（根据 DB 配置路由到不同 Provider）
│   └── types.ts                    # 共享类型定义（AIModel、PROVIDERS）
│
├── prisma/                         # 数据库
│   ├── schema.prisma               # Prisma Schema（数据模型定义）
│   └── migrations/                 # 数据库迁移文件
│
├── .env                            # 环境变量（DATABASE_URL）
├── next.config.mjs                 # Next.js 配置
├── postcss.config.mjs              # PostCSS 配置（Tailwind）
├── eslint.config.mjs               # ESLint 配置
├── tsconfig.json                   # TypeScript 配置
└── package.json                    # 项目依赖
```

## 核心概念

### Server Component vs Client Component

| 文件                             | 类型     | 原因                          |
| ------------------------------ | ------ | --------------------------- |
| `app/layout.tsx`               | Server | 默认，无交互                      |
| `app/page.tsx`                 | Server | 纯展示                         |
| `app/models/page.tsx`          | Server | 只渲染 Client Component        |
| `app/arena/page.tsx`           | Server | 只渲染 Client Component        |
| `components/sidebar.tsx`       | Client | 使用 `usePathname()`          |
| `components/models-client.tsx` | Client | 使用 `useState`、`useEffect`   |
| `components/model-form.tsx`    | Client | 表单交互（`onChange`、`onSubmit`） |
| `components/arena-client.tsx` | Client | 使用 `useState`、`useRef`、流式读取 |

### Route Handler vs Server Action

```
Route Handler:  fetch('/api/models', { method: 'POST' })
Server Action:  await createModel({ name, provider, ... })
```

| 特性   |     Route Handler     |           Server Action          |
| ---- | :-------------------: | :------------------------------: |
| 定义位置 | `app/api/**/route.ts` | `lib/actions.ts`（`'use server'`） |
| 调用方式 |  `fetch(url, {...})`  |              直接函数调用              |
| 类型安全 |          手动处理         |               天然支持               |
| 用途   |       获取数据（GET）       |         数据变更（POST/DELETE）        |

## 数据库

### AI 流式调用架构

```
[arena-client.tsx]                     [app/api/chat/route.ts]
     │                                        │
     │  POST /api/chat                         │
     │  { modelId, messages }                  │
     │ ──────────────────────────────────────> │
     │                                        │ 1. 查 DB 获取模型配置
     │                                        │ 2. ai-service.ts 创建 Provider
     │                                        │ 3. streamText() 调用 AI
     │  ReadableStream (SSE)                   │
     │ <────────────────────────────────────── │
     │                                        │
     │  逐行解析:                               │
     │  0:"text" → onDelta 拼接到 UI           │
     │  d:{...}  → 流结束                      │
     │  e:{...}  → 错误处理                     │
     │                                        │
     │  两个模型并行调用，同时流式输出             │
```

### 表结构 — aimodel

| 字段 | 类型 | 说明 |
|------|------|------|
| id        | VARCHAR(191) | 主键（CUID）                     |
| name      | VARCHAR(191) | 模型名称                         |
| provider  | VARCHAR(191) | Provider（openai/anthropic 等） |
| endpoint  | VARCHAR(191) | API 端点                       |
| apiKey    | VARCHAR(191) | API 密钥                       |
| createdAt | DATETIME(3)  | 创建时间                         |
| updatedAt | DATETIME(3)  | 更新时间                         |

## 学习阶段

* [x] 阶段一：基础架构（App Router、布局、Server/Client Components）

* [x] 阶段二：数据持久化（Prisma + MySQL、Route Handlers、Server Actions）

*- [x] 阶段三：AI 调用（Vercel AI SDK、流式响应、多模型对比）

* [ ] 阶段四：用户系统（NextAuth.js、中间件、权限控制）

* [ ] 阶段五：进阶功能（图片生成、文件上传、错误处理、React Query）

* [ ] 阶段六：测试与部署（Vitest、Vercel 部署）


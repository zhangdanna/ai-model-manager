# AI 模型竞技场 (AI Model Arena)

Next.js 全栈 + AI 调用学习项目。配置多个 AI 模型，发送 Prompt 进行多轮对话对比，评估不同模型的输出效果。

## 技术栈

| 类别     | 技术                    | 版本        |
| ------ | --------------------- | --------- |
| 框架     | Next.js (App Router)  | 16.3.3    |
| 语言     | TypeScript            | 5.x       |
| 样式     | Tailwind CSS          | 4.x       |
| 数据库    | MySQL + Prisma        | 5.22.0    |
| AI SDK | Vercel AI SDK (v7)    | 5.x       |
| 认证     | JWT (jose + bcryptjs) | -         |
| 运行时    | Node.js               | >= 20.9.0 |

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 填写 MySQL 连接信息 和 AUTH_SECRET

# 3. 初始化数据库
npx prisma generate
npx prisma db push

# 4. 启动开发服务器
npm run dev
```

打开 <http://localhost:3000> 查看效果。

## 环境变量

```env
DATABASE_URL="mysql://user:password@localhost:3306/ai-model-arena"
AUTH_SECRET="your-random-secret-key-at-least-32-chars"
```

## 功能概览

### 首页看板

- 模型总数、累计对战次数、今日对战次数

- 提供商分布统计（按 provider 分组展示模型数量）

- 最近对战记录：可点击展开查看完整多轮对话，支持删除

### 模型管理

- 创建 / 编辑 / 删除 AI 模型配置

- 支持多厂商：OpenAI、Azure OpenAI、Anthropic、Google AI、DeepSeek、自定义

- `modelId` 字段：区分显示名与 API 实际模型标识（如 `gpt-4o` vs `gpt-4o-mini`），实现同一厂商下真正模型间 PK

### 模型对战

- 选择两个模型，输入相同 Prompt 进行对比

- **多轮对话**：支持追问，每个模型独立维护对话历史上下文

- 双模型并行流式输出，实时对比

- 对战记录自动保存到数据库

### 用户认证

- JWT 注册 / 登录 / 登出

- 路由保护中间件：未登录跳转登录页

- 数据隔离：每个用户只能操作自己的模型和对战记录

## 项目结构

```
ai-model-manager/
├── app/                            # Next.js App Router
│   ├── layout.tsx                  # 根布局（侧边栏 + 内容区）
│   ├── page.tsx                    # 首页看板（Server Component）
│   ├── globals.css                 # 全局样式
│   ├── login/
│   │   └── page.tsx                # 登录 / 注册页
│   ├── models/
│   │   └── page.tsx                # 模型管理页
│   ├── arena/
│   │   └── page.tsx                # 模型对战页
│   └── api/
│       ├── chat/
│       │   └── route.ts            # POST /api/chat — 流式 AI 调用
│       ├── models/
│       │   ├── route.ts            # GET /api/models — 模型列表
│       │   └── [id]/
│       │       └── route.ts        # GET/PUT/DELETE /api/models/:id
│       ├── stats/
│       │   └── route.ts            # GET /api/stats — 统计数据
│       └── auth/
│           ├── register/route.ts   # POST — 注册
│           ├── login/route.ts      # POST — 登录
│           └── logout/route.ts     # POST — 登出
│
├── components/                     # React 组件
│   ├── sidebar.tsx                 # 侧边栏导航
│   ├── arena-client.tsx            # 模型对战（多轮对话 + 流式对比）
│   ├── models-client.tsx           # 模型管理客户端逻辑
│   ├── model-form.tsx              # 模型表单（创建 / 编辑）
│   ├── model-list.tsx              # 模型卡片列表
│   ├── auth-form.tsx               # 登录 / 注册表单
│   └── battle-history.tsx          # 对战记录（展开详情 + 删除）
│
├── lib/                            # 工具库
│   ├── prisma.ts                   # Prisma 客户端单例
│   ├── actions.ts                  # Server Actions（CRUD）
│   ├── ai-service.ts               # AI Provider 工厂
│   ├── auth.ts                     # JWT 认证（登录/注册/会话）
│   └── types.ts                    # 共享类型定义
│
├── proxy.ts                        # 路由保护中间件
├── prisma/
│   ├── schema.prisma               # 数据模型
│   └── migrations/                 # 迁移文件
│
├── .env                            # 环境变量
├── next.config.mjs                 # Next.js 配置
├── tsconfig.json                   # TypeScript 配置
└── package.json
```

## Server Component vs Client Component

| 文件                              | 类型     | 原因                          |
| ------------------------------- | ------ | --------------------------- |
| `app/layout.tsx`                | Server | 默认，无交互                      |
| `app/page.tsx`                  | Server | 纯展示 + 数据查询                  |
| `app/models/page.tsx`           | Server | 渲染 Client Component         |
| `app/arena/page.tsx`            | Server | 渲染 Client Component         |
| `app/login/page.tsx`            | Client | 登录表单交互                      |
| `components/sidebar.tsx`        | Client | `usePathname()`             |
| `components/models-client.tsx`  | Client | `useState`、`useEffect`      |
| `components/model-form.tsx`     | Client | 表单交互（`onChange`、`onSubmit`） |
| `components/arena-client.tsx`   | Client | 流式读取、多轮对话状态管理               |
| `components/battle-history.tsx` | Client | 展开/折叠、删除交互                  |
| `components/auth-form.tsx`      | Client | 登录/注册表单交互                   |

## 数据库

### 表结构

**User** — 用户

| 字段        | 类型           | 说明        |
| --------- | ------------ | --------- |
| id        | VARCHAR(191) | 主键        |
| name      | VARCHAR(191) | 用户昵称      |
| email     | VARCHAR(191) | 邮箱（唯一）    |
| password  | VARCHAR(191) | bcrypt 哈希 |
| createdAt | DATETIME(3)  | 创建时间      |
| updatedAt | DATETIME(3)  | 更新时间      |

**AIModel** — AI 模型配置

| 字段        | 类型           | 说明                      |
| --------- | ------------ | ----------------------- |
| id        | VARCHAR(191) | 主键                      |
| name      | VARCHAR(191) | 自定义显示名（如"GPT-4o 正式版"）   |
| modelId   | VARCHAR(191) | API 实际模型标识（如 `gpt-4o`）  |
| provider  | VARCHAR(191) | 厂商（openai / deepseek 等） |
| endpoint  | VARCHAR(191) | API 端点                  |
| apiKey    | VARCHAR(191) | API 密钥                  |
| userId    | VARCHAR(191) | 所属用户（外键）                |
| createdAt | DATETIME(3)  | 创建时间                    |
| updatedAt | DATETIME(3)  | 更新时间                    |

**Battle** — 对战记录

| 字段        | 类型           | 说明                                        |
| --------- | ------------ | ----------------------------------------- |
| id        | VARCHAR(191) | 主键                                        |
| prompt    | TEXT         | 首轮 Prompt                                 |
| modelAId  | VARCHAR(191) | 模型 A（外键）                                  |
| modelBId  | VARCHAR(191) | 模型 B（外键）                                  |
| resultA   | LONGTEXT     | 模型 A 全部响应（多轮拼接）                           |
| resultB   | LONGTEXT     | 模型 B 全部响应（多轮拼接）                           |
| rounds    | JSON         | 对话轮次数组 `[{prompt, responseA, responseB}]` |
| userId    | VARCHAR(191) | 所属用户（外键）                                  |
| createdAt | DATETIME(3)  | 创建时间                                      |

### AI 流式调用架构

```
[arena-client.tsx]                     [app/api/chat/route.ts]
     │                                        │
     │  POST /api/chat                         │
     │  { modelId, messages }                  │
     │ ──────────────────────────────────────> │
     │                                        │ 1. 查 DB 获取模型配置
     │                                        │ 2. ai-service 创建 Provider
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

### 多轮对话流程

```
第 1 轮：用户输入 Prompt → 追加到 historyA / historyB
        → 并行调用两个模型 → 各自响应追加到各自历史
        → saveBattle() 创建 Battle 记录

第 N 轮：用户追问 → 追加到历史（含前 N-1 轮完整上下文）
        → 并行调用 → 响应追加
        → appendBattleRound() 追加到 rounds JSON
```

## 学习阶段

- [x] 阶段一：基础架构（App Router、布局、Server/Client Components）

- [x] 阶段二：数据持久化（Prisma + MySQL、Route Handlers、Server Actions）

- [x] 阶段三：AI 调用（Vercel AI SDK、流式响应、多模型对比）

- [x] 阶段四：用户认证（JWT、路由保护、权限控制）

- [x] 阶段五：进阶功能（多轮对话、对战记录管理、看板统计）

- [ ] 阶段六：测试与部署（Vitest、Vercel 部署）


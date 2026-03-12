# next-create-app

AI 全栈脚手架 — Next.js 16 + MySQL/OceanBase + 阿里云千问 SSE 流式对话。

可扩展为 AI 客服、AI 知识库、AI 电商 Agent、ToB 中台管理系统等。

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | Next.js 16 (App Router, React 19) |
| 样式 | Tailwind CSS 4 |
| 数据库 | MySQL / OceanBase (mysql2) |
| 认证 | JWT (HttpOnly Cookie) |
| 校验 | Zod v4 |
| AI | 阿里云千问 (OpenAI 兼容接口, SSE 流式) |
| 部署 | Vercel / Docker (standalone output) |

## 前置条件

- Node.js >= 20
- pnpm >= 9
- MySQL >= 5.7（仅本地开发需要，连远程库无需本地 MySQL）

## 环境配置

项目采用"完整配置文件 + 启动时复制"的策略：

| 文件 | 用途 |
|------|------|
| `.env.local.env` | 本地 MySQL 完整配置 |
| `.env.development.env` | 远程 dev 库完整配置 |
| `.env.production.env` | 远程 prod 库完整配置 |
| `.env` | **运行时配置**（启动时自动生成，不手动维护） |
| `.env.vercel` | Vercel Token（可选，避免每次命令行传入） |

每个环境文件包含所有变量（数据库、JWT、AI 等），启动命令会自动将对应文件复制到 `.env`。

如果对应的环境文件不存在，则直接使用已有的 `.env`。

参考 `.env.example` 创建你的环境文件。

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 创建环境文件

```bash
# 复制模板，按需修改
cp .env.example .env.local.env
```

### 3. 启动开发

```bash
# 连接本地 MySQL
pnpm dev

# 连接远程 dev 数据库
pnpm dev:dev

# 连接远程 prod 数据库
pnpm dev:prod
```

首次请求 API 时自动建表，无需手动操作数据库。

### 4. 手动切换环境

```bash
pnpm env:use local
pnpm env:use development
pnpm env:use production
```

### 5. 数据库迁移

```bash
pnpm db:migrate          # 本地库
pnpm db:migrate:dev      # 远程 dev 库
pnpm db:migrate:prod     # 远程 prod 库
```

## 环境切换原理

```
pnpm dev       →  .env.local.env       → 复制到 .env → 启动 Next.js
pnpm dev:dev   →  .env.development.env → 复制到 .env → 启动 Next.js
pnpm dev:prod  →  .env.production.env  → 复制到 .env → 启动 Next.js
```

如果对应环境文件不存在，直接使用已有的 `.env`，不会报错。

## 部署

### Vercel（推荐）

Vercel 线上构建时不依赖任何 `.env` 文件，环境变量通过 Vercel Dashboard 或 `vercel:sync` 命令写入 Vercel 平台，构建时自动注入 `process.env`。

本地的 `.env.production.env` 仅用于：
- `vercel:init` / `vercel:sync` 同步变量到 Vercel
- `vercel:check` 校验变量是否齐全
- `pnpm dev:prod` 本地连线上库调试

#### 前置条件

- Vercel 账号
- Vercel API Token：Dashboard → Settings → Tokens → Create Token

在项目根目录创建 `.env.vercel` 文件写入 `VERCEL_TOKEN=xxx`，之后所有 vercel 命令自动读取。

#### 首次配置

```bash
# 1. 链接 Vercel 项目（只需一次）
npx vercel link

# 2. 同步环境变量到 Vercel
pnpm vercel:sync
```

#### 后续环境变量变更

修改了 `.env.production.env` 后：

```bash
pnpm vercel:sync
```

#### 手动部署

```bash
pnpm vercel:deploy
```

### Docker

```bash
docker build -t next-create-app .
docker run -p 3000:3000 --env-file .env.production.env next-create-app
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册（email + password） |
| POST | `/api/auth/login` | 登录 |
| GET | `/api/auth/me` | 获取当前用户 |
| POST | `/api/auth/logout` | 登出 |
| PUT | `/api/auth/password` | 修改密码 |
| DELETE | `/api/auth/delete` | 注销账号 |
| POST | `/api/chat` | AI 对话（SSE 流式响应） |

## 项目结构

```
src/
├── app/
│   ├── api/
│   │   ├── auth/           # 认证相关 API
│   │   └── chat/           # AI SSE 流式对话
│   ├── layout.tsx          # 根布局
│   ├── page.tsx            # 首页入口
│   └── globals.css         # 设计系统
├── components/
│   ├── app-shell.tsx       # 主框架（鉴权状态管理）
│   ├── auth-form.tsx       # 登录/注册表单
│   ├── chat-view.tsx       # AI 对话界面
│   └── user-menu.tsx       # 用户菜单
├── lib/
│   ├── env.ts              # 环境变量集中读取
│   ├── db.ts               # MySQL 连接池
│   ├── auth.ts             # JWT 签发/验证
│   ├── schema.ts           # Zod 校验 schema
│   ├── migrate.ts          # 自动建表（幂等）
│   └── init.ts             # 应用初始化
└── scripts/
    ├── use-env.sh          # 环境切换脚本
    ├── migrate.ts          # 独立迁移脚本
    ├── vercel-deploy.ts    # Vercel 手动部署
    ├── vercel-token.ts     # Vercel Token 读取
    └── vercel-sync.ts      # Vercel 环境变量同步
```

## 全部命令速查

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 本地开发（本地 MySQL） |
| `pnpm dev:dev` | 本地开发（远程 dev 库） |
| `pnpm dev:prod` | 本地开发（远程 prod 库） |
| `pnpm build` | 构建生产版本 |
| `pnpm start` | 启动生产服务 |
| `pnpm env:use <env>` | 手动切换环境 |
| `pnpm db:migrate` | 迁移本地库 |
| `pnpm db:migrate:dev` | 迁移远程 dev 库 |
| `pnpm db:migrate:prod` | 迁移远程 prod 库 |
| `pnpm vercel:sync` | 同步环境变量到 Vercel |
| `pnpm vercel:deploy` | 手动触发部署 |
| `pnpm lint` | ESLint 检查 |

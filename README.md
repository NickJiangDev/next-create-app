# next-create-app

AI 全栈脚手架 — Next.js 16 + MySQL/OceanBase + OpenAI 兼容接口 SSE 流式对话。

支持接入任意 OpenAI 兼容的 AI 服务（通义千问、OpenAI、火山引擎/豆包、DeepSeek、Moonshot 等），只需修改环境变量即可切换。

可扩展为 AI 客服、AI 知识库、AI 电商 Agent、ToB 中台管理系统等。

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | Next.js 16 (App Router, React 19) |
| 样式 | Tailwind CSS 4 |
| 数据库 | MySQL / OceanBase (mysql2) |
| 认证 | JWT (HttpOnly Cookie) |
| 校验 | Zod v4 |
| AI | OpenAI 兼容接口 (SSE 流式) |
| 部署 | Docker / Vercel (standalone output) |

## 前置条件

- Node.js >= 18.18.0
- pnpm >= 9
- MySQL >= 5.7（仅本地开发需要，连远程库无需本地 MySQL）

## 环境配置

项目采用多环境配置文件，启动时自动切换：

| 文件 | 用途 |
|------|------|
| `.env.local.env` | 本地 MySQL 完整配置 |
| `.env.development.env` | 远程 dev 库完整配置 |
| `.env.production.env` | 远程 prod 库完整配置 |
| `.env` | **运行时配置**（启动时自动生成，无需手动维护） |

启动命令（`pnpm dev` / `pnpm dev:dev` / `pnpm dev:prod`）会自动将对应环境文件复制到 `.env`，无需手动切换。

`pnpm env:use <local|development|production>` 仅用于不通过启动命令、需要单独切换环境的场景（如单独跑迁移脚本前）。

参考 `.env.example` 创建你的环境文件。

### AI 服务配置

项目通过 OpenAI 兼容接口调用 AI 服务，修改以下三个变量即可切换厂商：

```bash
AI_API_KEY=your_api_key
AI_BASE_URL=https://api.example.com/v1
AI_MODEL=model-name
```

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 创建环境文件

```bash
cp .env.example .env.local.env
# 按需修改数据库和 AI 配置
```

### 3. 启动开发

```bash
pnpm dev          # 连接本地 MySQL
pnpm dev:dev      # 连接远程 dev 数据库
pnpm dev:prod     # 连接远程 prod 数据库
```

首次请求 API 时自动建表，无需手动操作数据库。

### 4. 数据库迁移

```bash
pnpm db:migrate          # 本地库
pnpm db:migrate:dev      # 远程 dev 库
pnpm db:migrate:prod     # 远程 prod 库
```

## 部署

### Docker（推荐）

多阶段构建，镜像精简，适合自托管和企业内部部署。

#### 本地构建

```bash
docker build -t next-create-app .
docker run -p 3000:3000 --env-file .env.production.env next-create-app
```

#### CI/CD 自动构建

项目配置了 GitHub Actions（`.github/workflows/docker.yml`），推送到 main 分支或打 tag 时自动构建并推送镜像到 ghcr.io：

- push main → `ghcr.io/<owner>/next-create-app:main`
- tag v1.0.0 → `ghcr.io/<owner>/next-create-app:1.0.0`
- PR → 仅构建验证，不推送

如需推送到公司内部镜像仓库，修改 workflow 中的 `REGISTRY` 和登录凭证即可。

#### 生产运行

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL=mysql://user:pass@host:3306/dbname \
  -e JWT_SECRET=your_secret \
  -e AI_API_KEY=your_key \
  -e AI_BASE_URL=https://api.example.com/v1 \
  -e AI_MODEL=model-name \
  next-create-app
```

### Vercel（可选）

也支持 Vercel 部署，环境变量通过 Vercel Dashboard 或 `vercel:sync` 命令写入平台。

```bash
npx vercel link              # 链接项目（只需一次）
pnpm vercel:sync             # 同步环境变量
pnpm vercel:deploy           # 手动部署（可选）
```

Vercel 相关配置需要在项目根目录创建 `.env.vercel` 写入 `VERCEL_TOKEN=xxx`。

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
| `pnpm lint:fix` | ESLint 自动修复 |

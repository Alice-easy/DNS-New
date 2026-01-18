<div align="center">

# 🌐 DNS Manager

**统一多平台 DNS 管理系统**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-0.45-C5F74F?logo=drizzle)](https://orm.drizzle.team/)

[![GitHub stars](https://img.shields.io/github/stars/Alice-easy/DNS-New?style=social)](https://github.com/Alice-easy/DNS-New/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Alice-easy/DNS-New?style=social)](https://github.com/Alice-easy/DNS-New/network/members)
[![GitHub issues](https://img.shields.io/github/issues/Alice-easy/DNS-New)](https://github.com/Alice-easy/DNS-New/issues)
[![GitHub last commit](https://img.shields.io/github/last-commit/Alice-easy/DNS-New)](https://github.com/Alice-easy/DNS-New/commits/main)

[English](./README.md) | 简体中文 | [日本語](./README.ja.md)

</div>

---

## 📖 项目概述

DNS Manager 是一个现代化、开源的 DNS 管理平台，将多个 DNS 服务商整合到一个直观的仪表盘中。基于 **Next.js 16**、**React 19** 和 **TypeScript** 构建，提供类型安全、高性能的跨服务商 DNS 记录管理解决方案。

### ✨ 核心亮点

- 🔌 **7 大 DNS 服务商** — Cloudflare、阿里云、腾讯云、Route53、华为云、GoDaddy、Namecheap
- 🗄️ **4 种数据库** — SQLite、PostgreSQL、MySQL、Turso (边缘)
- 🌍 **3 种语言** — English、简体中文、日本語
- 🔐 **企业级安全** — AES-256-GCM 加密、OAuth2、RBAC 权限控制

<!--
### 📸 界面截图

> 截图即将推出！可以本地运行预览界面。

<details>
<summary>点击展开截图</summary>

| 仪表盘 | 域名管理 | 记录编辑器 |
|:------:|:--------:|:----------:|
| ![仪表盘](./docs/screenshots/dashboard.png) | ![域名](./docs/screenshots/domains.png) | ![记录](./docs/screenshots/records.png) |

</details>
-->

---

## 🎯 功能特性

### 🔌 多服务商支持

| 服务商 | 状态 | 智能线路 | API 文档 |
|:------:|:----:|:--------:|:--------:|
| Cloudflare | ✅ | — | [文档](https://developers.cloudflare.com/api/) |
| 阿里云 DNS | ✅ | ✅ 电信/联通/移动/教育网 | [文档](https://help.aliyun.com/document_detail/29739.html) |
| 腾讯云 DNSPod | ✅ | ✅ 电信/联通/移动/境外 | [文档](https://cloud.tencent.com/document/api/1427/56153) |
| AWS Route53 | ✅ | ✅ 地理路由 | [文档](https://docs.aws.amazon.com/Route53/latest/APIReference/) |
| 华为云 DNS | ✅ | ✅ 电信/联通/移动 | [文档](https://support.huaweicloud.com/api-dns/dns_api_60001.html) |
| GoDaddy | ✅ | — | [文档](https://developer.godaddy.com/doc/endpoint/domains) |
| Namecheap | ✅ | — | [文档](https://www.namecheap.com/support/api/intro/) |

### 🗄️ 多数据库支持

| 数据库 | 类型 | 边缘兼容 | 适用场景 | 连接方式 |
|:------:|:----:|:--------:|:--------:|:--------:|
| SQLite | 文件 | ❌ | 本地 / VPS | `better-sqlite3` |
| PostgreSQL | 服务器 | ✅ | 生产环境 | `postgres` |
| MySQL | 服务器 | ❌ | 生产环境 | `mysql2` |
| Turso | 边缘 | ✅ | Vercel / CF | `@libsql/client` |

### 🛡️ 核心能力

| 分类 | 功能 |
|:-----|:-----|
| **DNS 管理** | 完整 CRUD (A/AAAA/CNAME/MX/TXT/NS/CAA/SRV)、智能线路、批量导入导出、变更检测 |
| **认证方式** | GitHub/Google/Discord/Gitee OAuth、邮箱/密码、NextAuth.js v5 |
| **多用户** | 角色管理（管理员/用户）、域名共享、细粒度权限 |
| **监控** | DNS 可用性检查、延迟监控、正确性验证 |
| **告警** | 可配置规则、Webhook/Discord/Telegram 通知 |
| **安全** | AES-256-GCM 加密、速率限制、输入验证、强密码策略 |

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              前端层                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   Next.js   │  │   React 19  │  │  shadcn/ui  │  │   Tailwind 4    │ │
│  │  App Router │  │             │  │             │  │                 │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Server Actions                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   records   │  │   domains   │  │  providers  │  │   monitoring    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   alerts    │  │ audit-logs  │  │    admin    │  │   auth/users    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌─────────────────────────┐ ┌─────────────┐ ┌─────────────────────────────┐
│     DNS 服务商           │ │   数据库    │ │       认证服务商             │
│  ┌───────┐ ┌─────────┐  │ │  Drizzle    │ │  ┌────────┐  ┌───────────┐  │
│  │  CF   │ │  阿里云  │  │ │    ORM      │ │  │ GitHub │  │  Google   │  │
│  └───────┘ └─────────┘  │ │      │      │ │  └────────┘  └───────────┘  │
│  ┌───────┐ ┌─────────┐  │ │      ▼      │ │  ┌────────┐  ┌───────────┐  │
│  │腾讯云 │ │ Route53 │  │ │ ┌───────┐   │ │  │Discord │  │   Gitee   │  │
│  └───────┘ └─────────┘  │ │ │SQLite │   │ │  └────────┘  └───────────┘  │
│  ┌───────┐ ┌─────────┐  │ │ │PgSQL  │   │ └─────────────────────────────┘
│  │华为云 │ │ GoDaddy │  │ │ │MySQL  │   │
│  └───────┘ └─────────┘  │ │ │Turso  │   │
│  ┌───────────────────┐  │ │ └───────┘   │
│  │    Namecheap      │  │ └─────────────┘
│  └───────────────────┘  │
└─────────────────────────┘
```

---

## 🛠️ 技术栈

| 分类 | 技术 |
|:-----|:-----|
| **框架** | Next.js 16 (App Router + Turbopack) |
| **UI 库** | React 19.2.1 |
| **语言** | TypeScript 5.0 |
| **样式** | Tailwind CSS 4 + shadcn/ui + Radix UI |
| **数据库** | Drizzle ORM 0.45 (SQLite / PostgreSQL / MySQL / Turso) |
| **认证** | NextAuth.js v5 (beta.30) |
| **验证** | Zod 4.2 + React Hook Form 7.68 |
| **国际化** | next-intl 4.6 |
| **图标** | Lucide React |
| **通知** | Sonner |
| **邮件** | Nodemailer |

---

## 🚀 快速开始

### 环境要求

- **Node.js** 20+ (推荐 LTS 版本)
- **npm**、**pnpm** 或 **bun**

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/Alice-easy/DNS-New.git
cd DNS-New

# 安装依赖
npm install

# 配置环境变量（只需要 AUTH_SECRET！）
cp .env.example .env
# 生成密钥: openssl rand -base64 32
# 编辑 .env 设置 AUTH_SECRET

# 创建数据目录（SQLite 需要）
mkdir -p data

# 初始化数据库
npm run db:push

# 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 🎉

### 一键部署

```bash
git clone https://github.com/Alice-easy/DNS-New.git && cd DNS-New && \
  cp .env.example .env && \
  sed -i "s/your-secret-key-here/$(openssl rand -base64 32)/" .env && \
  npm install && mkdir -p data && npm run db:push && npm run build && npm start
```

---

## 👨‍💻 开发指南

### 项目结构

```
src/
├── app/                          # Next.js App Router
│   ├── api/auth/[...nextauth]/  # NextAuth.js API 路由
│   └── [locale]/                # 国际化路由
│       ├── (dashboard)/         # 仪表盘路由组
│       │   ├── domains/         # 域名管理
│       │   ├── providers/       # 服务商管理
│       │   ├── records/         # 记录管理
│       │   ├── monitoring/      # 监控任务
│       │   ├── alerts/          # 告警规则
│       │   ├── admin/           # 管理面板
│       │   ├── settings/        # 用户设置
│       │   └── logs/            # 审计日志
│       ├── login/               # 登录页面
│       └── register/            # 注册页面
│
├── components/
│   ├── ui/                      # shadcn/ui 组件
│   ├── dashboard/               # 仪表盘组件
│   └── layout/                  # 布局组件
│
├── lib/
│   ├── db/                      # 数据库层
│   │   ├── index.ts            # 数据库初始化
│   │   ├── schema.ts           # SQLite/Turso Schema
│   │   ├── schema-pg.ts        # PostgreSQL Schema
│   │   └── schema-mysql.ts     # MySQL Schema
│   ├── providers/              # DNS 服务商适配器
│   │   ├── types.ts            # IDNSProvider 接口
│   │   ├── cloudflare.ts       # Cloudflare 适配器
│   │   ├── alidns.ts           # 阿里云 DNS 适配器
│   │   ├── dnspod.ts           # 腾讯云 DNSPod 适配器
│   │   ├── route53.ts          # AWS Route53 适配器
│   │   ├── huaweicloud.ts      # 华为云 适配器
│   │   ├── godaddy.ts          # GoDaddy 适配器
│   │   └── namecheap.ts        # Namecheap 适配器
│   ├── auth.ts                 # NextAuth 配置
│   ├── crypto.ts               # AES-256-GCM 加密
│   └── permissions.ts          # RBAC 权限控制
│
├── server/                      # Server Actions
│   ├── records.ts              # 记录 CRUD
│   ├── domains.ts              # 域名操作
│   ├── providers.ts            # 服务商管理
│   ├── monitoring.ts           # 监控任务
│   ├── alerts.ts               # 告警管理
│   └── audit-logs.ts           # 审计日志
│
├── i18n/                        # 国际化
│   ├── navigation.ts           # i18n 导航
│   └── routing.ts              # 语言路由
│
└── messages/                    # 翻译文件
    ├── en.json                 # 英文
    ├── zh-CN.json              # 简体中文
    └── ja.json                 # 日文
```

### 添加新的 DNS 服务商

1. 在 `src/lib/providers/` 创建新的适配器文件：

```typescript
// src/lib/providers/my-provider.ts
import type { IDNSProvider, ProviderMeta } from './types';

export class MyProvider implements IDNSProvider {
  readonly meta: ProviderMeta = {
    name: 'MyProvider',
    supportedRecordTypes: ['A', 'AAAA', 'CNAME', 'MX', 'TXT'],
    supportsSmartLines: false,
  };

  constructor(private credentials: MyProviderCredentials) {}

  async validateCredentials(): Promise<boolean> {
    // 实现凭据验证
  }

  async listDomains(): Promise<ProviderDomain[]> {
    // 实现域名列表
  }

  async listRecords(domainId: string): Promise<ProviderRecord[]> {
    // 实现记录列表
  }

  async createRecord(domainId: string, record: CreateRecordInput): Promise<ProviderRecord> {
    // 实现创建记录
  }

  async updateRecord(domainId: string, recordId: string, record: UpdateRecordInput): Promise<ProviderRecord> {
    // 实现更新记录
  }

  async deleteRecord(domainId: string, recordId: string): Promise<void> {
    // 实现删除记录
  }
}
```

2. 在 `src/lib/providers/index.ts` 中注册

3. 在服务商创建表单中添加 UI 支持

### 常用命令

```bash
npm run dev          # 启动开发服务器 (Turbopack)
npm run build        # 生产构建
npm run start        # 启动生产服务器
npm run lint         # 运行 ESLint
npm run db:generate  # 生成数据库迁移
npm run db:migrate   # 执行数据库迁移
npm run db:push      # 推送数据库结构
npm run db:studio    # 打开 Drizzle Studio
```

---

## 📡 API 参考

### Server Actions

DNS Manager 使用 Next.js Server Actions 替代传统 REST API，主要 Actions：

| 模块 | Actions |
|:-----|:--------|
| `server/records.ts` | `createRecord`, `updateRecord`, `deleteRecord`, `syncRecords`, `batchImportRecords` |
| `server/domains.ts` | `getDomains`, `getDomainWithRecords`, `syncDomains` |
| `server/providers.ts` | `createProvider`, `updateProvider`, `deleteProvider`, `testProvider` |
| `server/monitoring.ts` | `createMonitorTask`, `updateMonitorTask`, `deleteMonitorTask`, `checkNow` |
| `server/alerts.ts` | `createAlertRule`, `updateAlertRule`, `deleteAlertRule`, `addNotificationChannel` |

### 认证路由

| 路由 | 方法 | 描述 |
|:-----|:----:|:-----|
| `/api/auth/signin` | POST | 登录 |
| `/api/auth/signout` | POST | 登出 |
| `/api/auth/callback/github` | GET/POST | GitHub OAuth 回调 |
| `/api/auth/callback/google` | GET/POST | Google OAuth 回调 |
| `/api/auth/callback/discord` | GET/POST | Discord OAuth 回调 |
| `/api/auth/callback/gitee` | GET/POST | Gitee OAuth 回调 |

---

## ⚙️ 配置说明

### 环境变量

| 变量 | 必需 | 默认值 | 描述 |
|:-----|:----:|:------:|:-----|
| `AUTH_SECRET` | ✅ | — | NextAuth.js 密钥 |
| `DATABASE_TYPE` | ❌ | `sqlite` | `sqlite`, `postgres`, `mysql`, `turso` |
| `DATABASE_URL` | ❌ | `./data/sqlite.db` | 数据库连接字符串 |
| `TURSO_DATABASE_URL` | ❌ | — | Turso 数据库 URL |
| `TURSO_AUTH_TOKEN` | ❌ | — | Turso 认证令牌 |

### 管理面板配置

其他设置可通过 **管理面板 → 系统设置** 配置：

- OAuth 服务商凭据（GitHub、Google、Discord、Gitee）
- SMTP 邮件配置
- 凭据加密密钥
- 速率限制设置

---

## 🚢 部署指南

### Vercel（推荐）

1. Fork 本仓库
2. 导入到 Vercel
3. 设置环境变量：
   - `AUTH_SECRET`
   - `DATABASE_TYPE=turso`
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
4. 部署

### 自托管 (VPS)

```bash
# 克隆并配置
git clone https://github.com/Alice-easy/DNS-New.git
cd DNS-New
cp .env.example .env
# 编辑 .env 设置你的配置

# 安装并构建
npm install
npm run db:push
npm run build

# 使用 PM2 运行
npm install -g pm2
pm2 start npm --name "dns-manager" -- start
pm2 save
```

### Docker（即将推出）

Docker 支持将在未来版本中提供。

---

## 🤝 参与贡献

欢迎贡献！请遵循以下指南：

### 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/)：

```
feat: 添加新的 DNS 服务商支持
fix: 修复记录同步问题
docs: 更新 API 文档
style: 使用 prettier 格式化代码
refactor: 重构服务商适配器
test: 添加加密模块单元测试
chore: 更新依赖
```

### Pull Request 流程

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 进行修改
4. 运行代码检查：`npm run lint`
5. 提交更改：`git commit -m 'feat: add amazing feature'`
6. 推送到分支：`git push origin feature/amazing-feature`
7. 发起 Pull Request

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 使用有意义的变量名
- 为公开 API 添加 JSDoc 注释

---

## 🗺️ 路线图

- [ ] Docker 容器支持
- [ ] 更多 DNS 服务商（Azure DNS、DigitalOcean、Vultr）
- [ ] DNSSEC 管理
- [ ] DNS 模板/预设系统
- [ ] API Key 认证用于外部访问
- [ ] 批量域名导入导出
- [ ] 高级分析仪表盘

---

## ❓ 常见问题

<details>
<summary><strong>Q: 如何重置管理员密码？</strong></summary>

使用 Drizzle Studio 直接修改数据库：
```bash
npm run db:studio
```
导航到 `users` 表并更新密码哈希。
</details>

<details>
<summary><strong>Q: 可以同时使用多个数据库吗？</strong></summary>

不可以，DNS Manager 一次只使用一个数据库。但是，您可以通过导出和导入在数据库之间迁移数据。
</details>

<details>
<summary><strong>Q: API 凭据是如何存储的？</strong></summary>

所有服务商凭据在存储到数据库之前都使用 AES-256-GCM 进行加密。加密密钥来自 `CREDENTIALS_ENCRYPTION_KEY` 环境变量。
</details>

<details>
<summary><strong>Q: API 调用有速率限制吗？</strong></summary>

是的，DNS Manager 实现了速率限制以防止滥用。默认限制可在管理面板中配置。
</details>

---

## 📄 许可证

本项目采用 **MIT 许可证** — 详见 [LICENSE](LICENSE) 文件。

---

## 🙏 致谢

- [Next.js](https://nextjs.org/) — React 框架
- [shadcn/ui](https://ui.shadcn.com/) — 精美的 UI 组件
- [Drizzle ORM](https://orm.drizzle.team/) — TypeScript ORM
- [NextAuth.js](https://next-auth.js.org/) — Next.js 认证方案
- [Tailwind CSS](https://tailwindcss.com/) — 实用优先的 CSS 框架

---

<div align="center">

**由社区用 ❤️ 构建**

<br />

[![Made by Alice](https://img.shields.io/badge/Made%20by-Alice--easy-blueviolet?logo=github)](https://github.com/Alice-easy)

<br />

⭐ 如果觉得有用，请给个 Star！

</div>

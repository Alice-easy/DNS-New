# DNS Manager

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

一个统一的 DNS 管理系统，支持多个 DNS 服务商（Cloudflare、阿里云 DNS、DNSPod 等），提供现代化的 Web 管理界面。

**Language / 语言 / 言語**: [English](./README.md) | 简体中文 | [日本語](./README.ja.md)

## 截图

> 截图即将推出

<!--
![仪表盘](./docs/screenshots/dashboard.png)
![域名管理](./docs/screenshots/domains.png)
![记录管理](./docs/screenshots/records.png)
-->

## 功能特点

### 核心功能
- **多服务商支持**：在单一仪表盘中管理多个 DNS 服务商的记录
- **安全认证**：支持 GitHub OAuth + 邮箱密码认证（NextAuth.js）
- **统一仪表盘**：概览所有服务商、域名和记录
- **实时同步**：从服务商同步域名和记录
- **现代化 UI**：使用 shadcn/ui 组件和 Tailwind CSS 构建
- **响应式设计**：支持桌面和移动设备
- **国际化支持**：完整支持中文、英文、日文三语

### DNS 管理
- **记录管理**：完整的 DNS 记录 CRUD 操作（A、AAAA、CNAME、MX、TXT、NS 等）
- **批量操作**：支持 JSON 或 CSV 格式的记录导入/导出
- **变更检测**：同步时追踪和审查 DNS 记录变更
- **操作日志**：完整的 DNS 操作审计记录

### 多用户与权限
- **用户管理**：管理面板支持用户和角色管理
- **域名共享**：与其他用户共享域名并设置精细权限
- **权限级别**：所有者、完全控制、编辑、只读四种权限级别

### 监控与告警
- **DNS 监控**：监控 DNS 记录的可用性、延迟和正确性
- **告警规则**：配置监控失败、延迟阈值、记录变更等告警
- **通知渠道**：支持 Webhook、Discord、Telegram 通知
- **告警历史**：追踪所有触发的告警及其解决状态

### 智能 DNS（地理路由）
- **地理路由**：根据访问者地理位置路由 DNS 查询
- **区域/国家定向**：为特定区域或国家配置目标
- **负载均衡**：轮询、加权、故障转移三种策略
- **健康检查**：自动监控路由目标健康状态

### 安全特性

- **AES-256-GCM 加密**：服务商凭证在数据库中加密存储
- **智能密钥回退**：未设置专用加密密钥时自动使用 AUTH_SECRET
- **速率限制**：防止登录/注册的暴力破解攻击
- **输入验证**：DNS 记录在发送到服务商前进行验证
- **强密码策略**：要求 8 位以上，包含大小写字母和数字
- **安全日志**：生产环境隐藏错误详情

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router + Turbopack) |
| 语言 | TypeScript 5.0 |
| 样式 | Tailwind CSS 4 + shadcn/ui |
| 数据库 | SQLite + Drizzle ORM |
| 认证 | NextAuth.js v5 |
| 国际化 | next-intl |
| 表单处理 | react-hook-form |

## 支持的 DNS 服务商

| 服务商 | 状态 | 备注 |
|--------|------|------|
| Cloudflare | ✅ 已支持 | 完整 API 支持，含代理状态 |
| 阿里云 DNS | ✅ 已支持 | 完整 API 支持 |
| 腾讯云 DNSPod | ✅ 已支持 | 完整 API 支持 |
| AWS Route53 | 🔜 即将推出 | 计划中 |
| GoDaddy | 🔜 即将推出 | 计划中 |

## 快速开始

### 环境要求

- Node.js 20+
- npm 或 pnpm

### 安装步骤

1. 克隆仓库：

```bash
git clone https://github.com/Alice-easy/DNS-New.git
cd DNS-New
```

2. 安装依赖：

```bash
npm install
```

3. 配置环境变量：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置密钥：

```env
# 必填 - 使用以下命令生成: openssl rand -base64 32
AUTH_SECRET="你的密钥"

# 可选 - 其他配置都有默认值或可跳过
# DATABASE_URL="./data/sqlite.db"
# GITHUB_CLIENT_ID=""
# GITHUB_CLIENT_SECRET=""
```

> **提示**：只需要设置 `AUTH_SECRET`！加密密钥默认使用 AUTH_SECRET，GitHub OAuth 是可选的。

4. 初始化数据库：

```bash
npm run db:push
```

5. 启动开发服务器：

```bash
npm run dev
```

6. 在浏览器中打开 [http://localhost:3000](http://localhost:3000)

### 一键部署

```bash
# 一行命令部署 (Linux/macOS)
cp .env.example .env && \
  sed -i "s/your-secret-key-here/$(openssl rand -base64 32)/" .env && \
  npm install && npm run db:push && npm run build && npm start
```

### 更新项目

当发布新版本时，按照以下步骤更新：

```bash
# 拉取最新代码
git pull

# 更新依赖
npm install

# 如有数据库结构变更，执行迁移
npm run db:push
```

> **注意**：更新前建议备份 `data/` 目录，其中包含 SQLite 数据库。

### 创建 GitHub OAuth 应用（可选）

GitHub OAuth 是可选的，不配置也可以使用邮箱密码登录。

1. 前往 [GitHub 开发者设置](https://github.com/settings/developers)
2. 点击「New OAuth App」
3. 填写信息：
   - Application name: `DNS Manager`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. 将 Client ID 和 Client Secret 复制到 `.env` 文件

## 项目结构

```
dns-manager/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [locale]/           # 基于语言的路由
│   │   │   ├── (dashboard)/    # 仪表盘页面
│   │   │   │   ├── admin/      # 管理面板
│   │   │   │   ├── alerts/     # 告警管理
│   │   │   │   ├── changes/    # 变更检测
│   │   │   │   ├── domains/    # 域名管理
│   │   │   │   ├── geo-dns/    # 智能 DNS（地理路由）
│   │   │   │   ├── logs/       # 操作日志
│   │   │   │   ├── monitoring/ # DNS 监控
│   │   │   │   ├── providers/  # 服务商管理
│   │   │   │   ├── records/    # 记录管理
│   │   │   │   └── settings/   # 用户设置
│   │   │   ├── login/          # 登录页面
│   │   │   └── register/       # 注册页面
│   │   └── api/auth/           # NextAuth API 路由
│   ├── components/
│   │   ├── ui/                 # shadcn/ui 组件
│   │   ├── layout/             # 布局组件
│   │   └── language-switcher/  # 语言切换器
│   ├── i18n/                   # 国际化配置
│   │   ├── routing.ts          # 语言路由配置
│   │   ├── request.ts          # 请求配置
│   │   └── navigation.ts       # 类型安全的导航辅助
│   ├── lib/
│   │   ├── db/                 # 数据库（Drizzle）
│   │   ├── providers/          # DNS 服务商适配器
│   │   ├── auth.ts             # NextAuth 配置
│   │   ├── crypto.ts           # AES-256-GCM 加密
│   │   ├── rate-limit.ts       # 速率限制
│   │   ├── dns-validation.ts   # DNS 记录验证
│   │   ├── permissions.ts      # 权限工具
│   │   ├── geo-constants.ts    # 地理路由常量
│   │   └── env.ts              # 环境变量验证
│   └── server/                 # Server Actions
│       ├── providers.ts        # 服务商操作
│       ├── domains.ts          # 域名操作
│       ├── records.ts          # 记录操作
│       ├── monitoring.ts       # DNS 监控
│       ├── alerts.ts           # 告警通知
│       ├── geo-routing.ts      # 地理路由
│       └── users.ts            # 用户管理
├── messages/                   # 翻译文件
│   ├── en.json                 # 英文
│   ├── zh-CN.json              # 简体中文
│   └── ja.json                 # 日文
├── data/                       # SQLite 数据库
└── drizzle.config.ts           # Drizzle 配置
```

## DNS 服务商架构

系统使用适配器模式来支持多个 DNS 服务商：

```typescript
interface IDNSProvider {
  readonly meta: ProviderMeta;
  validateCredentials(): Promise<boolean>;
  listDomains(): Promise<ProviderDomain[]>;
  getDomain(domainId: string): Promise<ProviderDomain>;
  listRecords(domainId: string): Promise<ProviderRecord[]>;
  createRecord(domainId: string, record: CreateRecordInput): Promise<ProviderRecord>;
  updateRecord(domainId: string, recordId: string, record: UpdateRecordInput): Promise<ProviderRecord>;
  deleteRecord(domainId: string, recordId: string): Promise<void>;
}
```

### 添加新服务商

1. 在 `src/lib/providers/` 目录下创建新的适配器文件
2. 实现 `IDNSProvider` 接口
3. 在 `src/lib/providers/index.ts` 中注册服务商

## 脚本命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 运行 ESLint
npm run db:push      # 推送数据库 Schema
npm run db:studio    # 打开 Drizzle Studio
npm run db:generate  # 生成数据库迁移
```

## 开发路线图

### 第一阶段（MVP）✅

- [x] 项目搭建（Next.js、shadcn/ui、Drizzle）
- [x] 认证系统（NextAuth.js + GitHub）
- [x] 仪表盘布局
- [x] Cloudflare 服务商适配器
- [x] 域名和记录管理界面

### 第二阶段 ✅

- [x] 阿里云 DNS 适配器
- [x] DNSPod 适配器
- [x] 国际化支持（中/英/日）
- [x] 批量操作（导入/导出）
- [x] 操作日志界面
- [x] 多用户权限管理

### 第三阶段 ✅

- [x] DNS 监控（可用性、延迟、正确性检查）
- [x] 变更检测（同步时追踪 DNS 记录变更）
- [x] 告警通知（Webhook、Discord、Telegram）
- [x] 智能 DNS（地理路由，区域/国家定向）

### 第四阶段（计划中）

- [ ] AWS Route53 服务商适配器
- [ ] GoDaddy 服务商适配器
- [ ] DNS DNSSEC 管理
- [ ] API 访问令牌（自动化）
- [ ] 定时 DNS 记录更新
- [ ] DNS 模板管理

## 参与贡献

欢迎贡献代码！请随时提交 Pull Request。

1. Fork 本仓库
2. 创建功能分支（`git checkout -b feature/amazing-feature`）
3. 提交更改（`git commit -m 'Add some amazing feature'`）
4. 推送到分支（`git push origin feature/amazing-feature`）
5. 打开 Pull Request

## 开源许可

本项目基于 MIT 许可证开源 - 详见 [LICENSE](LICENSE) 文件。

## 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [shadcn/ui](https://ui.shadcn.com/) - 精美的 UI 组件
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [NextAuth.js](https://authjs.dev/) - Next.js 认证方案
- [next-intl](https://next-intl-docs.vercel.app/) - Next.js 国际化方案

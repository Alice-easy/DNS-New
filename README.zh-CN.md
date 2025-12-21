<div align="center">

# 🌐 DNS Manager

**统一多平台 DNS 管理系统**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

[![GitHub stars](https://img.shields.io/github/stars/Alice-easy/DNS-New?style=social)](https://github.com/Alice-easy/DNS-New/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Alice-easy/DNS-New?style=social)](https://github.com/Alice-easy/DNS-New/network/members)
[![GitHub issues](https://img.shields.io/github/issues/Alice-easy/DNS-New)](https://github.com/Alice-easy/DNS-New/issues)
[![GitHub last commit](https://img.shields.io/github/last-commit/Alice-easy/DNS-New)](https://github.com/Alice-easy/DNS-New/commits/main)

[English](./README.md) | 简体中文 | [日本語](./README.ja.md)

</div>

---

## ✨ 功能特性

一个现代化的统一 DNS 管理平台，将多个 DNS 服务商整合到一个直观的仪表盘中。

### 🔌 多服务商支持

| 服务商 | 状态 | 智能线路 |
|:------:|:----:|:--------:|
| Cloudflare | ✅ | - |
| 阿里云 DNS | ✅ | ✅ 电信/联通/移动/教育网等 |
| 腾讯云 DNSPod | ✅ | ✅ 电信/联通/移动/境外等 |
| AWS Route53 | ✅ | ✅ 地理路由 |
| 华为云 DNS | ✅ | ✅ 电信/联通/移动等 |
| GoDaddy | ✅ | - |
| Namecheap | ✅ | - |

### 🗄️ 多数据库支持

| 数据库 | 类型 | 边缘兼容 | 适用场景 |
|:------:|:----:|:--------:|:--------:|
| SQLite | 文件 | ❌ | 本地 / VPS |
| PostgreSQL | 服务器 | ✅ | 生产环境 |
| MySQL | 服务器 | ❌ | 生产环境 |
| Turso (libSQL) | 边缘 | ✅ | Vercel / Cloudflare |

### 🛡️ 核心能力

- **📊 统一仪表盘** — 在一处管理所有服务商、域名和记录
- **🔐 安全认证** — GitHub OAuth + 邮箱密码，基于 NextAuth.js v5
- **🌍 国际化** — English、简体中文、日本語
- **📱 响应式设计** — 桌面、平板、手机全适配
- **🔄 实时同步** — 从服务商同步域名和记录
- **📝 操作日志** — 完整的操作历史追踪

### 📋 DNS 管理

- **完整 CRUD** — A、AAAA、CNAME、MX、TXT、NS、CAA、SRV 记录
- **智能线路** — 基于运营商的解析（电信/联通/移动）
- **批量导入导出** — 支持 JSON 和 CSV 格式
- **变更检测** — 同步时追踪修改

### 👥 多用户与权限

- **角色管理** — 管理员和普通用户角色
- **域名共享** — 细粒度权限共享
- **访问级别** — 所有者 / 完全控制 / 编辑 / 只读

### 📡 监控与告警

- **DNS 监控** — 可用性、延迟、正确性检查
- **告警规则** — 可配置的阈值和触发条件
- **通知渠道** — Webhook、Discord、Telegram

### 🔒 安全特性

- **AES-256-GCM** — 凭据静态加密
- **速率限制** — 暴力破解防护
- **输入验证** — API 调用前的 DNS 记录验证
- **强密码策略** — 8+ 字符，包含大小写和数字

---

## 🚀 快速开始

### 环境要求

- Node.js 20+
- npm 或 pnpm

### 安装步骤

```bash
# 克隆
git clone https://github.com/Alice-easy/DNS-New.git
cd DNS-New

# 安装依赖
npm install

# 配置（只需要 AUTH_SECRET！）
cp .env.example .env
# 编辑 .env: AUTH_SECRET="your-secret-key"

# 初始化数据库
npm run db:push

# 运行
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 🎉

### 一键部署

```bash
cp .env.example .env && \
  sed -i "s/your-secret-key-here/$(openssl rand -base64 32)/" .env && \
  npm install && npm run db:push && npm run build && npm start
```

---

## ⚙️ 配置说明

### 最简配置

只需要 **一个** 环境变量：

```env
AUTH_SECRET="your-secret-key-here"  # 生成命令: openssl rand -base64 32
```

### 可选：数据库类型

```env
DATABASE_TYPE="sqlite"  # sqlite（默认）、postgres、mysql、turso
```

### 其他配置

通过 **管理面板 → 系统设置** 配置：
- GitHub OAuth 凭据
- 数据库连接字符串
- 加密密钥
- 更多...

---

## 🛠️ 技术栈

| 分类 | 技术 |
|:-----|:-----|
| 框架 | Next.js 16 (App Router + Turbopack) |
| 语言 | TypeScript 5.0 |
| 样式 | Tailwind CSS 4 + shadcn/ui |
| 数据库 | Drizzle ORM (SQLite/PostgreSQL/MySQL/Turso) |
| 认证 | NextAuth.js v5 |
| 国际化 | next-intl |

---

## 📜 常用命令

```bash
npm run dev          # 开发服务器
npm run build        # 生产构建
npm run start        # 生产服务器
npm run db:push      # 推送数据库结构
npm run db:studio    # 打开 Drizzle Studio
```

---

## 🤝 参与贡献

欢迎贡献！请随时提交 Pull Request。

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing`)
5. 发起 Pull Request

---

## 📄 许可证

MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

---

<div align="center">

**使用 Next.js、shadcn/ui 和 Drizzle ORM 用心构建 ❤️**

<br />

[![Made by Alice](https://img.shields.io/badge/Made%20by-Alice--easy-blueviolet?logo=github)](https://github.com/Alice-easy)

</div>

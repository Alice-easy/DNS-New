<div align="center">

# 🌐 DNS Manager

**统一多平台 DNS 管理系统**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md)

</div>

---

## ✨ Features

A modern, unified DNS management platform that consolidates multiple DNS providers into a single, intuitive dashboard.

### 🔌 Multi-Provider Support

| Provider | Status | Smart Lines |
|:--------:|:------:|:-----------:|
| Cloudflare | ✅ | - |
| Aliyun DNS | ✅ | ✅ Telecom/Unicom/Mobile/Edu |
| Tencent DNSPod | ✅ | ✅ Telecom/Unicom/Mobile/Overseas |
| AWS Route53 | ✅ | ✅ Geo Routing |
| Huawei Cloud | ✅ | ✅ Telecom/Unicom/Mobile |
| GoDaddy | ✅ | - |
| Namecheap | ✅ | - |

### 🗄️ Multi-Database Support

| Database | Type | Edge Compatible | Best For |
|:--------:|:----:|:---------------:|:--------:|
| SQLite | File | ❌ | Local / VPS |
| PostgreSQL | Server | ✅ | Production |
| MySQL | Server | ❌ | Production |
| Turso (libSQL) | Edge | ✅ | Vercel / Cloudflare |

### 🛡️ Core Capabilities

- **📊 Unified Dashboard** — Manage all providers, domains, and records in one place
- **🔐 Secure Auth** — GitHub OAuth + Email/Password with NextAuth.js v5
- **🌍 Internationalization** — English, 简体中文, 日本語
- **📱 Responsive Design** — Desktop, tablet, and mobile optimized
- **🔄 Real-time Sync** — Sync domains and records from providers
- **📝 Audit Logs** — Complete operation history tracking

### 📋 DNS Management

- **Full CRUD** — A, AAAA, CNAME, MX, TXT, NS, CAA, SRV records
- **Smart Lines** — ISP-based routing for Chinese carriers (Telecom/Unicom/Mobile)
- **Batch Import/Export** — JSON and CSV format support
- **Change Detection** — Track modifications during sync

### 👥 Multi-User & Permissions

- **Role Management** — Admin and User roles
- **Domain Sharing** — Share with granular permissions
- **Access Levels** — Owner / Full Control / Edit / Read-Only

### 📡 Monitoring & Alerts

- **DNS Monitoring** — Availability, latency, and correctness checks
- **Alert Rules** — Configurable thresholds and triggers
- **Notifications** — Webhook, Discord, Telegram channels

### 🔒 Security

- **AES-256-GCM** — Credentials encrypted at rest
- **Rate Limiting** — Brute-force protection
- **Input Validation** — DNS record validation before API calls
- **Strong Passwords** — 8+ chars with mixed case and numbers

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm or pnpm

### Installation

```bash
# Clone
git clone https://github.com/Alice-easy/DNS-New.git
cd DNS-New

# Install
npm install

# Configure (only AUTH_SECRET is required!)
cp .env.example .env
# Edit .env: AUTH_SECRET="your-secret-key"

# Database
npm run db:push

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

### One-liner Deploy

```bash
cp .env.example .env && \
  sed -i "s/your-secret-key-here/$(openssl rand -base64 32)/" .env && \
  npm install && npm run db:push && npm run build && npm start
```

---

## ⚙️ Configuration

### Minimal Setup

Only **one** environment variable is required:

```env
AUTH_SECRET="your-secret-key-here"  # Generate: openssl rand -base64 32
```

### Optional: Database Type

```env
DATABASE_TYPE="sqlite"  # sqlite (default), postgres, mysql, turso
```

### All Other Settings

Configure via **Admin Panel → System Settings**:
- GitHub OAuth credentials
- Database connection strings
- Encryption keys
- And more...

---

## 🛠️ Tech Stack

| Category | Technology |
|:---------|:-----------|
| Framework | Next.js 16 (App Router + Turbopack) |
| Language | TypeScript 5.0 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | Drizzle ORM (SQLite/PostgreSQL/MySQL/Turso) |
| Auth | NextAuth.js v5 |
| i18n | next-intl |

---

## 📜 Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
```

---

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ using Next.js, shadcn/ui, and Drizzle ORM**

</div>

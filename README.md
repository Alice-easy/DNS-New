<div align="center">

# 🌐 DNS Manager

**Unified Multi-Platform DNS Management System**

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

[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md)

</div>

---

## 📖 Overview

DNS Manager is a modern, open-source DNS management platform that consolidates multiple DNS providers into a single, intuitive dashboard. Built with **Next.js 16**, **React 19**, and **TypeScript**, it provides a type-safe, performant solution for managing DNS records across various providers.

### ✨ Key Highlights

- 🔌 **7 DNS Providers** — Cloudflare, Aliyun, DNSPod, Route53, Huawei Cloud, GoDaddy, Namecheap
- 🗄️ **4 Databases** — SQLite, PostgreSQL, MySQL, Turso (Edge)
- 🌍 **3 Languages** — English, 简体中文, 日本語
- 🔐 **Enterprise Security** — AES-256-GCM encryption, OAuth2, RBAC

<!--
### 📸 Screenshots

> Screenshots coming soon! Run locally to preview the UI.

<details>
<summary>Click to expand screenshots</summary>

| Dashboard | Domain Management | Record Editor |
|:---------:|:-----------------:|:-------------:|
| ![Dashboard](./docs/screenshots/dashboard.png) | ![Domains](./docs/screenshots/domains.png) | ![Records](./docs/screenshots/records.png) |

</details>
-->

---

## 🎯 Features

### 🔌 Multi-Provider Support

| Provider | Status | Smart Lines | API Docs |
|:--------:|:------:|:-----------:|:--------:|
| Cloudflare | ✅ | — | [Docs](https://developers.cloudflare.com/api/) |
| Aliyun DNS | ✅ | ✅ Telecom/Unicom/Mobile/Edu | [Docs](https://help.aliyun.com/document_detail/29739.html) |
| Tencent DNSPod | ✅ | ✅ Telecom/Unicom/Mobile/Overseas | [Docs](https://cloud.tencent.com/document/api/1427/56153) |
| AWS Route53 | ✅ | ✅ Geo Routing | [Docs](https://docs.aws.amazon.com/Route53/latest/APIReference/) |
| Huawei Cloud | ✅ | ✅ Telecom/Unicom/Mobile | [Docs](https://support.huaweicloud.com/api-dns/dns_api_60001.html) |
| GoDaddy | ✅ | — | [Docs](https://developer.godaddy.com/doc/endpoint/domains) |
| Namecheap | ✅ | — | [Docs](https://www.namecheap.com/support/api/intro/) |

### 🗄️ Multi-Database Support

| Database | Type | Edge Compatible | Best For | Connection |
|:--------:|:----:|:---------------:|:--------:|:----------:|
| SQLite | File | ❌ | Local / VPS | `better-sqlite3` |
| PostgreSQL | Server | ✅ | Production | `postgres` |
| MySQL | Server | ❌ | Production | `mysql2` |
| Turso | Edge | ✅ | Vercel / CF | `@libsql/client` |

### 🛡️ Core Capabilities

| Category | Features |
|:---------|:---------|
| **DNS Management** | Full CRUD (A/AAAA/CNAME/MX/TXT/NS/CAA/SRV), Smart Lines, Batch Import/Export, Change Detection |
| **Authentication** | GitHub/Google/Discord/Gitee OAuth, Email/Password, NextAuth.js v5 |
| **Multi-User** | Role Management (Admin/User), Domain Sharing, Granular Permissions |
| **Monitoring** | DNS Availability Checks, Latency Monitoring, Correctness Validation |
| **Alerts** | Configurable Rules, Webhook/Discord/Telegram Notifications |
| **Security** | AES-256-GCM Encryption, Rate Limiting, Input Validation, Strong Password Policy |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Frontend                                    │
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
│     DNS Providers       │ │  Database   │ │       Auth Providers        │
│  ┌───────┐ ┌─────────┐  │ │  Drizzle    │ │  ┌────────┐  ┌───────────┐  │
│  │  CF   │ │ Aliyun  │  │ │    ORM      │ │  │ GitHub │  │  Google   │  │
│  └───────┘ └─────────┘  │ │      │      │ │  └────────┘  └───────────┘  │
│  ┌───────┐ ┌─────────┐  │ │      ▼      │ │  ┌────────┐  ┌───────────┐  │
│  │DNSPod │ │ Route53 │  │ │ ┌───────┐   │ │  │Discord │  │   Gitee   │  │
│  └───────┘ └─────────┘  │ │ │SQLite │   │ │  └────────┘  └───────────┘  │
│  ┌───────┐ ┌─────────┐  │ │ │PgSQL  │   │ └─────────────────────────────┘
│  │Huawei │ │ GoDaddy │  │ │ │MySQL  │   │
│  └───────┘ └─────────┘  │ │ │Turso  │   │
│  ┌───────────────────┐  │ │ └───────┘   │
│  │    Namecheap      │  │ └─────────────┘
│  └───────────────────┘  │
└─────────────────────────┘
```

---

## 🛠️ Tech Stack

| Category | Technologies |
|:---------|:------------|
| **Framework** | Next.js 16 (App Router + Turbopack) |
| **UI Library** | React 19.2.1 |
| **Language** | TypeScript 5.0 |
| **Styling** | Tailwind CSS 4 + shadcn/ui + Radix UI |
| **Database** | Drizzle ORM 0.45 (SQLite / PostgreSQL / MySQL / Turso) |
| **Authentication** | NextAuth.js v5 (beta.30) |
| **Validation** | Zod 4.2 + React Hook Form 7.68 |
| **i18n** | next-intl 4.6 |
| **Icons** | Lucide React |
| **Notifications** | Sonner |
| **Email** | Nodemailer |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm**, **pnpm**, or **bun**

### Installation

```bash
# Clone the repository
git clone https://github.com/Alice-easy/DNS-New.git
cd DNS-New

# Install dependencies
npm install

# Configure environment (only AUTH_SECRET required!)
cp .env.example .env
# Generate secret: openssl rand -base64 32
# Edit .env and set AUTH_SECRET

# Create data directory (for SQLite)
mkdir -p data

# Initialize database
npm run db:push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

### One-liner Deploy

```bash
git clone https://github.com/Alice-easy/DNS-New.git && cd DNS-New && \
  cp .env.example .env && \
  sed -i "s/your-secret-key-here/$(openssl rand -base64 32)/" .env && \
  npm install && mkdir -p data && npm run db:push && npm run build && npm start
```

---

## 👨‍💻 Development Guide

### Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/auth/[...nextauth]/  # NextAuth.js API routes
│   └── [locale]/                # i18n routes
│       ├── (dashboard)/         # Dashboard route group
│       │   ├── domains/         # Domain management
│       │   ├── providers/       # Provider management
│       │   ├── records/         # Record management
│       │   ├── monitoring/      # Monitoring tasks
│       │   ├── alerts/          # Alert rules
│       │   ├── admin/           # Admin panel
│       │   ├── settings/        # User settings
│       │   └── logs/            # Audit logs
│       ├── login/               # Login page
│       └── register/            # Registration page
│
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── dashboard/               # Dashboard components
│   └── layout/                  # Layout components
│
├── lib/
│   ├── db/                      # Database layer
│   │   ├── index.ts            # DB initialization
│   │   ├── schema.ts           # SQLite/Turso schema
│   │   ├── schema-pg.ts        # PostgreSQL schema
│   │   └── schema-mysql.ts     # MySQL schema
│   ├── providers/              # DNS provider adapters
│   │   ├── types.ts            # IDNSProvider interface
│   │   ├── cloudflare.ts       # Cloudflare adapter
│   │   ├── alidns.ts           # Aliyun DNS adapter
│   │   ├── dnspod.ts           # Tencent DNSPod adapter
│   │   ├── route53.ts          # AWS Route53 adapter
│   │   ├── huaweicloud.ts      # Huawei Cloud adapter
│   │   ├── godaddy.ts          # GoDaddy adapter
│   │   └── namecheap.ts        # Namecheap adapter
│   ├── auth.ts                 # NextAuth configuration
│   ├── crypto.ts               # AES-256-GCM encryption
│   └── permissions.ts          # RBAC permissions
│
├── server/                      # Server Actions
│   ├── records.ts              # Record CRUD
│   ├── domains.ts              # Domain operations
│   ├── providers.ts            # Provider management
│   ├── monitoring.ts           # Monitoring tasks
│   ├── alerts.ts               # Alert management
│   └── audit-logs.ts           # Audit logging
│
├── i18n/                        # Internationalization
│   ├── navigation.ts           # i18n navigation
│   └── routing.ts              # Locale routing
│
└── messages/                    # Translation files
    ├── en.json                 # English
    ├── zh-CN.json              # Simplified Chinese
    └── ja.json                 # Japanese
```

### Adding a New DNS Provider

1. Create a new adapter file in `src/lib/providers/`:

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
    // Implement credential validation
  }

  async listDomains(): Promise<ProviderDomain[]> {
    // Implement domain listing
  }

  async listRecords(domainId: string): Promise<ProviderRecord[]> {
    // Implement record listing
  }

  async createRecord(domainId: string, record: CreateRecordInput): Promise<ProviderRecord> {
    // Implement record creation
  }

  async updateRecord(domainId: string, recordId: string, record: UpdateRecordInput): Promise<ProviderRecord> {
    // Implement record update
  }

  async deleteRecord(domainId: string, recordId: string): Promise<void> {
    // Implement record deletion
  }
}
```

2. Register in `src/lib/providers/index.ts`

3. Add UI support in the provider creation form

### Available Scripts

```bash
npm run dev          # Start development server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
```

---

## 📡 API Reference

### Server Actions

DNS Manager uses Next.js Server Actions instead of REST APIs. Key actions:

| Module | Actions |
|:-------|:--------|
| `server/records.ts` | `createRecord`, `updateRecord`, `deleteRecord`, `syncRecords`, `batchImportRecords` |
| `server/domains.ts` | `getDomains`, `getDomainWithRecords`, `syncDomains` |
| `server/providers.ts` | `createProvider`, `updateProvider`, `deleteProvider`, `testProvider` |
| `server/monitoring.ts` | `createMonitorTask`, `updateMonitorTask`, `deleteMonitorTask`, `checkNow` |
| `server/alerts.ts` | `createAlertRule`, `updateAlertRule`, `deleteAlertRule`, `addNotificationChannel` |

### Auth Routes

| Route | Method | Description |
|:------|:------:|:------------|
| `/api/auth/signin` | POST | Sign in |
| `/api/auth/signout` | POST | Sign out |
| `/api/auth/callback/github` | GET/POST | GitHub OAuth callback |
| `/api/auth/callback/google` | GET/POST | Google OAuth callback |
| `/api/auth/callback/discord` | GET/POST | Discord OAuth callback |
| `/api/auth/callback/gitee` | GET/POST | Gitee OAuth callback |

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|:---------|:--------:|:-------:|:------------|
| `AUTH_SECRET` | ✅ | — | NextAuth.js secret key |
| `DATABASE_TYPE` | ❌ | `sqlite` | `sqlite`, `postgres`, `mysql`, `turso` |
| `DATABASE_URL` | ❌ | `./data/sqlite.db` | Database connection string |
| `TURSO_DATABASE_URL` | ❌ | — | Turso database URL |
| `TURSO_AUTH_TOKEN` | ❌ | — | Turso auth token |

### Admin Panel Configuration

Additional settings can be configured via **Admin Panel → System Settings**:

- OAuth Provider Credentials (GitHub, Google, Discord, Gitee)
- SMTP Email Configuration
- Credentials Encryption Key
- Rate Limiting Settings

---

## 🚢 Deployment

### Vercel (Recommended)

1. Fork this repository
2. Import to Vercel
3. Set environment variables:
   - `AUTH_SECRET`
   - `DATABASE_TYPE=turso`
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
4. Deploy

### Self-Hosted (VPS)

```bash
# Clone and setup
git clone https://github.com/Alice-easy/DNS-New.git
cd DNS-New
cp .env.example .env
# Edit .env with your settings

# Install and build
npm install
npm run db:push
npm run build

# Run with PM2
npm install -g pm2
pm2 start npm --name "dns-manager" -- start
pm2 save
```

### Docker (Coming Soon)

Docker support is planned for a future release.

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new DNS provider support
fix: resolve record sync issue
docs: update API documentation
style: format code with prettier
refactor: reorganize provider adapters
test: add unit tests for crypto module
chore: update dependencies
```

### Pull Request Process

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run linting: `npm run lint`
5. Commit your changes: `git commit -m 'feat: add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use meaningful variable names
- Add JSDoc comments for public APIs

---

## 🗺️ Roadmap

- [ ] Docker container support
- [ ] More DNS providers (Azure DNS, DigitalOcean, Vultr)
- [ ] DNSSEC management
- [ ] DNS template/preset system
- [ ] API key authentication for external access
- [ ] Bulk domain import/export
- [ ] Advanced analytics dashboard

---

## ❓ FAQ

<details>
<summary><strong>Q: How do I reset my admin password?</strong></summary>

Use Drizzle Studio to directly modify the database:
```bash
npm run db:studio
```
Navigate to the `users` table and update the password hash.
</details>

<details>
<summary><strong>Q: Can I use multiple databases simultaneously?</strong></summary>

No, DNS Manager uses a single database at a time. However, you can migrate data between databases by exporting and importing.
</details>

<details>
<summary><strong>Q: How are API credentials stored?</strong></summary>

All provider credentials are encrypted using AES-256-GCM before storing in the database. The encryption key is derived from `CREDENTIALS_ENCRYPTION_KEY` environment variable.
</details>

<details>
<summary><strong>Q: Is there a rate limit for API calls?</strong></summary>

Yes, DNS Manager implements rate limiting to prevent abuse. Default limits can be configured in the Admin Panel.
</details>

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/) — The React Framework
- [shadcn/ui](https://ui.shadcn.com/) — Beautiful UI components
- [Drizzle ORM](https://orm.drizzle.team/) — TypeScript ORM
- [NextAuth.js](https://next-auth.js.org/) — Authentication for Next.js
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS

---

<div align="center">

**Built with ❤️ by the community**

<br />

[![Made by Alice](https://img.shields.io/badge/Made%20by-Alice--easy-blueviolet?logo=github)](https://github.com/Alice-easy)

<br />

⭐ Star this repo if you find it useful!

</div>

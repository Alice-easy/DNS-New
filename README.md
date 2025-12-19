# DNS Manager

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

A unified DNS management system that supports multiple DNS providers (Cloudflare, Aliyun DNS, DNSPod, etc.) with a modern web interface.

[English](#features) | [简体中文](#功能特点)

## Screenshots

> 📸 Screenshots coming soon

<!--
![Dashboard](./docs/screenshots/dashboard.png)
![Domains](./docs/screenshots/domains.png)
![Records](./docs/screenshots/records.png)
-->

## Features

- 🌐 **Multi-Provider Support**: Manage DNS records across multiple providers from a single dashboard
- 🔐 **Secure Authentication**: GitHub OAuth authentication with NextAuth.js
- 📊 **Unified Dashboard**: Overview of all providers, domains, and records
- ⚡ **Real-time Sync**: Sync domains and records from providers
- 🎨 **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- 📱 **Responsive**: Works on desktop and mobile devices

## 功能特点

- 🌐 **多服务商支持**：在单一仪表盘中管理多个 DNS 服务商的记录
- 🔐 **安全认证**：支持 GitHub OAuth 认证
- 📊 **统一仪表盘**：概览所有服务商、域名和记录
- ⚡ **实时同步**：从服务商同步域名和记录
- 🎨 **现代化 UI**：使用 shadcn/ui 组件和 Tailwind CSS 构建
- 📱 **响应式设计**：支持桌面和移动设备

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | SQLite with Drizzle ORM |
| Authentication | NextAuth.js v5 |

## Supported DNS Providers

| Provider | Status | Notes |
|----------|--------|-------|
| Cloudflare | ✅ Supported | Full API support |
| Aliyun DNS (阿里云解析) | ✅ Supported | Full API support |
| Tencent DNSPod (腾讯云 DNSPod) | ✅ Supported | Full API support |
| AWS Route53 | 🔜 Coming Soon | Planned |
| GoDaddy | 🔜 Coming Soon | Planned |

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm
- GitHub OAuth App (for authentication)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/dns-manager.git
cd dns-manager
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# NextAuth
AUTH_SECRET="your-secret-key-here"
AUTH_URL="http://localhost:3000"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

4. Initialize the database:

```bash
mkdir -p data
npm run db:push
```

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Creating GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - Application name: `DNS Manager`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy the Client ID and Client Secret to your `.env.local`

## Project Structure

```
dns-manager/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # Dashboard pages
│   │   ├── api/auth/           # NextAuth API routes
│   │   └── login/              # Login page
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   └── layout/             # Layout components
│   ├── lib/
│   │   ├── db/                 # Database (Drizzle)
│   │   ├── providers/          # DNS provider adapters
│   │   └── auth.ts             # NextAuth config
│   └── server/                 # Server actions
├── data/                       # SQLite database
└── drizzle.config.ts           # Drizzle config
```

## DNS Provider Architecture

The system uses an adapter pattern to support multiple DNS providers:

```typescript
interface IDNSProvider {
  validateCredentials(): Promise<boolean>;
  listDomains(): Promise<ProviderDomain[]>;
  listRecords(domainId: string): Promise<ProviderRecord[]>;
  createRecord(domainId: string, record: CreateRecordInput): Promise<ProviderRecord>;
  updateRecord(domainId: string, recordId: string, record: UpdateRecordInput): Promise<ProviderRecord>;
  deleteRecord(domainId: string, recordId: string): Promise<void>;
}
```

### Adding a New Provider

1. Create a new adapter file in `src/lib/providers/`
2. Implement the `IDNSProvider` interface
3. Register the provider in `src/lib/providers/index.ts`

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
npm run db:generate  # Generate migrations
```

## Roadmap

### Phase 1 (MVP) ✅
- [x] Project setup (Next.js, shadcn/ui, Drizzle)
- [x] Authentication (NextAuth.js + GitHub)
- [x] Dashboard layout
- [x] Cloudflare provider adapter
- [x] Domain and record management UI

### Phase 2 ✅
- [x] Aliyun DNS adapter
- [x] DNSPod adapter
- [ ] Batch operations (import/export)
- [ ] Operation logs

### Phase 3
- [ ] DNS monitoring
- [ ] Change detection
- [ ] Alert notifications
- [ ] Smart DNS (geo-routing)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [NextAuth.js](https://authjs.dev/) - Authentication for Next.js

# DNS Manager

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

A unified DNS management system that supports multiple DNS providers (Cloudflare, Aliyun DNS, DNSPod, etc.) with a modern web interface.

**Language / 语言 / 言語**: English | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md)

## Screenshots

> Screenshots coming soon

<!--
![Dashboard](./docs/screenshots/dashboard.png)
![Domains](./docs/screenshots/domains.png)
![Records](./docs/screenshots/records.png)
-->

## Features

- **Multi-Provider Support**: Manage DNS records across multiple providers from a single dashboard
- **Secure Authentication**: GitHub OAuth + Credentials authentication with NextAuth.js
- **Unified Dashboard**: Overview of all providers, domains, and records
- **Real-time Sync**: Sync domains and records from providers
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Responsive Design**: Works on desktop and mobile devices
- **Internationalization**: Full support for English, Chinese, and Japanese

### Security Features

- **AES-256-GCM Encryption**: Provider credentials are encrypted at rest
- **Smart Key Fallback**: Uses AUTH_SECRET for encryption if dedicated key is not set
- **Rate Limiting**: Protection against brute-force attacks on login/registration
- **Input Validation**: DNS record validation before sending to providers
- **Strong Password Policy**: Requires 8+ characters with uppercase, lowercase, and numbers
- **Secure Logging**: Error details hidden in production logs

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router + Turbopack) |
| Language | TypeScript 5.0 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | SQLite with Drizzle ORM |
| Authentication | NextAuth.js v5 |
| i18n | next-intl |
| Form Handling | react-hook-form |

## Supported DNS Providers

| Provider | Status | Notes |
|----------|--------|-------|
| Cloudflare | ✅ Supported | Full API support with proxy status |
| Aliyun DNS | ✅ Supported | Full API support |
| Tencent DNSPod | ✅ Supported | Full API support |
| AWS Route53 | 🔜 Coming Soon | Planned |
| GoDaddy | 🔜 Coming Soon | Planned |

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Alice-easy/DNS-New.git
cd DNS-New
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your secret key:

```env
# Required - Generate with: openssl rand -base64 32
AUTH_SECRET="your-secret-key-here"

# Optional - All other settings have defaults or can be skipped
# DATABASE_URL="./data/sqlite.db"
# GITHUB_CLIENT_ID=""
# GITHUB_CLIENT_SECRET=""
```

> **Note**: Only `AUTH_SECRET` is required! The encryption key defaults to using AUTH_SECRET, and GitHub OAuth is optional.

4. Initialize the database:

```bash
npm run db:push
```

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Quick Deploy

```bash
# One-liner setup (Linux/macOS)
cp .env.example .env && \
  sed -i "s/your-secret-key-here/$(openssl rand -base64 32)/" .env && \
  npm install && npm run db:push && npm run build && npm start
```

### Updating the Project

When a new version is released, follow these steps to update:

```bash
# Pull the latest code
git pull

# Update dependencies
npm install

# If there are database schema changes, run migration
npm run db:push
```

> **Note**: Before updating, it's recommended to backup your `data/` directory which contains the SQLite database.

### Creating GitHub OAuth App (Optional)

GitHub OAuth is optional. You can use email/password login without it.

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - Application name: `DNS Manager`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy the Client ID and Client Secret to your `.env`

## Project Structure

```
dns-manager/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [locale]/           # Locale-based routing
│   │   │   ├── (dashboard)/    # Dashboard pages
│   │   │   ├── login/          # Login page
│   │   │   └── register/       # Registration page
│   │   └── api/auth/           # NextAuth API routes
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── layout/             # Layout components
│   │   └── language-switcher/  # Language switcher
│   ├── i18n/                   # Internationalization
│   │   ├── routing.ts          # Locale routing config
│   │   ├── request.ts          # Request config
│   │   └── navigation.ts       # Typed navigation helpers
│   ├── lib/
│   │   ├── db/                 # Database (Drizzle)
│   │   ├── providers/          # DNS provider adapters
│   │   ├── auth.ts             # NextAuth config
│   │   ├── crypto.ts           # AES-256-GCM encryption
│   │   ├── rate-limit.ts       # Rate limiting
│   │   ├── dns-validation.ts   # DNS record validation
│   │   └── env.ts              # Environment validation
│   └── server/                 # Server actions
├── messages/                   # Translation files
│   ├── en.json                 # English
│   ├── zh-CN.json              # Simplified Chinese
│   └── ja.json                 # Japanese
├── data/                       # SQLite database
└── drizzle.config.ts           # Drizzle config
```

## DNS Provider Architecture

The system uses an adapter pattern to support multiple DNS providers:

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
- [x] Internationalization (EN/ZH/JA)
- [x] Batch operations (import/export)
- [x] Operation logs UI
- [x] Multi-user management with permissions

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
- [next-intl](https://next-intl-docs.vercel.app/) - Internationalization for Next.js

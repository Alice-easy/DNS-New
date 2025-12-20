# DNS Manager

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

複数の DNS プロバイダー（Cloudflare、Aliyun DNS、DNSPod など）を統一的に管理できる、モダンな Web インターフェースを備えた DNS 管理システムです。

**Language / 语言 / 言語**: [English](./README.md) | [简体中文](./README.zh-CN.md) | 日本語

## スクリーンショット

> スクリーンショットは近日公開予定

<!--
![ダッシュボード](./docs/screenshots/dashboard.png)
![ドメイン管理](./docs/screenshots/domains.png)
![レコード管理](./docs/screenshots/records.png)
-->

## 機能

- **マルチプロバイダー対応**：単一のダッシュボードで複数の DNS プロバイダーのレコードを管理
- **安全な認証**：NextAuth.js による GitHub OAuth + 資格情報認証
- **統合ダッシュボード**：全プロバイダー、ドメイン、レコードの一覧表示
- **リアルタイム同期**：プロバイダーからドメインとレコードを同期
- **モダン UI**：shadcn/ui コンポーネントと Tailwind CSS で構築
- **レスポンシブデザイン**：デスクトップとモバイルデバイスに対応

### セキュリティ機能

- **AES-256-GCM 暗号化**：プロバイダー資格情報をデータベースで暗号化保存
- **レート制限**：ログイン/登録へのブルートフォース攻撃を防止
- **入力検証**：DNS レコードをプロバイダーに送信前に検証
- **強力なパスワードポリシー**：8文字以上、大文字・小文字・数字を含む
- **セキュアログ**：本番環境ではエラー詳細を隠蔽

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript 5.0 |
| スタイリング | Tailwind CSS 4 + shadcn/ui |
| データベース | SQLite + Drizzle ORM |
| 認証 | NextAuth.js v5 |
| フォーム処理 | react-hook-form |

## 対応 DNS プロバイダー

| プロバイダー | ステータス | 備考 |
|--------------|------------|------|
| Cloudflare | 対応済み | フル API 対応、プロキシステータス含む |
| Aliyun DNS | 対応済み | フル API 対応 |
| Tencent DNSPod | 対応済み | フル API 対応 |
| AWS Route53 | 近日対応 | 計画中 |
| GoDaddy | 近日対応 | 計画中 |

## はじめに

### 前提条件

- Node.js 20+
- npm または pnpm
- GitHub OAuth アプリ（認証用）

### インストール

1. リポジトリをクローン：

```bash
git clone https://github.com/Alice-easy/DNS-New.git
cd DNS-New
```

2. 依存関係をインストール：

```bash
npm install
```

3. 環境変数を設定：

```bash
cp .env.example .env.local
```

`.env.local` ファイルを編集して認証情報を設定：

```env
# NextAuth
AUTH_SECRET="あなたのシークレットキー"
AUTH_URL="http://localhost:3000"

# 資格情報暗号化キー (AES-256-GCM)
# 以下のコマンドで生成: openssl rand -base64 32
CREDENTIALS_ENCRYPTION_KEY="あなたの暗号化キー"

# GitHub OAuth（オプション - OAuth ログイン用）
GITHUB_CLIENT_ID="あなたの GitHub Client ID"
GITHUB_CLIENT_SECRET="あなたの GitHub Client Secret"
```

> **重要**：`openssl rand -base64 32` を使用して安全な暗号化キーを生成してください。このキーはデータベース内の DNS プロバイダー資格情報を暗号化するために使用されます。

4. データベースを初期化：

```bash
mkdir -p data
npm run db:push
```

5. 開発サーバーを起動：

```bash
npm run dev
```

6. ブラウザで [http://localhost:3000](http://localhost:3000) を開く

### プロジェクトの更新

新しいバージョンがリリースされた場合、以下の手順で更新してください：

```bash
# 最新のコードをプル
git pull

# 依存関係を更新
npm install

# データベーススキーマに変更がある場合、マイグレーションを実行
npm run db:push
```

> **注意**：更新前に、SQLite データベースを含む `data/` ディレクトリのバックアップを推奨します。

### GitHub OAuth アプリの作成

1. [GitHub 開発者設定](https://github.com/settings/developers) にアクセス
2. 「New OAuth App」をクリック
3. 以下を入力：
   - Application name: `DNS Manager`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Client ID と Client Secret を `.env.local` ファイルにコピー

## プロジェクト構成

```
dns-manager/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # ダッシュボードページ
│   │   ├── api/auth/           # NextAuth API ルート
│   │   ├── login/              # ログインページ
│   │   └── register/           # 登録ページ
│   ├── components/
│   │   ├── ui/                 # shadcn/ui コンポーネント
│   │   └── layout/             # レイアウトコンポーネント
│   ├── lib/
│   │   ├── db/                 # データベース（Drizzle）
│   │   ├── providers/          # DNS プロバイダーアダプター
│   │   ├── auth.ts             # NextAuth 設定
│   │   ├── crypto.ts           # AES-256-GCM 暗号化
│   │   ├── rate-limit.ts       # レート制限
│   │   ├── dns-validation.ts   # DNS レコード検証
│   │   └── env.ts              # 環境変数検証
│   └── server/                 # Server Actions
├── data/                       # SQLite データベース
└── drizzle.config.ts           # Drizzle 設定
```

## DNS プロバイダーアーキテクチャ

システムはアダプターパターンを使用して複数の DNS プロバイダーをサポート：

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

### 新しいプロバイダーの追加

1. `src/lib/providers/` ディレクトリに新しいアダプターファイルを作成
2. `IDNSProvider` インターフェースを実装
3. `src/lib/providers/index.ts` でプロバイダーを登録

## スクリプト

```bash
npm run dev          # 開発サーバーを起動
npm run build        # 本番用にビルド
npm run start        # 本番サーバーを起動
npm run lint         # ESLint を実行
npm run db:push      # スキーマをデータベースにプッシュ
npm run db:studio    # Drizzle Studio を開く
npm run db:generate  # マイグレーションを生成
```

## ロードマップ

### フェーズ 1（MVP）

- [x] プロジェクトセットアップ（Next.js、shadcn/ui、Drizzle）
- [x] 認証システム（NextAuth.js + GitHub）
- [x] ダッシュボードレイアウト
- [x] Cloudflare プロバイダーアダプター
- [x] ドメインとレコード管理 UI

### フェーズ 2

- [x] Aliyun DNS アダプター
- [x] DNSPod アダプター
- [ ] バッチ操作（インポート/エクスポート）
- [ ] 操作ログ UI

### フェーズ 3

- [ ] DNS モニタリング
- [ ] 変更検出
- [ ] アラート通知
- [ ] スマート DNS（ジオルーティング）

## コントリビューション

コントリビューションは大歓迎です！お気軽に Pull Request を送ってください。

1. リポジトリをフォーク
2. フィーチャーブランチを作成（`git checkout -b feature/amazing-feature`）
3. 変更をコミット（`git commit -m 'Add some amazing feature'`）
4. ブランチにプッシュ（`git push origin feature/amazing-feature`）
5. Pull Request を作成

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています - 詳細は [LICENSE](LICENSE) ファイルをご覧ください。

## 謝辞

- [Next.js](https://nextjs.org/) - React フレームワーク
- [shadcn/ui](https://ui.shadcn.com/) - 美しい UI コンポーネント
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [NextAuth.js](https://authjs.dev/) - Next.js 認証ソリューション

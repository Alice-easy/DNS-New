<div align="center">

# 🌐 DNS Manager

**統合マルチプラットフォーム DNS 管理システム**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

[English](./README.md) | [简体中文](./README.zh-CN.md) | 日本語

</div>

---

## ✨ 機能

複数の DNS プロバイダーを一つの直感的なダッシュボードに統合する、モダンな統合 DNS 管理プラットフォーム。

### 🔌 マルチプロバイダー対応

| プロバイダー | 状態 | スマートライン |
|:------------:|:----:|:--------------:|
| Cloudflare | ✅ | - |
| Aliyun DNS | ✅ | ✅ 電信/聯通/移動/教育網 |
| Tencent DNSPod | ✅ | ✅ 電信/聯通/移動/海外 |
| AWS Route53 | ✅ | ✅ ジオルーティング |
| Huawei Cloud | ✅ | ✅ 電信/聯通/移動 |
| GoDaddy | ✅ | - |
| Namecheap | ✅ | - |

### 🗄️ マルチデータベース対応

| データベース | タイプ | エッジ対応 | 推奨用途 |
|:------------:|:------:|:----------:|:--------:|
| SQLite | ファイル | ❌ | ローカル / VPS |
| PostgreSQL | サーバー | ✅ | 本番環境 |
| MySQL | サーバー | ❌ | 本番環境 |
| Turso (libSQL) | エッジ | ✅ | Vercel / Cloudflare |

### 🛡️ コア機能

- **📊 統合ダッシュボード** — すべてのプロバイダー、ドメイン、レコードを一元管理
- **🔐 セキュア認証** — GitHub OAuth + メール/パスワード（NextAuth.js v5）
- **🌍 国際化** — English、简体中文、日本語
- **📱 レスポンシブデザイン** — デスクトップ、タブレット、モバイル対応
- **🔄 リアルタイム同期** — プロバイダーからドメインとレコードを同期
- **📝 監査ログ** — 完全な操作履歴追跡

### 📋 DNS 管理

- **フル CRUD** — A、AAAA、CNAME、MX、TXT、NS、CAA、SRV レコード
- **スマートライン** — 中国キャリア向け ISP ベースルーティング（電信/聯通/移動）
- **一括インポート/エクスポート** — JSON、CSV 形式対応
- **変更検出** — 同期時の変更を追跡

### 👥 マルチユーザー & 権限

- **ロール管理** — 管理者とユーザーロール
- **ドメイン共有** — 詳細な権限設定で共有
- **アクセスレベル** — オーナー / フルコントロール / 編集 / 読み取り専用

### 📡 監視 & アラート

- **DNS 監視** — 可用性、レイテンシ、正確性チェック
- **アラートルール** — 設定可能なしきい値とトリガー
- **通知チャンネル** — Webhook、Discord、Telegram

### 🔒 セキュリティ

- **AES-256-GCM** — 認証情報の暗号化保存
- **レート制限** — ブルートフォース攻撃対策
- **入力検証** — API 呼び出し前の DNS レコード検証
- **強力なパスワードポリシー** — 8文字以上、大文字小文字と数字を含む

---

## 🚀 クイックスタート

### 前提条件

- Node.js 20+
- npm または pnpm

### インストール

```bash
# クローン
git clone https://github.com/Alice-easy/DNS-New.git
cd DNS-New

# インストール
npm install

# 設定（AUTH_SECRET のみ必須！）
cp .env.example .env
# .env を編集: AUTH_SECRET="your-secret-key"

# データベース初期化
npm run db:push

# 起動
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開く 🎉

### ワンライナーデプロイ

```bash
cp .env.example .env && \
  sed -i "s/your-secret-key-here/$(openssl rand -base64 32)/" .env && \
  npm install && npm run db:push && npm run build && npm start
```

---

## ⚙️ 設定

### 最小構成

必要な環境変数は **1つ** だけ：

```env
AUTH_SECRET="your-secret-key-here"  # 生成: openssl rand -base64 32
```

### オプション：データベースタイプ

```env
DATABASE_TYPE="sqlite"  # sqlite（デフォルト）、postgres、mysql、turso
```

### その他の設定

**管理パネル → システム設定** で設定：
- GitHub OAuth 認証情報
- データベース接続文字列
- 暗号化キー
- その他...

---

## 🛠️ 技術スタック

| カテゴリ | 技術 |
|:---------|:-----|
| フレームワーク | Next.js 16 (App Router + Turbopack) |
| 言語 | TypeScript 5.0 |
| スタイリング | Tailwind CSS 4 + shadcn/ui |
| データベース | Drizzle ORM (SQLite/PostgreSQL/MySQL/Turso) |
| 認証 | NextAuth.js v5 |
| 国際化 | next-intl |

---

## 📜 スクリプト

```bash
npm run dev          # 開発サーバー
npm run build        # 本番ビルド
npm run start        # 本番サーバー
npm run db:push      # スキーマをデータベースにプッシュ
npm run db:studio    # Drizzle Studio を開く
```

---

## 🤝 コントリビュート

コントリビュート歓迎！お気軽に Pull Request を提出してください。

1. リポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing`)
5. Pull Request を作成

---

## 📄 ライセンス

MIT ライセンス - 詳細は [LICENSE](LICENSE) ファイルを参照。

---

<div align="center">

**Next.js、shadcn/ui、Drizzle ORM で ❤️ を込めて構築**

</div>

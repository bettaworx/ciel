# Ciel

Ciel は、モダンな技術スタックで構築されたミニマルSNS（ソーシャルネットワーキングサービス）アプリケーションです。

## 特徴

- **型安全性第一**: TypeScript と Go による完全な型安全性
- **リアルタイム対応**: WebSocket と Redis pub/sub によるリアルタイム機能
- **国際化対応**: 日本語と英語をサポート
- **レイヤードアーキテクチャ**: 関心の分離、依存性注入、テスタブルなコード
- **OpenAPI駆動**: API仕様を単一の真実の源として、型を自動生成

## 技術スタック

- **フロントエンド**: Next.js 15 (App Router) + TypeScript + React Query
- **バックエンド**: Go + Chi Router + SQLC
- **データベース**: PostgreSQL
- **キャッシュ/Pub-Sub**: Redis
- **API仕様**: OpenAPI 3.0
- **モノレポ管理**: pnpm workspaces

## プロジェクト構造

```
ciel/
├── apps/
│   ├── backend/          # Go API service (port 6137)
│   │   ├── internal/     # アプリケーションコード
│   │   ├── db/           # スキーマ、クエリ、マイグレーション
│   │   ├── tests/        # ユニット・統合テスト
│   │   └── AGENTS.md     # バックエンド固有のガイドライン
│   └── frontend/         # Next.js application (port 3000)
│       ├── app/          # App Router ページ
│       ├── components/   # React コンポーネント
│       ├── lib/          # API クライアント、フック、ユーティリティ
│       └── AGENTS.md     # フロントエンド固有のガイドライン
├── packages/
│   └── api/
│       └── openapi.yml   # OpenAPI 仕様 (真実の源)
├── docker/               # Docker設定ファイル
├── nginx/                # Nginx設定ファイル
└── AGENTS.md            # プロジェクト全体のガイドライン
```

## クイックスタート

### 前提条件

以下のツールが必要です:

- **Node.js**: 22.x 以降
- **pnpm**: 10.x 以降
- **Go**: 1.25.x 以降
- **sqlc**: 1.30.x 以降
- **Docker**: 最新版 (PostgreSQL と Redis 用)
- **ffmpeg**: 画像/動画処理用

### 開発環境のセットアップ

1. **リポジトリのクローン**

```bash
git clone https://github.com/XXXXXXXXX/ciel.git
cd ciel
```

2. **依存関係のインストール**

```bash
# フロントエンドの依存関係
pnpm install

# バックエンドの依存関係
cd apps/backend
go mod download
cd ../..
```

3. **環境変数の設定**

```bash
# ルートディレクトリの環境変数 (Docker用)
cp .env.example .env
# .env を編集して、PostgreSQL と Redis のパスワードを設定

# バックエンドの環境変数
cp apps/backend/.env.local.example apps/backend/.env.local
# .env.local を編集して、各種設定を行う
```

4. **コード生成**

```bash
# OpenAPI スキーマから型を生成
pnpm run gen:openapi        # Go 用
pnpm run gen:openapi:ts     # TypeScript 用

# SQLC コードを生成
pnpm run gen:sqlc
```

5. **データベースのセットアップ**

```bash
# PostgreSQL と Redis を起動
cp docker-compose.yml.example docker-compose.yml
docker compose up -d

# データベースマイグレーション (自動実行されます)
```

6. **開発サーバーの起動**

バックエンドとフロントエンドを別々のターミナルで起動します:

```bash
# ターミナル1: バックエンド
pnpm run run:backend
# => http://localhost:6137 で起動

# ターミナル2: フロントエンド
pnpm run dev:frontend
# => http://localhost:3000 で起動
```

## 本番環境へのデプロイ

### システム要件

- Debian 12 (Bookworm) または Ubuntu 22.04 LTS
- 2GB 以上の RAM
- 10GB 以上のディスクスペース

### 詳細なセットアップ手順

<details>
<summary>1. 必要なツールのインストール</summary>

#### Node.js (nvm 経由)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.6/install.sh | bash
source ~/.bashrc
nvm install 22.22.0
nvm use 22.22.0
nvm alias default 22.22.0
node -v  # => v22.22.0
```

#### pnpm

```bash
npm install -g pnpm
pnpm -v  # => 10.28.x
```

#### Go

```bash
wget https://go.dev/dl/go1.25.5.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.25.5.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc
go version  # => go version go1.25.5 linux/amd64
```

#### sqlc

```bash
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
echo 'export PATH=$PATH:$HOME/go/bin' >> ~/.bashrc
source ~/.bashrc
sqlc version  # => v1.30.0
```

#### ffmpeg (画像/動画処理用)

```bash
sudo apt-get update
sudo apt-get install ffmpeg
ffmpeg -version
```

#### Docker

[Docker公式インストールガイド](https://docs.docker.com/engine/install/)を参照してください。

#### Nginx と Let's Encrypt (任意、本番環境推奨)

```bash
sudo apt-get install nginx certbot python3-certbot-nginx
```

</details>

### 本番環境での起動

```bash
# 全てのセットアップ完了後
./run.sh
```

`run.sh` スクリプトは以下を実行します:
- バックエンドをバックグラウンドで起動
- フロントエンドをバックグラウンドで起動
- SSH切断後も継続実行

停止する場合:
```bash
./run.sh stop
```

## よく使うコマンド

### ワークスペース管理
```bash
pnpm install              # 全ての依存関係をインストール
```

### フロントエンド
```bash
pnpm -C apps/frontend dev           # 開発サーバー起動 (port 3000)
pnpm -C apps/frontend build         # プロダクションビルド
pnpm -C apps/frontend lint          # ESLint 実行
pnpm -C apps/frontend gen:openapi   # API 型を生成
```

### バックエンド
```bash
cd apps/backend
go run main.go                      # API サーバー起動 (port 6137)
go test ./tests/unit/...            # ユニットテスト実行
go test ./...                       # 全テスト実行 (高速)
```

### コード生成
```bash
pnpm run gen:openapi                # バックエンド OpenAPI 型を生成
pnpm run gen:openapi:ts             # フロントエンド API 型を生成
pnpm run gen:sqlc                   # SQLC コードを生成
```

## テスト

### バックエンドテスト
```bash
# ユニットテスト (高速、外部依存なし)
cd apps/backend
go test ./tests/unit/...

# 統合テスト (Docker必須)
docker compose -f apps/backend/docker-compose.test.yml up --abort-on-container-exit

# 統合テスト (ローカルDB使用)
go test ./tests/... -count=1 -tags=integration
```

詳細は `apps/backend/TESTING.md` を参照してください。

## ドキュメント

- **プロジェクト全体**: [AGENTS.md](./AGENTS.md)
- **バックエンド**: [apps/backend/AGENTS.md](./apps/backend/AGENTS.md)
- **フロントエンド**: [apps/frontend/AGENTS.md](./apps/frontend/AGENTS.md)
- **テスト**: [apps/backend/TESTING.md](./apps/backend/TESTING.md)

## ライセンス

MIT

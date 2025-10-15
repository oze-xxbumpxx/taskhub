# TaskHub

個人用タスク管理アプリケーションのバックエンド API

## 技術スタック

- **言語**: TypeScript
- **ランタイム**: Node.js
- **フレームワーク**: Express.js
- **API**: GraphQL (Apollo Server)
- **ORM**: Sequelize
- **データベース**: PostgreSQL
- **認証**: JWT
- **コンテナ**: Docker

## 機能

### Phase 1 (MVP)

- ✅ ユーザー登録・ログイン (JWT 認証)
- ✅ タスクの CRUD 操作
- ✅ プロジェクトの CRUD 操作
- ✅ タスクのステータス管理 (TODO/IN_PROGRESS/DONE)
- ✅ タスクの優先度設定 (LOW/MEDIUM/HIGH)
- ✅ タスクの期限設定
- ✅ プロジェクトごとのタスク分類

### Phase 2 (予定)

- タスクの検索・フィルタリング
- ソート機能
- ページネーション

### Phase 3 (予定)

- タグ機能
- サブタスク
- 統計・レポート機能
- リアルタイム更新

## セットアップ

### 前提条件

- Node.js (v18 以上)
- Docker & Docker Compose
- Git

### インストール

1. 依存パッケージのインストール

```bash
cd backend
npm install
```

2. 環境変数の設定

```bash
cp backend/.env.example backend/.env
```

3. Docker コンテナの起動

```bash
docker-compose up -d
```

4. 開発サーバーの起動

```bash
cd backend
npm run dev
```

GraphQL Playground: http://localhost:4000/graphql

## プロジェクト構造

```
taskhub/
├── backend/
│   ├── src/
│   │   ├── config/          # 設定ファイル
│   │   ├── models/          # Sequelizeモデル
│   │   ├── graphql/         # GraphQLスキーマ・リゾルバ
│   │   │   ├── schema/      # スキーマ定義
│   │   │   └── resolvers/   # リゾルバ関数
│   │   ├── middleware/      # ミドルウェア
│   │   ├── utils/           # ユーティリティ関数
│   │   └── index.ts         # エントリーポイント
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml
└── README.md
```

## データモデル

### User

- id (UUID)
- email (String, Unique)
- password (String, Hashed)
- name (String)

### Project

- id (UUID)
- name (String)
- description (Text)
- color (String)
- userId (FK)

### Task

- id (UUID)
- title (String)
- description (Text)
- status (Enum: TODO/IN_PROGRESS/DONE)
- priority (Enum: LOW/MEDIUM/HIGH)
- dueDate (Date)
- completedAt (Timestamp)
- projectId (FK, Nullable)
- userId (FK)

## 開発

### コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start

# マイグレーション実行
npm run db:migrate

# マイグレーションの取り消し
npm run db:migrate:undo
```

## ライセンス

MIT

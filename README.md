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
  **対象**: `src/` 配下のユーティリティ、サービス、GraphQL リゾルバなどロジック単位を基本とする単体試験を作成する
- **フレームワーク**: Vitest
- **配置**:
  - `src/**/__tests__/*.test.ts` または `src/**/*.test.ts`
- **命名**: `<対象ファイル名>.test.ts`
- **モック**:
  - 外部依存はモック化（例: `bcrypt`, `jsonwebtoken`, 外部 API）
  - GraphQL リゾルバ/サービスはデータ層（ORM 呼び出し）をモックし、認可/バリデーション/分岐を確認する
- **DB/ORM の扱い（擬似カラム方針）**:
  - 単体試験では実 DB（PostgreSQL）には接続しない
  - Sequelize のメモリ DB（sqlite `:memory:`）を使い、テスト内で必要最小限の「擬似カラム」を持つモデルをその場で `Model.init` で定義して振る舞いを検証する
  - マイグレーションは使わない。各テストで `sequelize.sync({ force: true })` を実行してクリーンな状態から検証する
  - 目的は「ビジネスロジック/バリデーションの成立」を確かめること。実スキーマ整合性は別レイヤ（統合/結合テスト）で担保する
- **カバレッジ**: 目標は 行 80% / 関数 80% / 分岐 70%（型定義/生成物は除外）
- **実行コマンド**:
  - `npm run test`（単発）
  - `npm run test:watch`（監視）
  - `npm run coverage`（カバレッジ）

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

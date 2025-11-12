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

## 型安全ガイドライン（実装方針）

- 目的: 「as any」を禁止し、型を最大限明確化して安全性・保守性を高める
- 対象: `src/` 配下のアプリ本体・テストコードの両方

### TypeScript 設定（tsconfig）

- strict 有効化と関連フラグの有効化推奨
  - "strict": true
  - "noImplicitAny": true
  - "strictNullChecks": true
  - "exactOptionalPropertyTypes": true
  - "noUncheckedIndexedAccess": true
  - "noFallthroughCasesInSwitch": true
  - "useUnknownInCatchVariables": true

### コーディング方針

- 「as any」は禁止。どうしても必要な場合は
  - 代替: "unknown" + 型ガード or スキーマバリデーション（例: Zod）
  - フェイルファストでエラーハンドリングを行う
- 関数の公開 API（export）には必ず戻り値型を明示
  - 例: リゾルバ関数は `Promise<UserResponse>` のように明示
- ドメイン型を活用して意味を明確化
  - 入出力 DTO 型（例: `CreateUserInput`, `LoginInput`）
  - レスポンスは判別可能共用体（discriminated union）で安全に
    - 例: `UserResponse = { success: true; user: User } | { success: false; errors: UserError[] }`
- ORM（Sequelize）は Model/Attributes/CreationAttributes を明確化
  - `class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes { ... }`
  - リゾルバでは返却型を `User`（ドメイン）に合わせて整形（不要な password を除外）
- Logger の構造化ログはキー名を統一（例: userId, taskId, projectId）
- ユーティリティ関数も入出力を明示（例: `hashPassword(password: string): Promise<string>`）

### テスト方針（Vitest）

- `vi.mocked(...)` を徹底し、モック/戻り値を型安全に
- 例外系は `unknown` を受け取り型絞り込みで検証
- 期待値は具体化（`toBeDefined` より、フィールド比較を優先）
- 外部依存はすべてモック。戻り値の型を固定する（成功/失敗両系統）

### 例: UserResponse の型安全化（判別共用体）

```typescript
type UserSuccess = { success: true; user: User; errors?: never };
type UserFailure = { success: false; user?: never; errors: UserError[] };
export type UserResponse = UserSuccess | UserFailure;
```

この方針に沿って「型を明確に書く」実装・レビューを継続します。

## 避けるべき実装パターン

以下の実装パターンは**避けるべき**です。コードレビュー時にも重点的にチェックします。

### ❌ 1. 無闇に`as`を連発する

**問題点**: 型アサーション（`as`）を多用すると、型安全性が失われ、実行時エラーの原因になります。

**悪い例**:

```typescript
// ❌ 悪い例
const userId = (authResult as any).userId;
const user = result as User;
const data = response.data as MyType;
```

**良い例**:

```typescript
// ✅ 良い例: 型ガードを使用
function isAuthResult(value: unknown): value is { userId: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "userId" in value &&
    typeof (value as { userId: unknown }).userId === "string"
  );
}

if (isAuthResult(authResult)) {
  const userId = authResult.userId; // 型安全
}

// ✅ 良い例: Zodなどのバリデーションライブラリを使用
const AuthResultSchema = z.object({
  userId: z.string(),
});
const validated = AuthResultSchema.parse(authResult);
const userId = validated.userId; // 型安全
```

### ❌ 2. `any`の拡散

**問題点**: `any`を使用すると、TypeScript の型チェックの恩恵を受けられません。

**悪い例**:

```typescript
// ❌ 悪い例
function getUser(parent: any, args: any, context: any): Promise<any> {
  const userId = (context as any).userId;
  return User.findByPk(userId);
}
```

**良い例**:

```typescript
// ✅ 良い例: 適切な型を定義
import { GraphQLResolvers } from "@apollo/server";

interface GetUserArgs {
  id: string;
}

interface GetUserContext {
  userId: string;
  isAuthenticated: boolean;
}

async function getUser(
  parent: unknown,
  args: GetUserArgs,
  context: GetUserContext
): Promise<User | null> {
  const userId = context.userId; // 型安全
  return User.findByPk(userId);
}
```

### ❌ 3. Non-null assertion (`!`)の乱用

**問題点**: `!`演算子は「この値は null/undefined ではない」と TypeScript に伝えますが、実行時には保証されません。

**悪い例**:

```typescript
// ❌ 悪い例
const secret = config.jwt.secret!; // もしsecretがundefinedなら実行時エラー
const user = await User.findByPk(id)!; // もしuserがnullなら実行時エラー
user!.email; // もしuserがnullなら実行時エラー
```

**良い例**:

```typescript
// ✅ 良い例: 明示的なチェック
const secret = config.jwt.secret;
if (!secret || typeof secret !== "string") {
  throw new Error("JWT secret is not configured");
}
// ここではsecretはstring型として扱える

const user = await User.findByPk(id);
if (!user) {
  throw new Error("User not found");
}
// ここではuserはUser型として扱える
const email = user.email; // 型安全
```

### ❌ 4. 複雑な型のコピペ

**問題点**: 型定義をコピペすると、型の整合性が保たれず、変更時に不整合が発生します。

**悪い例**:

```typescript
// ❌ 悪い例: 型定義をコピペ
type CreateTaskInput = {
  title: string;
  description?: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  // ... 他のフィールド
};

// 別の場所で同じ型をコピペ
type UpdateTaskInput = {
  title: string; // コピペミスで必須のまま
  description?: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  // ... 変更時に不整合が発生
};
```

**良い例**:

```typescript
// ✅ 良い例: 型の再利用と継承
type TaskBase = {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
};

type CreateTaskInput = TaskBase & {
  projectId?: string;
};

type UpdateTaskInput = Partial<TaskBase> & {
  projectId?: string;
};

// ✅ または、Zodスキーマから型を生成
const TaskBaseSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
});

type TaskBase = z.infer<typeof TaskBaseSchema>;
```

### ❌ 5. `as const`の誤用

**問題点**: `as const`はリテラル型を固定するためのものですが、誤用すると型の柔軟性を失います。

**悪い例**:

```typescript
// ❌ 悪い例: 不要なas const
const config = {
  port: 4000,
  env: "development",
} as const; // これにより、portは4000型、envは"development"型になる

// 後で変更できなくなる
config.port = 5000; // エラー: 4000型に5000を代入できない

// ❌ 悪い例: 配列のas constの誤用
const statuses = ["TODO", "IN_PROGRESS", "DONE"] as const;
// これにより、statusesはreadonlyタプル型になる
```

**良い例**:

```typescript
// ✅ 良い例: 適切な使用
// 1. リテラル型のユニオン型を定義したい場合
const TaskStatus = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
} as const;

type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];
// → "TODO" | "IN_PROGRESS" | "DONE"

// 2. 設定値が変更されないことを保証したい場合
const API_ENDPOINTS = {
  USERS: "/api/users",
  TASKS: "/api/tasks",
} as const;

// 3. 配列からユニオン型を生成したい場合
const STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const;
type Status = (typeof STATUSES)[number]; // "TODO" | "IN_PROGRESS" | "DONE"
```

### ❌ 6. ライブラリ型の過信

**問題点**: ライブラリの型定義をそのまま使うと、実際のデータ構造と不一致が発生する可能性があります。

**悪い例**:

```typescript
// ❌ 悪い例: Sequelizeの型をそのまま使用
import User from "./models/User";

async function getUser(id: string): Promise<User> {
  const user = await User.findByPk(id);
  return user; // userはUser | nullの可能性がある
}

// ❌ 悪い例: GraphQLの型をそのまま使用
import { User } from "./generated/graphql";

function transformUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    // passwordフィールドも含まれてしまう可能性
  };
}
```

**良い例**:

```typescript
// ✅ 良い例: ドメイン型を定義して使用
// 1. ドメイン型を定義
export interface UserDomain {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// 2. ORMモデルからドメイン型に変換
function toUserDomain(user: User): UserDomain {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    // passwordは意図的に除外
  };
}

// 3. リゾルバで使用
async function getUser(id: string): Promise<UserDomain | null> {
  const user = await User.findByPk(id);
  if (!user) {
    return null;
  }
  return toUserDomain(user);
}

// ✅ 良い例: GraphQL型とドメイン型を分離
// GraphQLスキーマから生成された型は、APIの入出力にのみ使用
// ビジネスロジックではドメイン型を使用
```

### ❌ 7. 二重アサーション禁止

**問題点**: 二重アサーション（`as unknown as T`など）は型安全性を完全に無視する危険なパターンです。

**悪い例**:

```typescript
// ❌ 悪い例: 二重アサーションの使用
const user = someValue as unknown as User;
const data = response as unknown as MyType;
const result = value as any as TargetType;
```

**良い例**:

```typescript
// ✅ 良い例: 型ガードを使用
function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "email" in value &&
    typeof (value as { id: unknown }).id === "string" &&
    typeof (value as { email: unknown }).email === "string"
  );
}

if (isUser(someValue)) {
  const user = someValue; // 型安全
}

// ✅ 良い例: Zodなどのバリデーションライブラリを使用
const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
});

const validated = UserSchema.parse(someValue);
const user = validated; // 型安全

// ✅ 良い例: 適切な型変換関数を作成
function toUser(value: unknown): User {
  if (!isUser(value)) {
    throw new Error("Invalid user data");
  }
  return value;
}

const user = toUser(someValue); // 型安全
```

### ❌ 8. マジックナンバー/マジックストリングの使用

**問題点**: 数値や文字列を直接コードに書くと、意味が不明確になり、保守性が低下します。

**悪い例**:

```typescript
// ❌ 悪い例: マジックナンバー/マジックストリング
if (password.length < 8) {
  // 8という数値の意味が不明確
}

if (status === "TODO") {
  // 文字列が直接書かれている
}
```

**良い例**:

```typescript
// ✅ 良い例: 定数として定義
const MIN_PASSWORD_LENGTH = 8;
const TaskStatus = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
} as const;

if (password.length < MIN_PASSWORD_LENGTH) {
  // 意味が明確
}

if (status === TaskStatus.TODO) {
  // 型安全で意味が明確
}
```

### ❌ 9. 深いネスト（早期リターン推奨）

**問題点**: 深いネスト（3 階層以上）は可読性を低下させます。早期リターンやガード句を使用してください。

**悪い例**:

```typescript
// ❌ 悪い例: 深いネスト
async function createTask(input: CreateTaskInput): Promise<TaskResponse> {
  if (input.title) {
    if (input.title.length > 0) {
      if (input.title.length <= 100) {
        // 実際の処理（3階層以上のネスト）
      }
    }
  }
}
```

**良い例**:

```typescript
// ✅ 良い例: 早期リターン（ガード句）を使用
async function createTask(input: CreateTaskInput): Promise<TaskResponse> {
  if (!input.title || input.title.trim().length === 0) {
    return {
      success: false,
      errors: [{ field: "title", message: "Title required" }],
    };
  }

  if (input.title.length > MAX_TITLE_LENGTH) {
    return {
      success: false,
      errors: [{ field: "title", message: "Title too long" }],
    };
  }

  // 実際の処理（ネストが浅い）
  const task = await Task.create(input);
  return { success: true, task };
}
```

### ❌ 10. 長すぎる関数（単一責任の原則違反）

**問題点**: 1 つの関数が 50 行を超えると、テストしにくく保守しにくくなります。複数の関数に分割してください。

**悪い例**:

```typescript
// ❌ 悪い例: 長すぎる関数（100行以上）
async function registerUser(input: CreateUserInput): Promise<UserResponse> {
  // バリデーション、パスワードチェック、重複チェック、作成、ログ...
  // すべてが1つの関数に詰め込まれている
}
```

**良い例**:

```typescript
// ✅ 良い例: 関数を分割（単一責任の原則）
function validateUserInput(input: CreateUserInput): UserError[] {
  // バリデーションロジック
}

async function registerUser(input: CreateUserInput): Promise<UserResponse> {
  const errors = validateUserInput(input);
  if (errors.length > 0) {
    return { success: false, errors };
  }
  // 各処理を関数に分割
}
```

### ❌ 11. ハードコードされた値

**問題点**: 設定値や環境依存の値を直接コードに書くと、環境ごとの変更が困難になります。

**悪い例**:

```typescript
// ❌ 悪い例: ハードコードされた値
const PORT = 4000;
const DB_HOST = "localhost";
const JWT_SECRET = "my-secret-key";
```

**良い例**:

```typescript
// ✅ 良い例: 環境変数や設定ファイルを使用
// src/config/env.ts
const envSchema = z.object({
  PORT: z.string().default("4000").transform(Number),
  DB_HOST: z.string().default("localhost"),
  JWT_SECRET: z.string().min(32),
});

export const config = envSchema.parse(process.env);
```

### ❌ 12. console.log の直接使用

**問題点**: `console.log`の直接使用は、本番環境でのログ管理が困難になります。プロジェクトのロガーを使用してください。

**悪い例**:

```typescript
// ❌ 悪い例: console.logの直接使用
console.log("User created:", user);
console.error("Error occurred:", error);
```

**良い例**:

```typescript
// ✅ 良い例: loggerを使用
import { logger } from "../utils/logger";

logger.info("User created", { userId: user.id, email: user.email });
logger.error("Error occurred", { error: error.message });
```

### ❌ 13. エラーハンドリングの不備

**問題点**: エラーを適切に処理せず、無視したり、型安全でない方法で処理すると、バグの原因になります。

**悪い例**:

```typescript
// ❌ 悪い例: エラーを無視
try {
  await someOperation();
} catch (error) {
  // エラーを無視
}

// ❌ 悪い例: any型でエラーを処理
catch (error: any) {
  console.log(error.message);
}
```

**良い例**:

```typescript
// ✅ 良い例: 適切なエラーハンドリング
try {
  await someOperation();
} catch (error) {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error("Operation failed", { error: err.message });
  throw new Error("Operation failed");
}
```

## 実装チェックリスト

コードレビュー時や実装時に、以下を確認してください：

- [ ] `as any`を使用していない
- [ ] `as`型アサーションは最小限で、型ガードやバリデーションで代替できないか検討した
- [ ] `any`型を使用していない（`unknown`を使用し、型ガードで絞り込んでいる）
- [ ] Non-null assertion (`!`)を使用していない（明示的な null チェックを行っている）
- [ ] 型定義をコピペせず、再利用可能な型を定義している
- [ ] `as const`は適切な場面でのみ使用している
- [ ] ライブラリの型をそのまま使わず、必要に応じてドメイン型に変換している
- [ ] 二重アサーション（`as unknown as T`など）を使用していない
- [ ] マジックナンバー/マジックストリングを使用せず、定数として定義している
- [ ] 深いネスト（3 階層以上）を避け、早期リターンを使用している
- [ ] 関数が 50 行を超えないように分割している（単一責任の原則）
- [ ] ハードコードされた値を避け、環境変数や設定ファイルを使用している
- [ ] `console.log`の直接使用を避け、`logger`を使用している
- [ ] エラーハンドリングで`unknown`型を使用し、型ガードで絞り込んでいる
- [ ] エラーを無視せず、適切に処理・ログ出力している
- [ ] 関数の引数と戻り値の型が明示されている

## ライセンス

MIT

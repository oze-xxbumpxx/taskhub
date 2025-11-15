import { User, Task } from "../../src/models";
import { AuthContext, JWTPayload } from "../../src/types/auth";

// Sequelize戻り値の型定義
export type FindOneReturn = Awaited<ReturnType<typeof User.findOne>>;
export type FindByPkReturn = Awaited<ReturnType<typeof User.findByPk>>;
export type CreateReturn = Awaited<ReturnType<typeof User.create>>;

// 型アダプタ（as unknown as をここ1カ所に隔離）
export const asFindOneReturn = (v: unknown): FindOneReturn =>
  v as FindOneReturn;

export const asFindByPkReturn = (v: unknown): FindByPkReturn =>
  v as FindByPkReturn;

export const asCreateReturn = (v: unknown): CreateReturn => v as CreateReturn;

// 最小プロトコル: テストで必要な最小限のUser形状
export interface MinimalUser {
  id: string;
  email: string;
  name: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 最小プロトコル: update可能なUser
export interface UpdatableUser extends MinimalUser {
  update: (u: { name?: string; email?: string }) => Promise<void>;
}

// 最小プロトコル: destroy可能なUser
export interface DestroyableUser extends MinimalUser {
  destroy: (options?: { transaction?: unknown }) => Promise<void>;
}

// ユーザーオブジェクトファクトリ（satisfiesで形状保証）
export function makeMinimalUser(
  init?: Partial<MinimalUser>
): MinimalUser {
  return {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    password: "hashed-password",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...init,
  } satisfies MinimalUser;
}

// 更新可能なユーザーオブジェクトファクトリ
export function makeUpdatableUser(
  init?: Partial<Omit<UpdatableUser, "update">>
): UpdatableUser {
  let state = makeMinimalUser(init);

  const updatable: UpdatableUser = {
    ...state,
    update: async (updates: { name?: string; email?: string }) => {
      state = { ...state, ...updates };
      updatable.name = state.name;
      updatable.email = state.email;
    },
  };

  return updatable;
}

// 削除可能なユーザーオブジェクトファクトリ
export function makeDestroyableUser(
  init?: Partial<Omit<DestroyableUser, "destroy">>,
  destroyFn?: (options?: { transaction?: unknown }) => Promise<void>
): DestroyableUser {
  const state = makeMinimalUser(init);

  return {
    ...state,
    destroy: destroyFn || (async () => {}),
  };
}

// 認証コンテキストヘルパー
export function makeAuthContext(token?: string): AuthContext {
  return {
    req: {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    },
  };
}

// JWTペイロードヘルパー
export function makeJWTPayload(userId: string): JWTPayload {
  return { userId };
}


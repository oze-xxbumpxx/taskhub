import { User, Task, Project } from "../../src/models";
import { AuthContext, JWTPayload } from "../../src/types/auth";

// Sequelize戻り値の型定義（User）
export type FindOneReturn = Awaited<ReturnType<typeof User.findOne>>;
export type FindByPkReturn = Awaited<ReturnType<typeof User.findByPk>>;
export type CreateReturn = Awaited<ReturnType<typeof User.create>>;

// Sequelize戻り値の型定義（Task）
export type TaskFindOneReturn = Awaited<ReturnType<typeof Task.findOne>>;
export type TaskFindByPkReturn = Awaited<ReturnType<typeof Task.findByPk>>;
export type TaskCreateReturn = Awaited<ReturnType<typeof Task.create>>;
export type TaskArrayReturn = Task[];

// Sequelize戻り値の型定義（Project）
export type ProjectFindOneReturn = Awaited<ReturnType<typeof Project.findOne>>;
export type ProjectFindByPkReturn = Awaited<
  ReturnType<typeof Project.findByPk>
>;
export type ProjectCreateReturn = Awaited<ReturnType<typeof Project.create>>;

// 型アダプタ（as unknown as をここ1カ所に隔離）
// User用
export const asFindOneReturn = (v: unknown): FindOneReturn =>
  v as FindOneReturn;

export const asFindByPkReturn = (v: unknown): FindByPkReturn =>
  v as FindByPkReturn;

export const asCreateReturn = (v: unknown): CreateReturn => v as CreateReturn;

// Task用
export const asTaskFindOneReturn = (v: unknown): TaskFindOneReturn =>
  v as TaskFindOneReturn;

export const asTaskFindByPkReturn = (v: unknown): TaskFindByPkReturn =>
  v as TaskFindByPkReturn;

export const asTaskCreateReturn = (v: unknown): TaskCreateReturn =>
  v as TaskCreateReturn;

export const asTaskArrayReturn = (v: unknown): TaskArrayReturn =>
  v as TaskArrayReturn;

// Project用
export const asProjectFindOneReturn = (v: unknown): ProjectFindOneReturn =>
  v as ProjectFindOneReturn;

export const asProjectFindByPkReturn = (v: unknown): ProjectFindByPkReturn =>
  v as ProjectFindByPkReturn;

export const asProjectCreateReturn = (v: unknown): ProjectCreateReturn =>
  v as ProjectCreateReturn;

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

// backend/tests/helpers/typeAdapters.ts の 75-84 行目を以下のように変更

// Task.findAndCountAll の戻り値型（モック環境では取得できないため直接定義）
export type TaskFindAndCountAllReturn =
  | { rows: Task[]; count: number }
  | { rows: Task[]; count: Array<{ count: number; [key: string]: unknown }> };

// count が number のケースのみを抽出した型
export type TaskFindAndCountNumberResult = Extract<
  TaskFindAndCountAllReturn,
  { count: number }
>;

// 型アダプタ（as unknown as をここ1カ所に隔離）
export const asTaskFindAndCountAllReturn = (
  v: TaskFindAndCountNumberResult
): Awaited<ReturnType<typeof Task.findAndCountAll>> =>
  v as unknown as Awaited<ReturnType<typeof Task.findAndCountAll>>;

// ユーザーオブジェクトファクトリ（satisfiesで形状保証）
export function makeMinimalUser(init?: Partial<MinimalUser>): MinimalUser {
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

// 最小プロトコル: テストで必要な最小限のTask形状
export interface MinimalTask {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate?: Date | null;
  projectId?: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// タスクオブジェクトファクトリ
export function makeMinimalTask(init?: Partial<MinimalTask>): MinimalTask {
  return {
    id: "task-1",
    title: "Test Task",
    description: null,
    status: "TODO",
    priority: "MEDIUM",
    dueDate: null,
    projectId: null,
    userId: "user-1",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...init,
  } satisfies MinimalTask;
}

// 最小プロトコル: テストで必要な最小限のProject形状
export interface MinimalProject {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// プロジェクトオブジェクトファクトリ
export function makeMinimalProject(
  init?: Partial<MinimalProject>
): MinimalProject {
  return {
    id: "project-1",
    name: "Test Project",
    description: null,
    color: null,
    userId: "user-1",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...init,
  } satisfies MinimalProject;
}

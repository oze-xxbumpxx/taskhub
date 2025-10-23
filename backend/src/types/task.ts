// Task関連の型定義

import { TaskStatus, TaskPriority } from "../models/Task";

// タスク作成用の入力型
export interface CreateTaskInput {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  projectId?: string | null;
}

// タスク更新用の入力型
export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  projectId?: string | null;
}

// タスクエラー型
export interface TaskError {
  field: string;
  message: string;
}

// タスクレスポンス型
export interface TaskResponse {
  success: boolean;
  task?: any; // 一時的にanyを使用（後でTask型に置き換え）
  errors?: TaskError[];
}

// タスク一覧取得用のフィルター型
export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

// タスク一覧取得用のソート型
export interface TaskSort {
  field:
    | "title"
    | "status"
    | "priority"
    | "dueDate"
    | "createdAt"
    | "updatedAt";
  direction: "ASC" | "DESC";
}

// タスク一覧取得用の入力型
export interface GetTasksInput {
  filters?: TaskFilters;
  sort?: TaskSort;
  limit?: number;
  offset?: number;
}

// タスク一覧レスポンス型
export interface TaskListResponse {
  success: boolean;
  tasks?: any[]; // 一時的にany[]を使用
  totalCount?: number;
  errors?: TaskError[];
}

// Project関連の型定義

// プロジェクト作成用の入力型
export interface CreateProjectInput {
  name: string;
  description?: string | null;
  color?: string | null;
}

// プロジェクト更新用の入力型
export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  color?: string | null;
}

// プロジェクトエラー型
export interface ProjectError {
  field: string;
  message: string;
}

// プロジェクトレスポンス型
export interface ProjectResponse {
  success: boolean;
  project?: any; // 一時的にanyを使用（後でProject型に置き換え）
  errors?: ProjectError[];
}

// プロジェクト一覧取得用のフィルター型
export interface ProjectFilters {
  name?: string;
  color?: string;
}

// プロジェクト一覧取得用のソート型
export interface ProjectSort {
  field: "name" | "createdAt" | "updatedAt";
  direction: "ASC" | "DESC";
}

// プロジェクト一覧取得用の入力型
export interface GetProjectsInput {
  filters?: ProjectFilters;
  sort?: ProjectSort;
  limit?: number;
  offset?: number;
}

// プロジェクト一覧レスポンス型
export interface ProjectListResponse {
  success: boolean;
  projects?: any[]; // 一時的にany[]を使用
  totalCount?: number;
  errors?: ProjectError[];
}

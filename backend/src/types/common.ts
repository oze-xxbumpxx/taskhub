// 共通の型定義

// 基本的なAPIレスポンス型
export interface BaseResponse {
  success: boolean;
  message?: string;
}

// エラーレスポンス型
export interface ErrorResponse {
  success: false;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

// ページネーション型
export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ユーザー関連の型定義

// ユーザー作成用の入力型
export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
}

// ログイン用の入力型
export interface LoginInput {
  email: string;
  password: string;
}

// ユーザーエラー型
export interface UserError {
  field: string;
  message: string;
}

// ユーザーレスポンス型（User型は後でimport）
export interface UserResponse {
  success: boolean;
  user?: any; // 一時的にanyを使用
  errors?: UserError[];
}

// 認証ペイロード型
export interface AuthPayload {
  token: string;
  user: any; // 一時的にanyを使用
}

// パスワード強度検証結果型
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

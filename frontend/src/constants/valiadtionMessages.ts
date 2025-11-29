// バリデーション関連の定数
export const VALIDATION = {
  // 文字数制限
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 255,
  MAX_EMAIL_LENGTH: 255,
  MAX_NAME_LENGTH: 100,
} as const;

// エラーメッセージ
export const ERROR_MESSAGES = {
  // 共通
  REQUIRED: (field: string) => `${field}は必須です`,

  // 文字数
  MIN_LENGTH: (field: string, min: number) =>
    `${field}は${min}文字以上で入力してください`,
  MAX_LENGTH: (field: string, max: number) =>
    `${field}は${max}文字以内で入力してください`,

  // Email
  EMAIL: {
    INVALID: "有効なメールアドレスを入力してください",
  },

  // Password
  PASSWORD: {
    MISMATCH: "パスワードが一致しません",
  },
} as const;

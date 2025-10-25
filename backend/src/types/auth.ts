// 認証関連の型定義

// GraphQLコンテキスト型
export interface GraphQLContext {
  req: any;
  user: {
    id: string;
    // 必要に応じて他のフィールドを追加
  } | null;
  isAuthenticated: boolean;
}

// 認証結果型
export interface AuthContextResult {
  user: {
    id: string;
  } | null;
  isAuthenticated: boolean;
}
// GraphQLコンテキスト型
export interface AuthContext {
  req: {
    headers: {
      authorization?: string;
    };
  };
}

// JWTペイロード型
export interface JWTPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

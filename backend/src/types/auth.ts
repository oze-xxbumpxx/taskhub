// 認証関連の型定義

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

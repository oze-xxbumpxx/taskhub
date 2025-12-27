import jwt, { SignOptions } from "jsonwebtoken";
import { config } from "../config/env";
import { logger } from "./logger";
import { AuthContext, JWTPayload } from "../types/auth";

const isJWTPayload = (decoded: any): decoded is JWTPayload => {
  return (
    decoded && typeof decoded === "object" && typeof decoded.userId === "string"
  );
};

const DURATION_RE = /^(?<value>\d+)(?<unit>[smhd])?$/;

function toExpiresInSeconds(input: string): number {
  const trimmed = input.trim();
  const match = DURATION_RE.exec(trimmed);
  if (!match?.groups) {
    throw new Error(`Invalid JWT_EXPIRES_IN format: ${input}`);
  }

  const value = Number(match.groups.value);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid JWT_EXPIRES_IN value: ${input}`);
  }

  const unit = match.groups.unit ?? "s";
  const multiplier =
    unit === "s"
      ? 1
      : unit === "m"
      ? 60
      : unit === "h"
      ? 60 * 60
      : 60 * 60 * 24;

  return value * multiplier;
}
// JWTトークンの検証
export const authenticateUser = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret!);
    if (!isJWTPayload(decoded)) {
      throw new Error("Invalid token payload");
    }
    return decoded;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.warn("Authentication failed:", { error: err.message });
    throw new Error("Invalid token");
  }
};

// JWTトークンの生成
export const generateToken = (userId: string) => {
  const secret = config.jwt.secret;
  if (!secret || typeof secret !== "string") {
    throw new Error("JWT secret is not configured");
  }
  const expiresInRaw = config.jwt.expiresIn;
  if (!expiresInRaw || typeof expiresInRaw !== "string") {
    throw new Error("JWT expiresIn is not configured");
  }

  const options: SignOptions = {
    expiresIn: toExpiresInSeconds(expiresInRaw),
  };
  return jwt.sign({ userId }, secret, options);
};

// 認証ミドルウェア
export const authMiddleware = (context: AuthContext) => {
  const token = context.req.headers.authorization?.split("Bearer ")[1];
  if (!token) {
    throw new Error("Authentication required");
  }
  return authenticateUser(token);
};

/**
 * GraphQLコンテキスト用の認証ミドルウェア
 * @param req - Express Request オブジェクト
 * @returns 認証されたユーザー情報またはnull
 */
export const createAuthContext = async (req: any) => {
  try {
    // Authorizationヘッダーからトークンを取得
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { user: null, isAuthenticated: false };
    }

    // Bearerトークンを抽出
    const token = authHeader.split(" ")[1];

    if (!token) {
      return { user: null, isAuthenticated: false };
    }

    // JWTトークンを検証
    const decoded = authenticateUser(token);
    if (!decoded || !decoded.userId) {
      return { user: null, isAuthenticated: false };
    }

    // ユーザー情報取得（必要に応じてデータベースから取得）
    // ここでは簡略化のため、decodedの情報を取得
    return {
      user: {
        id: decoded.userId,
        // 必要に応じて情報追加
      },
      isAuthenticated: true,
    };
  } catch (error) {
    logger.warn("Authentication failed:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { user: null, isAuthenticated: false };
  }
};

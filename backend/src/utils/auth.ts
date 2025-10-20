import jwt, { SignOptions } from "jsonwebtoken";
import { config } from "../config/env";
import { logger } from "./logger";
import { AuthContext } from "../types/auth";

// JWTトークンの検証
export const authenticateUser = (token: string) => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret!);
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
  const expiresIn =
    typeof config.jwt.expiresIn === "string"
      ? parseInt(config.jwt.expiresIn, 10)
      : config.jwt.expiresIn;
  const options: SignOptions = {
    expiresIn,
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

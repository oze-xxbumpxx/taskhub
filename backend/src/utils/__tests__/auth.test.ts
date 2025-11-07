import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import {
  generateToken,
  authenticateUser,
  authMiddleware,
  createAuthContext,
} from "../auth";
import { config } from "../../config/env";
import { logger } from "../logger";
import { AuthContext, JWTPayload } from "../../types/auth";

// jsonwebtokenをモック化
vi.mock("jsonwebtoken");
// configをモック化
vi.mock("../../config/env", () => ({
  config: {
    jwt: {
      secret: "test-secret-key",
    },
  },
}));
// loggerをモック化
vi.mock("../logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("auth utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateToken", () => {
    it("should generate a JWT token successfully", () => {
      // モックの設定
      const mockToken = "mock.jwt.token";
      const userId = "user-123";
      vi.mocked(jwt.sign).mockReturnValue(mockToken as never);

      // テスト実行
      const result = generateToken(userId);

      // 検証
      expect(result).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId },
        config.jwt.secret,
        { expiresIn: "10m" }
      );
    });

    it("should throw an error when JWT secret is not configured", () => {
      // モックの設定（secretが未設定の場合）
      const originalConfig = config.jwt.secret;
      (config.jwt as any).secret = undefined;

      // テスト実行と検証
      expect(() => generateToken("user-123")).toThrow(
        "JWT secret is not configured"
      );

      // 元に戻す
      config.jwt.secret = originalConfig;
    });

    it("should throw an error when JWT secret is not a string", () => {
      // モックの設定（secretが文字列でない場合）
      const originalConfig = config.jwt.secret;
      (config.jwt as any).secret = null;

      // テスト実行と検証
      expect(() => generateToken("user-123")).toThrow(
        "JWT secret is not configured"
      );

      // 元に戻す
      config.jwt.secret = originalConfig;
    });
  });

  describe("authenticateUser", () => {
    it("should verify and return decoded token payload", () => {
      // モックの設定
      const mockPayload: JWTPayload = {
        userId: "user-123",
        iat: 1234567890,
        exp: 1234567890,
      };
      const token = "valid.jwt.token";
      vi.mocked(jwt.verify).mockReturnValue(mockPayload as never);

      // テスト実行
      const result = authenticateUser(token);

      // 検証
      expect(result).toEqual(mockPayload);
      expect(jwt.verify).toHaveBeenCalledWith(
        token,
        config.jwt.secret
      );
    });

    it("should throw an error when token is invalid", () => {
      // モックの設定（検証失敗）
      const token = "invalid.jwt.token";
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      // テスト実行と検証
      expect(() => authenticateUser(token)).toThrow("Invalid token");
      expect(logger.warn).toHaveBeenCalled();
    });

    it("should throw an error when token payload is invalid", () => {
      // モックの設定（無効なペイロード）
      const token = "valid.jwt.token";
      const invalidPayload = { invalidField: "value" };
      vi.mocked(jwt.verify).mockReturnValue(invalidPayload as never);

      // テスト実行と検証
      expect(() => authenticateUser(token)).toThrow("Invalid token");
      expect(logger.warn).toHaveBeenCalled();
    });

    it("should throw an error when decoded payload does not have userId", () => {
      // モックの設定（userIdがないペイロード）
      const token = "valid.jwt.token";
      const invalidPayload = { iat: 1234567890 };
      vi.mocked(jwt.verify).mockReturnValue(invalidPayload as never);

      // テスト実行と検証
      expect(() => authenticateUser(token)).toThrow("Invalid token");
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe("authMiddleware", () => {
    it("should authenticate user with valid token", () => {
      // モックの設定
      const mockPayload: JWTPayload = {
        userId: "user-123",
      };
      const token = "valid.jwt.token";
      const context: AuthContext = {
        req: {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      };

      // authenticateUserをモック化
      vi.mocked(jwt.verify).mockReturnValue(mockPayload as never);

      // テスト実行
      const result = authMiddleware(context);

      // 検証
      expect(result).toEqual(mockPayload);
      expect(jwt.verify).toHaveBeenCalledWith(token, config.jwt.secret);
    });

    it("should throw an error when authorization header is missing", () => {
      // モックの設定（認証ヘッダーなし）
      const context: AuthContext = {
        req: {
          headers: {},
        },
      };

      // テスト実行と検証
      expect(() => authMiddleware(context)).toThrow(
        "Authentication required"
      );
    });

    it("should throw an error when Bearer token is missing", () => {
      // モックの設定（Bearer形式でない）
      const context: AuthContext = {
        req: {
          headers: {
            authorization: "InvalidToken",
          },
        },
      };

      // テスト実行と検証
      expect(() => authMiddleware(context)).toThrow(
        "Authentication required"
      );
    });
  });

  describe("createAuthContext", () => {
    it("should return authenticated context with valid token", async () => {
      // モックの設定
      const mockPayload: JWTPayload = {
        userId: "user-123",
      };
      const token = "valid.jwt.token";
      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };

      vi.mocked(jwt.verify).mockReturnValue(mockPayload as never);

      // テスト実行
      const result = await createAuthContext(req);

      // 検証
      expect(result.isAuthenticated).toBe(true);
      expect(result.user).toEqual({ id: "user-123" });
    });

    it("should return unauthenticated context when authorization header is missing", async () => {
      // モックの設定（認証ヘッダーなし）
      const req = {
        headers: {},
      };

      // テスト実行
      const result = await createAuthContext(req);

      // 検証
      expect(result.isAuthenticated).toBe(false);
      expect(result.user).toBeNull();
    });

    it("should return unauthenticated context when Bearer token is missing", async () => {
      // モックの設定（Bearer形式でない）
      const req = {
        headers: {
          authorization: "InvalidToken",
        },
      };

      // テスト実行
      const result = await createAuthContext(req);

      // 検証
      expect(result.isAuthenticated).toBe(false);
      expect(result.user).toBeNull();
    });

    it("should return unauthenticated context when token is empty", async () => {
      // モックの設定（空のトークン）
      const req = {
        headers: {
          authorization: "Bearer ",
        },
      };

      // テスト実行
      const result = await createAuthContext(req);

      // 検証
      expect(result.isAuthenticated).toBe(false);
      expect(result.user).toBeNull();
    });

    it("should return unauthenticated context when token verification fails", async () => {
      // モックの設定（検証失敗）
      const token = "invalid.jwt.token";
      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };

      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      // テスト実行
      const result = await createAuthContext(req);

      // 検証
      expect(result.isAuthenticated).toBe(false);
      expect(result.user).toBeNull();
      expect(logger.warn).toHaveBeenCalled();
    });

    it("should return unauthenticated context when payload is invalid", async () => {
      // モックの設定（無効なペイロード）
      const token = "valid.jwt.token";
      const req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };

      const invalidPayload = { invalidField: "value" };
      vi.mocked(jwt.verify).mockReturnValue(invalidPayload as never);

      // テスト実行
      const result = await createAuthContext(req);

      // 検証
      expect(result.isAuthenticated).toBe(false);
      expect(result.user).toBeNull();
      expect(logger.warn).toHaveBeenCalled();
    });
  });
});


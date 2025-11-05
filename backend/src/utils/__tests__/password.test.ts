import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcrypt";
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
} from "../password";
import { logger } from "../logger";

// bcryptoをモック化
vi.mock("bcrypt");
// loggerをモック化
vi.mock("../logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe("password utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("hashPassword", () => {
    it("should hash a password successfuly", async () => {
      // モックの設定
      const mockHashedPassword = "$2b$12$hashedpassword";
      vi.mocked(bcrypt.hash).mockResolvedValue(mockHashedPassword as never);

      // テスト実行
      const password = "SecurePass123!";
      const result = await hashPassword(password);

      // 結果の検証
      expect(result).toBe(mockHashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
    });

    it("should throw an error when bcrypt.hash fails", async () => {
      // モックの設定
      const mockError = new Error("bcrypt error");
      vi.mocked(bcrypt.hash).mockRejectedValue(mockError);

      // テスト実行
      const password = "SecurePass123!";
      await expect(hashPassword(password)).rejects.toThrow(
        "Password hashing failed"
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe("verifyPassword", () => {
    it("should return true when passworrd matches", async () => {
      // モックの設定
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      // テスト実行
      const password = "SecurePass123!";
      const hashedPassword = "$2b$12$hashedpassword";
      const result = await verifyPassword(password, hashedPassword);

      // 結果の検証
      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
    });
    it("shoud throw an error when bcrypt.compare fails", async () => {
      // モックの設定（エラー確認）
      const mockError = new Error("bcrypt compare error");
      vi.mocked(bcrypt.compare).mockRejectedValue(mockError);

      // テスト実行と検証
      const password = "SecurePass123!";
      const hashedPassword = "$2b$12$hashedpassword";
      await expect(verifyPassword(password, hashedPassword)).rejects.toThrow(
        "Password verification failed"
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe("validatePasswordStrength", () => {
    it("should return isValid: true for a strong password", () => {
      const password = "SecurePass123!";
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should return errors when password is too short", () => {
      const password = "Short1!";
      const result = validatePasswordStrength(password);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must be at least 8 characters long"
      );
    });
    it("should return errors when password lacks uppercase letter", () => {
      const password = "lowercase123!";
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one uppercase letter"
      );
    });

    it("should return errors when password lacks lowercase letter", () => {
      const password = "UPPERCASE123!";
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one lowercase letter"
      );
    });

    it("should return errors when password lacks number", () => {
      const password = "NoNumberPass!";
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one number"
      );
    });

    it("should return errors when password lacks special character", () => {
      const password = "NoSpecialChar123";
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Password must contain at least one special character"
      );
    });

    it("should return multiple errors for a weak password", () => {
      const password = "weak";
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});

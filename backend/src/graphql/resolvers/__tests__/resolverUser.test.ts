import { describe, it, expect, vi, beforeEach } from "vitest";
import { userResolvers } from "../resolveUser";
import { User } from "../../../models";
import { authMiddleware, generateToken } from "../../../utils/auth";
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
} from "../../../utils/password";
import { logger } from "../../../utils/logger";
import { CreateUserInput, LoginInput } from "../../../types/user";
import { validate } from "graphql";

// モックの設定
vi.mock("../../models", () => ({
  User: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("../../../utils/auth", () => ({
  generateToken: vi.fn(),
  authMiddleware: vi.fn(),
}));

vi.mock("../../../utils/password", () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
  validatePasswordStrength: vi.fn(),
}));

vi.mock("../../../utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("userResolvers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Mutation.register", () => {
    const validInput: CreateUserInput = {
      email: "test@example.com",
      password: "Password123!",
      name: "Test User",
    };

    const mockUser = {
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      password: "hashed-password",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    };

    it("有効な入力でユーザーが登録されること", async () => {
      // モックの設定
      vi.mocked(validatePasswordStrength).mockReturnValue({
        isValid: true,
        errors: [],
      });
      vi.mocked(User.findOne).mockResolvedValue(null);
      vi.mocked(hashPassword).mockResolvedValue("hashed-password");
      vi.mocked(User.create).mockResolvedValue(mockUser as User);

      // テスト実行
      const result = await userResolvers.Mutation.register(
        null,
        { input: validInput },
        {}
      );

      // 検証
      expect(result).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.id).toBe(mockUser.id);
      expect(result.user?.email).toBe(mockUser.email);
      expect(result.errors).toBeUndefined();

      // モックが正しく呼ばれたか確認
      expect(validatePasswordStrength).toHaveBeenCalledWith(
        validInput.password
      );
      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: validInput.email },
      });
      expect(hashPassword).toHaveBeenCalledWith(validInput.password);
      expect(User.create).toHaveBeenCalledWith({
        email: validInput.email,
        password: "hashed-password",
        name: validInput.name,
      });
    });
  });
});

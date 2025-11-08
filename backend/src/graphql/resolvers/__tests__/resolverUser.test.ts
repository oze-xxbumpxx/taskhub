import { describe, it, expect, vi, beforeEach } from "vitest";
import { User } from "../../../models";
import { authMiddleware, generateToken } from "../../../utils/auth";
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
} from "../../../utils/password";
import { logger } from "../../../utils/logger";
import { userResolvers } from "../resolveUser";
import { AuthContext } from "../../../types/auth";

// モックの設定（最初に配置する必要がある）
vi.mock("../../../config/database", () => ({
  default: {
    transaction: vi.fn(() => ({
      commit: vi.fn(),
      rollback: vi.fn(),
    })),
    define: vi.fn(),
    authenticate: vi.fn(),
    sync: vi.fn(),
  },
  testConnection: vi.fn(),
}));

vi.mock("../../../models", () => ({
  User: {
    findOne: vi.fn(),
    create: vi.fn(),
    findByPk: vi.fn(),
    destroy: vi.fn(),
    init: vi.fn(),
  },
  Task: {
    destroy: vi.fn(),
    init: vi.fn(),
  },
  Project: {
    init: vi.fn(),
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

vi.mock("../resolveTask", () => ({
  taskResolvers: {
    Query: {},
    Mutation: {},
  },
}));

vi.mock("../resolveProject", () => ({
  projectResolvers: {
    Query: {},
    Mutation: {},
  },
}));

describe("User Resolvers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    password: "hashed-password",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  };

  describe("Mutation.register", () => {
    const validInput = {
      email: "test@example.com",
      password: "Password123!",
      name: "Test User",
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
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.id).toBe(mockUser.id);
      expect(result.user?.email).toBe(mockUser.email);
      expect(result.user?.name).toBe(mockUser.name);
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

    it("メールアドレスが既に存在する場合、エラーを返すこと", async () => {
      // モックの設定
      vi.mocked(validatePasswordStrength).mockReturnValue({
        isValid: true,
        errors: [],
      });
      vi.mocked(User.findOne).mockResolvedValue(mockUser as User);

      // テスト実行
      const result = await userResolvers.Mutation.register(
        null,
        { input: validInput },
        {}
      );

      // 検証
      expect(result.success).toBe(false);
      expect(result.user).toBeUndefined();
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]?.field).toBe("email");
      expect(result.errors?.[0]?.message).toBe("Email already exists");
    });

    it("パスワード強度が不足している場合、エラーを返すこと", async () => {
      // モックの設定
      vi.mocked(validatePasswordStrength).mockReturnValue({
        isValid: false,
        errors: ["Password is too weak"],
      });
      vi.mocked(User.findOne).mockResolvedValue(null);

      // テスト実行
      const result = await userResolvers.Mutation.register(
        null,
        {
          input: {
            ...validInput,
            password: "weak",
          },
        },
        {}
      );

      // 検証
      expect(result.success).toBe(false);
      expect(result.user).toBeUndefined();
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]?.field).toBe("password");
    });
  });

  describe("Mutation.login", () => {
    const loginInput = {
      email: "test@example.com",
      password: "Password123!",
    };

    const mockUserWithPassword = {
      ...mockUser,
      password: "hashed-password",
    };

    it("有効な認証情報でログインできること", async () => {
      // モックの設定
      vi.mocked(User.findOne).mockResolvedValue(mockUserWithPassword as User);
      vi.mocked(verifyPassword).mockResolvedValue(true);
      vi.mocked(generateToken).mockReturnValue("test-token");

      // テスト実行
      const result = await userResolvers.Mutation.login(
        null,
        { input: loginInput },
        {}
      );

      // 検証
      if ("token" in result) {
        expect(result.token).toBe("test-token");
        expect(result.user).toBeDefined();
        expect(result.user.id).toBe(mockUser.id);
        expect(result.user.email).toBe(mockUser.email);
      } else {
        throw new Error("Expected AuthPayload but got UserResponse");
      }

      // モックが正しく呼ばれたか確認
      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: loginInput.email },
      });
      expect(verifyPassword).toHaveBeenCalledWith(
        loginInput.password,
        mockUser.password
      );
      expect(generateToken).toHaveBeenCalledWith(mockUser.id);
    });

    it("存在しないメールアドレスの場合、エラーを返すこと", async () => {
      // モックの設定
      vi.mocked(User.findOne).mockResolvedValue(null);

      // テスト実行
      const result = await userResolvers.Mutation.login(
        null,
        { input: loginInput },
        {}
      );

      // 検証
      if ("success" in result) {
        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors?.[0]?.field).toBe("email");
      } else {
        throw new Error("Expected UserResponse but got AuthPayload");
      }
    });

    it("パスワードが間違っている場合、エラーを返すこと", async () => {
      // モックの設定
      vi.mocked(User.findOne).mockResolvedValue(mockUserWithPassword as User);
      vi.mocked(verifyPassword).mockResolvedValue(false);

      // テスト実行
      const result = await userResolvers.Mutation.login(
        null,
        { input: loginInput },
        {}
      );

      // 検証
      if ("success" in result) {
        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors?.[0]?.field).toBe("password");
      } else {
        throw new Error("Expected UserResponse but got AuthPayload");
      }
    });
  });

  describe("Query.getUser", () => {
    it("認証済みユーザーでユーザー情報を取得できること", async () => {
      // モックの設定
      vi.mocked(authMiddleware).mockReturnValue({
        isAuthenticated: true,
        user: {
          id: mockUser.id,
        },
        userId: mockUser.id,
      } as any);
      vi.mocked(User.findByPk).mockResolvedValue(mockUser as User);

      // テスト実行
      const result = await userResolvers.Query.getUser(null, {}, {
        req: {
          headers: {
            authorization: `Bearer test-token`,
          },
        },
      } as AuthContext);

      // 検証
      expect(result).toBeDefined();
      expect(result?.id).toBe(mockUser.id);
      expect(result?.email).toBe(mockUser.email);
      expect(result?.name).toBe(mockUser.name);

      // モックが正しく呼ばれたか確認
      expect(User.findByPk).toHaveBeenCalledWith(mockUser.id);
    });

    it("認証されていない場合、エラーを返すこと", async () => {
      // モックの設定
      vi.mocked(authMiddleware).mockImplementation(() => {
        throw new Error("Authentication required");
      });

      // テスト実行
      await expect(
        userResolvers.Query.getUser(null, {}, {
          req: {
            headers: {},
          },
        } as AuthContext)
      ).rejects.toThrow("Authentication required");
    });
  });
});

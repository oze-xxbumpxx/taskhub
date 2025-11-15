import { describe, it, expect, vi, beforeEach } from "vitest";
import { Task, User } from "../../../models";
import { authMiddleware, generateToken } from "../../../utils/auth";
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
} from "../../../utils/password";
import { logger } from "../../../utils/logger";
import { userResolvers } from "../resolveUser";
import { AuthContext, JWTPayload } from "../../../types/auth";

import {
  asFindOneReturn,
  asFindByPkReturn,
  asCreateReturn,
  makeMinimalUser,
  makeDestroyableUser,
  makeAuthContext,
  makeJWTPayload,
} from "../../../../tests/helpers";

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

  const dummyCtx: AuthContext = {
    req: { headers: { authorization: "Bearer test-token" } },
  };

  describe("Mutation.register", () => {
    const validInput = {
      email: "test@example.com",
      password: "Password123!",
      name: "Test User",
    };

    it("有効な入力でユーザーが登録されること", async () => {
      vi.mocked(validatePasswordStrength).mockReturnValue({
        isValid: true,
        errors: [],
      });
      vi.mocked(User.findOne).mockResolvedValue(null);
      vi.mocked(hashPassword).mockResolvedValue("hashed-password");
      vi.mocked(User.create).mockResolvedValue(asCreateReturn(mockUser));
      const result = await userResolvers.Mutation.register(
        null,
        { input: validInput },
        dummyCtx
      );

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.id).toBe(mockUser.id);
      expect(result.user?.email).toBe(mockUser.email);
      expect(result.user?.name).toBe(mockUser.name);
      expect(result.errors).toBeUndefined();

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
      vi.mocked(validatePasswordStrength).mockReturnValue({
        isValid: true,
        errors: [],
      });
      vi.mocked(User.findOne).mockResolvedValue(asFindOneReturn(mockUser));
      const result = await userResolvers.Mutation.register(
        null,
        { input: validInput },
        dummyCtx
      );

      expect(result.success).toBe(false);
      expect(result.user).toBeUndefined();
      expect(result.errors?.[0]?.field).toBe("email");
      expect(result.errors?.[0]?.message).toBe("Email already exists");
    });

    it("パスワード強度が不足している場合、エラーを返すこと", async () => {
      vi.mocked(validatePasswordStrength).mockReturnValue({
        isValid: false,
        errors: ["Password is too weak"],
      });
      vi.mocked(User.findOne).mockResolvedValue(null);

      const result = await userResolvers.Mutation.register(
        null,
        {
          input: {
            ...validInput,
            password: "weak",
          },
        },
        dummyCtx
      );

      expect(result.success).toBe(false);
      expect(result.user).toBeUndefined();
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
      vi.mocked(User.findOne).mockResolvedValue(asFindOneReturn(mockUser));
      vi.mocked(verifyPassword).mockResolvedValue(true);
      vi.mocked(generateToken).mockReturnValue("test-token");

      const result = await userResolvers.Mutation.login(
        null,
        { input: loginInput },
        dummyCtx
      );

      if ("token" in result) {
        expect(result.token).toBe("test-token");
        expect(result.user).toBeDefined();
        expect(result.user.id).toBe(mockUser.id);
        expect(result.user.email).toBe(mockUser.email);
      } else {
        throw new Error("Expected AuthPayload but got UserResponse");
      }

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: loginInput.email },
      });
      expect(verifyPassword).toHaveBeenCalledWith(
        loginInput.password,
        mockUser.password
      );
      expect(generateToken).toHaveBeenCalledWith(mockUser.id);
    });

    it("ログイン成功はAuthPayload形状を返す", async () => {
      const u = makeMinimalUser({
        id: "u1",
        email: "a@b.c",
        password: "h",
        name: "A",
      });
      vi.mocked(User.findOne).mockResolvedValue(asFindOneReturn(u));
      vi.mocked(generateToken).mockReturnValue("test-token");

      const res = await userResolvers.Mutation.login(
        null,
        { input: { email: "a@b.c", password: "x" } },
        dummyCtx
      );

      expect("token" in res).toBe(true);
      expect((res as { token: string }).token).toBe("test-token");
    });

    it("ログイン失敗はUserResponse形状を返す", async () => {
      vi.mocked(User.findOne).mockResolvedValue(null);

      const res = await userResolvers.Mutation.login(
        null,
        { input: { email: "a@b.c", password: "x" } },
        dummyCtx
      );

      expect("success" in res).toBe(true);
      expect((res as { success: boolean }).success).toBe(false);
    });

    it("存在しないメールアドレスの場合、エラーを返すこと", async () => {
      vi.mocked(User.findOne).mockResolvedValue(null);

      const result = await userResolvers.Mutation.login(
        null,
        { input: loginInput },
        dummyCtx
      );

      if ("success" in result) {
        expect(result.success).toBe(false);
        expect(result.errors?.[0]?.field).toBe("email");
      } else {
        throw new Error("Expected UserResponse but got AuthPayload");
      }
    });

    it("パスワードが間違っている場合、エラーを返すこと", async () => {
      vi.mocked(User.findOne).mockResolvedValue(
        asFindOneReturn(mockUserWithPassword)
      );
      vi.mocked(verifyPassword).mockResolvedValue(false);

      const result = await userResolvers.Mutation.login(
        null,
        { input: loginInput },
        dummyCtx
      );

      if ("success" in result) {
        expect(result.success).toBe(false);
        expect(result.errors?.[0]?.field).toBe("password");
      } else {
        throw new Error("Expected UserResponse but got AuthPayload");
      }
    });
  });

  describe("Mutation.logout", () => {
    it("認証済みのユーザーをログアウトすること", async () => {
      const result = await userResolvers.Mutation.logout();

      expect(result).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(
        "User logged out (stateless)",
        {}
      );
    });
  });

  describe("Query.getUser", () => {
    it("認証済みユーザーでユーザー情報を取得できること", async () => {
      const jwtPayload: JWTPayload = { userId: mockUser.id };
      vi.mocked(authMiddleware).mockReturnValue(jwtPayload);
      vi.mocked(User.findByPk).mockResolvedValue(asFindByPkReturn(mockUser));
      const result = await userResolvers.Query.getUser(null, {}, dummyCtx);

      expect(result).toBeDefined();
      expect(result?.id).toBe(mockUser.id);
      expect(result?.email).toBe(mockUser.email);
      expect(result?.name).toBe(mockUser.name);

      expect(User.findByPk).toHaveBeenCalledWith(mockUser.id);
    });

    it("認証されていない場合、エラーを返すこと", async () => {
      vi.mocked(authMiddleware).mockImplementation(() => {
        throw new Error("Authentication required");
      });

      await expect(
        userResolvers.Query.getUser(null, {}, { req: { headers: {} } })
      ).rejects.toThrow("Authentication required");
    });
  });

  describe("Query.user", () => {
    const u = {
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    };

    it("有効なユーザーIDで取得", async () => {
      vi.mocked(User.findByPk).mockResolvedValue(asFindByPkReturn(u));
      const result = await userResolvers.Query.user(
        null,
        { id: u.id },
        dummyCtx
      );

      expect(result).toBeDefined();
      expect(result?.id).toBe(u.id);
      expect(result?.email).toBe(u.email);
      expect(logger.info).toHaveBeenCalledWith("User fetched", {
        userId: u.id,
        email: u.email,
      });
    });

    it("ユーザーが見つからない場合はエラーを返す", async () => {
      vi.mocked(User.findByPk).mockResolvedValue(null);

      await expect(
        userResolvers.Query.user(null, { id: "missing" }, dummyCtx)
      ).rejects.toThrow("User not found");
      expect(logger.warn).toHaveBeenCalledWith("User not found", {
        userId: "missing",
      });
    });

    it("無効IDの場合はエラーを返す", async () => {
      await expect(
        userResolvers.Query.user(null, { id: "" }, dummyCtx)
      ).rejects.toThrow("Invalid user id");
    });

    it("無効トークン（userIdが空文字）でエラー", async () => {
      const invalidPayload = makeJWTPayload("");
      vi.mocked(authMiddleware).mockReturnValue(invalidPayload);

      await expect(
        userResolvers.Query.getUser(null, {}, makeAuthContext("invalid-token"))
      ).rejects.toThrow("Invalid token");

      expect(logger.error).toHaveBeenCalledWith("Failed to get user profile", {
        error: "Invalid token",
      });
    });

    it("DB未存在時はwarnとerrorの両方をログ出力", async () => {
      const payload = makeJWTPayload("missing-user");
      vi.mocked(authMiddleware).mockReturnValue(payload);
      vi.mocked(User.findByPk).mockResolvedValue(null);

      await expect(
        userResolvers.Query.getUser(null, {}, makeAuthContext("test-token"))
      ).rejects.toThrow("User not found");

      expect(logger.warn).toHaveBeenCalledWith(
        "User not found for authenticated token",
        { userId: "missing-user" }
      );
      expect(logger.error).toHaveBeenCalledWith("Failed to get user profile", {
        error: "User not found",
      });
    });

    it("成功時はerrorログを出力しない", async () => {
      const payload = makeJWTPayload(mockUser.id);
      vi.mocked(authMiddleware).mockReturnValue(payload);
      vi.mocked(User.findByPk).mockResolvedValue(asFindByPkReturn(mockUser));

      await userResolvers.Query.getUser(
        null,
        {},
        makeAuthContext("test-token")
      );

      expect(logger.error).not.toHaveBeenCalled();
    });
  });

  describe("Mutation.createUser", () => {
    it("registerへ正しく委譲する", async () => {
      const input = {
        email: "test@example.com",
        password: "Password123!",
        name: "Test User",
      };

      vi.mocked(validatePasswordStrength).mockReturnValue({
        isValid: true,
        errors: [],
      });
      vi.mocked(User.findOne).mockResolvedValue(null);
      vi.mocked(hashPassword).mockResolvedValue("hashed-password");
      const user = makeMinimalUser({
        id: "user-1",
        email: input.email,
        name: input.name,
      });
      vi.mocked(User.create).mockResolvedValue(asCreateReturn(user));

      const result = await userResolvers.Mutation.createUser(
        null,
        { input },
        {}
      );

      expect(result.success).toBe(true);
      expect(result.user?.email).toBe(input.email);
      expect(result.errors).toBeUndefined();
    });

    it("registerのエラーをそのまま返す", async () => {
      vi.mocked(validatePasswordStrength).mockReturnValue({
        isValid: false,
        errors: ["Password is too weak"],
      });

      const result = await userResolvers.Mutation.createUser(
        null,
        { input: { email: "a@b.c", password: "weak", name: "User" } },
        {}
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.field).toBe("password");
    });
  });

  describe("Mutation.updateUser", () => {
    const userId = "user-123";
    const baseUser = () => ({
      id: userId,
      email: "old@example.com",
      name: "Old Name",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    });

    it("name更新が成功する", async () => {
      const payload: JWTPayload = { userId };
      vi.mocked(authMiddleware).mockReturnValue(payload);
      let record: any = { ...baseUser() };
      record.update = vi.fn(async (updates: any) => {
        Object.assign(record, updates);
        return record;
      });
      vi.mocked(User.findByPk).mockResolvedValue(asFindByPkReturn(record));
      vi.mocked(User.findOne).mockResolvedValue(null);

      const result = await userResolvers.Mutation.updateUser(
        null,
        { input: { name: "New Name" } },
        dummyCtx
      );

      expect(result.success).toBe(true);
      expect(record.update).toHaveBeenCalledWith({ name: "New Name" });
      expect(result.user?.name).toBe("New Name");
    });

    it("email更新が成功する（重複なし）", async () => {
      const payload: JWTPayload = { userId };
      vi.mocked(authMiddleware).mockReturnValue(payload);
      let record: any = { ...baseUser() };
      record.update = vi.fn(async (updates: any) => {
        Object.assign(record, updates);
        return record;
      });
      vi.mocked(User.findByPk).mockResolvedValue(asFindByPkReturn(record));
      vi.mocked(User.findOne).mockResolvedValue(null);

      const result = await userResolvers.Mutation.updateUser(
        null,
        { input: { email: "new@example.com" } },
        dummyCtx
      );

      expect(result.success).toBe(true);
      expect(record.update).toHaveBeenCalledWith({ email: "new@example.com" });
      expect(result.user?.email).toBe("new@example.com");
    });

    it("入力なしでもsuccess: trueで変更しない", async () => {
      const payload: JWTPayload = { userId };
      vi.mocked(authMiddleware).mockReturnValue(payload);
      const record: any = { ...baseUser(), update: vi.fn() };
      vi.mocked(User.findByPk).mockResolvedValue(asFindByPkReturn(record));
      const result = await userResolvers.Mutation.updateUser(
        null,
        { input: {} },
        dummyCtx
      );

      expect(result.success).toBe(true);
      expect(record.update).not.toHaveBeenCalled();
    });

    it("未認証ならauthエラー", async () => {
      vi.mocked(authMiddleware).mockImplementation(() => {
        throw new Error("Authentication required");
      });

      const result = await userResolvers.Mutation.updateUser(
        null,
        { input: { name: "x" } },
        { req: { headers: {} } }
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.field).toBe("auth");
    });

    it("トークン不正（空文字）ならauthエラー", async () => {
      const invalidPayload: JWTPayload = { userId: "" };
      vi.mocked(authMiddleware).mockReturnValue(invalidPayload);

      const result = await userResolvers.Mutation.updateUser(
        null,
        { input: { name: "x" } },
        dummyCtx
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.field).toBe("auth");
    });

    it("ユーザー未存在ならuserエラー", async () => {
      const payload: JWTPayload = { userId };
      vi.mocked(authMiddleware).mockReturnValue(payload);
      vi.mocked(User.findByPk).mockResolvedValue(null);

      const result = await userResolvers.Mutation.updateUser(
        null,
        { input: { name: "x" } },
        dummyCtx
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.field).toBe("user");
    });

    it("nameが不正（空白のみ）ならエラー", async () => {
      const payload: JWTPayload = { userId };
      vi.mocked(authMiddleware).mockReturnValue(payload);
      const record: any = { ...baseUser(), update: vi.fn() };
      vi.mocked(User.findByPk).mockResolvedValue(asFindByPkReturn(record));
      const result = await userResolvers.Mutation.updateUser(
        null,
        { input: { name: "   " } },
        dummyCtx
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.field).toBe("name");
      expect(record.update).not.toHaveBeenCalled();
    });

    it("emailが不正（空白のみ）ならエラー", async () => {
      const payload: JWTPayload = { userId };
      vi.mocked(authMiddleware).mockReturnValue(payload);
      const record: any = { ...baseUser(), update: vi.fn() };
      vi.mocked(User.findByPk).mockResolvedValue(asFindByPkReturn(record));
      const result = await userResolvers.Mutation.updateUser(
        null,
        { input: { email: "   " } },
        dummyCtx
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.field).toBe("email");
      expect(record.update).not.toHaveBeenCalled();
    });

    it("email重複ならエラー", async () => {
      const payload: JWTPayload = { userId };
      vi.mocked(authMiddleware).mockReturnValue(payload);
      const record: any = { ...baseUser(), update: vi.fn() };
      vi.mocked(User.findByPk).mockResolvedValue(asFindByPkReturn(record));
      const otherUser = makeMinimalUser({
        id: "other",
        email: "dup@example.com",
        name: "Other",
      });
      vi.mocked(User.findOne).mockResolvedValue(asFindOneReturn(otherUser));

      const result = await userResolvers.Mutation.updateUser(
        null,
        { input: { email: "dup@example.com" } },
        dummyCtx
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.field).toBe("email");
      expect(record.update).not.toHaveBeenCalled();
    });

    it("内部エラー時はgeneralエラーを返しlogger.errorを出す", async () => {
      const payload: JWTPayload = { userId };
      vi.mocked(authMiddleware).mockReturnValue(payload);
      vi.mocked(User.findByPk).mockRejectedValue(new Error("DB error"));

      const result = await userResolvers.Mutation.updateUser(
        null,
        { input: { name: "x" } },
        dummyCtx
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.field).toBe("general");
      expect(logger.error).toHaveBeenCalledWith("Failed to update user", {
        error: "DB error",
      });
    });
  });

  describe("Mutation.deleteUser", () => {
    const userId = "user-123";

    it("ユーザーIDからユーザーを削除", async () => {
      const payload: JWTPayload = { userId };
      vi.mocked(authMiddleware).mockReturnValue(payload);

      const userDestroy = vi.fn().mockResolvedValue(undefined);
      const destroyableUser = makeDestroyableUser(
        {
          id: userId,
          email: "x@y.z",
          name: "User",
        },
        userDestroy
      );
      vi.mocked(User.findByPk).mockResolvedValue(
        asFindByPkReturn(destroyableUser)
      );
      vi.mocked(Task.destroy).mockResolvedValue(3);

      const result = await userResolvers.Mutation.deleteUser(
        null,
        {},
        dummyCtx
      );

      expect(result.success).toBe(true);
      expect(Task.destroy).toHaveBeenCalledWith({
        where: { userId },
        transaction: expect.any(Object),
      });
      expect(userDestroy).toHaveBeenCalledWith({
        transaction: expect.any(Object),
      });
      expect(logger.info).toHaveBeenCalledWith("User deleted", { userId });
    });

    it("ユーザー未存在", async () => {
      const payload: JWTPayload = { userId };
      vi.mocked(authMiddleware).mockReturnValue(payload);
      vi.mocked(User.findByPk).mockResolvedValue(null);

      const result = await userResolvers.Mutation.deleteUser(
        null,
        {},
        dummyCtx
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.field).toBe("user");
      expect(Task.destroy).not.toHaveBeenCalled();
    });

    it("ユーザー未認証", async () => {
      vi.mocked(authMiddleware).mockImplementation(() => {
        throw new Error("Authentication required");
      });

      const result = await userResolvers.Mutation.deleteUser(
        null,
        {},
        { req: { headers: {} } }
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.field).toBe("auth");
      expect(Task.destroy).not.toHaveBeenCalled();
    });
  });
});

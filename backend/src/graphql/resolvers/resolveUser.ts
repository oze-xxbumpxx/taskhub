import { Task, User } from "../../models";
import { authMiddleware, generateToken } from "../../utils/auth";
import { logger } from "../../utils/logger";
import {
  hashPassword,
  validatePasswordStrength,
  verifyPassword,
} from "../../utils/password";
import {
  CreateUserInput,
  UserError,
  UserResponse,
  AuthPayload,
  LoginInput,
} from "../../types/user";
import { AuthContext } from "../../types/auth";
import sequelize from "../../config/database";

// クエリ
const Query = {
  // 現在のユーザー情報取得
  getUser: async (
    parent: any,
    args: any,
    context: AuthContext
  ): Promise<User | null> => {
    try {
      // JWTトークン検証
      const authResult = authMiddleware(context);
      if (!authResult) {
        throw new Error("Authentication required");
      }

      // ユーザーIDの取得
      const userId = (authResult as any).userId;
      if (!userId || typeof userId !== "string") {
        throw new Error("Invalid token");
      }

      // ユーザー情報の取得
      const user = await User.findByPk(userId);
      if (!user) {
        logger.warn("User not found for authenticated token", { userId });
        throw new Error("User not found");
      }

      // ログ出力
      logger.info("User profile accessed", { userId, email: user.email });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      } as User;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to get user profile", { error: err.message });
      throw err;
    }
  },

  // 特定のユーザー情報取得
  user: async (parent: any, args: { id: string }, context: any) => {},
};

// ミューテーション
const Mutation = {
  // ユーザー登録
  register: async (
    parent: any,
    args: { input: CreateUserInput },
    context: any
  ): Promise<UserResponse> => {
    try {
      const { email, password, name } = args.input;

      // 入力値の検証
      if (!email || !password || !name) {
        return {
          success: false,
          errors: [{ field: "input", message: "All fields are required" }],
        };
      }

      // パスワード強度チェック
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          errors: passwordValidation.errors.map((error) => ({
            field: "password",
            message: error,
          })),
        };
      }

      // メールアドレスの重複チェック
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return {
          success: false,
          errors: [{ field: "email", message: "Email already exists" }],
        };
      }

      // パスワードハッシュ化
      const hashedPassword = await hashPassword(password);

      // ユーザー作成
      const user = await User.create({
        email,
        password: hashedPassword,
        name,
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        } as User,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("User registration failed:", { error: err.message });

      return {
        success: false,
        errors: [{ field: "general", message: "Registration failed" }],
      };
    }
  },
  // ログイン
  login: async (
    parent: any,
    args: { input: LoginInput },
    context: any
  ): Promise<UserResponse | AuthPayload> => {
    try {
      const { email, password } = args.input;
      if (!email || !password) {
        return {
          success: false,
          errors: [
            { field: "input", message: "Email and password are required" },
          ],
        };
      }

      // ユーザーの存在確認
      const user = await User.findOne({ where: { email } });
      if (!user) {
        logger.warn("Login attempt with non-existent email", { email });
        return {
          success: false,
          errors: [{ field: "email", message: "Invalid email or password" }],
        };
      }

      // パスワード検証
      const isPasswordValid = await verifyPassword(password, user.password);
      if (!isPasswordValid) {
        logger.warn("Login attempt with invalid password", {
          email,
          userId: user.id,
        });
        return {
          success: false,
          errors: [{ field: "password", message: "Invalid email or password" }],
        };
      }

      // JWTトークン作成
      const token = generateToken(user.id);

      // ログイン成功
      logger.info("User logged in successfully", {
        userId: user.id,
        email: user.email,
      });
      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        } as User,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Login failed:", { error: err.message });

      return {
        success: false,
        errors: [{ field: "general", message: "Login failed" }],
      };
    }
  },
  // ユーザー情報更新
  updateUser: async (
    _: any,
    { input }: { input: { name?: string; email?: string } },
    context: AuthContext
  ): Promise<UserResponse> => {
    try {
      const auth = authMiddleware(context);
      if (!auth) {
        return {
          success: false,
          errors: [{ field: "auth", message: "Authentication required" }],
        };
      }

      const userId = (auth as any).userId;
      if (!userId || typeof userId !== "string") {
        return {
          success: false,
          errors: [{ field: "auth", message: "Invalid token" }],
        };
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return {
          success: false,
          errors: [{ field: "user", message: "User not found" }],
        };
      }

      const updates: Partial<User> = {};
      if (input.name !== undefined) {
        const name = String(input.name).trim();
        if (!name || name.length > 100) {
          return {
            success: false,
            errors: [
              { field: "name", message: "Name must be 1-100 characters" },
            ],
          };
        }
        updates.name = name;
      }
      if (input.email !== undefined) {
        const email = String(input.email).trim();
        if (!email) {
          return {
            success: false,
            errors: [{ field: "email", message: "Email is required" }],
          };
        }
        // 重複チェック
        const dup = await User.findOne({
          where: { email },
        });
        if (dup && dup.id !== user.id) {
          return {
            success: false,
            errors: [{ field: "email", message: "Email already exists" }],
          };
        }
        updates.email = email;
      }

      if (Object.keys(updates).length === 0) {
        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          } as User,
        };
      }

      await user.update(updates);
      logger.info("User updated", { userId, updates });
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        } as User,
      };
    } catch (error: any) {
      logger.error("Failed to update user", { error: error.message });
      return {
        success: false,
        errors: [{ field: "general", message: "Failed to update user" }],
      };
    }
  },
  // ユーザー削除
  deleteUser: async (
    _: any,
    __: any,
    context: AuthContext
  ): Promise<UserResponse> => {
    const t = await sequelize.transaction();
    try {
      const auth = authMiddleware(context);
      if (!auth) {
        return {
          success: false,
          errors: [{ field: "auth", message: "Authentication required" }],
        };
      }
      const userId = (auth as any).userId;
      if (!userId || typeof userId !== "string") {
        return {
          success: false,
          errors: [{ field: "auth", message: "Invalid token" }],
        };
      }
      const user = await User.findByPk(userId, { transaction: t });
      if (!user) {
        await t.rollback();
        return {
          success: false,
          errors: [{ field: "user", message: "User not found" }],
        };
      }
      // 　タスク削除
      await Task.destroy({ where: { id: userId }, transaction: t });
      // プロジェクトはmodels/indexのCASCADEで削除される
      // ユーザー削除
      await user.destroy({ transaction: t });
      await t.commit();
      logger.info("User deleted", { userId });

      return { success: true };
    } catch (error) {
      await t.rollback();
      const message = error instanceof Error ? error.message : String(error);
      logger.error("Failed to delete user", { error: message });
      return {
        success: false,
        errors: [{ field: "general", message: "Failed to delete user" }],
      };
    }
  },
};

export const userResolvers = {
  Query,
  Mutation,
};

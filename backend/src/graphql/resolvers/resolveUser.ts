import { User } from "../../models";
import { generateToken } from "../../utils/auth";
import { logger } from "../../utils/logger";
import {
  hashPassword,
  validatePasswordStrength,
  verifyPassword,
} from "../../utils/password";

interface CreateUserInput {
  email: string;
  password: string;
  name: string;
}

interface UserError {
  field: string;
  message: string;
}

interface UserResponse {
  success: boolean;
  user?: User;
  errors?: UserError[];
}

interface AuthPayload {
  token: string;
  user: User;
}

interface LoginInput {
  email: string;
  password: string;
}

// クエリ
const Query = {
  // 現在のユーザー情報取得
  me: async (parent: any, args: any, context: any) => {},

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
  updateUser: async (parent: any, args: { input: any }, context: any) => {},
  // ユーザー削除
  deleteUser: async (parent: any, args: { input: any }, context: any) => {},
};

export const userResolvers = {
  Query,
  Mutation,
};

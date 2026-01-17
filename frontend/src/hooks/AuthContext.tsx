import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useApolloClient } from "@apollo/client/react";
import { LOGIN, REGISTER, LOGOUT, GET_USER } from "@/api/graphql";
import { tokenStorage } from "@/api/client";
import type { User, FieldError } from "@/types";
import { AuthContext, type AuthContextType } from "./authTypes";

// GraphQLレスポンスの型定義
interface GetUserResponse {
  getUser: User | null;
}

// ログインレスポンスの型定義（Union型）
interface LoginResponse {
  login: {
    token?: string;
    user?: User;
    success?: boolean;
    errors?: FieldError[];
  };
}

// 登録レスポンスの型定義
interface RegisterResponse {
  register: {
    success: boolean;
    user?: User;
    errors?: FieldError[];
  };
}

// プロバイダーコンポーネント
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const client = useApolloClient();
  const [user, setUser] = useState<User | null>(null);

  // トークンがある場合のみローディング状態にする
  const [isLoading, setIsLoading] = useState(() => Boolean(tokenStorage.get()));

  // ユーザー情報取得クエリ（v4ではonCompleted/onErrorが廃止）
  const { data, error } = useQuery<GetUserResponse>(GET_USER, {
    skip: !isLoading, // トークンがない場合はスキップ
  });

  // データ取得成功時の処理
  useEffect(() => {
    if (data?.getUser) {
      setUser(data.getUser);
      setIsLoading(false);
    }
  }, [data]);

  // エラー発生時の処理
  useEffect(() => {
    if (error) {
      tokenStorage.remove();
      setUser(null);
      setIsLoading(false);
    }
  }, [error]);

  // ログインミューテーション
  const [loginMutation] = useMutation<LoginResponse>(LOGIN);

  // 登録ミューテーション
  const [registerMutation] = useMutation<RegisterResponse>(REGISTER);

  // ログアウトミューテーション
  const [logoutMutation] = useMutation(LOGOUT);

  // ログイン処理
  const login = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ success: boolean; errors?: FieldError[] }> => {
      try {
        const { data } = await loginMutation({
          variables: { input: { email, password } },
        });

        const result = data?.login;

        // AuthPayload の場合（ログイン成功）
        if (result?.token && result.user) {
          tokenStorage.set(result.token);
          setUser(result.user);
          return { success: true };
        }

        // UserResponse の場合（ログイン失敗）
        if (result?.errors) {
          return { success: false, errors: result.errors };
        }

        return {
          success: false,
          errors: [{ field: "general", message: "Login failed" }],
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "An error occurred";
        return { success: false, errors: [{ field: "general", message }] };
      }
    },
    [loginMutation]
  );

  // 登録処理
  const register = useCallback(
    async (
      email: string,
      password: string,
      name: string
    ): Promise<{ success: boolean; errors?: FieldError[] }> => {
      try {
        const { data } = await registerMutation({
          variables: { input: { email, password, name } },
        });

        const result = data?.register;

        if (result?.success) {
          return { success: true };
        }

        return {
          success: false,
          errors: result?.errors || [
            { field: "general", message: "Registration failed" },
          ],
        };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "An error occurred";
        return { success: false, errors: [{ field: "general", message }] };
      }
    },
    [registerMutation]
  );

  // ログアウト処理
  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutMutation();
    } finally {
      tokenStorage.remove();
      setUser(null);
      await client.resetStore();
    }
  }, [logoutMutation, client]);

  // コンテキスト値のメモ化
  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

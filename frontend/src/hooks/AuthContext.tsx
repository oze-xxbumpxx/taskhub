import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useApolloClient } from "@apollo/client";
import { LOGIN, REGISTER, LOGOUT, GET_USER } from "@/api/graphql";
import { tokenStorage } from "@/api/client";
import type { User, FieldError } from "@/types";
import { AuthContext, type AuthContextType } from "./authTypes";

// プロバイダーコンポーネント
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const client = useApolloClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ユーザー情報取得クエリ
  useQuery(GET_USER, {
    skip: !tokenStorage.get(),
    onCompleted: (data) => {
      if (data?.getUser) {
        setUser(data.getUser);
      }
      setIsLoading(false);
    },
    onError: () => {
      tokenStorage.remove();
      setUser(null);
      setIsLoading(false);
    },
  });

  // 初期化時にトークンがなければローディング完了
  useEffect(() => {
    if (!tokenStorage.get()) {
      setIsLoading(false);
    }
  }, []);

  // ログインミューテーション
  const [loginMutation] = useMutation(LOGIN);

  // 登録ミューテーション
  const [registerMutation] = useMutation(REGISTER);

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
        if (result?.token) {
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

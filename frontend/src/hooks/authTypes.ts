import { createContext } from "react";
import type { User, FieldError } from "@/types";

// 認証状態の型定義
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// 認証コンテキストの型定義
export interface AuthContextType extends AuthState {
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; errors?: FieldError[] }>;
  register: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ success: boolean; errors?: FieldError[] }>;
  logout: () => Promise<void>;
}

// コンテキストの作成
export const AuthContext = createContext<AuthContextType | null>(null);


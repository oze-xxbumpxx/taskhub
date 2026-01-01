import { LoginForm, RegisterForm } from "@/components";
import { useState } from "react";

type AuthMode = "login" | "register";

export const AuthPage = () => {
  const [mode, setMode] = useState<AuthMode>("login");

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-board">TaskHub</h1>
        <p className="auth-subtitle">タスクをシンプルに管理</p>
        {mode === "login" ? (
          <LoginForm
            onSuccess={() => {
              // ログイン成功後は App 側（useAuthのisAuthenticated）で表示が切り替わる想定なので
              // ここでは何もしなくてOK（必要なら後で navigate などを入れる）
            }}
            onSwitchToRegister={() => setMode("register")}
          />
        ) : (
          <RegisterForm
            onSuccess={() => {
              // RegisterForm は「登録 → 自動ログイン」まで実装済みなので、
              // 成功時はログイン済み扱いになり App 側で表示が切り替わる想定
            }}
            onSwitchToLogin={() => setMode("login")}
          />
        )}
      </div>
    </div>
  );
};

import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "@/api/client";
import { AuthProvider, useAuth } from "@/hooks";
import "./App.css";
import { LoginForm } from "./components/auth/LoginForm";
import { Dashboard } from "./pages/Dashboard";
import { useState } from "react";
import { RegisterForm } from "./components/auth/RegisterForm";

type AuthView = "login" | "register";
// メインコンテンツ（認証状態に応じて表示を切り替え）
function MainContent() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [authView, setAuthView] = useState<AuthView>("login");

  if (isLoading) {
    return (
      <div className="loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="welcome">
        <h1>Welcome to TaskHub</h1>
        {authView === "login" ? (
          <>
            <p>Please login to continue</p>
            <LoginForm onSwitchToRegister={() => setAuthView("register")} />
          </>
        ) : (
          <>
            <p>Create your account</p>
            <RegisterForm onSwitchToLogin={() => setAuthView("login")} />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="header">
        <h1>TaskHub</h1>
        <div className="user-info">
          <span>Welcome, {user?.name}</span>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>
      <main className="main">
        <Dashboard />
      </main>
    </div>
  );
}

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </ApolloProvider>
  );
}

export default App;

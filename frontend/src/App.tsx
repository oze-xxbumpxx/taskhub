import { ApolloProvider } from "@apollo/client/react";
import { apolloClient } from "@/api/client";
import { AuthProvider, useAuth } from "@/hooks";
import "./App.css";
import { Dashboard } from "./pages/Dashboard";
import { AuthPage } from "./pages/AuthPage";
import { Toaster } from "react-hot-toast";
// メインコンテンツ（認証状態に応じて表示を切り替え）
function MainContent() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
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
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1f2937",
              color: "#f3f4f6",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: "8px",
              padding: "12px 16px",
            },
            success: {
              iconTheme: {
                primary: "#10b981",
                secondary: "#1f2937",
              },
            },
            error: {
              iconTheme: {
                primary: "#ef4444",
                secondary: "#1f2937",
              },
            },
          }}
        />
      </AuthProvider>
    </ApolloProvider>
  );
}

export default App;

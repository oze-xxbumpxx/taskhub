import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "@/api/client";
import { AuthProvider, useAuth } from "@/hooks";
import "./App.css";
import { Dashboard } from "./pages/Dashboard";
import { is } from "zod/locales";
import { AuthPage } from "./pages/AuthPage";
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
      </AuthProvider>
    </ApolloProvider>
  );
}

export default App;

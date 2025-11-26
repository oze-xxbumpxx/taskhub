import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "@/api/client";
import { AuthProvider, useAuth } from "@/hooks";
import "./App.css";

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
    return (
      <div className="welcome">
        <h1>Welcome to TaskHub</h1>
        <p>Please login to continue</p>
        {/* TODO: ログインフォームを実装 */}
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
        <p>Dashboard content will be here</p>
        {/* TODO: ダッシュボードコンテンツを実装 */}
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

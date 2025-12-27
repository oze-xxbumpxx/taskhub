import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import cors from "cors";
import dotenv from "dotenv";
import sequelize, { testConnection } from "./config/database";
import { typeDefs } from "./graphql/schema";
import { resolvers } from "./graphql/resolvers";
import { createAuthContext } from "./utils/auth";

// 環境変数の読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

async function startServer() {
  // データベース接続をスキップするオプション
  const SKIP_DB_CONNECTION = process.env.SKIP_DB_CONNECTION === "true";

  if (!SKIP_DB_CONNECTION) {
    try {
      await testConnection();

      // 開発環境ではテーブルを自動同期（本番では使わない）
      if (process.env.NODE_ENV === "development") {
        await sequelize.sync({ alter: false });
        console.log("📊 Database synchronized");
      }
    } catch (error) {
      console.warn(
        "⚠️ Database connection failed, continuing without database..."
      );
      console.warn("To skip database connection, set SKIP_DB_CONNECTION=true");
    }
  } else {
    console.log("⏭️ Skipping database connection");
  }
  // Apollo Serverの初期化
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  // ミドルウェアの設定
  app.use(cors());
  app.use(express.json());

  // GraphQLエンドポイント
  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => {
        // 認証ミドルウェアを実行
        const authContext = await createAuthContext(req);

        return {
          req,
          user: authContext.user,
          isAuthenticated: authContext.isAuthenticated,
        };
      },
    })
  );

  // ヘルスチェックエンドポイント
  app.get("/health", (req, res) => {
    void req;
    res.json({ status: "ok", message: "TaskHub API is running" });
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    console.log(`🏥 Health check at http://localhost:${PORT}/health`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

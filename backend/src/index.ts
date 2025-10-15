import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import cors from "cors";
import dotenv from "dotenv";
import sequelize, { testConnection } from "./config/database";

// 環境変数の読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

async function startServer() {
  await testConnection();

  // 開発環境ではテーブルを自動同期（本番では使わない）
  if (process.env.NODE_ENV === "development") {
    await sequelize.sync({ alter: false });
    console.log("📊 Database synchronized");
  }
  // Apollo Serverの初期化（仮）
  const server = new ApolloServer({
    typeDefs: `
      type Query {
        hello: String
      }
    `,
    resolvers: {
      Query: {
        hello: () => "Hello from TaskHub API!",
      },
    },
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
        // TODO: 認証ミドルウェアを追加
        return { req };
      },
    })
  );

  // ヘルスチェックエンドポイント
  app.get("/health", (req, res) => {
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

import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 4000;

// ミドルウェアの設定
app.use(cors());
app.use(express.json());

// ヘルスチェックエンドポイント
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "TaskHub API is running",
    timestamp: new Date().toISOString(),
  });
});

// 基本的なAPIエンドポイント
app.get("/api/status", (_req, res) => {
  res.json({
    server: "TaskHub Backend",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
  });
});

// エラーハンドリング
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

// 404ハンドリング
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`🚀 Simple server ready at http://localhost:${PORT}`);
  console.log(`🏥 Health check at http://localhost:${PORT}/health`);
  console.log(`📊 Status check at http://localhost:${PORT}/api/status`);
});

export default app;

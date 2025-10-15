import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// データベース接続の設定
const sequelize = new Sequelize({
  database: process.env.DB_NAME || "taskhub_db",
  username: process.env.DB_USER || "taskhub_user",
  password: process.env.DB_PASSWORD || "taskhub_password",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  dialect: "postgres",
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// データベース接続のテスト
export const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection has been established successfully.");
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
    throw error;
  }
};

export default sequelize;

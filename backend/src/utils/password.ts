import bcrypt from "bcrypt";
import { logger } from "./logger";

// パスワードをハッシュ化
export const hashPassword = async (password: string): Promise<string> => {
  try {
    // ソルトラウンド数(12が推奨)
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Password hashing failed:", { error: err.message });
    throw new Error("Password hashing failed");
  }
};

// パスワードを検証
export const verifyPassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    const isValid = await bcrypt.compare(password, hashedPassword);
    return isValid;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Password verification failed:", { error: err.message });
    throw new Error("Password verification failed");
  }
};

// パスワードの強度チェック
export const validatePasswordStrength = (
  password: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

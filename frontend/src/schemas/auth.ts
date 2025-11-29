import { ERROR_MESSAGES, VALIDATION } from "@/constants";
import { z } from "zod";

// ログインスキーマ
export const loginSchema = z.object({
  email: z
    .email({ message: ERROR_MESSAGES.EMAIL.INVALID })
    .min(1, ERROR_MESSAGES.REQUIRED("メールアドレス"))
    .max(
      VALIDATION.MAX_EMAIL_LENGTH,
      ERROR_MESSAGES.MAX_LENGTH("メールアドレス", VALIDATION.MAX_EMAIL_LENGTH)
    ),
  password: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED("パスワード"))
    .min(
      VALIDATION.MIN_PASSWORD_LENGTH,
      ERROR_MESSAGES.MIN_LENGTH("パスワード", VALIDATION.MIN_PASSWORD_LENGTH)
    ),
});

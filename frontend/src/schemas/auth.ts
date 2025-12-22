import { ERROR_MESSAGES, VALIDATION } from "@/constants";
import { z } from "zod";

// ログインスキーマ
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, ERROR_MESSAGES.REQUIRED("メールアドレス"))
    .email(ERROR_MESSAGES.EMAIL.INVALID)
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

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, ERROR_MESSAGES.REQUIRED("名前"))
      .max(
        VALIDATION.MAX_NAME_LENGTH,
        ERROR_MESSAGES.MAX_LENGTH("名前", VALIDATION.MAX_NAME_LENGTH)
      ),
    email: z
      .string()
      .min(1, ERROR_MESSAGES.REQUIRED("メールアドレス"))
      .email(ERROR_MESSAGES.EMAIL.INVALID)
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
      )
      .max(
        VALIDATION.MAX_PASSWORD_LENGTH,
        ERROR_MESSAGES.MAX_LENGTH("パスワード", VALIDATION.MAX_PASSWORD_LENGTH)
      ),
    confirmPassword: z
      .string()
      .min(1, ERROR_MESSAGES.REQUIRED("パスワード（確認）")),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: ERROR_MESSAGES.PASSWORD.MISMATCH,
  });

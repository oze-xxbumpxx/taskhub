import type { FieldError } from "@/types";
import { Input, Button } from "@/components";
import { useAuth } from "@/hooks";
import { loginSchema } from "@/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { ERROR_MESSAGES } from "@/constants";
import toast from "react-hot-toast";

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginForm = ({
  onSuccess,
  onSwitchToRegister,
}: LoginFormProps) => {
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const applyServerErrors = (serverErrors: FieldError[] | undefined) => {
    if (!serverErrors || serverErrors.length === 0) {
      setError("root", {
        type: "server",
        message: ERROR_MESSAGES.AUTH.LOGIN_FAILED,
      });
      return;
    }

    for (const { field, message } of serverErrors) {
      if (field === "general") {
        setError("root", { type: "server", message });
        continue;
      }
      if (field === "email") {
        setError("email", { type: "server", message });
        continue;
      }
      if (field === "password") {
        setError("password", { type: "server", message });
        continue;
      }

      // 想定外のfieldはフォーム全体エラーに寄せる
      setError("root", { type: "server", message });
    }
  };

  const onSubmit: SubmitHandler<LoginFormValues> = async (values) => {
    clearErrors("root");

    const result = await login(values.email, values.password);
    if (result.success) {
      toast.success("ログインに成功しました");
      onSuccess?.();
      return;
    }

    if (result.errors) {
      const generalError = result.errors.find((e) => e.field === "general");
      if (generalError) {
        toast.error(generalError.message);
      }
    }

    applyServerErrors(result.errors);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="login-form" noValidate>
      <Input
        label="メールアドレス"
        type="email"
        autoComplete="email"
        disabled={isSubmitting}
        error={errors.email?.message}
        {...register("email")}
      />

      <Input
        label="パスワード"
        type="password"
        autoComplete="current-password"
        disabled={isSubmitting}
        error={errors.password?.message}
        {...register("password")}
      />

      {errors.root?.message && (
        <div className="form-error" role="alert">
          {errors.root.message}
        </div>
      )}

      <Button type="submit" isLoading={isSubmitting} className="login-submit">
        ログイン
      </Button>

      {onSwitchToRegister && (
        <button
          type="button"
          className="switch-link"
          onClick={onSwitchToRegister}
          disabled={isSubmitting}
        >
          アカウントをお持ちでない方はこちら
        </button>
      )}
    </form>
  );
};

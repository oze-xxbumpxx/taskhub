import { useAuth } from "@/hooks";
import { registerSchema } from "@/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Input } from "../Input";
import { Button } from "../Button";
import type { FieldError } from "@/types";
import { z } from "zod";
import toast from "react-hot-toast";
interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterForm = ({
  onSuccess,
  onSwitchToLogin,
}: RegisterFormProps) => {
  const { register: registerUser, login } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const applyServerErrors = (serverErrors: FieldError[] | undefined) => {
    if (!serverErrors || serverErrors.length === 0) {
      setError("root", { type: "server", message: "登録に失敗しました" });
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
      if (field === "name") {
        setError("name", { type: "server", message });
        continue;
      }
      setError("root", { type: "server", message });
    }
  };

  const onSubmit: SubmitHandler<RegisterFormValues> = async (values) => {
    clearErrors("root");

    const registerResult = await registerUser(
      values.email,
      values.password,
      values.name
    );
    if (!registerResult.success) {
      applyServerErrors(registerResult.errors);
      const generalError = registerResult.errors?.find(
        (e) => e.field === "general"
      );
      if (generalError) {
        toast.error(generalError.message);
      }
      return;
    } else {
      toast.success("アカウントを作成しました");
    }

    const loginResult = await login(values.email, values.password);
    if (!loginResult.success) {
      setError("root", {
        type: "server",
        message:
          "登録は完了しましたが、自動ログインに失敗しました。ログインしてください。",
      });
      return;
    } else {
      toast.success("ログインに成功しました");
    }

    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="login-form" noValidate>
      <Input
        label="名前"
        type="text"
        autoComplete="name"
        disabled={isSubmitting}
        error={errors.name?.message}
        {...register("name")}
      />

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
        autoComplete="new-password"
        disabled={isSubmitting}
        error={errors.password?.message}
        {...register("password")}
      />
      <Input
        label="パスワード（確認）"
        type="password"
        autoComplete="new-password"
        disabled={isSubmitting}
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      {errors.root?.message && (
        <div className="form-error" role="alert">
          {errors.root.message}
        </div>
      )}

      <Button type="submit" isLoading={isSubmitting} className="login-submit">
        登録
      </Button>

      {onSwitchToLogin && (
        <button
          type="button"
          className="switch-link"
          onClick={onSwitchToLogin}
          disabled={isSubmitting}
        >
          すでにアカウントをお持ちの方はこちら
        </button>
      )}
    </form>
  );
};

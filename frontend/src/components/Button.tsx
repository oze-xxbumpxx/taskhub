import { type ButtonHTMLAttributes, type ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary";
  isLoading?: boolean;
}

export const Button = ({
  children,
  variant = "primary",
  isLoading = false,
  disabled,
  className,
  ...props
}: ButtonProps) => {
  const baseStyles = "btn";
  const variantStyles = variant === "primary" ? "btn-primary" : "btn-secondary";

  return (
    <button
      className={`${baseStyles} ${variantStyles}${className ? ` ${className}` : ""}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? "Loading..." : children}
    </button>
  );
};

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export const LoginForm = ({
  onSuccess,
  onSwitchToRegister,
}): LoginFormProps => {
  // フォーム状態の管理
  const [email, setEmail] = useState("");
};

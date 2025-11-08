import { AuthContextResult } from "../../src/types/auth";

export const getTestContext = async (options?: {
  auth?: AuthContextResult;
}) => {
  return {
    req: {
      headers: {
        authorization: options?.auth?.isAuthenticated
          ? `Bearer test-token`
          : undefined,
      },
    },
    // リゾルバが期待する追加コンテキストがあればここに追加する
    user: options?.auth?.user,
    isAuthenticated: options?.auth?.isAuthenticated,
  };
};

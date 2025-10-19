// クエリ
const Query = {
  // 現在のユーザー情報取得
  me: async (parent: any, args: any, context: any) => {},

  // 特定のユーザー情報取得
  user: async (parent: any, args: { id: string }, context: any) => {},
};

// ミューテーション
const Mutation = {
  // ユーザー登録
  register: async (parent: any, args: { input: any }, context: any) => {},
  // ログイン
  login: async (parent: any, args: { input: any }, context: any) => {},
  // ユーザー情報更新
  updateUser: async (parent: any, args: { input: any }, context: any) => {},
  // ユーザー削除
  deleteUser: async (parent: any, args: { input: any }, context: any) => {},
};

export const userResolvers = {
  Query,
  Mutation,
};

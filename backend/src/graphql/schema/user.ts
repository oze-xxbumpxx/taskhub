export const userSchema = `
# User型定義
type User {
id: ID!
email: String!
name: String!
createdAt: DateTime!
updatedAt: DateTime!
projects: [Project!]!
tasks: [Task!]!
}

# 現在のユーザ情報取得
type Query {
getUser: User
user(id: ID!): User
}
# User作成用の入力型
input CreateUserInput {
  email: String!
  password: String!
  name: String!
}

# User更新用の入力型
input UpdateUserInput {
  name: String
  email: String
}

# ログイン用の入力型
input LoginInput {
email: String!
password: String!
}

# 認証レスポンス型
type AuthPayload {
token: String!
user: User!
}

# エラーレスポンス用の型
type UserError {
field: String!
message: String!
}

# レスポンス型
type UserResponse {
success: Boolean!
user: User
errors: [UserError!]
}
`;

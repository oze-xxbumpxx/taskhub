export const projectSchema = ` 
# Project型定義
type Project {
id: ID!
name: String!
description: String
color: String!
userId: ID!
createdAt: DateTime!
updatedAt: DateTime!
user: User!
tasks: [Task!]!
}

# 入力型
input CreateProjectInput {
  name: String!
  description: String
  color: String
}

# 更新型
input UpdateProjectInput {
  name: String
  description: String
  color: String
}

# エラーレスポンス用の型
type ProjectError {
field: String!
message: String!
}

# レスポンス型
type ProjectResponse {
  success: Boolean!
  project: Project
  errors: [ProjectError!]
}

`;

export const baseSchema = `
# 基本のQuery型
type Query {
  hello: String
}

# 基本のMutation型
type Mutation {
  # 空のMutation（各スキーマでextendする）
}

# スカラー型
scalar DateTime
`;

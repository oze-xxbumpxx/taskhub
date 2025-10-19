export const taskSchema = `
# Task型定義
type Task {
id: ID!
title: String!
description: String
status: TaskStatus!
priority: TaskPriority!
dueDate: DateTime
completedAt: DateTime
projectId: ID
userId: ID!
createdAt: DateTime!
updatedAt: DateTime!
project: Project
user: User!
}

input CreateTaskInput {
  title: String!
  description: String
  status: TaskStatus
  priority: TaskPriority
  dueDate: String
  projectId: ID
}

input UpdateTaskInput {
  title: String
  description: String
  status: TaskStatus
  priority: TaskPriority
  dueDate: String
  projectId: ID
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


# Enum型
enum TaskStatus {
TODO
IN_PROGRESS
DONE
}

enum TaskPriority {
LOW
MEDIUM
HIGH
}
`;

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

# タスククエリ
type Query {
  tasks: [Task!]!
  task(id: ID!): Task
  getTask(id: ID!): TaskResponse!
  getTasks(filters: TaskFilters, sort: TaskSort, pagination: PaginationInput): TaskListResponse!
}

# タスクミューテーション
type Mutation {
  createTask(input: CreateTaskInput!): TaskResponse!
  updateTask(id: ID!, input: UpdateTaskInput!): TaskResponse!
  deleteTask(id: ID!): TaskResponse!
}

# エラーレスポンス用の型
type TaskError {
field: String!
message: String!
}

# レスポンス型
type TaskResponse {
success: Boolean!
task: Task
errors: [TaskError!]
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

# タスク一覧レスポンス型
type TaskListResponse {
  success: Boolean!
  tasks: [Task!]
  totalCount: Int
  errors: [TaskError!]
}

# タスクフィルター型
input TaskFilters {
  status: TaskStatus
  priority: TaskPriority
  projectId: ID
  dueDateFrom: String
  dueDateTo: String
}

# タスクソート型
input TaskSort {
  field: TaskSortField!
  direction: SortDirection!
}

# ページネーション入力型
input PaginationInput {
  page: Int
  limit: Int
}

# タスクソートフィールド
enum TaskSortField {
  title
  status
  priority
  dueDate
  createdAt
  updatedAt
}

# ソート方向
enum SortDirection {
  ASC
  DESC
}
`;

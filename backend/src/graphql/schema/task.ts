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
type TaskError {
field: String!
message: String!
}

# タスクレスポンス型
type TaskResponse {
success: Boolean!
task: Task
errors: [TaskError!]
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

enum TaskSortField {
TITLE
STATUS
PRIORITY
DUE_DATE
CREATED_AT
UPDATED_AT
}

enum SortDirection {
ASC
DESC
}

# クエリ型
extend type Query {
  # タスク一覧取得
  getTasks(
    filters: TaskFilters
    sort: TaskSort
    limit: Int
    offset: Int
  ): TaskListResponse!
  
  # 特定のタスク取得
  getTask(id: ID!): TaskResponse!
}

# ミューテーション型
extend type Mutation {
  # タスク作成
  createTask(input: CreateTaskInput!): TaskResponse!
  
  # タスク更新
  updateTask(id: ID!, input: UpdateTaskInput!): TaskResponse!
  
  # タスク削除
  deleteTask(id: ID!): TaskResponse!
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

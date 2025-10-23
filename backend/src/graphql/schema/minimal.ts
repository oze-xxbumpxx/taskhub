const minimalSchema = `
type Query {
  hello: String
}

type Mutation {
  createTask(input: CreateTaskInput!): TaskResponse!
}

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
}

input CreateTaskInput {
  title: String!
  description: String
  status: TaskStatus
  priority: TaskPriority
  dueDate: String
  projectId: ID
}

type TaskError {
  field: String!
  message: String!
}

type TaskResponse {
  success: Boolean!
  task: Task
  errors: [TaskError!]
}

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

scalar DateTime
`;

export default minimalSchema;

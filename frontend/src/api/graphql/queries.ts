import { gql } from "@apollo/client";

// ユーザー関連クエリ
export const GET_USER = gql`
  query GetUser {
    getUser {
      id
      email
      name
      createdAt
      updatedAt
    }
  }
`;

// タスク関連クエリ
export const GET_TASKS = gql`
  query GetTasks(
    $filters: TaskFilters
    $sort: TaskSort
    $pagination: PaginationInput
  ) {
    getTasks(filters: $filters, sort: $sort, pagination: $pagination) {
      success
      tasks {
        id
        title
        description
        status
        priority
        dueDate
        projectId
        userId
        createdAt
        updatedAt
      }
      totalCount
      errors {
        field
        message
      }
    }
  }
`;

export const GET_TASK = gql`
  query GetTask($id: ID!) {
    getTask(id: $id) {
      success
      task {
        id
        title
        description
        status
        priority
        dueDate
        projectId
        userId
        createdAt
        updatedAt
      }
      errors {
        field
        message
      }
    }
  }
`;

// プロジェクト関連クエリ
export const GET_PROJECTS = gql`
  query GetProjects {
    getProjects {
      success
      projects {
        id
        name
        description
        color
        userId
        createdAt
        updatedAt
      }
      totalCount
      errors {
        field
        message
      }
    }
  }
`;

export const GET_PROJECT = gql`
  query GetProject($id: ID!) {
    getProject(id: $id) {
      success
      project {
        id
        name
        description
        color
        userId
        createdAt
        updatedAt
      }
      errors {
        field
        message
      }
    }
  }
`;

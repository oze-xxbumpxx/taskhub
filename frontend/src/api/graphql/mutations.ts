import { gql } from "@apollo/client";

// 認証関連ミューテーション
export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      ... on AuthPayload {
        token
        user {
          id
          email
          name
        }
      }
      ... on UserResponse {
        success
        errors {
          field
          message
        }
      }
    }
  }
`;

export const REGISTER = gql`
  mutation Register($input: CreateUserInput!) {
    register(input: $input) {
      success
      user {
        id
        email
        name
      }
      errors {
        field
        message
      }
    }
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

// タスク関連ミューテーション
export const CREATE_TASK = gql`
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
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

export const UPDATE_TASK = gql`
  mutation UpdateTask($id: ID!, $input: UpdateTaskInput!) {
    updateTask(id: $id, input: $input) {
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

export const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id) {
      success
      errors {
        field
        message
      }
    }
  }
`;

// プロジェクト関連ミューテーション
export const CREATE_PROJECT = gql`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
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

export const UPDATE_PROJECT = gql`
  mutation UpdateProject($id: ID!, $input: UpdateProjectInput!) {
    updateProject(id: $id, input: $input) {
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

export const DELETE_PROJECT = gql`
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id) {
      success
      errors {
        field
        message
      }
    }
  }
`;

import { User, Task, Project } from "../../src/models";
import { vi } from "vitest";

export const mockUser = {
  id: "user-1",
  email: "test@exmaple.com",
  name: "Test User",
  password: "hashed-password",
};

export const mockTask = {
  id: "task-1",
  title: "Test Task",
  description: "Task description",
  status: "TODO",
  priority: "MEDIUM",
  userId: mockUser.id,
};

export const mockProject = {
  id: "project-1",
  name: "Test Project",
  description: "Project description",
  color: "#FF6B6B",
  userId: mockUser.id,
};

// Sequelize モデルを jest/vitest の spyOn でモックしやすくする
export const mockModel = () => {
  vi.spyOn(User, "findOne").mockResolvedValue(mockUser as any);
  vi.spyOn(User, "create").mockResolvedValue(mockUser as any);
  // Task, Project も同様に必要なメソッドをモック
};

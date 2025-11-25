import { describe, it, expect, vi, beforeEach } from "vitest";
import { Task, Project, TaskStatus, TaskPriority } from "../../../models";
import { authMiddleware } from "../../../utils/auth";
import { logger } from "../../../utils/logger";
import { taskResolvers } from "../resolveTask";

import {
  asTaskCreateReturn,
  asTaskFindByPkReturn,
  asProjectFindOneReturn,
  makeMinimalTask,
  makeMinimalProject,
  makeAuthContext,
  makeJWTPayload,
  asTaskArrayReturn,
  asTaskFindAndCountAllReturn,
  type TaskFindAndCountNumberResult,
} from "../../../../tests/helpers";

type FindAndCountAllReturn =
  | { rows: Task[]; count: number }
  | { rows: Task[]; count: Array<{ count: number; [key: string]: unknown }> };

type FindAndCountNumberResult = Extract<
  FindAndCountAllReturn,
  { count: number }
>;
// モックの設定（最初に配置する必要がある）
vi.mock("../../../config/database", () => ({
  default: {
    transaction: vi.fn(() => ({
      commit: vi.fn(),
      rollback: vi.fn(),
    })),
    define: vi.fn(),
    authenticate: vi.fn(),
    sync: vi.fn(),
  },
  testConnection: vi.fn(),
}));

vi.mock("../../../models", () => ({
  Task: {
    findOne: vi.fn(),
    create: vi.fn(),
    findByPk: vi.fn(),
    destroy: vi.fn(),
    findAndCountAll: vi.fn(),
    init: vi.fn(),
    belongsTo: vi.fn(),
    hasMany: vi.fn(),
  },
  Project: {
    findOne: vi.fn(),
    init: vi.fn(),
    hasMany: vi.fn(),
    belongsTo: vi.fn(),
  },
  User: {
    init: vi.fn(),
    hasMany: vi.fn(),
    belongsTo: vi.fn(),
  },
  TaskStatus: {
    TODO: "TODO",
    IN_PROGRESS: "IN_PROGRESS",
    DONE: "DONE",
  },
  TaskPriority: {
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH",
  },
}));

vi.mock("../../../utils/auth", () => ({
  generateToken: vi.fn(),
  authMiddleware: vi.fn(),
}));

vi.mock("../../../utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Task Resolvers", () => {
  type FindAndCountTasksResult = {
    rows: Task[];
    count: number;
  };

  type NumberCountResult = {
    count: number;
    rows: Task[];
  };
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const userId = "user-123";
  const dummyCtx = makeAuthContext("test-token");

  describe("Mutation.createTask", () => {
    const validInput = {
      title: "Test Task",
      description: "Test Description",
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
    };

    it("有効な入力でタスクが作成されること", async () => {
      vi.mocked(authMiddleware).mockReturnValue(makeJWTPayload(userId));
      const task = makeMinimalTask({
        id: "task-1",
        title: validInput.title,
        userId,
      });
      vi.mocked(Task.create).mockResolvedValue(asTaskCreateReturn(task));

      const result = await taskResolvers.Mutation.createTask(
        null,
        { input: validInput },
        dummyCtx
      );

      expect(result.success).toBe(true);
      expect(result.task?.title).toBe(validInput.title);
      expect(result.errors).toBeUndefined();
      expect(logger.info).toHaveBeenCalledWith("Task Created", {
        taskId: task.id,
        userId,
      });
    });

    it("未認証の場合エラーを返すこと", async () => {
      vi.mocked(authMiddleware).mockImplementation(() => null as any);

      const result = await taskResolvers.Mutation.createTask(
        null,
        { input: validInput },
        { req: { headers: {} } }
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.field).toBe("auth");
    });

    it("タイトルが空の場合エラーを返すこと", async () => {
      vi.mocked(authMiddleware).mockReturnValue(makeJWTPayload(userId));

      const result = await taskResolvers.Mutation.createTask(
        null,
        { input: { ...validInput, title: "" } },
        dummyCtx
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.field).toBe("title");
      expect(result.errors?.[0]?.message).toBe("Title is required");
    });

    it("タイトルが100文字を超える場合エラーを返すこと", async () => {
      vi.mocked(authMiddleware).mockReturnValue(makeJWTPayload(userId));

      const result = await taskResolvers.Mutation.createTask(
        null,
        { input: { ...validInput, title: "a".repeat(101) } },
        dummyCtx
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.field).toBe("title");
      expect(result.errors?.[0]?.message).toBe(
        "Title must be 100 characters or less"
      );
    });

    it("存在しないプロジェクトIDの場合エラーを返すこと", async () => {
      vi.mocked(authMiddleware).mockReturnValue(makeJWTPayload(userId));
      vi.mocked(Project.findOne).mockResolvedValue(null);

      const result = await taskResolvers.Mutation.createTask(
        null,
        { input: { ...validInput, projectId: "nonexistent" } },
        dummyCtx
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.field).toBe("project");
      expect(result.errors?.[0]?.message).toBe(
        "Project not found or access denied"
      );
    });

    it("プロジェクトIDが有効な場合タスクが作成されること", async () => {
      vi.mocked(authMiddleware).mockReturnValue(makeJWTPayload(userId));
      const project = makeMinimalProject({ id: "project-1", userId });
      vi.mocked(Project.findOne).mockResolvedValue(
        asProjectFindOneReturn(project)
      );
      const task = makeMinimalTask({
        id: "task-1",
        title: validInput.title,
        projectId: "project-1",
        userId,
      });
      vi.mocked(Task.create).mockResolvedValue(asTaskCreateReturn(task));

      const result = await taskResolvers.Mutation.createTask(
        null,
        { input: { ...validInput, projectId: "project-1" } },
        dummyCtx
      );

      expect(result.success).toBe(true);
      expect(result.task?.projectId).toBe("project-1");
    });
  });

  describe("Mutation.updateTask", () => {
    const taskId = "task-123";
    const updateInput = {
      title: "Updated Task",
      status: "IN_PROGRESS" as const,
    };

    it("タスクの更新が成功すること", async () => {
      vi.mocked(authMiddleware).mockReturnValue(makeJWTPayload(userId));
      const taskUpdate = vi.fn().mockResolvedValue(undefined);
      const task = {
        ...makeMinimalTask({ id: taskId, userId, title: "Old Title" }),
        update: taskUpdate,
      };
      vi.mocked(Task.findOne).mockResolvedValue(asTaskFindByPkReturn(task));

      const result = await taskResolvers.Mutation.updateTask(
        null,
        { id: taskId, input: updateInput },
        dummyCtx
      );

      expect(result.success).toBe(true);
      expect(taskUpdate).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith("Task updated", {
        taskId,
        userId,
      });
    });

    it("タスクが見つからない場合エラーを返すこと", async () => {
      vi.mocked(authMiddleware).mockReturnValue(makeJWTPayload(userId));
      vi.mocked(Task.findOne).mockResolvedValue(null);

      const result = await taskResolvers.Mutation.updateTask(
        null,
        { id: taskId, input: updateInput },
        dummyCtx
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.field).toBe("task");
      expect(result.errors?.[0]?.message).toBe("Task not found");
    });

    it("他のユーザーのタスクは更新できないこと", async () => {
      vi.mocked(authMiddleware).mockReturnValue(makeJWTPayload(userId));
      vi.mocked(Task.findOne).mockImplementation(async (options: unknown) => {
        const opts = options as { where?: { userId?: string } } | undefined;
        expect(opts?.where?.userId).toBe(userId);
        return null;
      });

      const result = await taskResolvers.Mutation.updateTask(
        null,
        { id: taskId, input: updateInput },
        dummyCtx
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.field).toBe("task");
    });
  });

  describe("Mutation.deleteTask", () => {
    const taskId = "task-123";

    it("タスクの削除が成功すること", async () => {
      vi.mocked(authMiddleware).mockReturnValue(makeJWTPayload(userId));
      const taskDestroy = vi.fn().mockResolvedValue(undefined);
      const task = {
        ...makeMinimalTask({ id: taskId, userId }),
        destroy: taskDestroy,
      };
      vi.mocked(Task.findOne).mockResolvedValue(asTaskFindByPkReturn(task));

      const result = await taskResolvers.Mutation.deleteTask(
        null,
        { id: taskId },
        dummyCtx
      );

      expect(result.success).toBe(true);
      expect(taskDestroy).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith("Task deleted", {
        taskId,
        userId,
      });
    });

    it("タスクが見つからない場合エラーを返すこと", async () => {
      vi.mocked(authMiddleware).mockReturnValue(makeJWTPayload(userId));
      vi.mocked(Task.findOne).mockResolvedValue(null);

      const result = await taskResolvers.Mutation.deleteTask(
        null,
        { id: taskId },
        dummyCtx
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.field).toBe("task");
    });
  });

  describe("Query.getTasks", () => {
    it("タスク一覧が取得できること", async () => {
      vi.mocked(authMiddleware).mockReturnValue(makeJWTPayload(userId));
      const tasks = [
        makeMinimalTask({ id: "task-1", userId }),
        makeMinimalTask({ id: "task-2", userId }),
      ];

      const sequelizeTasks = tasks
        .map((task) => asTaskFindByPkReturn(task))
        .filter((task): task is Task => task !== null);
      const findAndCountResult: TaskFindAndCountNumberResult = {
        count: 2,
        rows: sequelizeTasks,
      };

      vi.mocked(Task.findAndCountAll).mockResolvedValue(
        asTaskFindAndCountAllReturn(findAndCountResult)
      );

      // 値が崩れていないことを念のため確認
      expect(findAndCountResult.count).toBe(2);
      expect(findAndCountResult.rows).toHaveLength(2);

      vi.mocked(Task.findAndCountAll).mockResolvedValue(
        asTaskFindAndCountAllReturn(findAndCountResult)
      );

      const result = await taskResolvers.Query.getTasks(null, {}, dummyCtx);

      expect(result.success).toBe(true);
      expect(result.tasks?.length).toBe(2);
      expect(result.totalCount).toBe(2);
    });

    it("フィルタが適用されること", async () => {
      vi.mocked(authMiddleware).mockReturnValue(makeJWTPayload(userId));
      const tasks = [makeMinimalTask({ id: "task-1", userId, status: "TODO" })];
      const sequelizeTasks = tasks
        .map((task) => asTaskFindByPkReturn(task))
        .filter((task): task is Task => task !== null);
      const filteredResult: FindAndCountNumberResult = {
        count: 1,
        rows: sequelizeTasks,
      };
      vi.mocked(Task.findAndCountAll).mockResolvedValue(
        asTaskFindAndCountAllReturn(filteredResult)
      );

      const result = await taskResolvers.Query.getTasks(
        null,
        { filters: { status: "TODO" } },
        dummyCtx
      );

      expect(result.success).toBe(true);
      expect(Task.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "TODO" }),
        })
      );
    });
  });

  describe("Query.getTask", () => {
    const taskId = "task-123";

    it("タスクが取得できること", async () => {
      vi.mocked(authMiddleware).mockReturnValue(makeJWTPayload(userId));
      const task = makeMinimalTask({ id: taskId, userId });
      vi.mocked(Task.findOne).mockResolvedValue(asTaskFindByPkReturn(task));

      const result = await taskResolvers.Query.getTask(
        null,
        { id: taskId },
        dummyCtx
      );

      expect(result.success).toBe(true);
      expect(result.task?.id).toBe(taskId);
      expect(logger.info).toHaveBeenCalledWith("Task retrieved", {
        taskId,
        userId,
      });
    });

    it("タスクが見つからない場合エラーを返すこと", async () => {
      vi.mocked(authMiddleware).mockReturnValue(makeJWTPayload(userId));
      vi.mocked(Task.findOne).mockResolvedValue(null);

      const result = await taskResolvers.Query.getTask(
        null,
        { id: taskId },
        dummyCtx
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.field).toBe("task");
    });

    it("他のユーザーのタスクは取得できないこと", async () => {
      vi.mocked(authMiddleware).mockReturnValue(makeJWTPayload(userId));
      vi.mocked(Task.findOne).mockImplementation(async (options: unknown) => {
        const opts = options as { where?: { userId?: string } } | undefined;
        expect(opts?.where?.userId).toBe(userId);
        return null;
      });

      const result = await taskResolvers.Query.getTask(
        null,
        { id: taskId },
        dummyCtx
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]?.field).toBe("task");
    });
  });
});

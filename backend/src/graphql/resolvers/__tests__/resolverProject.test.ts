import { Project } from "../../../models";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testConnection } from "../../../config/database";
import {
  asProjectCreateReturn,
  asProjectFindOneReturn,
  makeAuthContext,
  makeJWTPayload,
  makeMinimalProject,
} from "../../../../tests/helpers";
import { authMiddleware } from "../../../utils/auth";
import { logger } from "../../../utils/logger";
import { projectResolvers } from "../resolveProject";

// Project.findAndCountAll の戻り値型
type ProjectFindAndCountAllReturn =
  | { rows: Project[]; count: number }
  | {
      rows: Project[];
      count: Array<{ count: number; [key: string]: unknown }>;
    };

type ProjectFindAndCountNumberResult = Extract<
  ProjectFindAndCountAllReturn,
  { count: number }
>;

// モックの設定
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
  Project: {
    findOne: vi.fn(),
    create: vi.fn(),
    findByPk: vi.fn(),
    destroy: vi.fn(),
    findAndCountAll: vi.fn(),
    init: vi.fn(),
    hasMany: vi.fn(),
    belongsTo: vi.fn(),
  },
  Task: {
    init: vi.fn(),
    belongsTo: vi.fn(),
    hasMany: vi.fn(),
  },
  User: {
    init: vi.fn(),
    hasMany: vi.fn(),
    belongsTo: vi.fn(),
  },
}));

vi.mock("../../../utils/auth", () => ({
  authMiddleware: vi.fn(),
}));

vi.mock("../../../utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Project Resolver", () => {
  const userId = "user-123";
  const dummyCtx = makeAuthContext("test-token");
  const validInput = {
    name: "テストプロジェクト",
    description: "テストプロジェクトの説明",
    color: "#3B82F6",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Mutation.createProject", () => {
    it("有効な入力でプロジェクトを作成できる", async () => {
      const project = makeMinimalProject({ id: "project-001", userId });
      vi.mocked(authMiddleware).mockReturnValue(makeJWTPayload(userId));
      vi.mocked(Project.create).mockResolvedValue(
        asProjectCreateReturn(project)
      );

      const result = await projectResolvers.Mutation.createProject(
        null,
        { input: validInput },
        dummyCtx
      );

      expect(result.success).toBe(true);
      expect(result.project?.id).toBe(project.id);
      expect(result.errors).toBeUndefined();
      expect(logger.info).toHaveBeenCalledWith("Project Created", {
        projectId: project.id,
        userId,
      });
    });

    it("未認証の場合は認証エラーを返す", async () => {
      vi.mocked(authMiddleware).mockImplementation(() => null as any);
      const result = await projectResolvers.Mutation.createProject(
        null,
        { input: validInput },
        { req: { headers: {} } }
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toMatchObject({
        field: "auth",
        message: "Authentication required",
      });
    });

    it("名前が空の場合はバリデーションエラ-", async () => {
      vi.mocked(authMiddleware).mockReturnValue(makeJWTPayload(userId));

      const result = await projectResolvers.Mutation.createProject(
        null,
        {
          input: { ...validInput, name: "" },
        },
        dummyCtx
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toMatchObject({
        field: "name",
        message: "Name is required",
      });
    });
  });

  describe("Mutation.updateProject", () => {
    it("正常系：所有するプロジェクトを更新できる", async () => {
      const stored = {
        ...makeMinimalProject({ id: "project-001", userId }),
        update: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(authMiddleware).mockReturnValue(makeJWTPayload(userId));
      vi.mocked(Project.findOne).mockResolvedValue(
        asProjectFindOneReturn(stored)
      );

      const result = await projectResolvers.Mutation.updateProject(
        null,
        { id: stored.id, input: { name: "更新後の名前" } },
        dummyCtx
      );

      expect(result.success).toBe(true);
      expect(Project.findOne).toHaveBeenCalledWith({
        where: { id: stored.id, userId },
      });
      expect(stored.update).toHaveBeenCalledWith({
        name: "更新後の名前",
        description: undefined,
        color: undefined,
      });
    });
    it("対象プロジェクトが存在しない場合はエラーを返す", async () => {
      vi.mocked(authMiddleware).mockReturnValue(makeJWTPayload(userId));
      vi.mocked(Project.findOne).mockResolvedValue(null);

      const result = await projectResolvers.Mutation.updateProject(
        null,
        { id: "missing-project", input: { name: "任意" } },
        dummyCtx
      );
      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toMatchObject({
        field: "project",
        message: "Project not found",
      });
    });
    it("nameが空文字の場合はバリデーションエラー", async () => {
      const stored = {
        ...makeMinimalProject({ id: "project-002", userId }),
        update: vi.fn(),
      };
      vi.mocked(authMiddleware).mockReturnValue(makeJWTPayload(userId));
      vi.mocked(Project.findOne).mockResolvedValue(
        asProjectFindOneReturn(stored)
      );

      const result = await projectResolvers.Mutation.updateProject(
        null,
        { id: stored.id, input: { name: "" } },
        dummyCtx
      );
      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toMatchObject({
        field: "name",
        message: "Name is required",
      });
      expect(stored.update).not.toHaveBeenCalled();
    });
    it("colorが不正な場合はバリデーションエラー", async () => {
      const stored = {
        ...makeMinimalProject({ id: "project-003", userId }),
        update: vi.fn(),
      };
      vi.mocked(authMiddleware).mockReturnValue(makeJWTPayload(userId));
      vi.mocked(Project.findOne).mockResolvedValue(
        asProjectFindOneReturn(stored)
      );

      const result = await projectResolvers.Mutation.updateProject(
        null,
        { id: stored.id, input: { color: "invalid-color" } },
        dummyCtx
      );

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toMatchObject({
        field: "color",
        message: "Color must be a valid hex color code (e.g., #3B82F6)",
      });
    });
  });
  describe("Mutation.deleteProject", () => {
    it("正常系：プロジェクトを削除できる", async () => {
      const stored = {
        ...makeMinimalProject({ id: "project-del-001", userId }),
        destroy: vi.fn().mockResolvedValue(undefined),
      };
      vi.mocked(authMiddleware).mockReturnValue(makeJWTPayload(userId));
      vi.mocked(Project.findOne).mockResolvedValue(
        asProjectFindOneReturn(stored)
      );
      const result = await projectResolvers.Mutation.deleteProject(
        null,
        { id: stored.id },
        dummyCtx
      );
      expect(result.success).toBe(true);
      expect(Project.findOne).toHaveBeenCalledWith({
        where: { id: stored.id, userId },
      });
      expect(stored.destroy).toHaveBeenCalled();
    });
    it("対象プロジェクトが存在しない場合はエラーを返す", async () => {
      vi.mocked(authMiddleware).mockReturnValue(makeJWTPayload(userId));
      vi.mocked(Project.findOne).mockResolvedValue(null);

      const result = await projectResolvers.Mutation.deleteProject(
        null,
        { id: "missing-project" },
        dummyCtx
      );
      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toMatchObject({
        field: "project",
        message: "Project not found",
      });
    });
  });
  describe("Query.getProject", () => {
    it("正常系:所有するプロジェクトを取得する", async () => {
      const project = makeMinimalProject({ id: "project-get-001", userId });
      vi.mocked(authMiddleware).mockReturnValue(makeJWTPayload(userId));
      vi.mocked(Project.findOne).mockResolvedValue(
        asProjectFindOneReturn(project)
      );

      const result = await projectResolvers.Query.getProject(
        null,
        { id: project.id },
        dummyCtx
      );
      expect(result.success).toBe(true);
      expect(result.project).toEqual(project);
      expect(Project.findOne).toHaveBeenCalledWith({
        where: { id: project.id, userId },
      });
    });
    it("存在しない場合はエラー返す", async () => {
      vi.mocked(authMiddleware).mockReturnValue(makeJWTPayload(userId));
      vi.mocked(Project.findOne).mockResolvedValue(null);

      const result = await projectResolvers.Query.getProject(
        null,
        { id: "missing-project" },
        dummyCtx
      );
      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toMatchObject({
        field: "project",
        message: "Project not found",
      });
    });
  });
  describe("Query.getProjects", () => {
    it("正常系：プロジェクト一覧を取得できる", async () => {
      const projects = [
        makeMinimalProject({ id: "p1", userId }),
        makeMinimalProject({ id: "p2", userId }),
      ];
      vi.mocked(authMiddleware).mockReturnValue(makeJWTPayload(userId));
      const mockResult: ProjectFindAndCountNumberResult = {
        rows: projects as any[],
        count: projects.length,
      };
      vi.mocked(Project.findAndCountAll).mockResolvedValue(mockResult as any);
      const result = await projectResolvers.Query.getProjects(
        null,
        {},
        dummyCtx
      );

      expect(result.success).toBe(true);
      expect(result.projects).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(Project.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
          limit: 20,
          offset: 0,
        })
      );
    });
    it("フィルタ条件が適用される", async () => {
      const projects = [
        makeMinimalProject({ id: "p1", userId, name: "Test Project" }),
      ];
      vi.mocked(authMiddleware).mockReturnValue(makeJWTPayload(userId));
      const mockResult: ProjectFindAndCountNumberResult = {
        rows: projects as any[],
        count: projects.length,
      };
      vi.mocked(Project.findAndCountAll).mockResolvedValue(mockResult as any);

      await projectResolvers.Query.getProjects(
        null,
        { filters: { name: "Test" } },
        dummyCtx
      );

      expect(Project.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            name: "Test",
          }),
        })
      );
    });
  });
});

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
      vi.mocked(authMiddleware).mockImplementation(() => {
        throw new Error("Authentication required");
      });

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
  });
});

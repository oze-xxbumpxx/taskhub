import { AuthContext } from "../../types/auth";
import {
  CreateProjectInput,
  UpdateProjectInput,
  ProjectResponse,
  ProjectListResponse,
} from "../../types/project";
import { authMiddleware } from "../../utils/auth";
import Project from "../../models/Project";
import { logger } from "../../utils/logger";

// 型ガードヘルパー: authMiddlewareの戻り値がuserIdを持つか検証
function hasUserId(v: unknown): v is { userId: string } {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as { userId?: unknown }).userId === "string" &&
    (v as { userId: string }).userId.trim().length > 0
  );
}

const Mutation = {
  // プロジェクト作成
  createProject: async (
    parent: unknown,
    args: { input: CreateProjectInput },
    context: AuthContext
  ): Promise<ProjectResponse> => {
    try {
      // 認証チェック
      const authResult = authMiddleware(context);
      if (!authResult) {
        return {
          success: false,
          errors: [{ field: "auth", message: "Authentication required" }],
        };
      }

      if (!hasUserId(authResult)) {
        return {
          success: false,
          errors: [{ field: "auth", message: "Invalid token" }],
        };
      }
      const userId = authResult.userId;

      // 入力値バリデーション
      if (
        !args.input.name ||
        typeof args.input.name !== "string" ||
        args.input.name.trim() === ""
      ) {
        return {
          success: false,
          errors: [{ field: "name", message: "Name is required" }],
        };
      }

      if (args.input.name.length > 100) {
        return {
          success: false,
          errors: [
            { field: "name", message: "Name must be 100 characters or less" },
          ],
        };
      }

      // カラーコードのバリデーション
      const color = args.input.color || "#3B82F6";
      if (!/^#[0-9A-F]{6}$/i.test(color)) {
        return {
          success: false,
          errors: [
            {
              field: "color",
              message: "Color must be a valid hex color code (e.g., #3B82F6)",
            },
          ],
        };
      }

      // プロジェクト作成
      const project = await Project.create({
        name: args.input.name.trim(),
        description: args.input.description || null,
        color: color,
        userId,
      });

      logger.info("Project Created", { projectId: project.id, userId });

      return {
        success: true,
        project,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to create project", { error: err.message });
      return {
        success: false,
        errors: [{ field: "general", message: "Failed to create project" }],
      };
    }
  },

  // プロジェクト更新
  updateProject: async (
    parent: unknown,
    args: { id: string; input: UpdateProjectInput },
    context: AuthContext
  ): Promise<ProjectResponse> => {
    try {
      // 認証チェック
      const authResult = authMiddleware(context);
      if (!authResult) {
        return {
          success: false,
          errors: [{ field: "auth", message: "Authentication required" }],
        };
      }

      if (!hasUserId(authResult)) {
        return {
          success: false,
          errors: [{ field: "auth", message: "Invalid token" }],
        };
      }
      const userId = authResult.userId;

      // プロジェクトの存在確認と所有権チェック
      const project = await Project.findOne({
        where: {
          id: args.id,
          userId,
        },
      });

      if (!project) {
        return {
          success: false,
          errors: [{ field: "project", message: "Project not found" }],
        };
      }

      const updateData: any = {};

      // name の更新
      if (args.input.name !== undefined) {
        if (
          typeof args.input.name !== "string" ||
          args.input.name.trim() === ""
        ) {
          return {
            success: false,
            errors: [{ field: "name", message: "Name is required" }],
          };
        }
        if (args.input.name.length > 100) {
          return {
            success: false,
            errors: [
              {
                field: "name",
                message: "Name must be 100 characters or less",
              },
            ],
          };
        }
        updateData.name = args.input.name.trim();
      }

      // description の更新
      if (args.input.description !== undefined) {
        updateData.description = args.input.description;
      }

      // color の更新
      if (args.input.color !== undefined) {
        if (args.input.color && !/^#[0-9A-F]{6}$/i.test(args.input.color)) {
          return {
            success: false,
            errors: [
              {
                field: "color",
                message: "Color must be a valid hex color code (e.g., #3B82F6)",
              },
            ],
          };
        }
        updateData.color = args.input.color || "#3B82F6";
      }

      // プロジェクト更新
      await project.update(updateData);
      logger.info("Project updated", { projectId: project.id, userId });

      return {
        success: true,
        project,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to update project", { error: err.message });
      return {
        success: false,
        errors: [{ field: "general", message: "Failed to update project" }],
      };
    }
  },

  // プロジェクト削除
  deleteProject: async (
    parent: unknown,
    args: { id: string },
    context: AuthContext
  ): Promise<ProjectResponse> => {
    try {
      // 認証チェック
      const authResult = authMiddleware(context);
      if (!authResult) {
        return {
          success: false,
          errors: [{ field: "auth", message: "Authentication required" }],
        };
      }

      if (!hasUserId(authResult)) {
        return {
          success: false,
          errors: [{ field: "auth", message: "Invalid token" }],
        };
      }
      const userId = authResult.userId;

      // プロジェクトの存在確認と所有権チェック
      const project = await Project.findOne({
        where: {
          id: args.id,
          userId,
        },
      });

      if (!project) {
        return {
          success: false,
          errors: [{ field: "project", message: "Project not found" }],
        };
      }

      // プロジェクト削除
      await project.destroy();

      // ログ出力
      logger.info("Project deleted", { projectId: project.id, userId });

      // 成功レスポンス
      return {
        success: true,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to delete project", { error: err.message });
      return {
        success: false,
        errors: [{ field: "general", message: "Failed to delete project" }],
      };
    }
  },
};

// Query リゾルバ
const Query = {
  // プロジェクト一覧取得
  getProjects: async (
    parent: unknown,
    args: {
      filters?: unknown;
      sort?: unknown;
      pagination?: unknown;
    },
    context: AuthContext
  ): Promise<ProjectListResponse> => {
    try {
      // 認証チェック
      const authResult = authMiddleware(context);
      if (!authResult) {
        return {
          success: false,
          errors: [{ field: "auth", message: "Authentication required" }],
        };
      }

      if (!hasUserId(authResult)) {
        return {
          success: false,
          errors: [{ field: "auth", message: "Invalid token" }],
        };
      }
      const userId = authResult.userId;

      // フィルター条件の構築
      const where: { userId: string; name?: string; color?: string } = {
        userId,
      };

      const filters = args.filters as
        | { name?: string; color?: string }
        | undefined;
      if (filters?.name && typeof filters.name === "string") {
        where.name = filters.name;
      }
      if (filters?.color && typeof filters.color === "string") {
        where.color = filters.color;
      }

      // ソート条件の構築
      const order: [string, string][] = [];
      const sort = args.sort as
        | { field?: string; direction?: string }
        | undefined;
      if (
        sort?.field &&
        typeof sort.field === "string" &&
        sort?.direction &&
        typeof sort.direction === "string"
      ) {
        order.push([sort.field, sort.direction.toUpperCase()]);
      } else {
        order.push(["createdAt", "DESC"]); // デフォルトソート
      }

      // ページネーション
      const pagination = args.pagination as
        | { limit?: number; offset?: number }
        | undefined;
      const limit =
        typeof pagination?.limit === "number" ? pagination.limit : 20;
      const offset =
        typeof pagination?.offset === "number" ? pagination.offset : 0;

      // プロジェクト取得
      const { count, rows: projects } = await Project.findAndCountAll({
        where,
        order,
        limit,
        offset,
      });

      logger.info("Projects retrieved", { userId, count });

      return {
        success: true,
        projects,
        totalCount: count,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to get projects", { error: err.message });
      return {
        success: false,
        errors: [{ field: "general", message: "Failed to get projects" }],
      };
    }
  },

  // 単一プロジェクト取得
  getProject: async (
    parent: unknown,
    args: { id: string },
    context: AuthContext
  ): Promise<ProjectResponse> => {
    try {
      // 認証チェック
      const authResult = authMiddleware(context);
      if (!authResult) {
        return {
          success: false,
          errors: [{ field: "auth", message: "Authentication required" }],
        };
      }

      if (!hasUserId(authResult)) {
        return {
          success: false,
          errors: [{ field: "auth", message: "Invalid token" }],
        };
      }
      const userId = authResult.userId;

      // プロジェクト取得
      const project = await Project.findOne({
        where: {
          id: args.id,
          userId,
        },
      });

      if (!project) {
        return {
          success: false,
          errors: [{ field: "project", message: "Project not found" }],
        };
      }

      logger.info("Project retrieved", { projectId: project.id, userId });

      return {
        success: true,
        project,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to get project", { error: err.message });
      return {
        success: false,
        errors: [{ field: "general", message: "Failed to get project" }],
      };
    }
  },
};

export const projectResolvers = {
  Query,
  Mutation,
};

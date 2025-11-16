import { Task, Project, TaskPriority, TaskStatus } from "../../models";
import { authMiddleware } from "../../utils/auth";
import { logger } from "../../utils/logger";
import { AuthContext } from "../../types/auth";
import { CreateTaskInput, TaskResponse } from "../../types/task";
import sequelize from "../../config/database";
import { Transaction } from "sequelize";

// 型ガードヘルパー: authMiddlewareの戻り値がuserIdを持つか検証
function hasUserId(v: unknown): v is { userId: string } {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as { userId?: unknown }).userId === "string" &&
    (v as { userId: string }).userId.trim().length > 0
  );
}

// Query リゾルバ
const Query = {
  // タスク一覧取得
  getTasks: async (
    parent: unknown,
    args: {
      filters?: any;
      sort?: any;
      pagination?: any;
    },
    context: AuthContext
  ) => {
    try {
      // 認証チェック
      let authResult: unknown;
      try {
        authResult = authMiddleware(context);
      } catch {
        return {
          success: false,
          errors: [{ field: "auth", message: "Authentication required" }],
        };
      }
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
      const where: any = { userId };

      if (args.filters?.status) {
        where.status = args.filters.status;
      }
      if (args.filters?.priority) {
        where.priority = args.filters.priority;
      }
      if (args.filters?.projectId) {
        where.projectId = args.filters.projectId;
      }

      // ソート条件の構築
      const order: any[] = [];
      if (args.sort?.field && args.sort?.direction) {
        order.push([args.sort.field, args.sort.direction.toUpperCase()]);
      } else {
        order.push(["createdAt", "DESC"]); // デフォルトソート
      }

      // ページネーション
      const limit = args.pagination?.limit || 20;
      const offset = args.pagination?.offset || 0;

      // タスク取得
      const { count, rows: tasks } = await Task.findAndCountAll({
        where,
        order,
        limit,
        offset,
      });

      logger.info("Tasks retrieved", { userId, count });

      return {
        success: true,
        tasks,
        totalCount: count,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to get tasks", { error: err.message });
      return {
        success: false,
        errors: [{ field: "general", message: "Failed to get tasks" }],
      };
    }
  },

  // 単一タスク取得
  getTask: async (
    parent: unknown,
    args: { id: string },
    context: AuthContext
  ) => {
    try {
      // 認証チェック
      let authResult: unknown;
      try {
        authResult = authMiddleware(context);
      } catch {
        return {
          success: false,
          errors: [{ field: "auth", message: "Authentication required" }],
        };
      }
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

      // タスク取得
      const task = await Task.findOne({
        where: {
          id: args.id,
          userId,
        },
      });

      if (!task) {
        return {
          success: false,
          errors: [{ field: "task", message: "Task not found" }],
        };
      }

      logger.info("Task retrieved", { taskId: task.id, userId });

      return {
        success: true,
        task,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to get task", { error: err.message });
      return {
        success: false,
        errors: [{ field: "general", message: "Failed to get task" }],
      };
    }
  },
};

const Mutation = {
  // タスク作成
  createTask: async (
    parent: unknown,
    args: { input: CreateTaskInput },
    context: AuthContext
  ): Promise<TaskResponse> => {
    try {
      // 認証チェック
      let authResult: unknown;
      try {
        authResult = authMiddleware(context);
      } catch {
        return {
          success: false,
          errors: [{ field: "auth", message: "Authentication required" }],
        };
      }
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
        !args.input.title ||
        typeof args.input.title !== "string" ||
        args.input.title.trim() === ""
      ) {
        return {
          success: false,
          errors: [{ field: "title", message: "Title is required" }],
        };
      }

      if (args.input.title.length > 100) {
        return {
          success: false,
          errors: [
            { field: "title", message: "Title must be 100 characters or less" },
          ],
        };
      }

      // プロジェクトの所有権チェック
      if (args.input.projectId) {
        const project = await Project.findOne({
          where: {
            id: args.input.projectId,
            userId,
          },
        });
        if (!project) {
          return {
            success: false,
            errors: [
              {
                field: "project",
                message: "Project not found or access denied",
              },
            ],
          };
        }
      }

      // タスク作成
      const task = await Task.create({
        title: args.input.title.trim(),
        description: args.input.description || null,
        status: args.input.status || TaskStatus.TODO,
        priority: args.input.priority || TaskPriority.MEDIUM,
        dueDate: args.input.dueDate ? new Date(args.input.dueDate) : null,
        projectId: args.input.projectId || null,
        userId,
      });

      logger.info("Task Created", { taskId: task.id, userId });

      return {
        success: true,
        task,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to create task", { error: err.message });
      return {
        success: false,
        errors: [{ field: "general", message: "Failed to create task" }],
      };
    }
  },
  // タスク更新
  updateTask: async (
    parent: unknown,
    args: { id: string; input: any },
    context: AuthContext
  ): Promise<TaskResponse> => {
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
      // タスクの存在確認と所有権チェック
      const task = await Task.findOne({
        where: {
          id: args.id,
          userId,
        },
      });
      if (!task) {
        return {
          success: false,
          errors: [{ field: "task", message: "Task not found" }],
        };
      }
      const updateData: any = {};
      // title の更新
      if (args.input.title !== undefined) {
        if (
          typeof args.input.title !== "string" ||
          args.input.title.trim() === ""
        ) {
          return {
            success: false,
            errors: [{ field: "title", message: "Title is required" }],
          };
        }
        updateData.title = args.input.title.trim();
      }

      // description の更新
      if (args.input.description !== undefined) {
        updateData.description = args.input.description;
      }

      // status の更新
      if (args.input.status !== undefined) {
        updateData.status = args.input.status;
      }

      // priority の更新
      if (args.input.priority !== undefined) {
        updateData.priority = args.input.priority;
      }

      // dueDate の更新
      if (args.input.dueDate !== undefined) {
        updateData.dueDate = args.input.dueDate
          ? new Date(args.input.dueDate)
          : null;
      }

      // projectId の更新（プロジェクト所有権チェック付き）
      if (args.input.projectId !== undefined) {
        if (args.input.projectId) {
          // プロジェクトの所有権チェック
          const project = await Project.findOne({
            where: {
              id: args.input.projectId,
              userId,
            },
          });
          if (!project) {
            return {
              success: false,
              errors: [
                {
                  field: "project",
                  message: "Project not found or access denied",
                },
              ],
            };
          }
        }
        updateData.projectId = args.input.projectId;
      }
      // タスク更新
      await task.update(updateData);
      logger.info("Task updated", { taskId: task.id, userId });
      return {
        success: true,
        task,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to update task", { error: err.message });
      return {
        success: false,
        errors: [{ field: "general", message: "Failed to update task" }],
      };
    }
  },
  // タスク削除
  deleteTask: async (
    parent: unknown,
    args: { id: string },
    context: AuthContext
  ): Promise<TaskResponse> => {
    let t: Transaction | null = null;
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

      // タスクの存在確認と所有権チェック
      const task = await Task.findOne({
        where: {
          id: args.id,
          userId,
        },
      });
      if (!task) {
        return {
          success: false,
          errors: [{ field: "task", message: "Task noto found" }],
        };
      }
      t = await sequelize.transaction();
      // タスク削除
      await task.destroy({ transaction: t });
      await t.commit();
      // ログ出力
      logger.info("Task deleted", { taskId: task.id, userId });

      //　成功レスポンス
      return {
        success: true,
      };
    } catch (error) {
      if (t) {
        await t.rollback();
      }
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to delete task", { error: err.message });
      return {
        success: false,
        errors: [{ field: "general", message: "Failed to delete task" }],
      };
    }
  },
};

export const taskResolvers = {
  Query,
  Mutation,
};

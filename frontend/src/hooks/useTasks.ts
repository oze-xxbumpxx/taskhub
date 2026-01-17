import { useQuery, useMutation, useApolloClient } from "@apollo/client/react";
import {
  GET_TASKS,
  GET_TASK,
  CREATE_TASK,
  UPDATE_TASK,
  DELETE_TASK,
} from "@/api/graphql";
import type { Task, TaskStatus, TaskPriority, FieldError } from "@/types";

// フィルター型
interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  projectId?: string;
}

// ソート型
interface TaskSort {
  field: string;
  direction: "ASC" | "DESC";
}

// ページネーション型
interface Pagination {
  limit?: number;
  offset?: number;
}

// タスク作成入力型
interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  projectId?: string;
}

// タスク更新入力型
interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  projectId?: string;
}

// タスク一覧取得フック
export const useTasks = (
  filters?: TaskFilters,
  sort?: TaskSort,
  pagination?: Pagination
) => {
  const { data, loading, error, refetch } = useQuery(GET_TASKS, {
    variables: { filters, sort, pagination },
    fetchPolicy: "cache-and-network",
  });

  return {
    tasks: (data?.getTasks?.tasks as Task[]) || [],
    totalCount: (data?.getTasks?.totalCount as number) || 0,
    loading,
    error,
    refetch,
  };
};

// 単一タスク取得フック
export const useTask = (id: string) => {
  const { data, loading, error, refetch } = useQuery(GET_TASK, {
    variables: { id },
    skip: !id,
  });

  return {
    task: data?.getTask?.task as Task | null,
    loading,
    error,
    refetch,
  };
};

// タスク作成フック
export const useCreateTask = () => {
  const client = useApolloClient();
  const [createTaskMutation, { loading }] = useMutation(CREATE_TASK);

  const createTask = async (
    input: CreateTaskInput
  ): Promise<{ success: boolean; task?: Task; errors?: FieldError[] }> => {
    try {
      const { data } = await createTaskMutation({
        variables: { input },
      });

      const result = data?.createTask;

      if (result?.success) {
        // キャッシュを更新
        await client.refetchQueries({ include: [GET_TASKS] });
        return { success: true, task: result.task };
      }

      return { success: false, errors: result?.errors };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create task";
      return { success: false, errors: [{ field: "general", message }] };
    }
  };

  return { createTask, loading };
};

// タスク更新フック
export const useUpdateTask = () => {
  const [updateTaskMutation, { loading }] = useMutation(UPDATE_TASK);

  const updateTask = async (
    id: string,
    input: UpdateTaskInput
  ): Promise<{ success: boolean; task?: Task; errors?: FieldError[] }> => {
    try {
      const { data } = await updateTaskMutation({
        variables: { id, input },
      });

      const result = data?.updateTask;

      if (result?.success) {
        return { success: true, task: result.task };
      }

      return { success: false, errors: result?.errors };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update task";
      return { success: false, errors: [{ field: "general", message }] };
    }
  };

  return { updateTask, loading };
};

// タスク削除フック
export const useDeleteTask = () => {
  const client = useApolloClient();
  const [deleteTaskMutation, { loading }] = useMutation(DELETE_TASK);

  const deleteTask = async (
    id: string
  ): Promise<{ success: boolean; errors?: FieldError[] }> => {
    try {
      const { data } = await deleteTaskMutation({
        variables: { id },
      });

      const result = data?.deleteTask;

      if (result?.success) {
        // キャッシュを更新
        await client.refetchQueries({ include: [GET_TASKS] });
        return { success: true };
      }

      return { success: false, errors: result?.errors };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete task";
      return { success: false, errors: [{ field: "general", message }] };
    }
  };

  return { deleteTask, loading };
};

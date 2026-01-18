import { useState } from "react";
import { useCreateTask, useDeleteTask } from "./useTasks";
import type { FieldError } from "@/types";
import toast from "react-hot-toast";

interface CreateTaskData {
  title: string;
  description?: string;
}

interface UseTaskOperationsOptions {
  projectId: string | null;
}

export const useTaskOperations = ({ projectId }: UseTaskOperationsOptions) => {
  const { createTask, loading: creating } = useCreateTask();
  const { deleteTask, loading: deleting } = useDeleteTask();

  const [createErrors, setCreateErrors] = useState<FieldError[] | null>(null);
  const [deleteErrors, setDeleteErrors] = useState<FieldError[] | null>(null);

  const handleCreate = async (data: CreateTaskData): Promise<boolean> => {
    setCreateErrors(null);

    const title = data.title.trim();
    if (!title) {
      setCreateErrors([{ field: "title", message: "Title is required" }]);
      return false;
    }

    if (!projectId) {
      setCreateErrors([
        { field: "projectId", message: "Please select a project first" },
      ]);
      return false;
    }

    const result = await createTask({
      title,
      description: data.description,
      projectId,
    });

    if (result.success) {
      toast.success("タスクを作成しました");
      return true;
    }

    setCreateErrors(
      result.errors ?? [{ field: "general", message: "Failed to create task" }]
    );
    const generalError = result.errors?.find((e) => e.field === "general");
    if (generalError) {
      toast.error(generalError.message);
    }
    return false;
  };

  const handleDelete = async (taskId: string) => {
    setDeleteErrors(null);

    const ok = window.confirm("このタスクを削除しますか？");
    if (!ok) return;

    const result = await deleteTask(taskId);
    if (result.success) {
      toast.success("タスクを削除しました");
      return;
    }

    setDeleteErrors(
      result.errors ?? [{ field: "general", message: "Failed to delete task" }]
    );
    const generalError = result.errors?.find((e) => e.field === "general");
    if (generalError) {
      toast.error(generalError.message);
    }
  };

  return {
    // Create
    createTask: handleCreate,
    creating,
    createErrors,
    // Delete
    deleteTask: handleDelete,
    deleting,
    deleteErrors,
  };
};

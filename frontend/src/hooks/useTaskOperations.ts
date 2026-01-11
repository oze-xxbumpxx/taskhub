import { useState } from "react";
import { useCreateTask, useDeleteTask } from "./useTasks";
import type { FieldError } from "@/types";

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

  const handleCreate = async (data: CreateTaskData) => {
    setCreateErrors(null);

    const title = data.title.trim();
    if (!title) {
      setCreateErrors([{ field: "title", message: "Title is required" }]);
      return;
    }

    if (!projectId) {
      setCreateErrors([
        { field: "projectId", message: "Please select a project first" },
      ]);
      return;
    }

    const result = await createTask({
      title,
      description: data.description,
      projectId,
    });

    if (result.success) {
      return;
    }

    setCreateErrors(
      result.errors ?? [{ field: "general", message: "Failed to create task" }]
    );
  };

  const handleDelete = async (taskId: string) => {
    setDeleteErrors(null);

    const ok = window.confirm("このタスクを削除しますか？");
    if (!ok) return;

    const result = await deleteTask(taskId);
    if (result.success) {
      return;
    }

    setDeleteErrors(
      result.errors ?? [{ field: "general", message: "Failed to delete task" }]
    );
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

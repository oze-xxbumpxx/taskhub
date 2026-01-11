import type { FieldError, Task, TaskPriority, TaskStatus } from "@/types";
import { useUpdateTask } from "./useTasks";
import { useState } from "react";

interface EditValues {
  title: string;
  description: string;
  priority: TaskPriority;
}

export const useTaskEdit = () => {
  const { updateTask, loading } = useUpdateTask();

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<TaskPriority>("MEDIUM");
  const [errors, setErrors] = useState<FieldError[] | null>(null);

  const startEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description ?? "");
    setEditPriority(task.priority);
    setErrors(null);
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditTitle("");
    setEditDescription("");
    setEditPriority("MEDIUM");
    setErrors(null);
  };

  const saveEdit = async () => {
    if (!editingTaskId) return;
    setErrors(null);

    const title = editTitle.trim();
    if (!title) {
      setErrors([{ field: "title", message: "Title is required" }]);
      return;
    }

    const result = await updateTask(editingTaskId, {
      title,
      description: editDescription.trim() || undefined,
      priority: editPriority,
    });

    if (result.success) {
      cancelEdit();
      return;
    }

    setErrors(
      result.errors ?? [{ field: "general", message: "Failed to update task" }]
    );
  };

  const changeField = (
    field: "title" | "description" | "priority",
    value: string
  ) => {
    if (field === "title") setEditTitle(value);
    if (field === "description") setEditDescription(value);
    if (field === "priority") setEditPriority(value as TaskPriority);
  };

  const updateStatus = async (taskId: string, newStatus: TaskStatus) => {
    setErrors(null);

    const result = await updateTask(taskId, { status: newStatus });
    if (result.success) {
      return;
    }

    setErrors(
      result.errors ?? [
        { field: "general", message: "Failed to update task status" },
      ]
    );
  };

  const editValues: EditValues = {
    title: editTitle,
    description: editDescription,
    priority: editPriority,
  };

  return {
    editingTaskId,
    editValues,
    errors,
    loading,
    startEdit,
    cancelEdit,
    saveEdit,
    changeField,
    updateStatus,
  };
};

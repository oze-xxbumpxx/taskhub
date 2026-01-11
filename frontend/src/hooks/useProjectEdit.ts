import { useState } from "react";
import { useUpdateProject } from "./useProjects";
import type { Project, FieldError } from "@/types";

interface EditValues {
  name: string;
  description: string;
  color: string;
}

export const useProjectEdit = () => {
  const { updateProject, loading } = useUpdateProject();

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editColor, setEditColor] = useState("#3B82F6");
  const [errors, setErrors] = useState<FieldError[] | null>(null);

  const startEdit = (project: Project) => {
    setEditingProjectId(project.id);
    setEditName(project.name);
    setEditDescription(project.description ?? "");
    setEditColor(project.color ?? "#3B82F6");
    setErrors(null);
  };

  const cancelEdit = () => {
    setEditingProjectId(null);
    setEditName("");
    setEditDescription("");
    setEditColor("#3B82F6");
    setErrors(null);
  };

  const saveEdit = async () => {
    if (!editingProjectId) return;
    setErrors(null);

    const name = editName.trim();
    if (!name) {
      setErrors([{ field: "name", message: "Name is required" }]);
      return;
    }

    const result = await updateProject(editingProjectId, {
      name,
      description: editDescription.trim() || undefined,
      color: editColor,
    });

    if (result.success) {
      cancelEdit();
      return;
    }

    setErrors(
      result.errors ?? [
        { field: "general", message: "Failed to update project" },
      ]
    );
  };

  const changeField = (
    field: "name" | "description" | "color",
    value: string
  ) => {
    if (field === "name") setEditName(value);
    if (field === "description") setEditDescription(value);
    if (field === "color") setEditColor(value);
  };

  const editValues: EditValues = {
    name: editName,
    description: editDescription,
    color: editColor,
  };

  return {
    editingProjectId,
    editValues,
    errors,
    loading,
    startEdit,
    cancelEdit,
    saveEdit,
    changeField,
  };
};

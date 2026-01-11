import type { FieldError, Project } from "@/types";
import { useCreateProject, useDeleteProject } from "./useProjects";
import { useState } from "react";

interface CreateProjectData {
  name: string;
  description?: string;
  color: string;
}

interface UseProjectOperationsOptions {
  projects: Project[];
  selectedProjectId: string | null;
  onProjectCreated: (projectId: string) => void;
  onProjectDeleted: (projectId: string | null) => void;
}

export const useProjectOperations = ({
  projects,
  selectedProjectId,
  onProjectCreated,
  onProjectDeleted,
}: UseProjectOperationsOptions) => {
  const { createProject, loading: creating } = useCreateProject();
  const { deleteProject, loading: deleting } = useDeleteProject();

  const [createErrors, setCreateErrors] = useState<FieldError[] | null>(null);
  const [deleteErrors, setDeleteErrors] = useState<FieldError[] | null>(null);

  const effectiveSelectedProjectId =
    selectedProjectId && projects.some((p) => p.id === selectedProjectId)
      ? selectedProjectId
      : (projects[0]?.id ?? null);

  const handleCreate = async (data: CreateProjectData) => {
    setCreateErrors(null);

    const name = data.name.trim();
    if (!name) {
      setCreateErrors([{ field: "name", message: "Name is required" }]);
      return;
    }

    const result = await createProject({
      name,
      description: data.description,
      color: data.color,
    });

    if (result.success) {
      const newProjectId = result.project?.id;
      if (newProjectId) {
        onProjectCreated(newProjectId);
      }
      return;
    }

    setCreateErrors(
      result.errors ?? [
        { field: "general", message: "Failed to create project" },
      ]
    );
  };

  const handleDelete = async (projectId: string) => {
    setDeleteErrors(null);

    const ok = window.confirm("このプロジェクトを削除しますか？");
    if (!ok) return;

    const nextSelectedProjectId =
      projects.find((p) => p.id !== projectId)?.id ?? null;

    const result = await deleteProject(projectId);
    if (result.success) {
      if (effectiveSelectedProjectId === projectId) {
        onProjectDeleted(nextSelectedProjectId);
      }
      return;
    }

    setDeleteErrors(
      result.errors ?? [
        { field: "general", message: "Failed to delete project" },
      ]
    );
  };

  return {
    // Computed
    effectiveSelectedProjectId,
    // Create
    createProject: handleCreate,
    creating,
    createErrors,
    // Delete
    deleteProject: handleDelete,
    deleting,
    deleteErrors,
  };
};

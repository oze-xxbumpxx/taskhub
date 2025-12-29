import { Button, Input } from "@/components";
import {
  useCreateProject,
  useCreateTask,
  useDeleteProject,
  useProjects,
  useTasks,
} from "@/hooks";
import type { FieldError } from "@/types";
import { useMemo, useState } from "react";

export const Dashboard = () => {
  const {
    projects,
    loading: projectLoading,
    error: projectsError,
  } = useProjects();

  const { createProject, loading: creatingProject } = useCreateProject();
  const { deleteProject, loading: deletingProject } = useDeleteProject();
  const { createTask, loading: creatingTask } = useCreateTask();
  const [deleteProjectErrors, setDeleteProjectErrors] = useState<
    FieldError[] | null
  >(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [createTaskErrors, setCreateTaskErrors] = useState<FieldError[] | null>(
    null
  );

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectColor, setProjectColor] = useState("#3B82F6");
  const [createProjectErrors, setCreateProjectErrors] = useState<
    FieldError[] | null
  >(null);

  const onCreateTask = async () => {
    setCreateTaskErrors(null);

    const title = taskTitle.trim();
    if (!title) {
      setCreateTaskErrors([{ field: "title", message: "Title is required" }]);
      return;
    }

    if (!effectiveSelectedProjectId) {
      setCreateProjectErrors([
        { field: "projectId", message: "Please select a project first" },
      ]);
      return;
    }

    const result = await createTask({
      title,
      description: taskDescription.trim() ? taskDescription.trim() : undefined,
      projectId: effectiveSelectedProjectId,
    });

    if (result.success) {
      setTaskTitle("");
      setTaskDescription("");
      return;
    }

    setCreateTaskErrors(
      result.errors ?? [{ field: "general", message: "Failed to create task" }]
    );
  };
  const onCreateProject = async () => {
    setCreateProjectErrors(null);

    const name = projectName.trim();
    if (!name) {
      setCreateProjectErrors([{ field: "name", message: "Name is required" }]);
      return;
    }
    const result = await createProject({
      name,
      description: projectDescription.trim()
        ? projectDescription.trim()
        : undefined,
      color: projectColor,
    });

    if (result.success) {
      const newProjectId = result.project?.id;
      if (newProjectId) {
        setSelectedProjectId(newProjectId);
      }
      setProjectName("");
      setProjectDescription("");
      setProjectColor("#3B82F6");
      return;
    }

    setCreateProjectErrors(
      result.errors ?? [
        { field: "general", message: "Failed to create project" },
      ]
    );
  };
  const effectiveSelectedProjectId =
    selectedProjectId && projects.some((p) => p.id === selectedProjectId)
      ? selectedProjectId
      : (projects[0]?.id ?? null);

  const onDeleteProject = async (projectId: string) => {
    setDeleteProjectErrors(null);

    const ok = window.confirm("このプロジェクトを削除しますか？");
    if (!ok) return;

    // 削除後に選ぶ候補
    const nextSelectedProjectId =
      projects.find((p) => p.id !== projectId)?.id ?? null;

    const result = await deleteProject(projectId);
    if (result.success) {
      if (effectiveSelectedProjectId === projectId) {
        setSelectedProjectId(nextSelectedProjectId);
      }
      return;
    }

    setDeleteProjectErrors(
      result.errors ?? [
        { field: "general", message: "Failed to delete projecrt" },
      ]
    );
  };

  const taskFilters = useMemo(() => {
    if (!effectiveSelectedProjectId) return undefined;
    return {
      projectId: effectiveSelectedProjectId,
    };
  }, [effectiveSelectedProjectId]);

  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
  } = useTasks(taskFilters);

  if (projectLoading) return <p>Loading projects...</p>;
  if (projectsError) return <p>Failed to load projects</p>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16 }}>
      <aside>
        <h2>Projects</h2>
        {/* {Delete Project form} */}
        {deleteProjectErrors?.length ? (
          <div role="alert">
            {deleteProjectErrors.map((e, i) => (
              <div key={`${e.field}-${i}`}>{e.message}</div>
            ))}
          </div>
        ) : null}
        {/* {Crete Project Form} */}
        <div style={{ marginBottom: 16 }}>
          <Input
            label="Project name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            disabled={creatingProject}
          />
          <Input
            label="Description"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            disabled={creatingProject}
          />
          <Input
            label="Color"
            value={projectColor}
            onChange={(e) => setProjectColor(e.target.value)}
            disabled={creatingProject}
          />
          {createProjectErrors?.length ? (
            <div role="alert">
              {createProjectErrors.map((err, idx) => (
                <div key={`${err.field}-${idx}`}>{err.message}</div>
              ))}
            </div>
          ) : null}

          <Button
            type="button"
            onClick={onCreateProject}
            isLoading={creatingProject}
          >
            Create Project
          </Button>
        </div>
        {projects.length === 0 ? (
          <p>No projects found</p>
        ) : (
          <ul>
            {projects.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelectedProjectId(p.id)}
                >
                  {p.name}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteProject(p.id)}
                  disabled={deletingProject}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <section>
        <h2>Tasks</h2>
        {/* ✅ Create Task Form */}
        <div style={{ marginBottom: 16 }}>
          <Input
            label="Task title"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            disabled={creatingTask}
          />
          <Input
            label="Description"
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            disabled={creatingTask}
          />

          {createTaskErrors?.length ? (
            <div role="alert">
              {createTaskErrors.map((err, idx) => (
                <div key={`${err.field}-${idx}`}>{err.message}</div>
              ))}
            </div>
          ) : null}

          <Button type="button" onClick={onCreateTask} isLoading={creatingTask}>
            Create task
          </Button>
        </div>

        {tasksLoading && <p>Loading tasks...</p>}
        {tasksError && <p role="alert">Failed to load tasks</p>}

        {!tasksLoading && !tasksError && (
          <>
            {tasks.length === 0 ? (
              <p>No tasks found</p>
            ) : (
              <ul>
                {tasks.map((t) => (
                  <li key={t.id}>
                    <strong>{t.title}</strong>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  );
};

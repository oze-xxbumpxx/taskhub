import { ProjectForm, ProjectItem } from "@/components/projects";
import { TaskForm, TaskItem } from "@/components/tasks";
import {
  useCreateProject,
  useCreateTask,
  useDeleteProject,
  useDeleteTask,
  useProjects,
  useTasks,
  useUpdateProject,
  useUpdateTask,
} from "@/hooks";
import type {
  FieldError,
  Project,
  Task,
  TaskPriority,
  TaskStatus,
} from "@/types";
import { useMemo, useState } from "react";

export const Dashboard = () => {
  const {
    projects,
    loading: projectLoading,
    error: projectsError,
  } = useProjects();

  const { createProject, loading: creatingProject } = useCreateProject();
  const { deleteProject } = useDeleteProject();
  const { createTask, loading: creatingTask } = useCreateTask();
  const { deleteTask } = useDeleteTask();
  const { updateTask, loading: updatingTask } = useUpdateTask();
  const { updateProject, loading: updatingProject } = useUpdateProject();
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [deleteProjectErrors, setDeleteProjectErrors] = useState<
    FieldError[] | null
  >(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [deleteTaskErrors, setDeleteTaskErrors] = useState<FieldError[] | null>(
    null
  );

  const [updateTaskErrors, setUpdateTaskErrors] = useState<FieldError[] | null>(
    null
  );
  const [createTaskErrors, setCreateTaskErrors] = useState<FieldError[] | null>(
    null
  );

  const [updateProjectErrors, setUpdateProjectErrors] = useState<
    FieldError[] | null
  >(null);

  const [createProjectErrors, setCreateProjectErrors] = useState<
    FieldError[] | null
  >(null);

  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [editTaskPriority, setEditTaskPriority] =
    useState<TaskPriority>("MEDIUM");

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectDescription, setEditProjectDescription] = useState("");
  const [editProjectColor, setEditProjectColor] = useState("#3B82F6");

  const onCreateTask = async (data: {
    title: string;
    description?: string;
  }) => {
    setCreateTaskErrors(null);

    const title = data.title.trim();
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
      description: data.description,
      projectId: effectiveSelectedProjectId,
    });

    if (result.success) {
      return;
    }

    setCreateTaskErrors(
      result.errors ?? [{ field: "general", message: "Failed to create task" }]
    );
  };
  const onCreateProject = async (data: {
    name: string;
    description?: string;
    color: string;
  }) => {
    setCreateProjectErrors(null);

    const name = data.name.trim();
    if (!name) {
      setCreateProjectErrors([{ field: "name", message: "Name is required" }]);
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
        setSelectedProjectId(newProjectId);
      }
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
        { field: "general", message: "Failed to delete project" },
      ]
    );
  };

  const onDeleteTask = async (taskId: string) => {
    setDeleteTaskErrors(null);

    const ok = window.confirm("このタスクを削除しますか？");
    if (!ok) return;

    const result = await deleteTask(taskId);
    if (result.success) {
      return;
    }

    setDeleteTaskErrors(
      result.errors ?? [{ field: "general", message: "Failed to delete task" }]
    );
  };

  const onUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    setUpdateTaskErrors(null);

    const result = await updateTask(taskId, { status: newStatus });
    if (result.success) {
      return;
    }

    setUpdateTaskErrors(
      result.errors ?? [
        { field: "general", message: "Failed to update task status" },
      ]
    );
  };

  const onStartEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description ?? "");
    setEditTaskPriority(task.priority);
    setUpdateTaskErrors(null);
  };

  const onEditTaskChange = (
    field: "title" | "description" | "priority",
    value: string
  ) => {
    if (field === "title") setEditTaskTitle(value);
    if (field === "description") setEditTaskDescription(value);
    if (field === "priority") setEditTaskPriority(value as TaskPriority);
  };
  // 編集をキャンセル
  const onCancelEditTask = () => {
    setEditingTaskId(null);
    setEditTaskTitle("");
    setEditTaskDescription("");
    setEditTaskPriority("MEDIUM");
    setUpdateTaskErrors(null);
  };

  // 編集を保存
  const onSaveEditTask = async () => {
    if (!editingTaskId) return;
    setUpdateTaskErrors(null);

    const title = editTaskTitle.trim();
    if (!title) {
      setUpdateTaskErrors([{ field: "title", message: "Title is required" }]);
      return;
    }

    const result = await updateTask(editingTaskId, {
      title,
      description: editTaskDescription.trim() || undefined,
      priority: editTaskPriority,
    });

    if (result.success) {
      onCancelEditTask();
      return;
    }

    setUpdateTaskErrors(
      result.errors ?? [{ field: "general", message: "Failed to update task" }]
    );
  };

  const onEditProjectChange = (
    field: "name" | "description" | "color",
    value: string
  ) => {
    if (field === "name") setEditProjectName(value);
    if (field === "description") setEditProjectDescription(value);
    if (field === "color") setEditProjectColor(value);
  };

  const onStartEditProject = (project: Project) => {
    setEditingProjectId(project.id);
    setEditProjectName(project.name);
    setEditProjectDescription(project.description ?? "");
    setEditProjectColor(project.color ?? "#3B82F6");
    setUpdateProjectErrors(null);
  };

  // プロジェクト編集キャンセル
  const onCancelEditProject = () => {
    setEditingProjectId(null);
    setEditProjectName("");
    setEditProjectDescription("");
    setEditProjectColor("#3B82F6");
    setUpdateProjectErrors(null);
  };

  // 編集保存
  const onSaveEditProject = async () => {
    if (!editingProjectId) return;

    setUpdateProjectErrors(null);

    const name = editProjectName.trim();
    if (!name) {
      setUpdateProjectErrors([{ field: "name", message: "Name is required" }]);
      return;
    }

    const result = await updateProject(editingProjectId, {
      name,
      description: editProjectDescription.trim() || undefined,
      color: editProjectColor,
    });

    if (result.success) {
      onCancelEditProject();
      return;
    }

    setUpdateProjectErrors(
      result.errors ?? [
        { field: "general", message: "Failed to update project" },
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
        {updateProjectErrors?.length ? (
          <div role="alert">
            {updateProjectErrors.map((e, i) => (
              <div key={`${e.field}-${i}`}>{e.message}</div>
            ))}
          </div>
        ) : null}
        <ProjectForm
          onSubmit={onCreateProject}
          loading={creatingProject}
          errors={createProjectErrors}
        ></ProjectForm>
        {projects.length === 0 ? (
          <p>No projects found</p>
        ) : (
          <ul>
            {projects.map((p) => (
              <ProjectItem
                key={p.id}
                project={p}
                isEditing={editingProjectId === p.id}
                onSelect={() => setSelectedProjectId(p.id)}
                onStartEdit={() => onStartEditProject(p)}
                onCancelEdit={onCancelEditProject}
                onSaveEdit={onSaveEditProject}
                onDelete={() => onDeleteProject(p.id)}
                editValues={{
                  name: editProjectName,
                  description: editProjectDescription,
                  color: editProjectColor,
                }}
                onEditChange={onEditProjectChange}
                loading={updatingProject}
                disabled={editingProjectId !== null}
              />
            ))}
          </ul>
        )}
      </aside>

      <section>
        <h2>Tasks</h2>
        {/* ✅ Create Task Form */}
        <TaskForm
          onSubmit={onCreateTask}
          loading={creatingTask}
          errors={createTaskErrors}
        />

        {tasksLoading && <p>Loading tasks...</p>}
        {tasksError && <p role="alert">Failed to load tasks</p>}
        {!tasksLoading && !tasksError && (
          <>
            {deleteTaskErrors?.length ? (
              <div role="alert">
                {deleteTaskErrors.map((e, i) => (
                  <div key={`${e.field}-${i}`}>{e.message}</div>
                ))}
              </div>
            ) : null}

            {updateTaskErrors?.length ? (
              <div role="alert">
                {updateTaskErrors.map((e, i) => (
                  <div key={`${e.field}-${i}`}>{e.message}</div>
                ))}
              </div>
            ) : null}

            {tasks.length === 0 ? (
              <p>No tasks found</p>
            ) : (
              <ul>
                {tasks.map((t) => (
                  <TaskItem
                    key={t.id}
                    task={t}
                    isEditing={editingTaskId === t.id}
                    onStartEdit={() => onStartEditTask(t)}
                    onCancelEdit={onCancelEditTask}
                    onSaveEdit={onSaveEditTask}
                    onDelete={() => onDeleteTask(t.id)}
                    onStatusChange={(status) =>
                      onUpdateTaskStatus(t.id, status)
                    }
                    editValues={{
                      title: editTaskTitle,
                      description: editTaskDescription,
                      priority: editTaskPriority,
                    }}
                    onEditChange={onEditTaskChange}
                    loading={updatingTask}
                    disabled={editingTaskId !== null}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  );
};

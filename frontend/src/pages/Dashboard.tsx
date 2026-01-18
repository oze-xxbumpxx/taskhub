import { ProjectForm, ProjectItem } from "@/components/projects";
import { TaskForm, TaskItem } from "@/components/tasks";
import {
  useProjectEdit,
  useProjects,
  useTaskEdit,
  useTasks,
  useTaskOperations,
  useProjectOperations,
} from "@/hooks";
import { useMemo, useState } from "react";

export const Dashboard = () => {
  const {
    projects,
    loading: projectLoading,
    error: projectsError,
  } = useProjects();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

  const taskEdit = useTaskEdit();
  const projectEdit = useProjectEdit();

  const projectOps = useProjectOperations({
    projects,
    selectedProjectId,
    onProjectCreated: setSelectedProjectId,
    onProjectDeleted: setSelectedProjectId,
  });

  const taskOps = useTaskOperations({
    projectId: projectOps.effectiveSelectedProjectId,
  });

  const taskFilters = useMemo(() => {
    if (!projectOps.effectiveSelectedProjectId) return undefined;
    return {
      projectId: projectOps.effectiveSelectedProjectId,
    };
  }, [projectOps.effectiveSelectedProjectId]);

  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
  } = useTasks(taskFilters);

  const isInitialProjectsLoading = projectLoading && projects.length === 0;
  const isInitialTasksLoading = tasksLoading && tasks.length === 0;

  return (
    <div className="flex gap-8 p-6 min-h-screen bg-gray-900">
      <aside className="w-80 flex-shrink-0">
        <h2 className="text-xl font-bold text-white mb-5">プロジェクト</h2>
        {/* {Delete Project form} */}
        {projectOps.deleteErrors?.length ? (
          <div
            role="alert"
            className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
          >
            {projectOps.deleteErrors.map((e, i) => (
              <div key={`${e.field}-${i}`}>{e.message}</div>
            ))}
          </div>
        ) : null}
        {projectEdit.errors?.length ? (
          <div
            role="alert"
            className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
          >
            {projectEdit.errors.map((e, i) => (
              <div key={`${e.field}-${i}`}>{e.message}</div>
            ))}
          </div>
        ) : null}
        {projectsError ? (
          <div
            role="alert"
            className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
          >
            プロジェクトの読み込みに失敗しました
          </div>
        ) : null}

        <ProjectForm
          onSubmit={projectOps.createProject}
          loading={projectOps.creating}
          errors={projectOps.createErrors}
        />

        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-400">一覧</p>
          {projectLoading && !isInitialProjectsLoading ? (
            <p className="text-xs text-gray-400">更新中...</p>
          ) : null}
        </div>

        {isInitialProjectsLoading ? (
          <p className="text-gray-400 text-sm mt-2">Loading projects...</p>
        ) : projects.length === 0 ? (
          <p className="text-gray-400 text-sm mt-2">プロジェクトがありません</p>
        ) : (
          <ul className="space-y-2 mt-2">
            {projects.map((p) => (
              <ProjectItem
                key={p.id}
                project={p}
                isEditing={projectEdit.editingProjectId === p.id}
                onSelect={() => setSelectedProjectId(p.id)}
                onStartEdit={() => projectEdit.startEdit(p)}
                onCancelEdit={projectEdit.cancelEdit}
                onSaveEdit={projectEdit.saveEdit}
                onDelete={() => projectOps.deleteProject(p.id)}
                editValues={projectEdit.editValues}
                onEditChange={projectEdit.changeField}
                loading={projectEdit.loading}
                disabled={projectEdit.editingProjectId !== null}
              />
            ))}
          </ul>
        )}
      </aside>

      <section className="flex-1">
        <h2 className="text-xl font-bold text-white mb-5">タスク</h2>
        {/* ✅ Create Task Form */}
        <TaskForm
          onSubmit={taskOps.createTask}
          loading={taskOps.creating}
          errors={taskOps.createErrors}
        />

        {tasksError ? (
          <div
            role="alert"
            className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
          >
            タスクの読み込みに失敗しました
          </div>
        ) : null}

        {taskOps.deleteErrors?.length ? (
          <div
            role="alert"
            className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
          >
            {taskOps.deleteErrors.map((e, i) => (
              <div key={`${e.field}-${i}`}>{e.message}</div>
            ))}
          </div>
        ) : null}

        {taskEdit.errors?.length ? (
          <div
            role="alert"
            className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
          >
            {taskEdit.errors.map((e, i) => (
              <div key={`${e.field}-${i}`}>{e.message}</div>
            ))}
          </div>
        ) : null}

        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-400">一覧</p>
          {tasksLoading && !isInitialTasksLoading ? (
            <p className="text-xs text-gray-400">更新中...</p>
          ) : null}
        </div>

        {isInitialTasksLoading ? (
          <p className="text-gray-400 mt-2">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="text-gray-400 text-sm mt-2">タスクがありません</p>
        ) : (
          <ul className="space-y-3 mt-2">
            {tasks.map((t) => (
              <TaskItem
                key={t.id}
                task={t}
                isEditing={taskEdit.editingTaskId === t.id}
                onStartEdit={() => taskEdit.startEdit(t)}
                onCancelEdit={taskEdit.cancelEdit}
                onSaveEdit={taskEdit.saveEdit}
                onDelete={() => taskOps.deleteTask(t.id)}
                onStatusChange={(status) => taskEdit.updateStatus(t.id, status)}
                editValues={taskEdit.editValues}
                onEditChange={taskEdit.changeField}
                loading={taskEdit.loading}
                disabled={taskEdit.editingTaskId !== null}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

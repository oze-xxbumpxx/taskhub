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

  if (projectLoading) return <p>Loading projects...</p>;
  if (projectsError) return <p>Failed to load projects</p>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16 }}>
      <aside>
        <h2>Projects</h2>
        {/* {Delete Project form} */}
        {projectOps.deleteErrors?.length ? (
          <div role="alert">
            {projectOps.deleteErrors.map((e, i) => (
              <div key={`${e.field}-${i}`}>{e.message}</div>
            ))}
          </div>
        ) : null}
        {projectEdit.errors?.length ? (
          <div role="alert">
            {projectEdit.errors.map((e, i) => (
              <div key={`${e.field}-${i}`}>{e.message}</div>
            ))}
          </div>
        ) : null}
        <ProjectForm
          onSubmit={projectOps.createProject}
          loading={projectOps.creating}
          errors={projectOps.createErrors}
        ></ProjectForm>
        {projects.length === 0 ? (
          <p>No projects found</p>
        ) : (
          <ul>
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

      <section>
        <h2>Tasks</h2>
        {/* ✅ Create Task Form */}
        <TaskForm
          onSubmit={taskOps.createTask}
          loading={taskOps.creating}
          errors={taskOps.createErrors}
        />

        {tasksLoading && <p>Loading tasks...</p>}
        {tasksError && <p role="alert">Failed to load tasks</p>}
        {!tasksLoading && !tasksError && (
          <>
            {taskOps.deleteErrors?.length ? (
              <div role="alert">
                {taskOps.deleteErrors.map((e, i) => (
                  <div key={`${e.field}-${i}`}>{e.message}</div>
                ))}
              </div>
            ) : null}

            {taskEdit.errors?.length ? (
              <div role="alert">
                {taskEdit.errors.map((e, i) => (
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
                    isEditing={taskEdit.editingTaskId === t.id}
                    onStartEdit={() => taskEdit.startEdit(t)}
                    onCancelEdit={taskEdit.cancelEdit}
                    onSaveEdit={taskEdit.saveEdit}
                    onDelete={() => taskOps.deleteTask(t.id)}
                    onStatusChange={(status) =>
                      taskEdit.updateStatus(t.id, status)
                    }
                    editValues={taskEdit.editValues}
                    onEditChange={taskEdit.changeField}
                    loading={taskEdit.loading}
                    disabled={taskEdit.editingTaskId !== null}
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

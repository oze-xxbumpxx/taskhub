import { useProjects, useTasks } from "@/hooks";
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

  const effectiveSelectedProjectId =
    selectedProjectId && projects.some((p) => p.id === selectedProjectId)
      ? selectedProjectId
      : (projects[0]?.id ?? null);

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
              </li>
            ))}
          </ul>
        )}
      </aside>

      <section>
        <h2>Tasks</h2>
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

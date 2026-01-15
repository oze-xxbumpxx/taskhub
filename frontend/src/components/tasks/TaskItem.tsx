import type { Task, TaskPriority, TaskStatus } from "@/types";
import { Input } from "../Input";
import { Button } from "../Button";

interface EditValues {
  title: string;
  description: string;
  priority: TaskPriority;
}

interface TaskItemProps {
  task: Task;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: TaskStatus) => void;
  editValues: EditValues;
  onEditChange: (field: keyof EditValues, value: string) => void;
  loading: boolean;
  disabled: boolean;
}

const priorityColor: Record<TaskPriority, string> = {
  HIGH: "text-red-300 bg-red-500/10 border border-red-500/40",
  MEDIUM: "text-amber-200 bg-amber-500/10 border border-amber-500/40",
  LOW: "text-emerald-200 bg-emerald-500/10 border border-emerald-500/40",
};

const statusLabel: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

export const TaskItem = ({
  task,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onStatusChange,
  editValues,
  onEditChange,
  loading,
  disabled,
}: TaskItemProps) => {
  if (isEditing) {
    return (
      <li className="p-4 rounded-lg bg-gray-800 border border-gray-700 shadow-lg space-y-3">
        <Input
          label="Title"
          value={editValues.title}
          onChange={(e) => onEditChange("title", e.target.value)}
          disabled={loading}
        />
        <Input
          label="Description"
          value={editValues.description}
          onChange={(e) => onEditChange("description", e.target.value)}
          disabled={loading}
        />
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-300">Priority</label>
          <select
            value={editValues.priority}
            onChange={(e) => onEditChange("priority", e.target.value)}
            disabled={loading}
            className="bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={onSaveEdit} isLoading={loading}>
            Save
          </Button>
          <Button
            type="button"
            onClick={onCancelEdit}
            disabled={loading}
            variant="secondary"
            className="min-w-[92px]"
          >
            Cancel
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="group flex items-start justify-between gap-3 p-3 rounded-lg bg-gray-800/60 border border-gray-700 hover:bg-gray-800 transition-all duration-200">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${priorityColor[task.priority]}`}
          >
            {task.priority}
          </span>
          <span className="text-xs text-gray-400 border border-gray-700 rounded px-2 py-0.5 bg-gray-900/60">
            {statusLabel[task.status]}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <div className="w-1 h-10 rounded-full bg-gradient-to-b from-blue-400 to-purple-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
          <div className="min-w-0">
            <p className="text-gray-100 font-semibold leading-tight truncate">
              {task.title}
            </p>
            {task.description ? (
              <p className="text-sm text-gray-400 line-clamp-2 mt-1">
                {task.description}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 ml-2">
        <select
          value={task.status}
          onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
          disabled={loading}
          className="bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          aria-label="Change task status"
        >
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>

        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
          <button
            type="button"
            onClick={onStartEdit}
            disabled={loading || disabled}
            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            aria-label="Edit task"
          >
            <span className="text-xs font-semibold">EDIT</span>
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={loading || disabled}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
            aria-label="Delete task"
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );
};

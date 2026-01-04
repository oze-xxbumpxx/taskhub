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
      <li>
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
        <select
          value={editValues.priority}
          onChange={(e) => onEditChange("priority", e.target.value)}
          disabled={loading}
        >
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH</option>
        </select>
        <Button type="button" onClick={onSaveEdit} isLoading={loading}>
          Save
        </Button>
        <Button type="button" onClick={onCancelEdit} disabled={loading}>
          Cancel
        </Button>
      </li>
    );
  }

  return (
    <li>
      <strong>{task.title}</strong>
      <span>{task.priority}</span>
      <select
        value={task.status}
        onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
        disabled={loading}
      >
        <option value="TODO">TODO</option>
        <option value="IN_PROGRESS">IN_PROGRESS</option>
        <option value="DONE">DONE</option>
      </select>
      <button
        type="button"
        onClick={onStartEdit}
        disabled={loading || disabled}
      >
        Edit
      </button>
      <button type="button" onClick={onDelete} disabled={loading || disabled}>
        Delete
      </button>
    </li>
  );
};

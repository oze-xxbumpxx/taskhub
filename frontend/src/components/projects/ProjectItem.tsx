import { Button, Input } from "@/components";
import type { Project } from "@/types";

interface EditValues {
  name: string;
  description: string;
  color: string;
}

interface ProjectItemProps {
  project: Project;
  isEditing: boolean;
  onSelect: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
  editValues: EditValues;
  onEditChange: (field: keyof EditValues, value: string) => void;
  loading: boolean;
  disabled: boolean;
}

export const ProjectItem = ({
  project,
  isEditing,
  onSelect,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  editValues,
  onEditChange,
  loading,
  disabled,
}: ProjectItemProps) => {
  if (isEditing) {
    return (
      <li>
        <Input
          label="Name"
          value={editValues.name}
          onChange={(e) => onEditChange("name", e.target.value)}
          disabled={loading}
        />
        <Input
          label="Description"
          value={editValues.description}
          onChange={(e) => onEditChange("description", e.target.value)}
          disabled={loading}
        />
        <Input
          label="Color"
          value={editValues.color}
          onChange={(e) => onEditChange("color", e.target.value)}
          disabled={loading}
        />
        <Button type="button" onClick={onSaveEdit} isLoading={loading}>
          Save
        </Button>
        <button type="button" onClick={onCancelEdit} disabled={loading}>
          Cancel
        </button>
      </li>
    );
  }

  return (
    <li>
      <button type="button" onClick={onSelect}>
        {project.name}
      </button>
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

import { Button, Input } from "@/components";
import { PROJECET_COLORS_VALUES } from "@/constants/project";
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
      <li className="p-3 rounded-lg bg-gray-800 border border-gray-700">
        <div className="space-y-3">
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
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              {PROJECET_COLORS_VALUES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onEditChange("color", c)}
                  disabled={loading}
                  className={`w-6 h-6 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white ${
                    editValues.color === c
                      ? "ring-2 ring-white ring-offset-2 ring-offset-gray-800 scale-110"
                      : ""
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
              <div className="relative ml-2">
                <input
                  type="color"
                  value={editValues.color}
                  onChange={(e) => onEditChange("color", e.target.value)}
                  disabled={loading}
                  className="w-8 h-8 p-0 border-0 rounded cursor-pointer bg-transparent"
                  title="Custom color"
                />
              </div>
            </div>
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
        </div>
      </li>
    );
  }

  return (
    <li className="group flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-all duration-200">
      <button
        type="button"
        onClick={onSelect}
        className="flex-1 flex items-center gap-3 text-left bg-transparent border-0 p-2 rounded  cursor-pointer"
      >
        <span
          className="w-3 h-3 rounded-full flex-shrink-0 shadow-[0_0_8px_rgba(0,0,0,0.5)]"
          style={{
            backgroundColor: project.color,
            boxShadow: `0 0 10px ${project.color}66`,
          }}
        />
        <span className="truncate text-gray-200 font-medium tracking-wide">
          {project.name}
        </span>
      </button>
      <div className="flex gap-2 opacity-0  group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0 ml-2">
        <button
          type="button"
          onClick={onStartEdit}
          disabled={loading || disabled}
          className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          title="Edit"
          aria-label="Edit Project"
        >
          <span className="text-xs font-semibold">EDIT</span>
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={loading || disabled}
          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
          aria-label="Delete Project"
        >
          Delete
        </button>
      </div>
    </li>
  );
};

import { useState } from "react";
import { Button, Input } from "@/components";
import type { FieldError } from "@/types";

interface ProjectFormProps {
  onSubmit: (data: {
    name: string;
    description?: string;
    color: string;
  }) => Promise<void>;
  loading: boolean;
  errors: FieldError[] | null;
}

export const ProjectForm = ({
  onSubmit,
  loading,
  errors,
}: ProjectFormProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3B82F6");

  const handleSubmit = async () => {
    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
    });
    // 成功時にフォームをリセット（親からコールバックで通知されるか、errorsがnullなら成功と判断）
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <Input
        label="Project name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={loading}
      />
      <Input
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={loading}
      />
      <Input
        label="Color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        disabled={loading}
      />

      {errors?.length ? (
        <div role="alert">
          {errors.map((err, idx) => (
            <div key={`${err.field}-${idx}`}>{err.message}</div>
          ))}
        </div>
      ) : null}

      <Button type="button" onClick={handleSubmit} isLoading={loading}>
        Create Project
      </Button>
    </div>
  );
};

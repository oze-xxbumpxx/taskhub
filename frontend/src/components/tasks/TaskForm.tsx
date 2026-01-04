import type { FieldError } from "@/types";
import { Button } from "../Button";
import { Input } from "../Input";
import { useState } from "react";

interface TaskFormProps {
  onSubmit: (data: { title: string; description?: string }) => Promise<void>;
  loading: boolean;
  errors: FieldError[] | null;
}

export const TaskForm = ({ onSubmit, loading, errors }: TaskFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <Input
        label="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={loading}
      />
      <Input
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
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
        Create task
      </Button>
    </div>
  );
};

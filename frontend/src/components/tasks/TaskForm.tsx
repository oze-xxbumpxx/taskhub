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
    <div className="mb-6 p-4 rounded-lg bg-gray-800/40 border border-gray-700/50">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">新規タスク</h3>
      <div className="space-y-3">
        <Input
          label="タスク名"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
          placeholder="例: ログイン機能の実装"
        />
        <Input
          label="説明（任意）"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          placeholder="タスクの詳細を入力"
        />

        {errors?.length ? (
          <div
            role="alert"
            className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
          >
            {errors.map((err, idx) => (
              <div key={`${err.field}-${idx}`}>{err.message}</div>
            ))}
          </div>
        ) : null}

        <Button
          type="button"
          onClick={handleSubmit}
          isLoading={loading}
          className="w-full"
        >
          作成
        </Button>
      </div>
    </div>
  );
};

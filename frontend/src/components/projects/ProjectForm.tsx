import { useState } from "react";
import { Button, Input } from "@/components";
import type { FieldError } from "@/types";
import { PROJECET_COLORS_VALUES } from "@/constants/project";

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
    <div className="mb-6 p-4 rounded-lg bg-gray-800/40 border border-gray-700/50">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">
        新規プロジェクト
      </h3>
      <div className="space-y-3">
        <Input
          label="プロジェクト名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          placeholder="例: Webアプリ開発"
        />
        <Input
          label="説明（任意）"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          placeholder="プロジェクトの説明を入力"
        />
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            カラー
          </label>
          <div className="flex flex-wrap gap-2 items-center">
            {PROJECET_COLORS_VALUES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                disabled={loading}
                className={`w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed ${
                  color === c
                    ? "ring-2 ring-white ring-offset-2 ring-offset-gray-800 scale-110"
                    : ""
                }`}
                style={{ backgroundColor: c }}
                aria-label={`カラーを選択: ${c}`}
              />
            ))}
            <div className="relative ml-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={loading}
                className="w-8 h-8 p-0 border-0 rounded cursor-pointer bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                title="カスタムカラー"
              />
            </div>
          </div>
        </div>

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

import { useQuery, useMutation, useApolloClient } from "@apollo/client/react";
import {
  GET_PROJECTS,
  GET_PROJECT,
  CREATE_PROJECT,
  UPDATE_PROJECT,
  DELETE_PROJECT,
} from "@/api/graphql";
import type { Project, FieldError } from "@/types";

// フィルター型
interface ProjectFilters {
  name?: string;
  color?: string;
}

// ソート型
interface ProjectSort {
  field: string;
  direction: "ASC" | "DESC";
}

// ページネーション型
interface Pagination {
  limit?: number;
  offset?: number;
}

// プロジェクト作成入力型
interface CreateProjectInput {
  name: string;
  description?: string;
  color?: string;
}

// プロジェクト更新入力型
interface UpdateProjectInput {
  name?: string;
  description?: string;
  color?: string;
}

// プロジェクト一覧取得フック
export const useProjects = (
  filters?: ProjectFilters,
  sort?: ProjectSort,
  pagination?: Pagination
) => {
  const { data, loading, error, refetch } = useQuery(GET_PROJECTS, {
    variables: { filters, sort, pagination },
    fetchPolicy: "cache-and-network",
  });

  return {
    projects: (data?.getProjects?.projects as Project[]) || [],
    totalCount: (data?.getProjects?.totalCount as number) || 0,
    loading,
    error,
    refetch,
  };
};

// 単一プロジェクト取得フック
export const useProject = (id: string) => {
  const { data, loading, error, refetch } = useQuery(GET_PROJECT, {
    variables: { id },
    skip: !id,
  });

  return {
    project: data?.getProject?.project as Project | null,
    loading,
    error,
    refetch,
  };
};

// プロジェクト作成フック
export const useCreateProject = () => {
  const client = useApolloClient();
  const [createProjectMutation, { loading }] = useMutation(CREATE_PROJECT);

  const createProject = async (
    input: CreateProjectInput
  ): Promise<{
    success: boolean;
    project?: Project;
    errors?: FieldError[];
  }> => {
    try {
      const { data } = await createProjectMutation({
        variables: { input },
      });

      const result = data?.createProject;

      if (result?.success) {
        // キャッシュを更新
        await client.refetchQueries({ include: [GET_PROJECTS] });
        return { success: true, project: result.project };
      }

      return { success: false, errors: result?.errors };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create project";
      return { success: false, errors: [{ field: "general", message }] };
    }
  };

  return { createProject, loading };
};

// プロジェクト更新フック
export const useUpdateProject = () => {
  const [updateProjectMutation, { loading }] = useMutation(UPDATE_PROJECT);

  const updateProject = async (
    id: string,
    input: UpdateProjectInput
  ): Promise<{
    success: boolean;
    project?: Project;
    errors?: FieldError[];
  }> => {
    try {
      const { data } = await updateProjectMutation({
        variables: { id, input },
      });

      const result = data?.updateProject;

      if (result?.success) {
        return { success: true, project: result.project };
      }

      return { success: false, errors: result?.errors };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update project";
      return { success: false, errors: [{ field: "general", message }] };
    }
  };

  return { updateProject, loading };
};

// プロジェクト削除フック
export const useDeleteProject = () => {
  const client = useApolloClient();
  const [deleteProjectMutation, { loading }] = useMutation(DELETE_PROJECT);

  const deleteProject = async (
    id: string
  ): Promise<{ success: boolean; errors?: FieldError[] }> => {
    try {
      const { data } = await deleteProjectMutation({
        variables: { id },
      });

      const result = data?.deleteProject;

      if (result?.success) {
        // キャッシュを更新
        await client.refetchQueries({ include: [GET_PROJECTS] });
        return { success: true };
      }

      return { success: false, errors: result?.errors };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete project";
      return { success: false, errors: [{ field: "general", message }] };
    }
  };

  return { deleteProject, loading };
};

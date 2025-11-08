import { graphql, GraphQLSchema, ExecutionResult } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "../../src/graphql/schema";
import { resolvers } from "../../src/graphql/resolvers";
import { getTestContext } from "./testContext";
import { AuthContextResult } from "../../src/types/auth";

// スキーマを毎回新しく作成（GraphQLスキーマのインスタンス問題を回避）
const getSchema = (): GraphQLSchema => {
  return makeExecutableSchema({
    typeDefs,
    resolvers,
  });
};

export interface QueryOptions {
  query: string;
  variables?: Record<string, any>;
  auth?: AuthContextResult;
}

export interface MutationOptions {
  mutation: string;
  variables?: Record<string, any>;
  auth?: AuthContextResult;
}

export interface TestServer {
  query: (options: QueryOptions) => Promise<ExecutionResult>;
  mutate: (options: MutationOptions) => Promise<ExecutionResult>;
}

export const createTestServer = (): TestServer => {
  return {
    query: async (options: QueryOptions) => {
      const context = await getTestContext({ auth: options.auth });
      return graphql({
        schema: getSchema(),
        source: options.query,
        variableValues: options.variables,
        contextValue: context,
      });
    },
    mutate: async (options: MutationOptions) => {
      const context = await getTestContext({ auth: options.auth });
      return graphql({
        schema: getSchema(),
        source: options.mutation,
        variableValues: options.variables,
        contextValue: context,
      });
    },
  };
};

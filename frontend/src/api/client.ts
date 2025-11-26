import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  type NormalizedCacheObject,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const TOKEN_KEY = "taskhub_token";

// トークン管理ユーティリティ
export const tokenStorage = {
  get: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },
  set: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  remove: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },
};

// HTTP リンク（GraphQL エンドポイント）
const httpLink = createHttpLink({
  uri: "/graphql",
});

// 認証リンク（リクエストヘッダーにトークンを追加）
const authLink = setContext((_, { headers }: { headers?: HeadersInit }) => {
  const token = tokenStorage.get();

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// Apollo Client インスタンス
export const apolloClient: ApolloClient<NormalizedCacheObject> =
  new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            // タスク一覧のキャッシュポリシー
            getTasks: {
              keyArgs: ["filters", "sort"],
              merge(existing, incoming) {
                return incoming;
              },
            },
            // プロジェクト一覧のキャッシュポリシー
            getProjects: {
              keyArgs: ["filters", "sort"],
              merge(existing, incoming) {
                return incoming;
              },
            },
          },
        },
      },
    }),
    defaultOptions: {
      watchQuery: {
        fetchPolicy: "cache-and-network",
        errorPolicy: "all",
      },
      query: {
        fetchPolicy: "network-only",
        errorPolicy: "all",
      },
      mutate: {
        errorPolicy: "all",
      },
    },
  });

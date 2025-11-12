import { userResolvers } from "./resolveUser";
import { taskResolvers } from "./resolveTask";
import { projectResolvers } from "./resolveProject";

export const resolvers = {
  Query: {
    hello: () => "Hello from TaskHub API!",
    ...userResolvers.Query,
    ...taskResolvers.Query,
    ...projectResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...taskResolvers.Mutation,
    ...projectResolvers.Mutation,
  },
  LoginResult: {
    __resolveType(obj: any) {
      if (typeof obj?.token === "string") return "AuthPayload";
      if (typeof obj?.success === "boolean") return "UserResponse";
      return null;
    },
  },
};

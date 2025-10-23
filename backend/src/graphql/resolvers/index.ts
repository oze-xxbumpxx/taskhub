import { userResolvers } from "./resolveUser";
import { taskResolvers } from "./resolveTask";

export const resolvers = {
  Query: {
    hello: () => "Hello from TaskHub API!",
    ...userResolvers.Query,
    ...taskResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...taskResolvers.Mutation,
  },
};

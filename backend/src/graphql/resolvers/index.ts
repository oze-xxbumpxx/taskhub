// TODO: ここにGraphQLリゾルバを統合します
// 例:
// import userResolvers from './user';
// import projectResolvers from './project';
// import taskResolvers from './task';
//
// export const resolvers = {
//   Query: {
//     ...userResolvers.Query,
//     ...projectResolvers.Query,
//     ...taskResolvers.Query,
//   },
//   Mutation: {
//     ...userResolvers.Mutation,
//     ...projectResolvers.Mutation,
//     ...taskResolvers.Mutation,
//   },
// };

export const resolvers = {
  Query: {
    hello: () => "Hello from TaskHub API!",
  },
};

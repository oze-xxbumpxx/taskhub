import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 4001;

// 最小限のGraphQLスキーマ
const typeDefs = `
  type Query {
    hello: String
  }
`;

const resolvers = {
  Query: {
    hello: () => "Hello from TaskHub API!",
  },
};

async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  app.use(cors());
  app.use(express.json());

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async () => {
        return {};
      },
    })
  );

  app.get("/health", (_, res) => {
    res.json({ status: "ok", message: "TaskHub API is running" });
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    console.log(`🏥 Health check at http://localhost:${PORT}/health`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

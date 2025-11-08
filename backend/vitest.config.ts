import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.{test,spec}.ts"],
    exclude: ["node_modules", "dist"],
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      exclude: ["src/types/**", "src/graphql/schema/**", "src/index.ts"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
  resolve: {
    dedupe: ["graphql"],
    alias: {
      graphql: path.resolve(__dirname, "node_modules/graphql"),
      "@graphql-tools/schema": path.resolve(
        __dirname,
        "node_modules/@graphql-tools/schema"
      ),
    },
  },
});

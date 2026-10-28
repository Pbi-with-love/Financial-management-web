import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Run test files sequentially to avoid DB conflicts between integration test suites
    fileParallelism: false,
  },
});

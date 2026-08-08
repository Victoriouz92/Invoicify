/**
 * Vitest Configuration
 *
 * WHAT IT IS: Configuration file that tells Vitest (our test runner) how to find and run tests.
 * WHY IT EXISTS: Vitest needs to know where our tests are and how to handle TypeScript files.
 * REAL WORLD ANALOGY: Like a recipe card that tells the chef which ingredients to use and how to cook them.
 */
import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    // Look for test files in __tests__ directory and any .test.ts files
    include: ["__tests__/**/*.test.ts", "**/*.test.ts"],
    // Exclude node_modules and build artifacts
    exclude: ["node_modules", ".next"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});

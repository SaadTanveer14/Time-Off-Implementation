import { defineConfig, mergeConfig } from "vitest/config";
import base from "./vitest.config";

export default mergeConfig(
  base,
  defineConfig({
    test: {
      include: ["tests/contract/**/*.test.ts", "tests/contract/**/*.test.tsx"],
      testTimeout: 15000,
    },
  }),
);

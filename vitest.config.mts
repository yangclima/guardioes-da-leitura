import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts", "src/game/core/**/*.ts"],
      exclude: ["src/lib/store/redisStore.ts", "src/lib/store/index.ts", "src/lib/http.ts", "src/lib/queries.ts"],
    },
  },
});

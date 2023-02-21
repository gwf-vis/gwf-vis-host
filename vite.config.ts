import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
    },
  },
});

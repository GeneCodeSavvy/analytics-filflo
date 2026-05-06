import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  outDir: "dist",
  splitting: false,
  platform: "node",
  noExternal: [/@shared/],
  banner: {
    js: `import { createRequire } from "module"; const require = createRequire(import.meta.url);`,
  },
});


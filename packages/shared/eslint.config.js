import { config as baseConfig } from "@repo/eslint-config/base";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  ...baseConfig,
]);
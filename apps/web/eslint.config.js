import reactRefresh from "eslint-plugin-react-refresh";
import { config as baseConfig } from "@repo/eslint-config/react-internal";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist"]),
  ...baseConfig,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-refresh": reactRefresh },
    rules: {
      ...reactRefresh.configs.vite.rules,
    },
  },
]);

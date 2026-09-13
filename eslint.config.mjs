import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Next.js 16 / React 19 Compiler presets flag common legitimate patterns:
      // - reading localStorage / URL params in useEffect and calling setState once
      // - server components using wall-clock ranges for analytics queries
      // Turning these off keeps CI + `next build` (lint-on-build) green without churn.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "test-results/**",
    "playwright-report/**",
    "scripts/**/*.cjs",
  ]),
]);

export default eslintConfig;

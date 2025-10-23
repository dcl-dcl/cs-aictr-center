import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // 禁用 TypeScript any 类型检查
      "@typescript-eslint/no-explicit-any": "off",
      // 禁用 prefer-const 规则
      "prefer-const": "off",
      // 禁用未使用变量警告
      "@typescript-eslint/no-unused-vars": "off",
      // 禁用 Next.js img 元素警告
      "@next/next/no-img-element": "off",
      // 禁用 React 未转义实体警告
      "react/no-unescaped-entities": "off",
    },
  },
];

export default eslintConfig;
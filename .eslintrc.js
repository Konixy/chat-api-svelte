module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "eslint-config-prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: 2018, sourceType: "module" },
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
  },
};

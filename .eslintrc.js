module.exports = {
  extends: [
    require.resolve('@hover/javascript/eslint'),
    require.resolve('@hover/javascript/eslint/strict'),
  ],
  ignorePatterns: ['dom-testing-library.js', 'rollup.input.js'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['tsconfig.eslint.json', 'tsconfig.json'],
  },
  rules: {
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    'no-restricted-syntax': 'off',
    'no-underscore-dangle': ['error', {allow: ['__regex', '__flags']}],
  },
  overrides: [
    {
      files: ['playwright-test/*.+(js|ts)'],
      rules: {
        'import/no-extraneous-dependencies': ['error', {devDependencies: true}],
      },
    },
    {
      files: ['test/fixture/**/*.+(js|ts)'],
      rules: {
        'jest/no-done-callback': 'off',
      },
    },
    {
      files: ['lib/fixture/**/*.+(js|ts)'],
      rules: {
        'no-empty-pattern': 'off',
        'no-underscore-dangle': ['error', {allow: ['__testingLibraryReviver']}],
      },
    },
  ],
}

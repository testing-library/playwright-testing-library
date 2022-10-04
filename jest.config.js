/** @typedef {import('jest').Config} JestConfig */

/** @type {JestConfig} */
const config = require('@hover/javascript/jest')

/** @type {JestConfig} */
module.exports = {
  ...config,
  testEnvironment: 'node',
  collectCoverageFrom: ['**/*.ts', '!**/*.d.ts'],
  modulePathIgnorePatterns: ['<rootDir>/jest.config.js'],
  coverageThreshold: {},
  setupFilesAfterEnv: ['./jest.setup.ts'],
  testMatch: ['<rootDir>/test/standalone/*.+(test.js|test.jsx|test.ts|test.tsx)'],
  testTimeout: 30000,
}

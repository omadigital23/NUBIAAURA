import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
    // Path to your Next.js app
    dir: './',
});

const customJestConfig: Config = {
    // Test environment - using 'node' by default to avoid jsdom/parse5 ESM issues
    // Individual tests can override with @jest-environment jsdom docblock if needed
    testEnvironment: 'node',

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

    // Module paths
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },

    // Test match patterns
    testMatch: [
        '<rootDir>/__tests__/**/*.+(ts|tsx|js)',
    ],

    testPathIgnorePatterns: [
        '<rootDir>/e2e/',
        '<rootDir>/node_modules/',
        '<rootDir>/.next/',
    ],

    // Coverage settings
    collectCoverageFrom: [
        'app/**/*.{js,jsx,ts,tsx}',
        'components/**/*.{js,jsx,ts,tsx}',
        'lib/**/*.{js,jsx,ts,tsx}',
        'hooks/**/*.{js,jsx,ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!**/.next/**',
        '!**/coverage/**',
    ],

    // Coverage threshold (note: singular, not plural)
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50,
        },
    },

    // Test timeout
    testTimeout: 10000,
};

export default createJestConfig(customJestConfig);

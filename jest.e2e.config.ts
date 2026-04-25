import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/__tests__/e2e/**/*.e2e.ts', '**/__tests__/e2e/**/*.e2e-spec.ts'],
  moduleNameMapper: {
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@presentation/(.*)$': '<rootDir>/src/presentation/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },
  verbose: true,
  testTimeout: 60000,
  globalSetup: './__tests__/e2e/setup/globalSetup.ts',
  globalTeardown: './__tests__/e2e/setup/globalTeardown.ts',
};

export default config;

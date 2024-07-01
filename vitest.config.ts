import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      provider: 'v8',
    },
    poolOptions: {
      /**
       * Due to PID files, we can't exactly run tests in parallel that
       * operate on the same examples.
       */
      threads: { singleThread: true },
    },
  },
});

import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: [
            { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
        ],
    },
    test: {
        environment: 'node',
        include: ['src/**/*.test.ts'],
        // server-only/empty.js is not an exported path of the package, so it is mocked once here
        setupFiles: ['./src/test/setup.ts'],
    },
});

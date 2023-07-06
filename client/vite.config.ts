import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            name: 'DyteTranscriptions',
            entry: 'src/index.ts',
            formats: ['es', 'umd'],
            fileName: (format) => `index.${format}.js`,
        },
    },
    server: {
        port: 3000,
        host: 'localhost',
    },
});

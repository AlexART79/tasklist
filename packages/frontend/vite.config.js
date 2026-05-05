/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
    plugins: [tailwindcss(), react()],
    server: {
        proxy: {
            '/api': 'http://localhost:3001',
            '/auth': 'http://localhost:3001',
            '/health': 'http://localhost:3001',
            '/ws': { target: 'ws://localhost:3001', ws: true },
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
    },
});

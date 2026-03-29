import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    federation({
      name: 'shell',
      remotes: {
        remote_workflow: {
          type: 'module',
          name: 'remote_workflow',
          entry: 'http://localhost:5174/remoteEntry.js',
          entryGlobalName: 'remote_workflow',
          shareScope: 'default',
        },
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
        'react-router-dom': { singleton: true, requiredVersion: '^6.0.0' },
        zustand: { singleton: true, requiredVersion: '^5.0.0' },
      },
      dts: false,
    }),
    react(),
  ],
  envDir: path.resolve(__dirname, '..'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    origin: 'http://localhost:5173',
  },
  build: {
    target: 'chrome89',
  },
});

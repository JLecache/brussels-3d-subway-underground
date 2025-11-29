// Fichier: vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// 1. IMPORT DU PLUGIN CESIUM
import cesium from 'vite-plugin-cesium';

export default defineConfig({
  plugins: [
    react(),
    // 2. ACTIVATION DU PLUGIN
    cesium() 
  ],
});
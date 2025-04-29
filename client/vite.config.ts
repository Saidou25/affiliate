import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',  // This is pointing to the 'dist' folder inside the client
  },
  base: '/affiliate/', 
});

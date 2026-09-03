import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Automatically adapt base path:
// - Vercel deploys to root domain (/), so base is '/'
// - GitHub Pages or relative environments use relative './' or VITE_BASE_PATH
const base = process.env.VERCEL ? '/' : (process.env.VITE_BASE_PATH || './');

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
  ],
});

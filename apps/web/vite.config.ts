import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// GitHub Pages serves this project under /Energie-4-AI/, not at a domain root.
// The deploy workflow sets BASE_PATH; local dev and `vite preview` keep '/'.
// Everything the app needs is bundled (data/v1/*.json and the world-atlas
// topology are imports, not runtime fetches), so the base only has to be right
// for the assets Vite emits itself. Permalinks are built from
// window.location.pathname, so they inherit whatever base is in effect.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
});

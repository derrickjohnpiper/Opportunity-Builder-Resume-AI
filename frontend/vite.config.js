import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// VITE_BASE_URL is set at build time:
//   - GitHub Pages: "/Opportunity-Builder-Resume-AI/"
//   - Render / local: "/" (default)
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_URL || '/',
})

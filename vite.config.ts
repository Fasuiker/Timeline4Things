import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// GitHub Pages serves from /Timeline4Things/; Electron needs relative asset paths.
const base =
  process.env.GITHUB_PAGES === 'true'
    ? '/Timeline4Things/'
    : process.env.ELECTRON === 'true'
      ? './'
      : '/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

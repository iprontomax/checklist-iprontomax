import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `npm run build:artifact` gera a versão de testes publicada como link privado (caminhos relativos).
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  base: mode === 'artifact' ? './' : '/',
  build: {
    chunkSizeWarningLimit: 900,
    outDir: mode === 'artifact' ? 'dist-artifact' : 'dist',
  },
}))

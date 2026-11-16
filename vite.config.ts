import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Modos de build:
//  - padrão:    `npm run build`           → dist/ (servidor próprio, rotas com BrowserRouter)
//  - pages:     `npm run build:pages`     → dist/ para GitHub Pages em /checklist-iprontomax/
//  - artifact:  `npm run build:artifact`  → dist-artifact/ para o link privado de testes
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  base: mode === 'artifact' ? './' : mode === 'pages' ? '/checklist-iprontomax/' : '/',
  build: {
    chunkSizeWarningLimit: 900,
    outDir: mode === 'artifact' ? 'dist-artifact' : 'dist',
  },
}))

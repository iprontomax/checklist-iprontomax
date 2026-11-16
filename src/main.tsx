import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, HashRouter, MemoryRouter } from 'react-router-dom'
import { IS_ARTIFACT, IS_PAGES } from './lib/env'

// Link privado de testes: a URL não muda, então as rotas ficam em memória.
// GitHub Pages: rotas depois do # para recarregar a página sem erro 404.
const Router = IS_ARTIFACT ? MemoryRouter : IS_PAGES ? HashRouter : BrowserRouter
import { App } from './App'
import { StoreProvider } from './lib/store'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <StoreProvider>
        <App />
      </StoreProvider>
    </Router>
  </StrictMode>,
)

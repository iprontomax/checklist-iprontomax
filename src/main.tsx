import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { IS_ARTIFACT } from './lib/env'

// No link privado de testes a URL não muda, então as rotas ficam em memória.
const Router = IS_ARTIFACT ? MemoryRouter : BrowserRouter
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

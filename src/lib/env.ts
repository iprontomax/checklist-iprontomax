/** Build "artifact": versão de testes publicada como link privado (sem impressão nem download de arquivos). */
export const IS_ARTIFACT = import.meta.env.MODE === 'artifact'

/** Build "pages": GitHub Pages não tem fallback de rotas, então usamos rotas com # na URL. */
export const IS_PAGES = import.meta.env.MODE === 'pages'

export const asset = (path: string) => import.meta.env.BASE_URL + path

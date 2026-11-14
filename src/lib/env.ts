/** Build "artifact": versão de testes publicada como link privado (sem impressão nem download de arquivos). */
export const IS_ARTIFACT = import.meta.env.MODE === 'artifact'

export const asset = (path: string) => import.meta.env.BASE_URL + path

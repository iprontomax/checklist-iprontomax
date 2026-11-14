import { cx } from '../lib/utils'

/** Logomarca iProntoMax. O "pronto" é branco, então use sobre fundo escuro. */
export function Logo({ className }: { className?: string }) {
  return <img src="/logo-iprontomax.png" alt="iProntoMax" className={cx('block h-auto select-none', className)} draggable={false} />
}

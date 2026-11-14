import { cx } from '../lib/utils'
import { asset } from '../lib/env'

/** Logomarca iProntoMax. O "pronto" é branco, então use sobre fundo escuro. */
export function Logo({ className }: { className?: string }) {
  return <img src={asset('logo-iprontomax.png')} alt="iProntoMax" className={cx('block h-auto select-none', className)} draggable={false} />
}

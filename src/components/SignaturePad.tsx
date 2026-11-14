import { useEffect, useRef, useState } from 'react'
import { Eraser } from 'lucide-react'

/** Área de assinatura com mouse, caneta ou dedo. Retorna PNG em dataURL. */
export function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const [empty, setEmpty] = useState(true)
  const dirty = useRef(false)

  useEffect(() => {
    const c = canvas.current!
    const resize = () => {
      const r = c.getBoundingClientRect()
      const ratio = window.devicePixelRatio || 1
      c.width = r.width * ratio
      c.height = r.height * ratio
      const ctx = c.getContext('2d')!
      ctx.scale(ratio, ratio)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = 2.4
      ctx.strokeStyle = '#13213a'
      dirty.current = false
      setEmpty(true)
      onChange(null)
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const down = (e: React.PointerEvent) => {
    canvas.current!.setPointerCapture(e.pointerId)
    drawing.current = true
    last.current = pos(e)
  }
  const move = (e: React.PointerEvent) => {
    if (!drawing.current || !last.current) return
    const p = pos(e)
    const ctx = canvas.current!.getContext('2d')!
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
    if (!dirty.current) { dirty.current = true; setEmpty(false) }
  }
  const up = () => {
    if (!drawing.current) return
    drawing.current = false
    last.current = null
    if (dirty.current) onChange(canvas.current!.toDataURL('image/png'))
  }
  const clear = () => {
    const c = canvas.current!
    c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
    dirty.current = false
    setEmpty(true)
    onChange(null)
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-line bg-white">
        <canvas
          ref={canvas}
          className="block h-44 w-full cursor-crosshair touch-none"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
        />
        {empty && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm font-medium text-slate-400">
            Assine aqui com o dedo ou o mouse
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-6 bottom-8 border-b border-slate-300" />
      </div>
      <div className="mt-2 flex justify-end">
        <button type="button" onClick={clear} className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-fg">
          <Eraser size={14} /> Limpar assinatura
        </button>
      </div>
    </div>
  )
}

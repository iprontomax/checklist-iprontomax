import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, HardHat, PenLine, ShieldCheck, Truck } from 'lucide-react'
import { useStore } from '../lib/store'
import type { Role } from '../lib/types'
import { Logo } from '../components/Logo'
import { Button, Field, Input, Segmented } from '../components/ui'

export function Login() {
  const { user, login } = useStore()
  const nav = useNavigate()
  const [role, setRole] = useState<Role>('tecnico')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/tecnico'} replace />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const err = login(username, password, role)
    if (err) setError(err)
    else nav(role === 'admin' ? '/admin' : '/tecnico')
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* painel da marca */}
      <section className="relative hidden overflow-hidden bg-[#071020] p-12 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -top-40 -right-40 size-[520px] rounded-full bg-[#22d6a8]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-52 -left-24 size-[460px] rounded-full bg-[#2f6fd8]/25 blur-3xl" />
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]" aria-hidden>
          <defs>
            <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
              <path d="M44 0H0V44" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        <Logo className="relative w-52" />
        <div className="relative mt-auto max-w-lg">
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-[#22d6a8]">Checklist diário</div>
          <h1 className="mt-3 text-4xl leading-[1.1] font-extrabold tracking-tight">
            Equipe segura, veículo em ordem, cliente conectado.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            Antes de sair para a rota, cada técnico confere EPIs, materiais e o veículo. Qualquer falta bloqueia a saída e
            vira uma pendência para a administração resolver.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-3">
            {[
              { icon: <HardHat size={18} />, t: "EPI's e materiais" },
              { icon: <Truck size={18} />, t: 'Inspeção do veículo' },
              { icon: <PenLine size={18} />, t: 'Assinatura digital' },
            ].map((f) => (
              <div key={f.t} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="text-[#22d6a8]">{f.icon}</div>
                <div className="mt-2 text-sm font-semibold">{f.t}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* formulário */}
      <section className="flex flex-col items-center justify-center px-5 py-10 sm:px-10">
        <div className="mb-8 rounded-2xl bg-[#071020] px-5 py-4 lg:hidden">
          <Logo className="w-40" />
        </div>
        <form onSubmit={submit} className="animate-in w-full max-w-sm">
          <h2 className="text-2xl font-extrabold tracking-tight">Entrar</h2>
          <p className="mt-1 text-sm text-muted">Acesse com seu usuário da iProntoMax.</p>

          <Segmented
            className="mt-6 w-full"
            value={role}
            onChange={(r) => { setRole(r); setError(null) }}
            options={[
              { value: 'tecnico', label: <span className="inline-flex items-center gap-1.5"><HardHat size={14} /> Técnico</span> },
              { value: 'admin', label: <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} /> Administrador</span> },
            ]}
          />

          <div className="mt-6 space-y-4">
            <Field label="Usuário">
              <Input autoFocus autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="seu.usuario" required />
            </Field>
            <Field label="Senha">
              <div className="relative">
                <Input
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  required
                  className="pr-11"
                />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-fg" aria-label="Mostrar senha">
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </Field>
          </div>

          {error && <div className="mt-4 rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">{error}</div>}

          <Button type="submit" variant="primary" size="lg" className="mt-6 w-full">
            Entrar <ArrowRight size={18} />
          </Button>

          <div className="mt-8 rounded-2xl border border-dashed border-line p-4 text-xs text-muted">
            <div className="mb-1 font-bold text-fg">Acesso de demonstração</div>
            Administrador: <b className="text-fg">admin</b> / <b className="text-fg">admin123</b>
            <br />
            Técnicos: <b className="text-fg">carlos</b>, <b className="text-fg">joao</b>, <b className="text-fg">marcos</b>, <b className="text-fg">rafael</b>, <b className="text-fg">lucas</b> / <b className="text-fg">123456</b>
          </div>
        </form>
        <p className="mt-10 text-[11px] text-muted">© {new Date().getFullYear()} iProntoMax · Provedor de internet</p>
      </section>
    </div>
  )
}

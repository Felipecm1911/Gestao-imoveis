import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { CircleCheck } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { useMe } from './api'
import building from '@/assets/login-building.jpg'

// só o que o sistema já faz ou está no plano das próximas fases
const highlights = [
  'Imóveis e proprietários',
  'Contratos e aluguéis',
  'Financeiro e repasses',
  'Manutenção e ocorrências',
  'Relatórios e indicadores',
  'Portais do proprietário e do inquilino',
]

export function AuthShell({ title, description, children, footer }: { title: string; description: string; children: ReactNode; footer: ReactNode }) {
  const me = useMe()
  if (me.data) return <Navigate to="/app/dashboard" replace />
  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <aside className="relative hidden overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col">
        <img src={building} alt="" className="pointer-events-none absolute inset-y-0 right-0 h-full w-[62%] object-cover" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,var(--sidebar)_38%,color-mix(in_oklab,var(--sidebar)_70%,transparent)_55%,transparent_80%)]" />
        <Logo subtitle className="relative text-white [&_span]:text-4xl [&_span.block]:mt-1 [&_span.block]:text-base [&_svg]:size-14" />
        <div className="relative z-10 my-auto max-w-[58%] pb-28">
          <p className="text-[1.75rem] leading-tight font-semibold text-white xl:text-[2rem]">
            O controle completo da sua imobiliária em um só lugar
          </p>
          <ul className="mt-8 grid gap-3">
            {highlights.map((h) => (
              <li key={h} className="flex items-center gap-3 text-white/90">
                <CircleCheck className="size-5 shrink-0 fill-brand text-sidebar" aria-hidden /> {h}
              </li>
            ))}
          </ul>
        </div>
        <svg aria-hidden viewBox="0 0 1440 320" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-32 w-full text-brand-solid">
          <path fill="currentColor" d="M0,200 C260,110 430,300 760,250 C1060,205 1230,90 1440,150 L1440,320 L0,320 Z" />
        </svg>
      </aside>
      <main className="flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm sm:p-9">
          <Logo className="mb-6 justify-center" />
          <h1 className="text-center text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 mb-8 text-center text-sm text-muted-foreground">{description}</p>
          <div className="grid gap-5">
            {children}
            <p className="text-center text-sm text-muted-foreground">{footer}</p>
          </div>
        </div>
      </main>
    </div>
  )
}

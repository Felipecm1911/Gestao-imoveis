import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { CircleCheck } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { useMe } from './api'
import { BuildingArt } from './BuildingArt'

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
  if (me.data) return <Navigate to="/app/properties" replace />
  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <aside className="relative hidden overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_100%,rgb(15_118_110/0.5),transparent_55%),radial-gradient(circle_at_0%_0%,rgb(201_107_75/0.22),transparent_45%)]"
        />
        <BuildingArt className="pointer-events-none absolute -right-4 bottom-0 h-[64%] max-h-[600px]" />
        <Logo subtitle className="relative text-white [&_span]:text-4xl [&_span.block]:mt-1 [&_span.block]:text-base [&_svg]:size-14" />
        <div className="relative mt-auto max-w-[44%]">
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
      </aside>
      <main className="flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm sm:p-10">
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

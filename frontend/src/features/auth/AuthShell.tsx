import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { CircleCheck } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { useMe } from './api'

// só o que o sistema já faz
const highlights = [
  'Imóveis com fotos, filtros e situação',
  'Proprietários com dados bancários e PIX',
  'Equipe com permissões por papel',
  'Dados de cada imobiliária isolados no banco',
]

export function AuthShell({ title, description, children, footer }: { title: string; description: string; children: ReactNode; footer: ReactNode }) {
  const me = useMe()
  if (me.data) return <Navigate to="/app/properties" replace />
  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_90%,rgb(15_118_110/0.45),transparent_55%),radial-gradient(circle_at_10%_0%,rgb(201_107_75/0.25),transparent_45%)]"
        />
        <Logo subtitle className="relative text-white [&_span]:text-3xl [&_span.block]:text-sm [&_svg]:size-11" />
        <div className="relative mt-auto max-w-md">
          <p className="text-3xl leading-tight font-semibold text-white">
            O controle completo da sua imobiliária em um só lugar
          </p>
          <ul className="mt-8 grid gap-3">
            {highlights.map((h) => (
              <li key={h} className="flex items-center gap-3">
                <CircleCheck className="size-5 shrink-0 text-brand" aria-hidden /> {h}
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <main className="flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <Logo className="mb-6 justify-center" />
          <h1 className="text-center text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 mb-6 text-center text-sm text-muted-foreground">{description}</p>
          <div className="grid gap-4">
            {children}
            <p className="text-center text-sm text-muted-foreground">{footer}</p>
          </div>
        </div>
      </main>
    </div>
  )
}

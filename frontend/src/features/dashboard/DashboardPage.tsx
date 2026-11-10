import type { ComponentType } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Home, ImageOff, Percent, Users, Wrench } from 'lucide-react'
import { EmptyState, ErrorState, LoadingRows, PageHeader } from '@/components/states'
import { Skeleton } from '@/components/ui/skeleton'
import { useMe } from '@/features/auth/api'
import { useOwners } from '@/features/owners/api'
import { useProperties, usePropertyCount } from '@/features/properties/api'
import { StatusBadge } from '@/features/properties/StatusBadge'
import { formatBRL } from '@/lib/format'
import { cn } from '@/lib/utils'

function Kpi({ label, value, hint, icon: Icon, tone, pending }: {
  label: string; value: string | number | undefined; hint?: string; icon: ComponentType<{ className?: string }>; tone: string; pending: boolean
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-xs">
      <span className={cn('flex size-12 shrink-0 items-center justify-center rounded-xl', tone)}>
        <Icon className="size-6" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">{pending ? <Skeleton className="mt-1 h-7 w-12" /> : value ?? '—'}</p>
        {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  )
}

const slices = [
  { status: 'OCUPADO', label: 'Alugado', color: '#2f855a' },
  { status: 'DISPONIVEL', label: 'Disponível', color: '#0284c7' },
  { status: 'MANUTENCAO', label: 'Manutenção', color: '#b7791f' },
  { status: 'INATIVO', label: 'Inativo', color: '#c53030' },
] as const

export function DashboardPage() {
  const me = useMe()
  const total = usePropertyCount()
  const counts = {
    OCUPADO: usePropertyCount('OCUPADO'),
    DISPONIVEL: usePropertyCount('DISPONIVEL'),
    MANUTENCAO: usePropertyCount('MANUTENCAO'),
    INATIVO: usePropertyCount('INATIVO'),
  }
  const owners = useOwners({ page: 0, size: 1 })
  const recent = useProperties({ page: 0 })

  const pending = total.isPending || Object.values(counts).some((c) => c.isPending)
  // uma contagem com erro estragaria a conta: mostra "—" em vez de um número falso
  const failed = total.isError || Object.values(counts).some((c) => c.isError)
  const n = (s: keyof typeof counts) => counts[s].data ?? 0
  const active = (total.data ?? 0) - n('INATIVO')
  // ocupação = alugados sobre a carteira ativa (inativos não contam)
  const occupancy = active > 0 ? Math.round((n('OCUPADO') / active) * 1000) / 10 : 0

  let acc = 0
  const gradient = slices
    .map(({ status, color }) => {
      const from = acc
      acc += total.data ? (n(status) / total.data) * 100 : 0
      return `${color} ${from}% ${acc}%`
    })
    .join(', ')

  return (
    <>
      <PageHeader title="Dashboard" description={`Olá, ${me.data?.name.split(' ')[0] ?? ''}. Visão geral da ${me.data?.organizationName ?? 'sua carteira'}.`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Imóveis" value={total.data} hint="na carteira" icon={Home} tone="bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300" pending={total.isPending} />
        <Kpi label="Taxa de ocupação" value={failed ? undefined : `${occupancy.toLocaleString('pt-BR')}%`} hint={failed ? 'não foi possível calcular' : `${n('OCUPADO')} de ${active} ativos alugados`} icon={Percent} tone="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" pending={pending} />
        <Kpi label="Proprietários" value={owners.data?.totalElements} hint="cadastrados" icon={Users} tone="bg-orange-100 text-brand-solid dark:bg-orange-950 dark:text-orange-300" pending={owners.isPending} />
        <Kpi label="Em manutenção" value={counts.MANUTENCAO.data} hint="imóveis parados" icon={Wrench} tone="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" pending={counts.MANUTENCAO.isPending} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section aria-labelledby="recent-title" className="rounded-xl border bg-card p-5 shadow-xs">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 id="recent-title" className="font-semibold">Imóveis da carteira</h2>
            <Link to="/app/properties" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Ver todos <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          {recent.isPending ? (
            <LoadingRows rows={5} />
          ) : recent.isError ? (
            <ErrorState error={recent.error} onRetry={() => recent.refetch()} />
          ) : recent.data.content.length === 0 ? (
            <EmptyState title="Nenhum imóvel cadastrado" />
          ) : (
            <ul className="divide-y">
              {recent.data.content.slice(0, 5).map((p) => (
                <li key={p.id}>
                  <Link to={`/app/properties/${p.id}`} className="flex items-center gap-3 py-2.5 hover:bg-muted/40">
                    <span className="block size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                      {p.coverUrl ? <img src={p.coverUrl} alt="" loading="lazy" className="size-full object-cover" /> : <ImageOff className="m-auto mt-4 size-4 text-muted-foreground" aria-hidden />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{p.code} – {p.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{p.district}, {p.city} – {p.state}</span>
                    </span>
                    <span className="hidden text-sm font-medium sm:block">{formatBRL(p.suggestedRent)}</span>
                    <StatusBadge status={p.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="status-title" className="rounded-xl border bg-card p-5 shadow-xs">
          <h2 id="status-title" className="font-semibold">Status dos imóveis</h2>
          {failed ? (
            <ErrorState error={total.error ?? Object.values(counts).find((c) => c.isError)?.error} onRetry={() => [total, ...Object.values(counts)].forEach((c) => c.refetch())} />
          ) : pending ? (
            <Skeleton className="mx-auto mt-6 size-44 rounded-full" />
          ) : !total.data ? (
            <EmptyState title="Nenhum imóvel ainda" description="Cadastre imóveis para ver a distribuição." />
          ) : (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-6">
              <div className="relative size-44 shrink-0 rounded-full" style={{ background: `conic-gradient(${gradient})` }} role="img" aria-label={`Total de ${total.data} imóveis`}>
                <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-card">
                  <span className="text-3xl font-semibold">{total.data}</span>
                  <span className="text-sm text-muted-foreground">Imóveis</span>
                </div>
              </div>
              <ul className="grid gap-2.5 text-sm">
                {slices.map((s) => (
                  <li key={s.status}>
                    <Link to={`/app/properties?status=${s.status}`} className="flex items-center gap-2 hover:underline">
                      <i className="size-2.5 rounded-full" style={{ background: s.color }} aria-hidden />
                      {s.label} ({n(s.status)})
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </>
  )
}

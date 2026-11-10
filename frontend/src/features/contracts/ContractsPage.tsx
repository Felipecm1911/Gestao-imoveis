import type { ComponentType } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Archive, CalendarDays, CircleCheck, Clock, Eye, FileDown, MoreVertical, Pencil, Plus, RefreshCw, Search } from 'lucide-react'
import { Pagination } from '@/components/Pagination'
import { EmptyState, ErrorState, LoadingRows, PageHeader } from '@/components/states'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useProperties } from '@/features/properties/api'
import { formatBRL, formatDate, situationLabel } from '@/lib/format'
import { useDebounced } from '@/lib/useDebounced'
import { cn } from '@/lib/utils'
import { useContracts, useContractStats, type ContractStats } from './api'
import { SituationBadge } from './SituationBadge'

const ALL = 'todos'

const stats: { situation: string; count: keyof ContractStats; label: string; icon: ComponentType<{ className?: string }>; tone: string }[] = [
  { situation: '', count: 'total', label: 'Todos', icon: CalendarDays, tone: 'bg-secondary text-secondary-foreground' },
  { situation: 'ATIVO', count: 'active', label: 'Ativos', icon: CircleCheck, tone: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
  { situation: 'EM_RENOVACAO', count: 'renewing', label: 'Em renovação', icon: RefreshCw, tone: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  { situation: 'ENCERRANDO', count: 'ending', label: 'Encerrando', icon: Clock, tone: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' },
  { situation: 'ENCERRADO', count: 'ended', label: 'Encerrados', icon: Archive, tone: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
]

function LabeledSelect({ label, value, options, onChange }: {
  label: string
  value: string
  options: [string, string][]
  onChange: (v: string) => void
}) {
  return (
    <div className="grid min-w-40 flex-1 gap-0.5 sm:flex-none">
      <span className="px-1 text-xs font-medium text-muted-foreground" aria-hidden>{label}</span>
      <Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? '' : v)}>
        <SelectTrigger className="w-full sm:w-48" aria-label={label}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos</SelectItem>
          {options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}

export function ContractsPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const situation = params.get('situation') ?? ''
  const propertyId = params.get('propertyId') ?? ''
  const page = Number(params.get('page') ?? 0)
  const size = Number(params.get('size') ?? 5)
  const counts = useContractStats()
  const contracts = useContracts({ q: useDebounced(q), situation, propertyId, page, size })
  // shortcut: filtro lista até 100 imóveis; acima disso, trocar por busca com autocomplete
  const properties = useProperties({ size: 100 })

  const update = (next: Record<string, string>) => {
    const merged = { ...Object.fromEntries(params), page: '0', ...next }
    setParams(Object.fromEntries(Object.entries(merged).filter(([, v]) => v !== '')), { replace: true })
  }
  const filtered = !!(q || situation || propertyId)

  return (
    <>
      <PageHeader title="Contratos" description="Gerencie os contratos de locação." />

      <div className="-mx-4 mb-6 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5 [&>*]:min-w-40 [&>*]:snap-start">
        {stats.map(({ situation: s, count, label, icon: Icon, tone }) => (
          <button
            key={label}
            type="button"
            onClick={() => update({ situation: s })}
            aria-pressed={situation === s}
            className={cn(
              'flex items-center gap-3 rounded-xl border bg-card p-4 text-left shadow-xs transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-ring',
              situation === s && 'border-primary bg-accent/40 ring-1 ring-primary',
            )}
          >
            <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-lg', tone)}>
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm text-muted-foreground">{label}</span>
              <span className="block text-2xl font-semibold">
                {counts.isPending ? <Skeleton className="mt-1 h-7 w-8" /> : counts.isError ? '—' : counts.data[count]}
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={q}
            onChange={(e) => update({ q: e.target.value })}
            placeholder="Buscar por código, imóvel ou inquilino…"
            aria-label="Buscar contratos"
            className="bg-card pl-9"
          />
        </div>
        <LabeledSelect
          label="Status"
          value={situation}
          options={Object.entries(situationLabel)}
          onChange={(v) => update({ situation: v })}
        />
        <LabeledSelect
          label="Imóvel"
          value={propertyId}
          options={(properties.data?.content ?? []).map((p) => [p.id, `${p.code} – ${p.title}`])}
          onChange={(v) => update({ propertyId: v })}
        />
        <Button asChild className="w-full sm:w-auto">
          <Link to="/app/contracts/new"><Plus /> Novo contrato</Link>
        </Button>
      </div>

      {contracts.isPending ? (
        <LoadingRows />
      ) : contracts.isError ? (
        <ErrorState error={contracts.error} onRetry={() => contracts.refetch()} />
      ) : contracts.data.content.length === 0 ? (
        <EmptyState
          title={filtered ? 'Nenhum contrato com esses filtros' : 'Nenhum contrato cadastrado'}
          description={filtered ? 'Ajuste a busca ou os filtros.' : 'Crie o primeiro contrato ligando um imóvel a um inquilino.'}
          action={filtered
            ? <Button variant="outline" onClick={() => setParams({}, { replace: true })}>Limpar filtros</Button>
            : <Button asChild><Link to="/app/contracts/new"><Plus /> Criar contrato</Link></Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead className="hidden md:table-cell">Imóvel</TableHead>
                <TableHead>Inquilino</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Aluguel</TableHead>
                <TableHead className="hidden lg:table-cell">Início</TableHead>
                <TableHead className="hidden sm:table-cell">Vencimento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.data.content.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-semibold">{c.code}</TableCell>
                  <TableCell className="hidden max-w-56 truncate md:table-cell">{c.propertyCode} – {c.propertyTitle}</TableCell>
                  <TableCell className="max-w-40 truncate">{c.tenantName}</TableCell>
                  <TableCell className="hidden text-right font-medium lg:table-cell">{formatBRL(c.monthlyRent)}</TableCell>
                  <TableCell className="hidden lg:table-cell">{formatDate(c.startDate)}</TableCell>
                  <TableCell className="hidden sm:table-cell">{formatDate(c.endDate)}</TableCell>
                  <TableCell><SituationBadge situation={c.situation} /></TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/app/contracts/${c.id}`} aria-label={`Ver contrato ${c.code}`}><Eye /></Link>
                      </Button>
                      {c.status === 'RASCUNHO' || c.status === 'ATIVO' ? (
                        <Button variant="ghost" size="icon" asChild className="hidden sm:inline-flex">
                          <Link to={`/app/contracts/${c.id}/edit`} aria-label={`Editar contrato ${c.code}`}><Pencil /></Link>
                        </Button>
                      ) : <span className="hidden size-9 sm:block" />}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Mais ações do contrato ${c.code}`}><MoreVertical /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <a href={`/api/contracts/${c.id}/pdf`} target="_blank" rel="noreferrer"><FileDown /> Abrir PDF</a>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="border-t px-4 pb-4">
            <Pagination
              page={page}
              totalPages={contracts.data.totalPages}
              total={contracts.data.totalElements}
              size={size}
              noun={contracts.data.totalElements === 1 ? 'contrato' : 'contratos'}
              onChange={(p) => update({ page: String(p) })}
              onSizeChange={(s) => update({ size: String(s) })}
            />
          </div>
        </div>
      )}
    </>
  )
}

import type { ComponentType } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  Bath,
  BedDouble,
  Building,
  Car,
  CircleCheck,
  Eye,
  House,
  ImageOff,
  LayoutGrid,
  List,
  MapPin,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Wrench,
  CircleOff,
} from 'lucide-react'
import { Pagination } from '@/components/Pagination'
import { EmptyState, ErrorState, PageHeader } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatBRL, parseDecimalInput, propertyStatusLabel, propertyTypeLabel } from '@/lib/format'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { cn } from '@/lib/utils'
import { usePropertyCount, useProperties, type PropertyFilters, type PropertyListItem, type PropertyStatus } from './api'
import { StatusBadge } from './StatusBadge'

const ALL = 'todos'
const PAGE_SIZE = 12

function FilterSelect({ label, value, options, onChange }: {
  label: string
  value: string
  options: Record<string, string>
  onChange: (v: string) => void
}) {
  return (
    <Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? '' : v)}>
      <SelectTrigger className="w-full lg:w-36" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{label}: todos</SelectItem>
        {Object.entries(options).map(([v, l]) => (
          <SelectItem key={v} value={v}>{l}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

const stats: { status?: PropertyStatus; label: string; icon: ComponentType<{ className?: string }>; tone: string }[] = [
  { label: 'Todos', icon: Building, tone: 'bg-secondary text-secondary-foreground' },
  { status: 'DISPONIVEL', label: 'Disponíveis', icon: House, tone: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' },
  { status: 'OCUPADO', label: 'Alugados', icon: CircleCheck, tone: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
  { status: 'MANUTENCAO', label: 'Em manutenção', icon: Wrench, tone: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  { status: 'INATIVO', label: 'Inativos', icon: CircleOff, tone: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' },
]

function StatCard({ status, label, icon: Icon, tone, active, onClick }: (typeof stats)[number] & { active: boolean; onClick: () => void }) {
  const count = usePropertyCount(status)
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex items-center gap-3 rounded-xl border bg-card p-4 text-left shadow-xs transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-ring',
        active && 'border-primary ring-1 ring-primary',
      )}
    >
      <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-lg', tone)}>
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm text-muted-foreground">{label}</span>
        <span className="block text-2xl font-semibold">
          {count.isPending ? <Skeleton className="mt-1 h-7 w-8" /> : count.isError ? '—' : count.data}
        </span>
      </span>
    </button>
  )
}

function Thumb({ p, className }: { p: PropertyListItem; className?: string }) {
  return (
    <span className={cn('block shrink-0 overflow-hidden rounded-md bg-muted', className)}>
      {p.coverUrl ? (
        <img src={p.coverUrl} alt="" loading="lazy" className="size-full object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center text-muted-foreground"><ImageOff className="size-4" aria-hidden /></span>
      )}
    </span>
  )
}

function Features({ p }: { p: PropertyListItem }) {
  return (
    <span className="flex gap-3 text-sm text-muted-foreground">
      <span className="flex items-center gap-1" title="Quartos"><BedDouble className="size-4" aria-hidden />{p.bedrooms}<span className="sr-only">quartos</span></span>
      <span className="flex items-center gap-1" title="Banheiros"><Bath className="size-4" aria-hidden />{p.bathrooms}<span className="sr-only">banheiros</span></span>
      <span className="flex items-center gap-1" title="Vagas"><Car className="size-4" aria-hidden />{p.parking}<span className="sr-only">vagas</span></span>
      {p.areaM2 !== null && <span>{p.areaM2} m²</span>}
    </span>
  )
}

function PropertyTable({ items }: { items: PropertyListItem[] }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
      <Table>
        <TableHeader className="bg-muted/60">
          <TableRow>
            <TableHead className="pl-4">Código</TableHead>
            <TableHead>Imóvel</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="hidden lg:table-cell">Proprietário</TableHead>
            <TableHead>Aluguel</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-4 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="pl-4 font-medium">{p.code}</TableCell>
              <TableCell>
                <Link to={`/app/properties/${p.id}`} className="flex items-center gap-3 hover:underline">
                  <Thumb p={p} className="h-11 w-16" />
                  <span className="min-w-0">
                    <span className="block max-w-72 truncate font-medium">{p.title}</span>
                    <span className="block max-w-72 truncate text-xs text-muted-foreground">{p.district}, {p.city} – {p.state}</span>
                  </span>
                </Link>
              </TableCell>
              <TableCell>{propertyTypeLabel[p.type]}</TableCell>
              <TableCell className="hidden max-w-48 truncate lg:table-cell">{p.owner.name}</TableCell>
              <TableCell className="font-medium">{formatBRL(p.suggestedRent)}</TableCell>
              <TableCell><StatusBadge status={p.status} /></TableCell>
              <TableCell className="pr-4">
                <span className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`/app/properties/${p.id}`} aria-label={`Ver ${p.code}`}><Eye /></Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`/app/properties/${p.id}/edit`} aria-label={`Editar ${p.code}`}><Pencil /></Link>
                  </Button>
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/** Celular: lista compacta com miniatura à esquerda. */
function PropertyList({ items }: { items: PropertyListItem[] }) {
  return (
    <ul className="grid gap-3">
      {items.map((p) => (
        <li key={p.id}>
          <Link to={`/app/properties/${p.id}`} className="flex gap-3 rounded-xl border bg-card p-3 shadow-xs focus-visible:outline-2 focus-visible:outline-ring">
            <Thumb p={p} className="size-20" />
            <span className="grid min-w-0 flex-1 content-start gap-0.5">
              <span className="text-xs font-semibold text-primary">{p.code}</span>
              <span className="truncate font-medium">{p.title}</span>
              <span className="truncate text-xs text-muted-foreground">{p.district}, {p.city} – {p.state}</span>
              <span className="mt-1 flex items-center justify-between gap-2">
                <span className="font-semibold">{formatBRL(p.suggestedRent)}</span>
                <StatusBadge status={p.status} />
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function PropertyCard({ p }: { p: PropertyListItem }) {
  return (
    <Link to={`/app/properties/${p.id}`} className="group rounded-xl focus-visible:outline-2 focus-visible:outline-ring">
      <Card className="h-full overflow-hidden pt-0 transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg">
        <div className="relative aspect-[3/2] bg-muted">
          {p.coverUrl ? (
            <img src={p.coverUrl} alt="" loading="lazy" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-muted-foreground">
              <ImageOff className="size-8" aria-hidden />
            </div>
          )}
          <div className="absolute top-3 right-3"><StatusBadge status={p.status} /></div>
        </div>
        <CardContent className="grid gap-1">
          <span className="text-xs font-semibold tracking-wide text-primary">{p.code} · {propertyTypeLabel[p.type]}</span>
          <h2 className="truncate font-semibold">{p.title}</h2>
          <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" aria-hidden />{p.district}, {p.city} – {p.state}
          </p>
          <span className="mt-1"><Features p={p} /></span>
          <p className="mt-2 border-t pt-3 text-lg font-semibold">
            {formatBRL(p.suggestedRent)} <span className="text-sm font-normal text-muted-foreground">/mês</span>
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

function MoreFilters({ filters, set }: { filters: PropertyFilters; set: (name: keyof PropertyFilters, value: string) => void }) {
  return (
    <>
      <FilterSelect label="Tipo" value={filters.type ?? ''} options={propertyTypeLabel} onChange={(v) => set('type', v)} />
      <FilterSelect label="Status" value={filters.status ?? ''} options={propertyStatusLabel} onChange={(v) => set('status', v)} />
      <Input className="lg:w-32" placeholder="Cidade" aria-label="Cidade" defaultValue={filters.city}
        onChange={(e) => set('city', e.target.value)} />
      <Input className="lg:w-24" inputMode="decimal" placeholder="R$ mín" aria-label="Aluguel mínimo"
        defaultValue={filters.minRent} onChange={(e) => set('minRent', parseDecimalInput(e.target.value) ?? '')} />
      <Input className="lg:w-24" inputMode="decimal" placeholder="R$ máx" aria-label="Aluguel máximo"
        defaultValue={filters.maxRent} onChange={(e) => set('maxRent', parseDecimalInput(e.target.value) ?? '')} />
    </>
  )
}

export function PropertiesPage() {
  const [params, setParams] = useSearchParams()
  const desktop = useMediaQuery('(min-width: 768px)')
  const view = params.get('view') === 'cards' ? 'cards' : 'table'
  const filters: PropertyFilters = {
    q: params.get('q') ?? '',
    city: params.get('city') ?? '',
    type: params.get('type') ?? '',
    status: params.get('status') ?? '',
    minRent: params.get('minRent') ?? '',
    maxRent: params.get('maxRent') ?? '',
    page: Number(params.get('page') ?? 0),
  }
  const properties = useProperties(filters)
  const set = (name: keyof PropertyFilters | 'view', value: string) =>
    setParams({ ...Object.fromEntries(params), [name]: value, page: name === 'page' ? value : '0' }, { replace: true })
  const hasFilters = Object.entries(filters).some(([k, v]) => k !== 'page' && v)
  const total = properties.data?.totalElements

  return (
    <>
      <PageHeader
        title="Imóveis"
        description={total === undefined ? 'Sua carteira de imóveis administrados.' : `${total} ${total === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}`}
        actions={<Button variant="brand" asChild><Link to="/app/properties/new"><Plus /> Novo imóvel</Link></Button>}
      />

      <div className="-mx-4 mb-6 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-5 [&>*]:min-w-40 [&>*]:snap-start">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} active={(filters.status ?? '') === (s.status ?? '')} onClick={() => set('status', s.status ?? '')} />
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3 shadow-xs">
        <div className="relative min-w-0 flex-1 lg:max-w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input className="pl-9" placeholder="Buscar código, título, rua…" aria-label="Buscar imóveis"
            value={filters.q} onChange={(e) => set('q', e.target.value)} />
        </div>
        {desktop ? (
          <MoreFilters filters={filters} set={set} />
        ) : (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Filtros"><SlidersHorizontal /></Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader><SheetTitle>Filtros</SheetTitle></SheetHeader>
              <div className="grid gap-3 px-4 pb-6"><MoreFilters filters={filters} set={set} /></div>
            </SheetContent>
          </Sheet>
        )}
        {desktop && (
          <div className="ml-auto flex rounded-lg border p-0.5" role="group" aria-label="Visualização">
            <Button size="sm" variant={view === 'table' ? 'secondary' : 'ghost'} aria-pressed={view === 'table'} onClick={() => set('view', 'table')}>
              <List /> Tabela
            </Button>
            <Button size="sm" variant={view === 'cards' ? 'secondary' : 'ghost'} aria-pressed={view === 'cards'} onClick={() => set('view', 'cards')}>
              <LayoutGrid /> Cards
            </Button>
          </div>
        )}
      </div>

      {properties.isPending ? (
        <div className="grid gap-3" role="status" aria-label="Carregando">
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : properties.isError ? (
        <ErrorState error={properties.error} onRetry={() => properties.refetch()} />
      ) : properties.data.content.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'Nenhum imóvel com esses filtros' : 'Nenhum imóvel cadastrado'}
          description={hasFilters ? 'Ajuste ou limpe os filtros.' : 'Cadastre um proprietário e depois o primeiro imóvel.'}
          action={hasFilters
            ? <Button variant="outline" onClick={() => setParams({})}>Limpar filtros</Button>
            : <Button variant="brand" asChild><Link to="/app/properties/new"><Plus /> Cadastrar imóvel</Link></Button>}
        />
      ) : (
        <>
          {!desktop ? (
            <PropertyList items={properties.data.content} />
          ) : view === 'cards' ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {properties.data.content.map((p) => <PropertyCard key={p.id} p={p} />)}
            </div>
          ) : (
            <PropertyTable items={properties.data.content} />
          )}
          <Pagination page={filters.page ?? 0} totalPages={properties.data.totalPages} total={total} size={PAGE_SIZE}
            onChange={(p) => set('page', String(p))} />
        </>
      )}
    </>
  )
}

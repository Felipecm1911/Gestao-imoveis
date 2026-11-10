import { Link, useSearchParams } from 'react-router'
import { BedDouble, Bath, Car, ImageOff, MapPin, Plus } from 'lucide-react'
import { Pagination } from '@/components/Pagination'
import { EmptyState, ErrorState, PageHeader } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { formatBRL, parseDecimalInput, propertyStatusLabel, propertyTypeLabel } from '@/lib/format'
import { useProperties, type PropertyFilters, type PropertyListItem } from './api'
import { StatusBadge } from './StatusBadge'

const ALL = 'todos'

function FilterSelect({ label, value, options, onChange }: {
  label: string
  value: string
  options: Record<string, string>
  onChange: (v: string) => void
}) {
  return (
    <Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? '' : v)}>
      <SelectTrigger className="w-full sm:w-40" aria-label={label}>
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
          <p className="mt-1 flex gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1" title="Quartos"><BedDouble className="size-4" aria-hidden />{p.bedrooms}<span className="sr-only">quartos</span></span>
            <span className="flex items-center gap-1" title="Banheiros"><Bath className="size-4" aria-hidden />{p.bathrooms}<span className="sr-only">banheiros</span></span>
            <span className="flex items-center gap-1" title="Vagas"><Car className="size-4" aria-hidden />{p.parking}<span className="sr-only">vagas</span></span>
            {p.areaM2 !== null && <span>{p.areaM2} m²</span>}
          </p>
          <p className="mt-2 border-t pt-3 text-lg font-semibold">
            {formatBRL(p.suggestedRent)} <span className="text-sm font-normal text-muted-foreground">/mês</span>
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

export function PropertiesPage() {
  const [params, setParams] = useSearchParams()
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
  const set = (name: keyof PropertyFilters, value: string) =>
    setParams({ ...Object.fromEntries(params), [name]: value, page: name === 'page' ? value : '0' }, { replace: true })
  const hasFilters = Object.entries(filters).some(([k, v]) => k !== 'page' && v)

  return (
    <>
      <PageHeader
        title="Imóveis"
        description="Sua carteira de imóveis administrados."
        actions={<Button asChild><Link to="/app/properties/new"><Plus /> Novo imóvel</Link></Button>}
      />
      <div className="mb-6 grid gap-2 rounded-xl border bg-card p-3 sm:flex sm:flex-wrap">
        <Input className="sm:w-56" placeholder="Buscar código, título, rua…" aria-label="Buscar imóveis"
          defaultValue={filters.q} onChange={(e) => set('q', e.target.value)} />
        <Input className="sm:w-40" placeholder="Cidade" aria-label="Cidade" defaultValue={filters.city}
          onChange={(e) => set('city', e.target.value)} />
        <FilterSelect label="Tipo" value={filters.type ?? ''} options={propertyTypeLabel} onChange={(v) => set('type', v)} />
        <FilterSelect label="Situação" value={filters.status ?? ''} options={propertyStatusLabel} onChange={(v) => set('status', v)} />
        <Input className="sm:w-32" inputMode="decimal" placeholder="R$ mín" aria-label="Aluguel mínimo"
          defaultValue={filters.minRent} onChange={(e) => set('minRent', parseDecimalInput(e.target.value) ?? '')} />
        <Input className="sm:w-32" inputMode="decimal" placeholder="R$ máx" aria-label="Aluguel máximo"
          defaultValue={filters.maxRent} onChange={(e) => set('maxRent', parseDecimalInput(e.target.value) ?? '')} />
      </div>

      {properties.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Carregando">
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
        </div>
      ) : properties.isError ? (
        <ErrorState error={properties.error} onRetry={() => properties.refetch()} />
      ) : properties.data.content.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'Nenhum imóvel com esses filtros' : 'Nenhum imóvel cadastrado'}
          description={hasFilters ? 'Ajuste ou limpe os filtros.' : 'Cadastre um proprietário e depois o primeiro imóvel.'}
          action={hasFilters
            ? <Button variant="outline" onClick={() => setParams({})}>Limpar filtros</Button>
            : <Button asChild><Link to="/app/properties/new">Cadastrar imóvel</Link></Button>}
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
            {properties.data.totalElements} {properties.data.totalElements === 1 ? 'imóvel' : 'imóveis'}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {properties.data.content.map((p) => <PropertyCard key={p.id} p={p} />)}
          </div>
          <Pagination page={filters.page ?? 0} totalPages={properties.data.totalPages} onChange={(p) => set('page', String(p))} />
        </>
      )}
    </>
  )
}

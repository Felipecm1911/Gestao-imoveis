import { useState } from 'react'
import { Link } from 'react-router'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { Pagination } from '@/components/Pagination'
import { EmptyState, ErrorState, LoadingRows, PageHeader } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useContract, useContracts, useContractStats } from '@/features/contracts/api'
import { useChangeStatus, useProperties, usePropertyCount, type PropertyListItem } from '@/features/properties/api'
import { StatusBadge } from '@/features/properties/StatusBadge'
import { formatBRL, formatDate, installmentStatusLabel } from '@/lib/format'
import { useDebounced } from '@/lib/useDebounced'

export function FinancePage() {
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<string>()
  const contracts = useContracts({ page, size: 10 })
  const contract = useContract(selected)
  const detail = contract.data

  return (
    <>
      <PageHeader title="Financeiro" description="Consulte parcelas, recebimentos e saldos por contrato." />
      <section className="rounded-xl border bg-card p-4">
        <h2 className="mb-3 font-semibold">Contratos</h2>
        {contracts.isPending ? <LoadingRows rows={3} /> : contracts.isError ? (
          <ErrorState error={contracts.error} onRetry={() => contracts.refetch()} />
        ) : contracts.data.content.length === 0 ? (
          <EmptyState title="Nenhum contrato cadastrado" action={<Button asChild><Link to="/app/contracts/new">Novo contrato</Link></Button>} />
        ) : (
          <>
            <Table>
              <TableHeader><TableRow><TableHead>Contrato</TableHead><TableHead>Imóvel</TableHead><TableHead>Inquilino</TableHead><TableHead>Aluguel</TableHead><TableHead>Parcelas</TableHead></TableRow></TableHeader>
              <TableBody>{contracts.data.content.map((item) => (
                <TableRow key={item.id}>
                  <TableCell><Link className="text-primary hover:underline" to={`/app/contracts/${item.id}`}>{item.code}</Link></TableCell>
                  <TableCell>{item.propertyTitle}</TableCell><TableCell>{item.tenantName}</TableCell><TableCell>{formatBRL(item.monthlyRent)}</TableCell>
                  <TableCell><Button size="sm" variant={selected === item.id ? 'default' : 'outline'} aria-label={`Ver parcelas de ${item.code}`} onClick={() => setSelected(item.id)}>Ver parcelas</Button></TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
            <Pagination page={page} totalPages={contracts.data.totalPages} onChange={setPage} />
          </>
        )}
      </section>
      {selected && (
        <section className="mt-5 rounded-xl border bg-card p-4" aria-label="Parcelas do contrato">
          {contract.isPending ? <LoadingRows rows={3} /> : contract.isError ? (
            <ErrorState error={contract.error} onRetry={() => contract.refetch()} />
          ) : detail && (
            <>
              <h2 className="mb-3 font-semibold">Parcelas de {detail.code}</h2>
              <dl className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {Object.entries({ Total: detail.summary.total, Recebido: detail.summary.received, 'Em aberto': detail.summary.open, 'Em atraso': detail.summary.overdue }).map(([label, amount]) => (
                  <div className="rounded-lg bg-muted p-3" key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="font-semibold">{formatBRL(amount)}</dd></div>
                ))}
              </dl>
              {detail.installments.length === 0 ? <EmptyState title="Nenhuma parcela neste contrato" /> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Nº</TableHead><TableHead>Vencimento</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>{detail.installments.map((item) => (
                    <TableRow key={item.id}><TableCell>{item.number}</TableCell><TableCell>{formatDate(item.dueDate)}</TableCell><TableCell>{formatBRL(item.amount)}</TableCell><TableCell>{installmentStatusLabel[item.status] ?? item.status}</TableCell></TableRow>
                  ))}</TableBody>
                </Table>
              )}
            </>
          )}
        </section>
      )}
    </>
  )
}

function MaintenanceRow({ property }: { property: PropertyListItem }) {
  const change = useChangeStatus(property.id)
  const inMaintenance = property.status === 'MANUTENCAO'
  return (
    <TableRow>
      <TableCell><Link className="text-primary hover:underline" to={`/app/properties/${property.id}`}>{property.code} · {property.title}</Link></TableCell>
      <TableCell>{property.city} – {property.state}</TableCell>
      <TableCell><StatusBadge status={property.status} /></TableCell>
      <TableCell>
        <Button size="sm" variant="outline" disabled={change.isPending} onClick={() => change.mutate(inMaintenance ? 'DISPONIVEL' : 'MANUTENCAO', {
          onSuccess: () => toast.success(inMaintenance ? 'Imóvel liberado' : 'Imóvel marcado em manutenção'),
          onError: (error) => toast.error(error.message),
        })}>{inMaintenance ? 'Liberar imóvel' : 'Marcar em manutenção'}</Button>
      </TableCell>
    </TableRow>
  )
}

export function MaintenancePage() {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [available, setAvailable] = useState(false)
  const q = useDebounced(search)
  const properties = useProperties({ page, q, status: available ? 'DISPONIVEL' : 'MANUTENCAO' })
  return (
    <>
      <PageHeader title="Manutenções" description="Acompanhe os imóveis em manutenção e libere-os quando estiverem disponíveis." />
      <section className="rounded-xl border bg-card p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          <Button variant={available ? 'outline' : 'default'} aria-pressed={!available} onClick={() => { setAvailable(false); setPage(0) }}>Em manutenção</Button>
          <Button variant={available ? 'default' : 'outline'} aria-pressed={available} onClick={() => { setAvailable(true); setPage(0) }}>Imóveis disponíveis</Button>
          <Input className="max-w-xs" aria-label="Buscar imóvel" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0) }} placeholder="Buscar imóvel" />
        </div>
        {properties.isPending || properties.isPlaceholderData ? <LoadingRows rows={3} /> : properties.isError ? <ErrorState error={properties.error} onRetry={() => properties.refetch()} /> : (
          <>
            {properties.data.content.length === 0 ? <EmptyState title="Nenhum imóvel encontrado" /> : (
              <Table>
                <TableHeader><TableRow><TableHead>Imóvel</TableHead><TableHead>Cidade</TableHead><TableHead>Status</TableHead><TableHead>Ação</TableHead></TableRow></TableHeader>
                <TableBody>{properties.data.content.map((property) => <MaintenanceRow key={property.id} property={property} />)}</TableBody>
              </Table>
            )}
            <Pagination page={page} totalPages={properties.data.totalPages} onChange={setPage} />
          </>
        )}
      </section>
    </>
  )
}

export function ReportsPage() {
  const total = usePropertyCount()
  const occupied = usePropertyCount('OCUPADO')
  const available = usePropertyCount('DISPONIVEL')
  const maintenance = usePropertyCount('MANUTENCAO')
  const contracts = useContractStats()
  const queries = [total, occupied, available, maintenance, contracts]
  const rows: [string, number | undefined][] = [
    ['Total de imóveis', total.data], ['Imóveis alugados', occupied.data],
    ['Imóveis disponíveis', available.data], ['Imóveis em manutenção', maintenance.data],
    ['Total de contratos', contracts.data?.total], ['Contratos ativos', contracts.data?.active],
    ['Contratos a vencer', contracts.data?.ending], ['Contratos encerrados', contracts.data?.ended],
  ]
  const error = queries.find((query) => query.isError)
  const pending = queries.some((query) => query.isPending)
  function download() {
    const csv = ['Indicador;Quantidade', ...rows.map(([label, value]) => `${label};${value}`)].join('\r\n')
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'imobly-relatorio-carteira.csv'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <>
      <PageHeader title="Relatórios" description="Resumo da carteira de imóveis e contratos." actions={<Button onClick={download} disabled={pending || Boolean(error)}><Download /> Exportar CSV</Button>} />
      <section className="rounded-xl border bg-card p-4">
        {error ? <ErrorState error={error.error} onRetry={() => queries.forEach((query) => void query.refetch())} /> : pending ? <LoadingRows rows={4} /> : (
          <Table>
            <TableHeader><TableRow><TableHead>Indicador</TableHead><TableHead>Quantidade</TableHead></TableRow></TableHeader>
            <TableBody>{rows.map(([label, value]) => <TableRow key={label}><TableCell>{label}</TableCell><TableCell>{value}</TableCell></TableRow>)}</TableBody>
          </Table>
        )}
      </section>
    </>
  )
}

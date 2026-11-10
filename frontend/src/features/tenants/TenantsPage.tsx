import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Pagination } from '@/components/Pagination'
import { EmptyState, ErrorState, LoadingRows, PageHeader } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ApiError } from '@/lib/api'
import { useDebounced } from '@/lib/useDebounced'
import { formatDocument, formatPhone, initials } from '@/lib/format'
import { useTenantContractCount } from '@/features/contracts/api'
import { useDeleteTenant, useTenants, type Tenant } from './api'

function ContractCount({ tenantId }: { tenantId: string }) {
  const count = useTenantContractCount(tenantId)
  return <>{count.data ?? (count.isError ? '—' : '…')}</>
}

export function TenantsPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const page = Number(params.get('page') ?? 0)
  const tenants = useTenants({ q: useDebounced(q), page })
  const remove = useDeleteTenant()
  const [toDelete, setToDelete] = useState<Tenant | null>(null)

  const update = (next: Record<string, string>) => setParams({ ...Object.fromEntries(params), ...next }, { replace: true })

  return (
    <>
      <PageHeader
        title="Inquilinos"
        description={tenants.data ? `${tenants.data.totalElements} ${tenants.data.totalElements === 1 ? 'registrado' : 'registrados'}` : 'Quem aluga os imóveis administrados.'}
        actions={
          <Button variant="brand" asChild>
            <Link to="/app/tenants/new"><Plus /> Novo inquilino</Link>
          </Button>
        }
      />
      <div className="mb-4 rounded-xl border bg-card p-3 shadow-xs">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            className="pl-9"
            placeholder="Buscar por nome, CPF/CNPJ…"
            aria-label="Buscar inquilinos"
            defaultValue={q}
            onChange={(e) => update({ q: e.target.value, page: '0' })}
          />
        </div>
      </div>

      {tenants.isPending ? (
        <LoadingRows />
      ) : tenants.isError ? (
        <ErrorState error={tenants.error} onRetry={() => tenants.refetch()} />
      ) : tenants.data.content.length === 0 ? (
        <EmptyState
          title={q ? 'Nenhum inquilino encontrado' : 'Nenhum inquilino cadastrado'}
          description={q ? 'Tente outro termo de busca.' : 'Cadastre o primeiro inquilino para fechar contratos.'}
          action={!q && <Button variant="brand" asChild><Link to="/app/tenants/new"><Plus /> Cadastrar inquilino</Link></Button>}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <Table>
              <TableHeader className="bg-muted/60">
                <TableRow>
                  <TableHead className="pl-4">Nome</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead className="text-center">Contratos</TableHead>
                  <TableHead className="w-24 pr-4 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.data.content.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="pl-4 font-medium">
                      <span className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground" aria-hidden>
                          {initials(o.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate">{o.name}</span>
                          <span className="block truncate text-xs font-normal text-muted-foreground">
                            {[o.email, o.phone && formatPhone(o.phone)].filter(Boolean).join(' · ') || 'Sem contato'}
                          </span>
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>{formatDocument(o.document)}</TableCell>
                    <TableCell className="text-center"><ContractCount tenantId={o.id} /></TableCell>
                    <TableCell className="flex justify-end gap-1 pr-4">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/app/tenants/${o.id}/edit`} aria-label={`Editar ${o.name}`}><Pencil /></Link>
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Excluir ${o.name}`} onClick={() => setToDelete(o)}>
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination page={page} totalPages={tenants.data.totalPages} total={tenants.data.totalElements} size={20} onChange={(p) => update({ page: String(p) })} />
        </>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Excluir inquilino?"
        description={`${toDelete?.name ?? ''} será removido. Inquilinos com contratos não podem ser excluídos.`}
        confirmLabel="Excluir"
        pending={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() =>
          remove.mutate(toDelete!.id, {
            onSuccess: () => toast.success('Inquilino excluído'),
            onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Não foi possível excluir'),
            onSettled: () => setToDelete(null),
          })
        }
      />
    </>
  )
}

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
import { formatDocument, formatPhone, initials } from '@/lib/format'
import { useDeleteOwner, useOwners, type Owner } from './api'

export function OwnersPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const page = Number(params.get('page') ?? 0)
  const owners = useOwners({ q, page })
  const remove = useDeleteOwner()
  const [toDelete, setToDelete] = useState<Owner | null>(null)

  const update = (next: Record<string, string>) => setParams({ ...Object.fromEntries(params), ...next }, { replace: true })

  return (
    <>
      <PageHeader
        title="Proprietários"
        description={owners.data ? `${owners.data.totalElements} ${owners.data.totalElements === 1 ? 'registrado' : 'registrados'}` : 'Donos dos imóveis administrados.'}
        actions={
          <Button variant="brand" asChild>
            <Link to="/app/owners/new"><Plus /> Novo proprietário</Link>
          </Button>
        }
      />
      <div className="mb-4 rounded-xl border bg-card p-3 shadow-xs">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            className="pl-9"
            placeholder="Buscar por nome, CPF/CNPJ…"
            aria-label="Buscar proprietários"
            defaultValue={q}
            onChange={(e) => update({ q: e.target.value, page: '0' })}
          />
        </div>
      </div>

      {owners.isPending ? (
        <LoadingRows />
      ) : owners.isError ? (
        <ErrorState error={owners.error} onRetry={() => owners.refetch()} />
      ) : owners.data.content.length === 0 ? (
        <EmptyState
          title={q ? 'Nenhum proprietário encontrado' : 'Nenhum proprietário cadastrado'}
          description={q ? 'Tente outro termo de busca.' : 'Cadastre o primeiro proprietário para vincular imóveis.'}
          action={!q && <Button variant="brand" asChild><Link to="/app/owners/new"><Plus /> Cadastrar proprietário</Link></Button>}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
            <Table>
              <TableHeader className="bg-muted/60">
                <TableRow>
                  <TableHead className="pl-4">Nome</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead className="hidden md:table-cell">E-mail</TableHead>
                  <TableHead className="hidden lg:table-cell">Telefone</TableHead>
                  <TableHead className="w-24 pr-4 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {owners.data.content.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="pl-4 font-medium">
                      <span className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground" aria-hidden>
                          {initials(o.name)}
                        </span>
                        {o.name}
                      </span>
                    </TableCell>
                    <TableCell>{formatDocument(o.document)}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{o.email ?? '—'}</TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">{o.phone ? formatPhone(o.phone) : '—'}</TableCell>
                    <TableCell className="flex justify-end gap-1 pr-4">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/app/owners/${o.id}/edit`} aria-label={`Editar ${o.name}`}><Pencil /></Link>
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
          <Pagination page={page} totalPages={owners.data.totalPages} total={owners.data.totalElements} size={20} onChange={(p) => update({ page: String(p) })} />
        </>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Excluir proprietário?"
        description={`${toDelete?.name ?? ''} será removido. Proprietários com imóveis não podem ser excluídos.`}
        confirmLabel="Excluir"
        pending={remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() =>
          remove.mutate(toDelete!.id, {
            onSuccess: () => toast.success('Proprietário excluído'),
            onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Não foi possível excluir'),
            onSettled: () => setToDelete(null),
          })
        }
      />
    </>
  )
}

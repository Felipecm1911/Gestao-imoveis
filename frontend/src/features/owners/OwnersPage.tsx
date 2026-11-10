import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Pagination } from '@/components/Pagination'
import { EmptyState, ErrorState, LoadingRows, PageHeader } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ApiError } from '@/lib/api'
import { formatDocument, initials } from '@/lib/format'
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
        description="Donos dos imóveis administrados."
        actions={
          <Button asChild>
            <Link to="/app/owners/new"><Plus /> Novo proprietário</Link>
          </Button>
        }
      />
      <Input
        className="mb-4 max-w-sm bg-card"
        placeholder="Buscar por nome ou CPF/CNPJ"
        aria-label="Buscar proprietários"
        defaultValue={q}
        onChange={(e) => update({ q: e.target.value, page: '0' })}
      />

      {owners.isPending ? (
        <LoadingRows />
      ) : owners.isError ? (
        <ErrorState error={owners.error} onRetry={() => owners.refetch()} />
      ) : owners.data.content.length === 0 ? (
        <EmptyState
          title={q ? 'Nenhum proprietário encontrado' : 'Nenhum proprietário cadastrado'}
          description={q ? 'Tente outro termo de busca.' : 'Cadastre o primeiro proprietário para vincular imóveis.'}
          action={!q && <Button asChild><Link to="/app/owners/new">Cadastrar proprietário</Link></Button>}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border bg-card">
            <Table>
              <TableHeader className="bg-muted/60">
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead className="hidden md:table-cell">Contato</TableHead>
                  <TableHead className="w-24"><span className="sr-only">Ações</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {owners.data.content.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground" aria-hidden>
                          {initials(o.name)}
                        </span>
                        {o.name}
                      </span>
                    </TableCell>
                    <TableCell>{formatDocument(o.document)}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{o.email ?? o.phone ?? '—'}</TableCell>
                    <TableCell className="flex justify-end gap-1">
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
          <Pagination page={page} totalPages={owners.data.totalPages} onChange={(p) => update({ page: String(p) })} />
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

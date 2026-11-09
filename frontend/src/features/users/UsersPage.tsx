import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Navigate } from 'react-router'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { applyServerErrors, Field, FormError } from '@/components/form'
import { EmptyState, ErrorState, LoadingRows, PageHeader } from '@/components/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useMe } from '@/features/auth/api'
import { ApiError } from '@/lib/api'
import { useCreateUser, useDeactivateUser, useUsers, type User } from './api'
import { newUserSchema, type NewUserForm } from './schemas'

function NewUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateUser()
  const form = useForm<NewUserForm>({
    resolver: zodResolver(newUserSchema),
    defaultValues: { name: '', email: '', password: '', role: 'STAFF' },
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await create.mutateAsync(values)
      toast.success('Usuário criado')
      form.reset()
      onClose()
    } catch (e) {
      applyServerErrors(e, form.setError)
    }
  })

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo usuário</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} noValidate className="grid gap-4">
          <FormError error={create.error} />
          <Field label="Nome" error={errors.name?.message}>{(p) => <Input {...p} {...form.register('name')} />}</Field>
          <Field label="E-mail" error={errors.email?.message}>{(p) => <Input type="email" {...p} {...form.register('email')} />}</Field>
          <Field label="Senha inicial" error={errors.password?.message}>
            {(p) => <Input type="password" autoComplete="new-password" {...p} {...form.register('password')} />}
          </Field>
          <Field label="Perfil" error={errors.role?.message}>
            {(p) => (
              <Controller control={form.control} name="role" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger {...p} className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STAFF">Equipe (cadastros do dia a dia)</SelectItem>
                    <SelectItem value="ADMIN">Administrador (inclui usuários)</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            )}
          </Field>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Criando…' : 'Criar usuário'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function UsersPage() {
  const me = useMe()
  const users = useUsers()
  const deactivate = useDeactivateUser()
  const [creating, setCreating] = useState(false)
  const [toDeactivate, setToDeactivate] = useState<User | null>(null)

  if (me.data?.role !== 'ADMIN') return <Navigate to="/app/properties" replace />
  const myId = me.data.id

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Quem acessa o sistema da sua imobiliária."
        actions={<Button onClick={() => setCreating(true)}><Plus /> Novo usuário</Button>}
      />
      {users.isPending ? (
        <LoadingRows />
      ) : users.isError ? (
        <ErrorState error={users.error} onRetry={() => users.refetch()} />
      ) : users.data.length === 0 ? (
        <EmptyState title="Nenhum usuário" />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead><span className="sr-only">Ações</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.data.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{u.email}</TableCell>
                  <TableCell>{u.role === 'ADMIN' ? 'Administrador' : 'Equipe'}</TableCell>
                  <TableCell>
                    <Badge variant={u.active ? 'secondary' : 'outline'}>{u.active ? 'Ativo' : 'Desativado'}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {u.active && u.id !== myId && (
                      <Button variant="ghost" size="sm" onClick={() => setToDeactivate(u)}>Desativar</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <NewUserDialog open={creating} onClose={() => setCreating(false)} />
      <ConfirmDialog
        open={!!toDeactivate}
        title="Desativar usuário?"
        description={`${toDeactivate?.name ?? ''} perde o acesso imediatamente, inclusive sessões abertas.`}
        confirmLabel="Desativar"
        pending={deactivate.isPending}
        onCancel={() => setToDeactivate(null)}
        onConfirm={() =>
          deactivate.mutate(toDeactivate!.id, {
            onSuccess: () => toast.success('Usuário desativado'),
            onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Não foi possível desativar'),
            onSettled: () => setToDeactivate(null),
          })
        }
      />
    </>
  )
}

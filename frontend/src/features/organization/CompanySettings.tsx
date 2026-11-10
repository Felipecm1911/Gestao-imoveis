import { useForm } from 'react-hook-form'
import { Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { applyServerErrors, Field, FormError } from '@/components/form'
import { ErrorState, LoadingRows } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useOrganization, useRenameOrganization, type Organization } from './api'

function CompanyForm({ org }: { org: Organization }) {
  const rename = useRenameOrganization()
  const form = useForm({ values: { name: org.name } })
  const { errors, isSubmitting, isDirty } = form.formState

  const onSubmit = form.handleSubmit(async ({ name }) => {
    try {
      await rename.mutateAsync(name.trim())
      toast.success('Alterações salvas')
    } catch (e) {
      applyServerErrors(e, form.setError)
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-xl border bg-card p-5 shadow-xs">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_240px]">
        <div className="grid content-start gap-4">
          <FormError error={rename.error} />
          <Field label="Nome da imobiliária" error={errors.name?.message}>
            {(p) => (
              <Input {...p} {...form.register('name', {
                validate: (v) => v.trim().length > 0 || 'Informe o nome da imobiliária',
                maxLength: { value: 120, message: 'Máximo de 120 caracteres' },
              })} />
            )}
          </Field>
          <Field label="Identificador">{(p) => <Input {...p} value={org.slug} readOnly disabled />}</Field>
          <Field label="Plano">{(p) => <Input {...p} value={org.plan} readOnly disabled />}</Field>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center">
          <Building2 className="size-14 text-sidebar dark:text-foreground" strokeWidth={1.5} aria-hidden />
          <p className="font-semibold break-words">{org.name}</p>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <Button type="submit" variant="brand" disabled={isSubmitting || !isDirty}>{isSubmitting ? 'Salvando…' : 'Salvar alterações'}</Button>
      </div>
    </form>
  )
}

export function CompanySettings() {
  const org = useOrganization()
  return (
    <section aria-labelledby="company-title" className="min-w-0">
      <div className="mb-4">
        <h2 id="company-title" className="text-lg font-semibold">Empresa</h2>
        <p className="text-sm text-muted-foreground">Dados da sua imobiliária.</p>
      </div>
      {org.isPending ? <LoadingRows rows={3} /> : org.isError ? <ErrorState error={org.error} onRetry={() => org.refetch()} /> : <CompanyForm org={org.data} />}
    </section>
  )
}

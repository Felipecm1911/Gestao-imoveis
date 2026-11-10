import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { applyServerErrors, Field, FormError } from '@/components/form'
import { ErrorState, LoadingRows, PageHeader } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTenant, useSaveTenant } from './api'
import { emptyTenant, fromTenant, tenantSchema, toPayload, type TenantForm } from './schemas'

export function TenantFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const tenant = useTenant(id)
  const save = useSaveTenant(id)
  const form = useForm<TenantForm>({ resolver: zodResolver(tenantSchema), defaultValues: emptyTenant })
  const { errors, isSubmitting } = form.formState
  const { reset } = form

  useEffect(() => {
    if (tenant.data) reset(fromTenant(tenant.data))
  }, [tenant.data, reset])

  if (id && tenant.isPending) return <LoadingRows rows={8} />
  if (id && tenant.isError) return <ErrorState error={tenant.error} onRetry={() => tenant.refetch()} />

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await save.mutateAsync(toPayload(values, tenant.data?.version))
      toast.success(id ? 'Inquilino atualizado' : 'Inquilino cadastrado')
      navigate('/app/tenants')
    } catch (e) {
      applyServerErrors(e, form.setError)
    }
  })

  const text = (name: keyof TenantForm, label: string, extra: Record<string, unknown> = {}, className = '') => (
    <Field label={label} error={errors[name]?.message} className={className}>
      {(p) => <Input {...p} {...extra} {...form.register(name)} />}
    </Field>
  )

  return (
    <>
      <PageHeader title={id ? 'Editar inquilino' : 'Novo inquilino'} />
      <form onSubmit={onSubmit} noValidate className="grid max-w-4xl gap-5">
        <FormError error={save.error} />
        <fieldset className="grid gap-4 rounded-xl border bg-card p-5 shadow-xs sm:grid-cols-2">
          <legend className="float-left col-span-full mb-1 text-base font-semibold">Dados</legend>
          {text('name', 'Nome completo ou razão social', { autoComplete: 'name' }, 'sm:col-span-2')}
          {text('document', 'CPF ou CNPJ', { inputMode: 'numeric' })}
          {text('phone', 'Telefone', { inputMode: 'tel', autoComplete: 'tel' })}
          {text('email', 'E-mail', { type: 'email', autoComplete: 'email' }, 'sm:col-span-2')}
        </fieldset>
        <fieldset className="grid gap-4 rounded-xl border bg-card p-5 shadow-xs sm:grid-cols-6">
          <legend className="float-left col-span-full mb-1 text-base font-semibold">Endereço (opcional)</legend>
          {text('zip', 'CEP', { inputMode: 'numeric' }, 'sm:col-span-2')}
          {text('street', 'Rua', {}, 'sm:col-span-4')}
          {text('number', 'Número', {}, 'sm:col-span-1')}
          {text('complement', 'Complemento', {}, 'sm:col-span-2')}
          {text('district', 'Bairro', {}, 'sm:col-span-3')}
          {text('city', 'Cidade', {}, 'sm:col-span-4')}
          {text('state', 'UF', { maxLength: 2 }, 'sm:col-span-2')}
        </fieldset>
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando…' : 'Salvar'}</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/app/tenants')}>Cancelar</Button>
        </div>
      </form>
    </>
  )
}

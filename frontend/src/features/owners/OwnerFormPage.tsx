import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { applyServerErrors, Field, FormError } from '@/components/form'
import { ErrorState, LoadingRows, PageHeader } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useOwner, useSaveOwner } from './api'
import { emptyOwner, fromOwner, ownerSchema, toPayload, type OwnerForm } from './schemas'

export function OwnerFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const owner = useOwner(id)
  const save = useSaveOwner(id)
  const form = useForm<OwnerForm>({ resolver: zodResolver(ownerSchema), defaultValues: emptyOwner })
  const { errors, isSubmitting } = form.formState
  const { reset } = form

  useEffect(() => {
    if (owner.data) reset(fromOwner(owner.data))
  }, [owner.data, reset])

  if (id && owner.isPending) return <LoadingRows rows={8} />
  if (id && owner.isError) return <ErrorState error={owner.error} onRetry={() => owner.refetch()} />

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await save.mutateAsync(toPayload(values, owner.data?.version))
      toast.success(id ? 'Proprietário atualizado' : 'Proprietário cadastrado')
      navigate('/app/owners')
    } catch (e) {
      applyServerErrors(e, form.setError)
    }
  })

  const text = (name: keyof OwnerForm, label: string, extra: Record<string, unknown> = {}, className = '') => (
    <Field label={label} error={errors[name]?.message} className={className}>
      {(p) => <Input {...p} {...extra} {...form.register(name)} />}
    </Field>
  )

  return (
    <>
      <PageHeader title={id ? 'Editar proprietário' : 'Novo proprietário'} />
      <form onSubmit={onSubmit} noValidate className="grid max-w-3xl gap-6">
        <FormError error={save.error} />
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-2 font-medium">Dados</legend>
          {text('name', 'Nome completo ou razão social', { autoComplete: 'name' }, 'sm:col-span-2')}
          {text('document', 'CPF ou CNPJ', { inputMode: 'numeric' })}
          {text('phone', 'Telefone', { inputMode: 'tel', autoComplete: 'tel' })}
          {text('email', 'E-mail', { type: 'email', autoComplete: 'email' }, 'sm:col-span-2')}
        </fieldset>
        <fieldset className="grid gap-4 sm:grid-cols-6">
          <legend className="mb-2 font-medium">Endereço (opcional)</legend>
          {text('zip', 'CEP', { inputMode: 'numeric' }, 'sm:col-span-2')}
          {text('street', 'Rua', {}, 'sm:col-span-4')}
          {text('number', 'Número', {}, 'sm:col-span-1')}
          {text('complement', 'Complemento', {}, 'sm:col-span-2')}
          {text('district', 'Bairro', {}, 'sm:col-span-3')}
          {text('city', 'Cidade', {}, 'sm:col-span-4')}
          {text('state', 'UF', { maxLength: 2 }, 'sm:col-span-2')}
        </fieldset>
        <Field label="Dados bancários / PIX (opcional)" error={errors.bankInfo?.message}>
          {(p) => <Textarea rows={2} {...p} {...form.register('bankInfo')} />}
        </Field>
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando…' : 'Salvar'}</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/app/owners')}>Cancelar</Button>
        </div>
      </form>
    </>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { applyServerErrors, Field, FormError } from '@/components/form'
import { EmptyState, ErrorState, LoadingRows, PageHeader } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useOwners } from '@/features/owners/api'
import { propertyTypeLabel } from '@/lib/format'
import { useProperty, useSaveProperty } from './api'
import { emptyProperty, fromProperty, propertySchema, toPayload, type PropertyForm } from './schemas'

export function PropertyFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const property = useProperty(id)
  // shortcut: lista até 100 proprietários num select; acima disso, trocar por busca com autocomplete
  const owners = useOwners({ size: 100 })
  const save = useSaveProperty(id)
  const form = useForm<PropertyForm>({ resolver: zodResolver(propertySchema), defaultValues: emptyProperty })
  const { errors, isSubmitting } = form.formState
  const { reset } = form

  useEffect(() => {
    if (property.data) reset(fromProperty(property.data))
  }, [property.data, reset])

  if ((id && property.isPending) || owners.isPending) return <LoadingRows rows={10} />
  if (id && property.isError) return <ErrorState error={property.error} onRetry={() => property.refetch()} />
  if (owners.isError) return <ErrorState error={owners.error} onRetry={() => owners.refetch()} />
  if (owners.data.content.length === 0) {
    return (
      <EmptyState
        title="Cadastre um proprietário primeiro"
        description="Todo imóvel pertence a um proprietário."
        action={<Button asChild><Link to="/app/owners/new">Cadastrar proprietário</Link></Button>}
      />
    )
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const saved = await save.mutateAsync(toPayload(values, property.data?.version))
      toast.success(id ? 'Imóvel atualizado' : 'Imóvel cadastrado')
      navigate(`/app/properties/${saved?.id ?? id}`)
    } catch (e) {
      applyServerErrors(e, form.setError)
    }
  })

  const text = (name: keyof PropertyForm, label: string, className = '', extra: Record<string, unknown> = {}) => (
    <Field label={label} error={errors[name]?.message} className={className}>
      {(p) => <Input {...p} {...extra} {...form.register(name)} />}
    </Field>
  )

  return (
    <>
      <PageHeader title={id ? 'Editar imóvel' : 'Novo imóvel'} />
      <form onSubmit={onSubmit} noValidate className="grid max-w-4xl gap-5">
        <FormError error={save.error} />
        <fieldset className="grid gap-4 rounded-xl border bg-card p-5 shadow-xs sm:grid-cols-6">
          <legend className="float-left col-span-full mb-1 text-base font-semibold">Identificação</legend>
          <Field label="Proprietário" error={errors.ownerId?.message} className="sm:col-span-4">
            {(p) => (
              <Controller
                control={form.control}
                name="ownerId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger {...p} className="w-full"><SelectValue placeholder="Escolha…" /></SelectTrigger>
                    <SelectContent>
                      {owners.data.content.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </Field>
          {text('code', 'Código', 'sm:col-span-2', { placeholder: 'AP-0001' })}
          {text('title', 'Título', 'sm:col-span-4')}
          <Field label="Tipo" error={errors.type?.message} className="sm:col-span-2">
            {(p) => (
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger {...p} className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(propertyTypeLabel).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </Field>
          <Field label="Descrição (opcional)" error={errors.description?.message} className="sm:col-span-6">
            {(p) => <Textarea rows={3} {...p} {...form.register('description')} />}
          </Field>
        </fieldset>

        <fieldset className="grid gap-4 rounded-xl border bg-card p-5 shadow-xs sm:grid-cols-6">
          <legend className="float-left col-span-full mb-1 text-base font-semibold">Endereço</legend>
          {text('zip', 'CEP', 'sm:col-span-2', { inputMode: 'numeric' })}
          {text('street', 'Rua', 'sm:col-span-4')}
          {text('number', 'Número', 'sm:col-span-1')}
          {text('complement', 'Complemento', 'sm:col-span-2')}
          {text('district', 'Bairro', 'sm:col-span-3')}
          {text('city', 'Cidade', 'sm:col-span-4')}
          {text('state', 'UF', 'sm:col-span-2', { maxLength: 2 })}
        </fieldset>

        <fieldset className="grid gap-4 rounded-xl border bg-card p-5 shadow-xs grid-cols-2 sm:grid-cols-5">
          <legend className="float-left col-span-full mb-1 text-base font-semibold">Características e valor</legend>
          {text('areaM2', 'Área (m²)', '', { inputMode: 'decimal' })}
          {text('bedrooms', 'Quartos', '', { inputMode: 'numeric' })}
          {text('bathrooms', 'Banheiros', '', { inputMode: 'numeric' })}
          {text('parking', 'Vagas', '', { inputMode: 'numeric' })}
          {text('suggestedRent', 'Aluguel sugerido (R$)', 'col-span-2 sm:col-span-1', { inputMode: 'decimal', placeholder: '2.300,00' })}
        </fieldset>

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando…' : 'Salvar'}</Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
        </div>
      </form>
    </>
  )
}

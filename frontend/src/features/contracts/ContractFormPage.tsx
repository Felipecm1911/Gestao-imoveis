import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { applyServerErrors, Field, FormError } from '@/components/form'
import { EmptyState, ErrorState, LoadingRows, PageHeader } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useProperties } from '@/features/properties/api'
import { useTenants } from '@/features/tenants/api'
import { adjustmentIndexLabel, guaranteeLabel } from '@/lib/format'
import { useContract, useSaveContract } from './api'
import { contractSchema, emptyContract, fromContract, toPayload, type ContractForm } from './schemas'

export function ContractFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const contract = useContract(id)
  // shortcut: selects listam até 100 imóveis/inquilinos; acima disso, trocar por busca com autocomplete
  const properties = useProperties({ size: 100 })
  const tenants = useTenants({ size: 100 })
  const save = useSaveContract(id)
  const form = useForm<ContractForm>({ resolver: zodResolver(contractSchema), defaultValues: emptyContract })
  const { errors, isSubmitting } = form.formState
  const { reset } = form
  const [index, guarantee] = useWatch({ control: form.control, name: ['adjustmentIndex', 'guaranteeType'] })

  useEffect(() => {
    if (contract.data) reset(fromContract(contract.data))
  }, [contract.data, reset])

  if ((id && contract.isPending) || properties.isPending || tenants.isPending) return <LoadingRows rows={10} />
  if (id && contract.isError) return <ErrorState error={contract.error} onRetry={() => contract.refetch()} />
  if (properties.isError) return <ErrorState error={properties.error} onRetry={() => properties.refetch()} />
  if (tenants.isError) return <ErrorState error={tenants.error} onRetry={() => tenants.refetch()} />
  if (properties.data.content.length === 0) {
    return (
      <EmptyState
        title="Cadastre um imóvel primeiro"
        description="Todo contrato aluga um imóvel da carteira."
        action={<Button asChild><Link to="/app/properties/new">Cadastrar imóvel</Link></Button>}
      />
    )
  }
  if (tenants.data.content.length === 0) {
    return (
      <EmptyState
        title="Cadastre um inquilino primeiro"
        description="Todo contrato tem um inquilino."
        action={<Button asChild><Link to="/app/tenants/new">Cadastrar inquilino</Link></Button>}
      />
    )
  }
  if (contract.data && contract.data.status !== 'RASCUNHO' && contract.data.status !== 'ATIVO') {
    return (
      <EmptyState
        title="Este contrato não pode mais ser alterado"
        description="Contratos encerrados ou cancelados ficam só para consulta."
        action={<Button asChild><Link to={`/app/contracts/${contract.data.id}`}>Ver contrato</Link></Button>}
      />
    )
  }

  // contrato ativo: só garantia e observações mudam (valor muda por reajuste; datas, por renovação ou encerramento)
  const locked = contract.data?.status === 'ATIVO'

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const saved = await save.mutateAsync(toPayload(values, contract.data?.version))
      toast.success(id ? 'Contrato atualizado' : 'Rascunho do contrato criado')
      navigate(`/app/contracts/${saved.id}`)
    } catch (e) {
      applyServerErrors(e, form.setError)
    }
  })

  const text = (name: keyof ContractForm, label: string, className = '', extra: Record<string, unknown> = {}) => (
    <Field label={label} error={errors[name]?.message} className={className}>
      {(p) => <Input {...p} {...extra} {...form.register(name)} />}
    </Field>
  )

  const select = (name: keyof ContractForm, label: string, options: [string, string][], className = '', disabled = false) => (
    <Field label={label} error={errors[name]?.message} className={className}>
      {(p) => (
        <Controller
          control={form.control}
          name={name}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
              <SelectTrigger {...p} className="w-full"><SelectValue placeholder="Escolha…" /></SelectTrigger>
              <SelectContent>
                {options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        />
      )}
    </Field>
  )

  return (
    <>
      <PageHeader
        title={id ? `Editar contrato ${contract.data?.code ?? ''}` : 'Novo contrato'}
        description={locked
          ? 'Contrato ativo: só garantia e observações podem mudar. Para o valor, use Reajustar; para as datas, Renovar ou Encerrar.'
          : 'O contrato nasce como rascunho. As parcelas são geradas quando você ativar.'}
      />
      <form onSubmit={onSubmit} noValidate className="grid max-w-4xl gap-5">
        <FormError error={save.error} />
        <fieldset className="grid gap-4 rounded-xl border bg-card p-5 shadow-xs sm:grid-cols-2">
          <legend className="float-left col-span-full mb-1 text-base font-semibold">Partes</legend>
          {select('propertyId', 'Imóvel', properties.data.content.filter((p) => p.status !== 'INATIVO' || p.id === contract.data?.property.id).map((p) => [p.id, `${p.code} – ${p.title}`]), '', locked)}
          {select('tenantId', 'Inquilino', tenants.data.content.map((t) => [t.id, t.name]), '', locked)}
        </fieldset>

        <fieldset className="grid grid-cols-2 gap-4 rounded-xl border bg-card p-5 shadow-xs sm:grid-cols-4">
          <legend className="float-left col-span-full mb-1 text-base font-semibold">Vigência e valor</legend>
          {text('startDate', 'Início', '', { type: 'date', disabled: locked })}
          {text('endDate', 'Término', '', { type: 'date', disabled: locked })}
          {text('monthlyRent', 'Aluguel mensal (R$)', '', { inputMode: 'decimal', placeholder: '2.300,00', disabled: locked })}
          {text('dueDay', 'Dia do vencimento', '', { inputMode: 'numeric', disabled: locked })}
          {select('adjustmentIndex', 'Reajuste anual', Object.entries(adjustmentIndexLabel), 'col-span-2', locked)}
          {index === 'PERCENTUAL_FIXO' && text('adjustmentPercent', 'Percentual ao ano (%)', 'col-span-2', { inputMode: 'decimal', placeholder: '5,00', disabled: locked })}
        </fieldset>

        <fieldset className="grid gap-4 rounded-xl border bg-card p-5 shadow-xs sm:grid-cols-2">
          <legend className="float-left col-span-full mb-1 text-base font-semibold">Garantia e observações</legend>
          {select('guaranteeType', 'Garantia', Object.entries(guaranteeLabel))}
          {guarantee !== 'NENHUMA' && text('guaranteeValue', 'Valor da garantia (R$)', '', { inputMode: 'decimal', placeholder: '6.900,00' })}
          {guarantee !== 'NENHUMA' && (
            <Field label="Detalhes da garantia (opcional)" error={errors.guaranteeNotes?.message} className="sm:col-span-2">
              {(p) => <Textarea rows={2} {...p} {...form.register('guaranteeNotes')} />}
            </Field>
          )}
          <Field label="Observações (opcional)" error={errors.notes?.message} className="sm:col-span-2">
            {(p) => <Textarea rows={3} {...p} {...form.register('notes')} />}
          </Field>
        </fieldset>

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando…' : 'Salvar'}</Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
        </div>
      </form>
    </>
  )
}

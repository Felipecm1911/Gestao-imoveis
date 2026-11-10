import { useState, type ComponentType, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  ArrowLeft, CalendarDays, ChartColumn, CircleDollarSign, Clock, FileDown, FileText, History, Home, ImageOff,
  Pencil, Play, Receipt, RefreshCw, ShieldCheck, TrendingUp, UserRound, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Field, FormError } from '@/components/form'
import { EmptyState, ErrorState, LoadingRows } from '@/components/states'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/lib/api'
import {
  adjustmentIndexLabel, contractActionLabel, formatBRL, formatDate, formatDateTime, formatDocument, formatMonth,
  formatPercent, guaranteeLabel,
} from '@/lib/format'
import { cn } from '@/lib/utils'
import { useContract, useContractAction, useContractHistory, type Contract } from './api'
import { parsePercentInput } from './schemas'
import { InstallmentBadge, SituationBadge } from './SituationBadge'

const errorToast = (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'Não foi possível concluir a operação.')

function Info({ icon: Icon, label, children }: { icon: ComponentType<{ className?: string }>; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-brand-solid dark:bg-orange-950 dark:text-orange-300">
        <Icon className="size-4.5" aria-hidden />
      </span>
      <div className="min-w-0 text-sm">
        <p className="font-medium">{label}</p>
        <div className="text-muted-foreground">{children}</div>
      </div>
    </div>
  )
}

function AdjustDialog({ contract, onClose }: { contract: Contract; onClose: () => void }) {
  const run = useContractAction(contract.id)
  const [percent, setPercent] = useState('')
  const [effectiveDate, setEffectiveDate] = useState('')
  const parsed = parsePercentInput(percent)
  const invalid = percent !== '' && parsed === null

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reajustar aluguel</DialogTitle>
          <DialogDescription>
            Aluguel atual: {formatBRL(contract.monthlyRent)}. As parcelas em aberto a partir da data de vigência são recalculadas.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            if (!parsed || !effectiveDate) return
            run.mutate({ action: 'adjust', body: { percent: parsed, effectiveDate } }, {
              onSuccess: () => { toast.success('Aluguel reajustado'); onClose() },
            })
          }}
        >
          <FormError error={run.error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Percentual (%)" error={invalid ? 'Ex.: 4,5 (até 2 casas)' : undefined}>
              {(p) => <Input {...p} value={percent} onChange={(e) => setPercent(e.target.value)} inputMode="decimal" placeholder="4,50" required />}
            </Field>
            <Field label="Vigência a partir de">
              {(p) => <Input {...p} type="date" value={effectiveDate} min={contract.startDate} max={contract.endDate} onChange={(e) => setEffectiveDate(e.target.value)} required />}
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={!parsed || !effectiveDate || run.isPending}>{run.isPending ? 'Aguarde…' : 'Aplicar reajuste'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TerminateDialog({ contract, onClose }: { contract: Contract; onClose: () => void }) {
  const run = useContractAction(contract.id)
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Encerrar contrato {contract.code}</DialogTitle>
          <DialogDescription>
            As parcelas com vencimento depois da data de encerramento são canceladas e o imóvel volta a ficar disponível. Não dá para desfazer.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            if (!date || !reason.trim()) return
            run.mutate({ action: 'terminate', body: { date, reason: reason.trim() } }, {
              onSuccess: () => { toast.success('Contrato encerrado'); onClose() },
            })
          }}
        >
          <FormError error={run.error} />
          <Field label="Data de encerramento">
            {(p) => <Input {...p} type="date" value={date} min={contract.startDate} max={contract.endDate} onChange={(e) => setDate(e.target.value)} required />}
          </Field>
          <Field label="Motivo">
            {(p) => <Textarea {...p} rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} required />}
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Voltar</Button>
            <Button type="submit" variant="destructive" disabled={!date || !reason.trim() || run.isPending}>{run.isPending ? 'Aguarde…' : 'Encerrar contrato'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function HistoryTab({ id }: { id: string }) {
  const history = useContractHistory(id)
  if (history.isPending) return <LoadingRows rows={3} />
  if (history.isError) return <ErrorState error={history.error} onRetry={() => history.refetch()} />
  if (history.data.length === 0) return <EmptyState title="Sem registros ainda" />
  return (
    <ol className="divide-y">
      {history.data.map((h, i) => (
        <li key={i} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
          <span className="flex items-center gap-2 font-medium"><History className="size-4 text-muted-foreground" aria-hidden />{contractActionLabel[h.action] ?? h.action}</span>
          <span className="text-muted-foreground">{formatDateTime(h.at)}{h.userName ? ` · ${h.userName}` : ''}</span>
        </li>
      ))}
    </ol>
  )
}

const tabs = [
  { id: 'parcelas', label: 'Parcelas', icon: Receipt },
  { id: 'reajustes', label: 'Reajustes', icon: ChartColumn },
  { id: 'documentos', label: 'Documentos', icon: FileText },
  { id: 'historico', label: 'Histórico', icon: History },
] as const

type TabId = (typeof tabs)[number]['id']

export function ContractDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const contract = useContract(id)
  const run = useContractAction(id ?? '')
  const [tab, setTab] = useState<TabId>('parcelas')
  const [dialog, setDialog] = useState<'adjust' | 'terminate' | 'cancel' | null>(null)

  if (contract.isPending) return <LoadingRows rows={8} />
  if (contract.isError) return <ErrorState error={contract.error} onRetry={() => contract.refetch()} />

  const c = contract.data
  const draft = c.status === 'RASCUNHO'
  const active = c.status === 'ATIVO'
  const pdfUrl = `/api/contracts/${c.id}/pdf`

  const activate = () => run.mutate({ action: 'activate' }, { onSuccess: () => toast.success('Contrato ativado e parcelas geradas'), onError: errorToast })
  const renew = () => run.mutate({ action: 'renew' }, {
    onSuccess: (renewal) => { toast.success(`Rascunho da renovação ${renewal.code} criado`); navigate(`/app/contracts/${renewal.id}`) },
    onError: errorToast,
  })

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="outline" size="icon" asChild className="shrink-0 bg-card">
            <Link to="/app/contracts" aria-label="Voltar para contratos"><ArrowLeft /></Link>
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Contrato {c.code}</h1>
              <SituationBadge situation={c.situation} className="h-7 px-3 text-sm" />
            </div>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{c.property.code} – {c.property.title}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {draft && <Button onClick={activate} disabled={run.isPending}><Play /> Ativar contrato</Button>}
          {active && (
            <Button variant="outline" onClick={() => setDialog('adjust')} className="border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 hover:text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <TrendingUp /> Reajustar
            </Button>
          )}
          {active && !c.renewal && (
            <Button variant="outline" onClick={renew} disabled={run.isPending} className="border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 hover:text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              <RefreshCw /> Renovar
            </Button>
          )}
          {active && (
            <Button variant="outline" onClick={() => setDialog('terminate')} className="border-red-300 bg-red-50 text-red-900 hover:bg-red-100 hover:text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
              <Clock /> Encerrar
            </Button>
          )}
          {(draft || active) && (
            <Button variant="outline" asChild className="bg-card"><Link to={`/app/contracts/${c.id}/edit`}><Pencil /> Editar</Link></Button>
          )}
          {draft && (
            <Button variant="outline" onClick={() => setDialog('cancel')} className="border-red-300 bg-red-50 text-red-900 hover:bg-red-100 hover:text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
              <X /> Cancelar
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-[11rem_minmax(0,1fr)]">
        <Link to={`/app/properties/${c.property.id}`} className="relative block aspect-[16/10] overflow-hidden rounded-xl border bg-muted md:aspect-auto md:min-h-36" aria-label={`Ver imóvel ${c.property.code}`}>
          {c.property.coverUrl
            ? <img src={c.property.coverUrl} alt="" className="absolute inset-0 size-full object-cover" />
            : <span className="flex size-full items-center justify-center text-muted-foreground"><ImageOff className="size-6" aria-hidden /></span>}
        </Link>
        <div className="rounded-xl border bg-card p-5 shadow-xs">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <Info icon={Home} label="Imóvel">
              <p className="truncate">{c.property.code} – {c.property.title}</p>
              <p className="truncate text-xs">{c.property.address}</p>
            </Info>
            <Info icon={UserRound} label="Inquilino">
              <p className="truncate">{c.tenant.name}</p>
              <p className="text-xs">CPF/CNPJ: {formatDocument(c.tenant.document)}</p>
            </Info>
            <Info icon={CalendarDays} label="Vigência">
              <p>{formatDate(c.startDate)} a {formatDate(c.endDate)}</p>
              {c.endedAt && <p className="text-xs">Encerrado em {formatDate(c.endedAt)}</p>}
            </Info>
            <Info icon={CircleDollarSign} label="Aluguel">
              <p className="font-semibold text-foreground">{formatBRL(c.monthlyRent)}</p>
              <p className="text-xs">Vence todo dia {c.dueDay}</p>
            </Info>
            <Info icon={ChartColumn} label={`Reajuste (${adjustmentIndexLabel[c.adjustmentIndex]})`}>
              <p>{c.adjustmentIndex === 'NENHUM' ? 'Não previsto' : c.adjustmentPercent !== null ? `${formatPercent(c.adjustmentPercent)} ao ano` : 'Anual'}</p>
            </Info>
            <Info icon={ShieldCheck} label="Garantia">
              <p>{guaranteeLabel[c.guaranteeType]}{c.guaranteeValue !== null && ` – ${formatBRL(c.guaranteeValue)}`}</p>
              {c.guaranteeNotes && <p className="truncate text-xs">{c.guaranteeNotes}</p>}
            </Info>
          </div>
          {(c.previousContract || c.renewal || c.endReason || c.notes) && (
            <div className="mt-4 grid gap-1 border-t pt-3 text-sm text-muted-foreground">
              {c.previousContract && <p>Renovação do contrato <Link className="font-medium text-primary hover:underline" to={`/app/contracts/${c.previousContract.id}`}>{c.previousContract.code}</Link>.</p>}
              {c.renewal && <p>Renovado pelo contrato <Link className="font-medium text-primary hover:underline" to={`/app/contracts/${c.renewal.id}`}>{c.renewal.code}</Link>.</p>}
              {c.endReason && <p>Motivo do encerramento: {c.endReason}</p>}
              {c.notes && <p>Observações: {c.notes}</p>}
            </div>
          )}
        </div>
      </div>

      <div role="tablist" aria-label="Seções do contrato" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {tabs.map(({ id: t, label, icon: Icon }) => (
          <button
            key={t}
            type="button"
            role="tab"
            id={`tab-${t}`}
            aria-selected={tab === t}
            aria-controls="contract-panel"
            onClick={() => setTab(t)}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-t-xl border border-b-0 px-5 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring',
              tab === t ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-4" aria-hidden />{label}
          </button>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section id="contract-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="rounded-xl rounded-tl-none border bg-card p-5 shadow-xs">
          {tab === 'parcelas' && (
            <>
              <h2 className="mb-3 text-lg font-semibold">Parcelas do contrato</h2>
              {c.installments.length === 0 ? (
                <EmptyState
                  title="Nenhuma parcela ainda"
                  description={draft ? 'As parcelas são geradas quando o contrato é ativado.' : 'Este contrato não gerou parcelas.'}
                  action={draft && <Button onClick={activate} disabled={run.isPending}><Play /> Ativar e gerar parcelas</Button>}
                />
              ) : (
                <Table>
                  <TableHeader className="bg-muted/60">
                    <TableRow>
                      <TableHead>Nº</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead className="hidden sm:table-cell">Referência</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {c.installments.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell>{String(i.number).padStart(3, '0')}</TableCell>
                        <TableCell>{formatDate(i.dueDate)}</TableCell>
                        <TableCell className="hidden sm:table-cell">{formatMonth(i.referenceMonth)}</TableCell>
                        <TableCell className="text-right font-medium">{formatBRL(i.amount)}</TableCell>
                        <TableCell className="text-center"><InstallmentBadge status={i.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}

          {tab === 'reajustes' && (
            <>
              <h2 className="mb-3 text-lg font-semibold">Reajustes aplicados</h2>
              {c.adjustments.length === 0 ? (
                <EmptyState
                  title="Nenhum reajuste aplicado"
                  description={active ? 'Use Reajustar para corrigir o aluguel a partir de uma data.' : undefined}
                  action={active && <Button variant="outline" onClick={() => setDialog('adjust')}><TrendingUp /> Reajustar</Button>}
                />
              ) : (
                <Table>
                  <TableHeader className="bg-muted/60">
                    <TableRow>
                      <TableHead>Vigência</TableHead>
                      <TableHead className="text-right">Percentual</TableHead>
                      <TableHead className="text-right">Aluguel anterior</TableHead>
                      <TableHead className="text-right">Novo aluguel</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {c.adjustments.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{formatDate(a.effectiveDate)}</TableCell>
                        <TableCell className="text-right">{formatPercent(a.percent)}</TableCell>
                        <TableCell className="text-right">{formatBRL(a.oldRent)}</TableCell>
                        <TableCell className="text-right font-medium">{formatBRL(a.newRent)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}

          {tab === 'documentos' && (
            <>
              <h2 className="mb-3 text-lg font-semibold">Documentos</h2>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                <span className="flex min-w-0 items-center gap-3">
                  <FileText className="size-9 shrink-0 rounded-lg bg-orange-100 p-2 text-brand-solid dark:bg-orange-950 dark:text-orange-300" aria-hidden />
                  <span className="min-w-0 text-sm">
                    <span className="block truncate font-medium">contrato-{c.code}.pdf</span>
                    <span className="block text-muted-foreground">Quadro-resumo gerado pelo sistema com os dados atuais</span>
                  </span>
                </span>
                <Button variant="outline" asChild><a href={pdfUrl} target="_blank" rel="noreferrer"><FileDown /> Abrir PDF</a></Button>
              </div>
            </>
          )}

          {tab === 'historico' && (
            <>
              <h2 className="mb-1 text-lg font-semibold">Histórico</h2>
              <HistoryTab id={c.id} />
            </>
          )}
        </section>

        <aside className="rounded-xl border bg-card p-5 shadow-xs" aria-labelledby="summary-title">
          <h2 id="summary-title" className="mb-2 text-lg font-semibold">Resumo financeiro</h2>
          <dl className="divide-y text-sm">
            <div className="flex items-center justify-between gap-2 py-2.5"><dt>Total do contrato</dt><dd className="rounded-md bg-muted px-2 py-0.5 font-semibold">{formatBRL(c.summary.total)}</dd></div>
            <div className="flex items-center justify-between gap-2 py-2.5"><dt>Recebido</dt><dd className="font-semibold text-emerald-700 dark:text-emerald-400">{formatBRL(c.summary.received)}</dd></div>
            <div className="flex items-center justify-between gap-2 py-2.5"><dt>Em aberto</dt><dd className="font-semibold text-amber-700 dark:text-amber-400">{formatBRL(c.summary.open)}</dd></div>
            <div className="flex items-center justify-between gap-2 py-2.5 text-red-700 dark:text-red-400"><dt>Em atraso</dt><dd className="font-semibold">{formatBRL(c.summary.overdue)}</dd></div>
          </dl>
          <p className="mt-4 mb-2 text-sm font-semibold" id="progress-label">Progresso de recebimento</p>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-labelledby="progress-label" aria-valuemin={0} aria-valuemax={100} aria-valuenow={c.summary.progressPercent}>
            <div className="h-full rounded-full bg-emerald-600" style={{ width: `${c.summary.progressPercent}%` }} />
          </div>
          <p className="mt-1.5 text-right text-sm font-medium">{formatPercent(c.summary.progressPercent)}</p>
        </aside>
      </div>

      {dialog === 'adjust' && <AdjustDialog contract={c} onClose={() => setDialog(null)} />}
      {dialog === 'terminate' && <TerminateDialog contract={c} onClose={() => setDialog(null)} />}
      <ConfirmDialog
        open={dialog === 'cancel'}
        title="Cancelar este rascunho?"
        description={`O contrato ${c.code} será cancelado e não poderá ser ativado depois.`}
        confirmLabel="Cancelar contrato"
        pending={run.isPending}
        onCancel={() => setDialog(null)}
        onConfirm={() => run.mutate({ action: 'cancel' }, { onSuccess: () => { toast.success('Contrato cancelado'); setDialog(null) }, onError: errorToast })}
      />
    </>
  )
}

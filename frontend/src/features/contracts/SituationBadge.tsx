import { Badge } from '@/components/ui/badge'
import { installmentStatusLabel, situationLabel } from '@/lib/format'
import { cn } from '@/lib/utils'

const green = 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
const amber = 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
const red = 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200'
const gray = 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
const sky = 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200'

const tone: Record<string, string> = {
  RASCUNHO: sky, ATIVO: green, EM_RENOVACAO: amber, ENCERRANDO: red, ENCERRADO: gray, CANCELADO: gray,
  ABERTA: amber, EM_ATRASO: red, CANCELADA: gray,
}

const pill = 'h-6 rounded-full border-transparent px-2.5'

export function SituationBadge({ situation, className }: { situation: string; className?: string }) {
  return <Badge className={cn(pill, tone[situation], className)}>{situationLabel[situation] ?? situation}</Badge>
}

export function InstallmentBadge({ status }: { status: string }) {
  return <Badge className={cn(pill, tone[status])}>{installmentStatusLabel[status] ?? status}</Badge>
}

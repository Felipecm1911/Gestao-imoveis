import { Badge } from '@/components/ui/badge'
import { propertyStatusLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { PropertyStatus } from './api'

const tone: Record<PropertyStatus, string> = {
  DISPONIVEL: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  OCUPADO: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200',
  MANUTENCAO: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  INATIVO: 'bg-muted text-muted-foreground',
}

export function StatusBadge({ status }: { status: PropertyStatus }) {
  return <Badge className={cn('border-transparent', tone[status])}>{propertyStatusLabel[status]}</Badge>
}

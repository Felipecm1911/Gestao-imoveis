import { Badge } from '@/components/ui/badge'
import { propertyStatusLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { PropertyStatus } from './api'

// texto escuro sobre fundo claro (AA); o ponto repete a cor, o rótulo carrega o significado
const tone: Record<PropertyStatus, string> = {
  DISPONIVEL: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200 [&>i]:bg-sky-600',
  OCUPADO: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200 [&>i]:bg-emerald-600',
  MANUTENCAO: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 [&>i]:bg-amber-500',
  INATIVO: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200 [&>i]:bg-red-600',
}

export function StatusBadge({ status }: { status: PropertyStatus }) {
  return (
    <Badge className={cn('gap-1.5 rounded-full border-transparent px-2.5', tone[status])}>
      <i className="size-1.5 rounded-full" aria-hidden />
      {propertyStatusLabel[status]}
    </Badge>
  )
}

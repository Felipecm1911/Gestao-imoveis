import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

/** Até 5 páginas numeradas em volta da atual. `page` começa em 0, como no Spring. */
export function Pagination({ page, totalPages, total, size, noun, onChange, onSizeChange }: {
  page: number
  totalPages: number
  total?: number
  size?: number
  /** "contratos" → "Exibindo 1 a 5 de 32 contratos" */
  noun?: string
  onChange: (page: number) => void
  /** Quando informado, mostra o seletor "N por página". */
  onSizeChange?: (size: number) => void
}) {
  if (totalPages <= 1 && total === undefined) return null
  const start = Math.max(0, Math.min(page - 2, totalPages - 5))
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i)
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      {total !== undefined && size !== undefined ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Exibindo {total === 0 ? 0 : page * size + 1} a {Math.min(total, (page + 1) * size)} de {total}{noun ? ` ${noun}` : ''}
        </p>
      ) : <span />}
      {onSizeChange && size !== undefined && (
        <Select value={String(size)} onValueChange={(v) => onSizeChange(Number(v))}>
          <SelectTrigger className="ml-auto w-36" aria-label="Itens por página"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[5, 10, 20].map((n) => <SelectItem key={n} value={String(n)}>{n} por página</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      {totalPages > 1 && (
        <nav className="flex items-center gap-1" aria-label="Paginação">
          <Button variant="ghost" size="icon" disabled={page === 0} onClick={() => onChange(page - 1)} aria-label="Página anterior">
            <ChevronLeft />
          </Button>
          {pages.map((p) => (
            <Button
              key={p}
              variant={p === page ? 'default' : 'ghost'}
              size="icon"
              aria-current={p === page ? 'page' : undefined}
              aria-label={`Página ${p + 1}`}
              onClick={() => onChange(p)}
            >
              {p + 1}
            </Button>
          ))}
          <Button variant="ghost" size="icon" disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)} aria-label="Próxima página">
            <ChevronRight />
          </Button>
        </nav>
      )}
    </div>
  )
}

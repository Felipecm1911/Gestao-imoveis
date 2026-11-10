import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** Até 5 páginas numeradas em volta da atual. `page` começa em 0, como no Spring. */
export function Pagination({ page, totalPages, total, size, onChange }: {
  page: number
  totalPages: number
  total?: number
  size?: number
  onChange: (page: number) => void
}) {
  if (totalPages <= 1 && total === undefined) return null
  const start = Math.max(0, Math.min(page - 2, totalPages - 5))
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i)
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      {total !== undefined && size !== undefined ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Exibindo {total === 0 ? 0 : page * size + 1} a {Math.min(total, (page + 1) * size)} de {total}
        </p>
      ) : <span />}
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

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null
  return (
    <nav className="mt-6 flex items-center justify-center gap-2" aria-label="Paginação">
      <Button variant="outline" size="icon" disabled={page === 0} onClick={() => onChange(page - 1)} aria-label="Página anterior">
        <ChevronLeft />
      </Button>
      <span className="text-sm text-muted-foreground" aria-live="polite">
        Página {page + 1} de {totalPages}
      </span>
      <Button
        variant="outline"
        size="icon"
        disabled={page + 1 >= totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Próxima página"
      >
        <ChevronRight />
      </Button>
    </nav>
  )
}

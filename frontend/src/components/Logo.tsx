import { House } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Logo({ className, subtitle }: { className?: string; subtitle?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <House className="size-8 shrink-0 text-brand" strokeWidth={2.25} aria-hidden />
      <div className="leading-tight">
        <span className="text-xl font-semibold tracking-tight">Imobly</span>
        {subtitle && <span className="block text-xs opacity-75">Gestão de Imóveis e Aluguéis</span>}
      </div>
    </div>
  )
}

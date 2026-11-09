import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { Building2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useMe } from './api'

export function AuthShell({ title, description, children, footer }: { title: string; description: string; children: ReactNode; footer: ReactNode }) {
  const me = useMe()
  if (me.data) return <Navigate to="/app/properties" replace />
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <Building2 className="size-5" aria-hidden /> Imobly
          </div>
          <CardTitle><h1 className="text-xl">{title}</h1></CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {children}
          <p className="text-center text-sm text-muted-foreground">{footer}</p>
        </CardContent>
      </Card>
    </main>
  )
}

import { useState } from 'react'
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router'
import { Building2, Home, LogOut, Menu, Moon, Sun, UserCog, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useLogout, useMe, type Me } from '@/features/auth/api'
import { cn } from '@/lib/utils'
import { applyTheme, currentTheme, type Theme } from './theme'

// só módulos que já existem: nada de link para tela vazia
const nav = [
  { to: '/app/properties', label: 'Imóveis', icon: Home },
  { to: '/app/owners', label: 'Proprietários', icon: Users },
  { to: '/app/users', label: 'Usuários', icon: UserCog, adminOnly: true },
]

const roleLabel: Record<string, string> = { ADMIN: 'Admin', STAFF: 'Equipe', OWNER: 'Proprietário', TENANT: 'Inquilino' }

function NavLinks({ me, onNavigate }: { me: Me; onNavigate?: () => void }) {
  return (
    <nav className="grid gap-1" aria-label="Principal">
      {nav
        .filter((item) => !item.adminOnly || me.role === 'ADMIN')
        .map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent',
                isActive && 'bg-accent font-medium',
              )
            }
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </NavLink>
        ))}
    </nav>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-3 py-4 font-semibold">
      <Building2 className="size-5" aria-hidden /> Imobly
    </div>
  )
}

export function AppLayout() {
  const me = useMe()
  const logout = useLogout()
  const navigate = useNavigate()
  const [theme, setTheme] = useState<Theme>(currentTheme)
  const [drawerOpen, setDrawerOpen] = useState(false)

  if (me.isPending) {
    return (
      <div className="p-6">
        <Skeleton className="h-10 w-64" />
      </div>
    )
  }
  if (!me.data) return <Navigate to="/login" replace />
  if (me.data.role !== 'ADMIN' && me.data.role !== 'STAFF') {
    return <p className="p-6">Os portais de proprietário e inquilino chegam numa próxima versão.</p>
  }

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next, true)
    setTheme(next)
  }

  return (
    <div className="flex min-h-svh">
      <aside className="hidden w-56 shrink-0 border-r bg-muted/30 px-2 md:block">
        <Brand />
        <NavLinks me={me.data} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 px-2">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <Brand />
              <NavLinks me={me.data} onNavigate={() => setDrawerOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="truncate text-sm text-muted-foreground">{me.data.organizationName}</span>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}>
              {theme === 'dark' ? <Sun /> : <Moon />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  {me.data.name} <span className="text-muted-foreground">({roleLabel[me.data.role]})</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="font-normal text-muted-foreground">{me.data.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => logout.mutate(undefined, { onSettled: () => navigate('/login') })}>
                  <LogOut /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

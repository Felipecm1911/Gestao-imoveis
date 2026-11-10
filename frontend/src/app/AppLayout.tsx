import { useState } from 'react'
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router'
import { Building2, ChevronDown, Home, LogOut, Menu, Moon, Sun, UserCog, Users } from 'lucide-react'
import { Logo } from '@/components/Logo'
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
import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'
import { applyTheme, currentTheme, type Theme } from './theme'

// só módulos que já existem: nada de link para tela vazia
const nav = [
  { to: '/app/properties', label: 'Imóveis', icon: Home },
  { to: '/app/owners', label: 'Proprietários', icon: Users },
  { to: '/app/users', label: 'Usuários', icon: UserCog, adminOnly: true },
]

const roleLabel: Record<string, string> = { ADMIN: 'Administrador', STAFF: 'Equipe', OWNER: 'Proprietário', TENANT: 'Inquilino' }

function Sidebar({ me, onNavigate }: { me: Me; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 px-3 py-5">
      <Logo subtitle className="px-2 text-white" />
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
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isActive && 'bg-sidebar-primary font-medium text-sidebar-primary-foreground hover:bg-sidebar-primary',
                )
              }
            >
              <Icon className="size-[18px]" aria-hidden />
              {label}
            </NavLink>
          ))}
      </nav>
      <div className="mt-auto flex items-center gap-3 rounded-lg bg-sidebar-accent/60 p-3">
        <Building2 className="size-8 shrink-0 rounded-md bg-white/10 p-1.5" aria-hidden />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{me.organizationName}</p>
          <p className="text-xs opacity-70">Sua imobiliária</p>
        </div>
      </div>
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
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 bg-sidebar text-sidebar-foreground md:block">
        <Sidebar me={me.data} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-2 border-b bg-card/90 px-4 backdrop-blur md:px-6">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-none bg-sidebar p-0 text-sidebar-foreground">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <Sidebar me={me.data} onNavigate={() => setDrawerOpen(false)} />
            </SheetContent>
          </Sheet>
          <Logo className="md:hidden [&_svg]:size-6 [&_span]:text-lg" />
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}>
              {theme === 'dark' ? <Sun /> : <Moon />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto gap-2.5 py-1.5" aria-label={`Conta de ${me.data.name}`}>
                  <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground" aria-hidden>
                    {initials(me.data.name)}
                  </span>
                  <span className="hidden text-left leading-tight sm:block">
                    <span className="block text-sm font-medium">{me.data.name}</span>
                    <span className="block text-xs text-muted-foreground">{roleLabel[me.data.role]}</span>
                  </span>
                  <ChevronDown className="hidden text-muted-foreground sm:block" aria-hidden />
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
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

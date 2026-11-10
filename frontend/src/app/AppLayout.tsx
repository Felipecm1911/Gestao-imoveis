import { useState, type ComponentType } from 'react'
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router'
import {
  Bell,
  Building2,
  ChartColumn,
  ChevronDown,
  CircleDollarSign,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  UserRound,
  Users,
  Wrench,
} from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useLogout, useMe, type Me } from '@/features/auth/api'
import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'
import { applyTheme, currentTheme, type Theme } from './theme'

type NavItem = { label: string; icon: ComponentType<{ className?: string }>; to?: string; adminOnly?: boolean; mobile?: string }

// sem `to` = módulo de uma próxima fase: aparece desabilitado com "Em breve", nunca leva a tela vazia
const nav: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Imóveis', icon: Home, to: '/app/properties', mobile: 'Imóveis' },
  { label: 'Proprietários', icon: Users, to: '/app/owners', mobile: 'Proprietários' },
  { label: 'Inquilinos', icon: UserRound },
  { label: 'Contratos', icon: FileText },
  { label: 'Financeiro', icon: CircleDollarSign },
  { label: 'Manutenções', icon: Wrench },
  { label: 'Relatórios', icon: ChartColumn },
  { label: 'Configurações', icon: Settings, to: '/app/users', adminOnly: true, mobile: 'Config.' },
]

const roleLabel: Record<string, string> = { ADMIN: 'Administrador', STAFF: 'Equipe', OWNER: 'Proprietário', TENANT: 'Inquilino' }

const visible = (me: Me) => nav.filter((item) => !item.adminOnly || me.role === 'ADMIN')

function Sidebar({ me, onNavigate }: { me: Me; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-5">
      <Logo subtitle className="px-2 text-white" />
      <nav className="grid gap-1" aria-label="Principal">
        {visible(me).map(({ to, label, icon: Icon }) =>
          to ? (
            <NavLink
              key={label}
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
          ) : (
            <span key={label} aria-disabled="true" className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm opacity-60">
              <Icon className="size-[18px]" aria-hidden />
              {label}
              <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase">Em breve</span>
            </span>
          ),
        )}
      </nav>
      <div className="mt-auto flex items-center gap-3 rounded-lg bg-sidebar-accent/60 p-3">
        <Building2 className="size-9 shrink-0 rounded-md bg-white/10 p-2" aria-hidden />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{me.organizationName}</p>
          <p className="text-xs opacity-70">{roleLabel[me.role]}</p>
        </div>
      </div>
    </div>
  )
}

/** Busca do topo: por enquanto o único conteúdo pesquisável são os imóveis. */
function GlobalSearch() {
  const navigate = useNavigate()
  return (
    <form
      role="search"
      className="relative hidden w-full max-w-md md:block"
      onSubmit={(e) => {
        e.preventDefault()
        const q = String(new FormData(e.currentTarget).get('q') ?? '').trim()
        navigate(q ? `/app/properties?q=${encodeURIComponent(q)}` : '/app/properties')
      }}
    >
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input name="q" type="search" className="bg-background pl-9" placeholder="Buscar imóvel por código, título ou rua…" aria-label="Buscar no sistema" />
    </form>
  )
}

function MobileTabBar({ me, onMenu }: { me: Me; onMenu: () => void }) {
  return (
    <nav aria-label="Atalhos" className="fixed inset-x-0 bottom-0 z-20 grid auto-cols-fr grid-flow-col border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
      {visible(me)
        .filter((i) => i.to && i.mobile)
        .map(({ to, mobile, icon: Icon }) => (
          <NavLink
            key={to}
            to={to!}
            className={({ isActive }) => cn('flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground', isActive && 'font-medium text-primary')}
          >
            <Icon className="size-5" aria-hidden />
            {mobile}
          </NavLink>
        ))}
      <button type="button" onClick={onMenu} className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground">
        <Menu className="size-5" aria-hidden />
        Mais
      </button>
    </nav>
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
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-72 border-none bg-sidebar p-0 text-sidebar-foreground">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Sidebar me={me.data} onNavigate={() => setDrawerOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur md:px-8">
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu" onClick={() => setDrawerOpen(true)}>
            <Menu />
          </Button>
          <Logo className="md:hidden [&_span]:text-lg [&_svg]:size-6" />
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Notificações">
                  <Bell />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <p className="px-2 py-6 text-center text-sm text-muted-foreground">Nenhuma notificação por enquanto.</p>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}>
              {theme === 'dark' ? <Sun /> : <Moon />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto gap-2.5 py-1.5 pl-1.5" aria-label={`Conta de ${me.data.name}`}>
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground" aria-hidden>
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
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 pb-24 md:p-8">
          <Outlet />
        </main>
      </div>
      <MobileTabBar me={me.data} onMenu={() => setDrawerOpen(true)} />
    </div>
  )
}

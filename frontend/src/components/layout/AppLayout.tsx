import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  PlusCircle,
  Clock,
  Wallet,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const navItems = [
  { to: '/', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/expenses/new', label: 'New Expense', Icon: PlusCircle, end: false },
  { to: '/history', label: 'History', Icon: Clock, end: false },
  { to: '/deposits', label: 'Deposits', Icon: Wallet, end: false },
]

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar — open plane, on the page ground */}
      <aside className="hidden md:flex flex-col w-[240px] shrink-0 border-r border-border">
        {/* Product name */}
        <div className="px-5 h-14 flex items-center">
          <span className="text-[15px] font-medium tracking-[-0.01em] text-foreground">
            Finance
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pt-1 flex flex-col gap-0.5">
          {navItems.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 h-8 px-3 rounded-md text-sm transition-colors duration-100',
                  isActive
                    ? 'bg-[#e9e9e9] text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-[#f0f0f0]',
                )
              }
            >
              <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 h-12 bg-background border-b border-border flex md:hidden items-center justify-between px-4 z-50">
        <span className="text-sm font-medium text-foreground">Finance</span>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-muted"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu sheet */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/20" onClick={() => setMobileMenuOpen(false)} />
          <nav className="absolute top-12 left-0 right-0 bg-background border-b border-border p-3 flex flex-col gap-0.5">
            {navItems.map(({ to, label, Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 h-11 px-3 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-[#e9e9e9] text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      {/* Main content area */}
      <main className="flex-1 min-h-screen pt-12 md:pt-0">
        <Outlet />
      </main>
    </div>
  )
}

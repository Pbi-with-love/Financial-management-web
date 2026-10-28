import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  PlusCircle,
  Clock,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/expenses/new', label: 'New Expense', Icon: PlusCircle, end: false },
  { to: '/history', label: 'History', Icon: Clock, end: false },
  { to: '/deposits', label: 'Deposits', Icon: Wallet, end: false },
]

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar — visible at md+ */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-border shrink-0">
        {/* Logo / App name */}
        <div className="px-6 py-5 border-b border-border">
          <span
            className="text-lg font-semibold text-primary"
            style={{ fontFamily: 'Lexend, sans-serif' }}
          >
            Finance
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 py-3 px-4 rounded-lg text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    className={isActive ? 'text-indigo-600' : 'text-slate-400'}
                    aria-hidden="true"
                  />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-h-screen pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom tab bar — visible below md */}
      <nav
        className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-border flex md:hidden z-50"
        aria-label="Mobile navigation"
      >
        {navItems.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors duration-150 min-h-[44px]',
                isActive ? 'text-indigo-600' : 'text-slate-500',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={20}
                  className={isActive ? 'text-indigo-600' : 'text-slate-400'}
                  aria-hidden="true"
                />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

'use client'

import {
  Activity,
  Bell,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  CreditCard,
  LayoutDashboard,
  ListFilter,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { signOutAction } from '@/app/actions/auth'
import { initials } from '@/lib/format'

const NAV = [
  { label: 'Genel Bakış', href: '/app', icon: LayoutDashboard },
  { label: 'Abonelikler', href: '/app/abonelikler', icon: CreditCard },
  { label: 'Ödeme Takvimi', href: '/app/takvim', icon: CalendarDays },
  { label: 'Analizler', href: '/app/analizler', icon: Activity },
  { label: 'Kategoriler', href: '/app/kategoriler', icon: ListFilter },
  { label: 'Bildirimler', href: '/app/bildirimler', icon: Bell },
]

function Logo() {
  return (
    <Link href="/app" className="flex items-center gap-2.5">
      <div className="flex size-8 items-center justify-center rounded-lg bg-[#0e7c66] text-white shadow-sm">
        <ShieldCheck size={17} strokeWidth={2.5} />
      </div>
      <span className="text-[15px] font-semibold tracking-[-0.02em] text-[#102a43]">
        Abonelik <span className="text-[#0e7c66]">Dedektifi</span>
      </span>
    </Link>
  )
}

export function AppShell({
  fullName,
  unreadCount,
  children,
}: {
  fullName: string
  unreadCount: number
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const closeOverlays = () => {
    setMobileOpen(false)
    setMenuOpen(false)
  }

  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  const isActive = (href: string) =>
    href === '/app' ? pathname === '/app' : pathname.startsWith(href)

  const current = NAV.find((n) => isActive(n.href))

  return (
    <div className="min-h-screen bg-[#f8faf9] text-[#102a43]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[236px] flex-col border-r border-[#e6ecea] bg-white px-4 py-5 transition-transform lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <Logo />
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-md p-1 text-[#718096] lg:hidden"
            aria-label="Menüyü kapat"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mt-9 px-2 text-[10px] font-semibold uppercase tracking-[.12em] text-[#a0aec0]">
          Çalışma alanı
        </div>
        <nav className="mt-2 space-y-0.5">
          {NAV.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeOverlays}
                aria-current={active ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${
                  active
                    ? 'bg-[#eaf7f3] text-[#08785f]'
                    : 'text-[#718096] hover:bg-[#f5f8f7] hover:text-[#102a43]'
                }`}
              >
                <item.icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.href === '/app/bildirimler' && unreadCount > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-[#eaf7f3] text-[10px] text-[#0e7c66]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        <div className="mt-7 px-2 text-[10px] font-semibold uppercase tracking-[.12em] text-[#a0aec0]">
          Tercihler
        </div>
        <nav className="mt-2">
          <Link
            href="/app/profil"
            onClick={closeOverlays}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${
              pathname.startsWith('/app/profil')
                ? 'bg-[#eaf7f3] text-[#08785f]'
                : 'text-[#718096] hover:bg-[#f5f8f7] hover:text-[#102a43]'
            }`}
          >
            <Settings size={16} />
            <span>Ayarlar</span>
          </Link>
        </nav>
        <div className="mt-auto border-t border-[#edf1f0] pt-4">
          <Link
            href="/app/profil"
            className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition hover:bg-[#f5f8f7]"
          >
            <div className="flex size-8 items-center justify-center rounded-full bg-[#dff2ec] text-[11px] font-semibold text-[#0e7c66]">
              {initials(fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold">{fullName || 'Hesabım'}</p>
              <p className="truncate text-[11px] text-[#94a3b8]">Ücretsiz plan</p>
            </div>
          </Link>
        </div>
      </aside>

      {mobileOpen && (
        <button
          aria-label="Menüyü kapat"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-[#102a43]/20 lg:hidden"
        />
      )}

      <div className="lg:pl-[236px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#e6ecea] bg-white/90 px-5 backdrop-blur-sm sm:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-2 text-[#718096] lg:hidden"
            aria-label="Menüyü aç"
          >
            <Menu size={19} />
          </button>
          <div className="hidden items-center gap-2 text-[12px] text-[#94a3b8] lg:flex">
            <span>Çalışma alanı</span>
            <span>/</span>
            <span className="text-[#4a5568]">{current?.label ?? 'Ayarlar'}</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-lg p-2 text-[#718096] hover:bg-[#f5f8f7] sm:block"
              aria-label="Yardım"
            >
              <CircleHelp size={18} />
            </a>
            <Link
              href="/app/bildirimler"
              className="relative rounded-lg p-2 text-[#718096] hover:bg-[#f5f8f7]"
              aria-label={`Bildirimler${unreadCount > 0 ? ` (${unreadCount} okunmamış)` : ''}`}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[#0e9871]" />
              )}
            </Link>
            <div className="h-5 w-px bg-[#e6ecea]" />
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 text-[12px] font-medium"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="hidden sm:inline">{fullName || 'Hesabım'}</span>
                <div className="flex size-7 items-center justify-center rounded-full bg-[#dff2ec] text-[10px] font-semibold text-[#0e7c66]">
                  {initials(fullName)}
                </div>
                <ChevronDown size={14} className="text-[#94a3b8]" />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-44 rounded-lg border border-[#e6ecea] bg-white py-1.5 shadow-lg"
                >
                  <Link
                    href="/app/profil"
                    role="menuitem"
                    onClick={closeOverlays}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-[12px] font-medium text-[#4a5568] hover:bg-[#f5f8f7]"
                  >
                    <UserRound size={14} /> Profil ve ayarlar
                  </Link>
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      role="menuitem"
                      className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[12px] font-medium text-[#dc2626] hover:bg-[#fef2f2]"
                    >
                      <LogOut size={14} /> Çıkış yap
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  )
}

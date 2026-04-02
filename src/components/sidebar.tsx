// Dashboard removed - Mar 29 15:40

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Calculator,
  Scissors,
  FileText,
  DollarSign,
  Layers,
  History,
  Settings,
  Users,
  Shield,
  LogOut,
  X,
  Menu,
  KeyRound
} from 'lucide-react'

const menuItems = [
  {
    title: 'Potong Kertas',
    href: '/',
    icon: Scissors
  },
  {
    title: 'Hitung Cetakan',
    href: '/hitung-cetakan',
    icon: Calculator
  },
  {
    title: 'Master Harga Kertas',
    href: '/master-harga-kertas',
    icon: FileText
  },
  {
    title: 'Master Ongkos Cetak',
    href: '/master-ongkos-cetak',
    icon: DollarSign
  },
  {
    title: 'Master Finishing',
    href: '/master-finishing',
    icon: Layers
  },
  {
    title: 'Master Customer',
    href: '/master-customer',
    icon: Users
  },
  {
    title: 'Riwayat',
    href: '/riwayat',
    icon: History
  },
  {
    title: 'Administrasi',
    href: '/administrasi',
    icon: Settings,
    submenu: [
      { title: 'Hak Akses', href: '/administrasi/hak-akses', icon: Shield },
      { title: 'Pengguna', href: '/administrasi/pengguna', icon: Users },
      { title: 'Pengaturan', href: '/administrasi/pengaturan', icon: Settings }
    ]
  }
]

interface SidebarProps {
  username?: string
  onLogout?: () => void | Promise<void>
  onChangePassword?: () => void
  isOpen?: boolean
  onToggle?: () => void
}

export function Sidebar({ username, onLogout, onChangePassword, isOpen = true, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname === '/potong-kertas'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-4 lg:p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <div className={cn("transition-opacity", !isOpen && "lg:opacity-100 opacity-0")}>
              <h1 className="text-lg font-bold text-slate-800">Sistem Cetak</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Manajemen Percetakan</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {menuItems.map((item) => (
            <div key={item.href}>
              {item.submenu ? (
                <div>
                  <Link
                    href={item.href}
                    onClick={onToggle}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive(item.href)
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className={cn("transition-opacity", !isOpen && "lg:opacity-100 opacity-0")}>{item.title}</span>
                  </Link>
                  <div className="ml-4 lg:ml-8 mt-1 space-y-1">
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        onClick={onToggle}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          pathname === subItem.href
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        )}
                      >
                        <subItem.icon className="w-4 h-4 flex-shrink-0" />
                        <span className={cn("transition-opacity", !isOpen && "lg:opacity-100 opacity-0")}>{subItem.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  href={item.href}
                  onClick={onToggle}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className={cn("transition-opacity", !isOpen && "lg:opacity-100 opacity-0")}>{item.title}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-200">
          {username && (
            <div className={cn("mb-3 px-3 py-2 bg-slate-50 rounded-lg transition-opacity", !isOpen && "lg:opacity-100 opacity-0")}>
              <p className="text-sm font-medium text-slate-800 truncate">{username}</p>
              <p className="text-xs text-slate-500">Online</p>
            </div>
          )}
          {onChangePassword && (
            <button
              onClick={onChangePassword}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors mb-1"
            >
              <KeyRound className="w-5 h-5 flex-shrink-0" />
              <span className={cn("transition-opacity", !isOpen && "lg:opacity-100 opacity-0")}>Ganti Password</span>
            </button>
          )}
          <button
            onClick={async () => {
              if (onLogout) {
                await onLogout()
              }
              router.push('/login')
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={cn("transition-opacity", !isOpen && "lg:opacity-100 opacity-0")}>Keluar</span>
          </button>
        </div>
      </div>
    </>
  )
}

export function MobileHeader({ onMenuToggle, username }: { onMenuToggle: () => void; username?: string }) {
  return (
    <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <button
          onClick={onMenuToggle}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Menu className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Scissors className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-slate-800 text-sm">Sistem Cetak</span>
        </div>
        <div className="w-8">
          {/* Spacer for balance */}
        </div>
      </div>
    </header>
  )
}

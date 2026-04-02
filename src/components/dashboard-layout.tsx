'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Sidebar, MobileHeader } from './sidebar'
import { useRouter, usePathname } from 'next/navigation'
import { getAuthUser, clearAuthUser } from '@/lib/auth'
import { KeyRound, Timer, X, LogOut, AlertTriangle } from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Demo popup state
  const [showDemoPopup, setShowDemoPopup] = useState(false)
  const [popupMessage, setPopupMessage] = useState('')

  // Auto logout state
  const [showLogoutWarning, setShowLogoutWarning] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [cpError, setCpError] = useState('')
  const [cpSuccess, setCpSuccess] = useState('')
  const [cpLoading, setCpLoading] = useState(false)

  // Auto logout timer
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const performLogout = useCallback(() => {
    clearAuthUser()
    router.push('/login')
  }, [router])

  // Activity listener - reset timer on user interaction
  const resetAutoLogoutTimer = useCallback(() => {
    const authData = localStorage.getItem('auth')
    if (!authData) return

    let settings: any = {}
    try {
      const stored = localStorage.getItem('app_settings')
      if (stored) settings = JSON.parse(stored)
    } catch {}

    const autoLogoutMinutes = settings.autoLogoutMinutes || 30
    const autoLogoutMs = autoLogoutMinutes * 60 * 1000
    const warningMs = 60000 // Show warning 60 seconds before logout

    // Clear existing timers
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current)
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)

    setShowLogoutWarning(false)
    setCountdown(0)

    // Set warning timer (60 seconds before logout)
    warningTimerRef.current = setTimeout(() => {
      setShowLogoutWarning(true)
      setCountdown(60)

      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, autoLogoutMs - warningMs)

    // Set logout timer
    logoutTimerRef.current = setTimeout(() => {
      setShowLogoutWarning(false)
      if (countdownRef.current) clearInterval(countdownRef.current)
      performLogout()
    }, autoLogoutMs)
  }, [performLogout])

  useEffect(() => {
    const checkAuth = () => {
      try {
        let authUser = getAuthUser()

        if (!authUser) {
          router.push('/login')
          return
        }

        setUser(authUser)

        // Check demo status
        if (authUser.isDemo && authUser.demoUntil) {
          const demoUntil = new Date(authUser.demoUntil)
          if (new Date() > demoUntil) {
            clearAuthUser()
            router.push('/login')
            return
          }
        }

        // Show popup for demo users (only once per session)
        if (authUser.isDemo && authUser.popupMessage) {
          const popupShown = sessionStorage.getItem('demo_popup_shown')
          if (!popupShown) {
            setPopupMessage(authUser.popupMessage)
            setTimeout(() => setShowDemoPopup(true), 500)
            sessionStorage.setItem('demo_popup_shown', 'true')
          }
        }

        setReady(true)
      } catch {
        router.push('/login')
      }
    }

    const timer = setTimeout(() => {
      checkAuth()
    }, 50)

    return () => clearTimeout(timer)
  }, [router, pathname])

  // Setup auto-logout and activity listeners
  useEffect(() => {
    if (!ready) return

    resetAutoLogoutTimer()

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']
    const handleActivity = () => resetAutoLogoutTimer()

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current)
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [ready, resetAutoLogoutTimer])

  const handleChangePassword = async () => {
    setCpError('')
    setCpSuccess('')
    setCpLoading(true)

    if (!oldPassword || !newPassword || !confirmPassword) {
      setCpError('Semua field wajib diisi')
      setCpLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setCpError('Password baru minimal 8 karakter')
      setCpLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setCpError('Password baru dan konfirmasi tidak sama')
      setCpLoading(false)
      return
    }

    try {
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          oldPassword,
          newPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setCpError(data.error || 'Gagal mengubah password')
        return
      }

      setCpSuccess('Password berhasil diubah!')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')

      setTimeout(() => {
        setShowChangePassword(false)
        setCpSuccess('')
      }, 2000)
    } catch {
      setCpError('Terjadi kesalahan jaringan')
    } finally {
      setCpLoading(false)
    }
  }

  // Format demo expiry date
  const getDemoDaysLeft = () => {
    if (!user?.demoUntil) return null
    const demoUntil = new Date(user.demoUntil)
    const now = new Date()
    const diffMs = demoUntil.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  // Don't render until auth check is done
  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        username={user?.username || 'User'}
        onLogout={performLogout}
        onChangePassword={() => {
          setOldPassword('')
          setNewPassword('')
          setConfirmPassword('')
          setCpError('')
          setCpSuccess('')
          setShowChangePassword(true)
        }}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="lg:ml-64 transition-all duration-300">
        <MobileHeader
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          username={user?.username}
        />

        {/* Desktop Header */}
        <header className="hidden lg:block bg-white border-b border-slate-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              {title && <h1 className="text-2xl font-bold text-slate-800">{title}</h1>}
              {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-4">
              {/* Demo Badge */}
              {user?.isDemo && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
                  <Timer className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-xs font-medium text-amber-700">
                    Demo: {getDemoDaysLeft()} hari lagi
                  </span>
                </div>
              )}
              <span className="text-sm text-slate-600">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
        </header>

        {/* Mobile Page Title */}
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              {title && <h1 className="text-xl font-bold text-slate-800">{title}</h1>}
              {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
            </div>
            {user?.isDemo && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full">
                <Timer className="w-3 h-3 text-amber-600" />
                <span className="text-[10px] font-medium text-amber-700">
                  {getDemoDaysLeft()} hari
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>

      {/* Demo Popup */}
      {showDemoPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Mode Demo</h3>
                <button onClick={() => setShowDemoPopup(false)} className="text-white/80 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-700 leading-relaxed">{popupMessage}</p>
              </div>
              {user?.demoUntil && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-amber-700">
                    Masa demo Anda berakhir: <strong>{new Date(user.demoUntil).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                    ({getDemoDaysLeft()} hari tersisa)
                  </p>
                </div>
              )}
              <button
                onClick={() => setShowDemoPopup(false)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto Logout Warning */}
      {showLogoutWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-rose-500 px-6 py-4">
              <div className="flex items-center gap-2">
                <LogOut className="w-5 h-5 text-white" />
                <h3 className="text-lg font-bold text-white">Sesi Akan Berakhir</h3>
              </div>
            </div>
            <div className="p-6 text-center">
              <p className="text-sm text-slate-700 mb-4">
                Anda tidak aktif selama beberapa waktu. Sesi akan otomatis berakhir dalam:
              </p>
              <div className="text-4xl font-bold text-red-600 mb-4">
                {countdown}<span className="text-lg text-slate-500"> detik</span>
              </div>
              <button
                onClick={() => {
                  setShowLogoutWarning(false)
                  if (countdownRef.current) clearInterval(countdownRef.current)
                  resetAutoLogoutTimer()
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors mb-2"
              >
                Tetap Masuk
              </button>
              <button
                onClick={performLogout}
                className="w-full border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium py-2.5 rounded-xl transition-colors"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Dialog */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-white" />
                  <h3 className="text-lg font-bold text-white">Ganti Password</h3>
                </div>
                <button onClick={() => setShowChangePassword(false)} className="text-white/80 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {cpError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 text-sm text-red-700">{cpError}</div>
              )}
              {cpSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-sm text-emerald-700">{cpSuccess}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password Lama</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan password lama"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password Baru</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Minimal 8 karakter"
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ulangi password baru"
                  minLength={8}
                />
              </div>
              <button
                onClick={handleChangePassword}
                disabled={cpLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                {cpLoading ? 'Menyimpan...' : 'Simpan Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Key, Eye, EyeOff, Phone, Mail, User as UserIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getAuthUser } from '@/lib/auth'

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Login state
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Register state
  const [regNamaLengkap, setRegNamaLengkap] = useState('')
  const [regNomorHP, setRegNomorHP] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [regError, setRegError] = useState('')
  const [regLoading, setRegLoading] = useState(false)
  const [regSuccess, setRegSuccess] = useState(false)

  const router = useRouter()

  // Check if already logged in
  useEffect(() => {
    if (isRedirecting) return

    const authUser = getAuthUser()
    if (authUser) {
      setIsRedirecting(true)
      router.push('/')
    }
  }, [router, isRedirecting])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.demoExpired) {
          setLoginError('Masa demo Anda sudah berakhir. Hubungi admin untuk perpanjangan.')
        } else {
          setLoginError(data.error || 'Login gagal')
        }
        return
      }

      // Simpan data user ke localStorage
      const userData = {
        ...data.user,
        popupMessage: data.settings.popupMessage,
        autoLogoutMinutes: data.settings.autoLogoutMinutes,
      }
      localStorage.setItem('auth', JSON.stringify(userData))

      // Simpan settings juga
      localStorage.setItem('app_settings', JSON.stringify({
        popupMessage: data.settings.popupMessage,
        autoLogoutMinutes: data.settings.autoLogoutMinutes,
      }))

      router.push('/')
    } catch (err) {
      setLoginError('Terjadi kesalahan jaringan')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegError('')
    setRegLoading(true)

    // Validasi client-side
    if (!regNamaLengkap.trim() || !regNomorHP.trim() || !regEmail.trim() || !regUsername.trim() || !regPassword || !regConfirmPassword) {
      setRegError('Semua field wajib diisi')
      setRegLoading(false)
      return
    }

    if (regUsername.trim().length < 8) {
      setRegError('Username minimal 8 karakter')
      setRegLoading(false)
      return
    }

    if (regPassword.length < 8) {
      setRegError('Password minimal 8 karakter')
      setRegLoading(false)
      return
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Password dan konfirmasi password tidak sama')
      setRegLoading(false)
      return
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namaLengkap: regNamaLengkap.trim(),
          nomorHP: regNomorHP.trim(),
          email: regEmail.trim(),
          username: regUsername.trim(),
          password: regPassword,
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setRegError(data.error || 'Pendaftaran gagal')
        return
      }

      setRegSuccess(true)
      setRegNamaLengkap('')
      setRegNomorHP('')
      setRegEmail('')
      setRegUsername('')
      setRegPassword('')
      setRegConfirmPassword('')

      // Otomatis pindah ke tab login setelah 2 detik
      setTimeout(() => {
        setRegSuccess(false)
        setActiveTab('login')
      }, 2000)
    } catch (err) {
      setRegError('Terjadi kesalahan jaringan')
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-lg">
            <Key className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Sistem Cetak</h1>
          <p className="text-slate-500 mt-1 text-sm">Silakan masuk untuk melanjutkan</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'login'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'register'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Daftar Akun
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6">
            {activeTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Login Error */}
                {loginError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 font-medium">
                    {loginError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="Masukkan username"
                    required
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Masukkan password"
                      required
                      autoComplete="current-password"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 pr-10 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {loginLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Masuk...
                    </>
                  ) : (
                    'Masuk'
                  )}
                </button>
                <p className="text-center text-sm text-slate-500">
                  Belum punya akun?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Daftar sekarang
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3">
                {/* Success Message */}
                {regSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700 font-medium">
                    Pendaftaran berhasil! Akun demo Anda aktif. Mengalihkan ke halaman login...
                  </div>
                )}

                {/* Error Message */}
                {regError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 font-medium">
                    {regError}
                  </div>
                )}

                {/* Nama Lengkap */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Masukkan nama lengkap"
                      required
                      value={regNamaLengkap}
                      onChange={(e) => setRegNamaLengkap(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Nomor Handphone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nomor Handphone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="Contoh: 081234567890"
                      required
                      value={regNomorHP}
                      onChange={(e) => setRegNomorHP(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="email@contoh.com"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Username <span className="text-xs text-slate-400">(minimal 8 karakter)</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Minimal 8 karakter"
                      required
                      autoComplete="username"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      minLength={8}
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      className={`w-full border rounded-lg pl-9 pr-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        regUsername.length > 0 && regUsername.length < 8 ? 'border-red-300' : 'border-slate-300'
                      }`}
                    />
                  </div>
                  {regUsername.length > 0 && regUsername.length < 8 && (
                    <p className="text-xs text-red-500 mt-1">Username harus minimal 8 karakter ({regUsername.length}/8)</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Password <span className="text-xs text-slate-400">(minimal 8 karakter)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Buat password"
                      required
                      autoComplete="new-password"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      minLength={8}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2.5 pr-10 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        regPassword.length > 0 && regPassword.length < 8 ? 'border-red-300' : 'border-slate-300'
                      }`}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {regPassword.length > 0 && regPassword.length < 8 && (
                    <p className="text-xs text-red-500 mt-1">Password harus minimal 8 karakter ({regPassword.length}/8)</p>
                  )}
                </div>

                {/* Konfirmasi Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Konfirmasi Password <span className="text-xs text-slate-400">(minimal 8 karakter)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Ulangi password"
                      required
                      autoComplete="new-password"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      minLength={8}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2.5 pr-10 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        regConfirmPassword.length > 0 && regConfirmPassword !== regPassword ? 'border-red-300' : 'border-slate-300'
                      }`}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {regConfirmPassword.length > 0 && regConfirmPassword !== regPassword && (
                    <p className="text-xs text-red-500 mt-1">Password tidak cocok</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={regLoading || regSuccess}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {regLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Mendaftar...
                    </>
                  ) : (
                    'Daftar Akun Demo'
                  )}
                </button>
                <p className="text-center text-xs text-slate-400">
                  Akun baru akan otomatis masuk mode demo
                </p>
                <p className="text-center text-sm text-slate-500">
                  Sudah punya akun?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Login sekarang
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

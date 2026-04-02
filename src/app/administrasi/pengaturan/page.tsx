'use client'

import { Wrench, Save, Bell, Database, Palette, Monitor, Percent, Shield, Timer, MessageSquare } from 'lucide-react'
import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { getAuthUser } from '@/lib/auth'

export default function PengaturanPage() {
  const [activeTab, setActiveTab] = useState('umum')
  const [saving, setSaving] = useState(false)

  // Profit setting
  const [profitPercent, setProfitPercent] = useState('0')

  // Demo settings
  const [demoDays, setDemoDays] = useState('7')
  const [popupMessage, setPopupMessage] = useState('')

  // Auto logout setting
  const [autoLogoutMinutes, setAutoLogoutMinutes] = useState('30')

  // General settings
  const [companyName, setCompanyName] = useState('Percetakan Maju Jaya')
  const [address, setAddress] = useState('Jl. Raya Utama No. 123, Jakarta')
  const [email, setEmail] = useState('info@percetakan.com')
  const [phone, setPhone] = useState('021-1234567')

  // Check if admin
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const authUser = getAuthUser()
    if (authUser && (authUser.role === 'admin' || authUser.role === 'owner')) {
      setIsAdmin(true)
    }
  }, [])

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings')
        const data = await res.json()
        if (data.profit) setProfitPercent(data.profit)
        if (data.demo_days) setDemoDays(data.demo_days)
        if (data.popup_message) setPopupMessage(data.popup_message)
        if (data.auto_logout_minutes) setAutoLogoutMinutes(data.auto_logout_minutes)
      } catch {}
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await Promise.all([
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'profit', value: profitPercent })
        }),
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'demo_days', value: demoDays })
        }),
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'popup_message', value: popupMessage })
        }),
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'auto_logout_minutes', value: autoLogoutMinutes })
        }),
      ])
      toast.success('Pengaturan berhasil disimpan!')
    } catch (error) {
      toast.error('Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout
      title="Pengaturan"
      subtitle="Konfigurasi sistem dan aplikasi"
    >
      <div className="max-w-4xl mx-auto">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex flex-col sm:flex-row overflow-x-auto">
            {[
              { id: 'umum', label: 'Umum', icon: Monitor },
              ...(isAdmin ? [
                { id: 'demo', label: 'Demo & Keamanan', icon: Shield },
                { id: 'notifikasi', label: 'Notifikasi', icon: Bell },
                { id: 'database', label: 'Database', icon: Database },
              ] : []),
              { id: 'tampilan', label: 'Tampilan', icon: Palette }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50 border-transparent'
                }`}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6">
            {activeTab === 'umum' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-4">Pengaturan Umum</h3>
                  <div className="space-y-4">
                    {/* Profit Setting */}
                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Percent className="w-4 h-4 text-emerald-600" />
                        <h4 className="text-sm font-semibold text-emerald-800">Profit</h4>
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                          Profit (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={profitPercent}
                            onChange={(e) => setProfitPercent(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Contoh: 10"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Persentase profit yang ditambahkan ke total hitung cetakan</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                        Nama Perusahaan
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                        Alamat
                      </label>
                      <textarea
                        rows={3}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                          Telepon
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'demo' && isAdmin && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-4">Pengaturan Demo & Keamanan</h3>

                  {/* Demo Duration */}
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-4 h-4 text-amber-600" />
                      <h4 className="text-sm font-semibold text-amber-800">Mode Demo</h4>
                    </div>
                    <p className="text-xs text-slate-600 mb-3">Setiap akun baru yang mendaftar akan otomatis masuk mode demo dengan batasan waktu.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                          Masa Aktif Demo
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="365"
                            value={demoDays}
                            onChange={(e) => setDemoDays(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">hari</span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-slate-500 mt-1">Berapa hari akun demo aktif sebelum expired</p>
                      </div>
                    </div>
                  </div>

                  {/* Popup Message */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <h4 className="text-sm font-semibold text-blue-800">Pesan Popup Demo</h4>
                    </div>
                    <p className="text-xs text-slate-600 mb-3">Pesan ini akan ditampilkan saat pengguna demo login untuk pertama kali.</p>
                    <textarea
                      rows={4}
                      value={popupMessage}
                      onChange={(e) => setPopupMessage(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Tulis pesan popup untuk pengguna demo..."
                    />
                  </div>

                  {/* Auto Logout */}
                  <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Timer className="w-4 h-4 text-red-600" />
                      <h4 className="text-sm font-semibold text-red-800">Auto Logout</h4>
                    </div>
                    <p className="text-xs text-slate-600 mb-3">Pengguna akan otomatis logout jika tidak aktif selama waktu tertentu.</p>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                        Batas Waktu Tidak Aktif
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max="1440"
                          value={autoLogoutMinutes}
                          onChange={(e) => setAutoLogoutMinutes(e.target.value)}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">menit</span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-1">60 detik sebelum logout akan muncul peringatan</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifikasi' && isAdmin && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-4">Pengaturan Notifikasi</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-slate-800">Notifikasi Email</p>
                        <p className="text-[10px] sm:text-xs text-slate-600">Terima notifikasi via email</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-slate-800">Notifikasi Order Baru</p>
                        <p className="text-[10px] sm:text-xs text-slate-600">Notifikasi ketika ada order baru</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'database' && isAdmin && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-4">Pengaturan Database</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs sm:text-sm text-amber-800 mb-2">
                        <strong>Perhatian:</strong> Backup database sebelum melakukan perubahan.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Button onClick={() => toast.success('Database berhasil di-backup!')} className="w-full">
                        <Database className="w-4 h-4 mr-2" />
                        Backup Database
                      </Button>
                      <Button onClick={() => toast.success('Database berhasil di-restore!')} variant="outline" className="w-full">
                        <Database className="w-4 h-4 mr-2" />
                        Restore Database
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tampilan' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-4">Pengaturan Tampilan</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-slate-800">Mode Gelap</p>
                        <p className="text-[10px] sm:text-xs text-slate-600">Gunakan tema gelap untuk aplikasi</p>
                      </div>
                      <Switch />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-2">
                        Bahasa
                      </label>
                      <select className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="id">Bahasa Indonesia</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-4 sm:pt-6 border-t border-slate-200">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

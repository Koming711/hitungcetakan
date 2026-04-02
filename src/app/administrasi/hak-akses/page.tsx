'use client'

import { Plus, Edit, Save, X, Eye, Trash2, ChevronRight, ChevronDown, Shield, Timer, MessageSquare, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { getAuthUser } from '@/lib/auth'

interface SubPermission {
  id: string
  name: string
  icon: 'view' | 'add' | 'edit' | 'delete' | 'print'
  allowed: boolean
}

interface FeaturePermission {
  featureId: string
  featureName: string
  allowed: boolean
  subPermissions?: SubPermission[]
  isGroup?: boolean
}

interface Role {
  id: string
  name: string
  features: FeaturePermission[]
}

const SIMPLE_FEATURES = [
  { id: 'hitung-cetakan', name: 'Hitung Cetakan' },
  { id: 'riwayat', name: 'Riwayat' },
  { id: 'hak-akses', name: 'Hak Akses' },
  { id: 'pengguna', name: 'Pengguna' },
  { id: 'pengaturan', name: 'Pengaturan' },
]

const GROUP_FEATURES = [
  {
    id: 'master-customer',
    name: 'Master Customer',
    subPermissions: [
      { id: 'master-customer-tambah', name: 'Tambah', icon: 'add' as const },
      { id: 'master-customer-edit', name: 'Edit', icon: 'edit' as const },
      { id: 'master-customer-delete', name: 'Hapus', icon: 'delete' as const },
    ]
  },
  {
    id: 'master-harga-kertas',
    name: 'Master Harga Kertas',
    subPermissions: [
      { id: 'master-harga-kertas-tambah', name: 'Tambah', icon: 'add' as const },
      { id: 'master-harga-kertas-edit', name: 'Edit', icon: 'edit' as const },
      { id: 'master-harga-kertas-delete', name: 'Hapus', icon: 'delete' as const },
    ]
  },
  {
    id: 'master-ongkos-cetak',
    name: 'Master Ongkos Cetak',
    subPermissions: [
      { id: 'master-ongkos-cetak-tambah', name: 'Tambah', icon: 'add' as const },
      { id: 'master-ongkos-cetak-edit', name: 'Edit', icon: 'edit' as const },
      { id: 'master-ongkos-cetak-delete', name: 'Hapus', icon: 'delete' as const },
    ]
  },
  {
    id: 'master-finishing',
    name: 'Master Finishing',
    subPermissions: [
      { id: 'master-finishing-tambah', name: 'Tambah', icon: 'add' as const },
      { id: 'master-finishing-edit', name: 'Edit', icon: 'edit' as const },
      { id: 'master-finishing-delete', name: 'Hapus', icon: 'delete' as const },
    ]
  },
]

function buildDefaultFeatures(roleId: string): FeaturePermission[] {
  const features: FeaturePermission[] = []

  for (const f of SIMPLE_FEATURES) {
    let allowed = false
    if (roleId === 'admin') allowed = true
    else if (roleId === 'manager') allowed = ['hitung-cetakan', 'riwayat'].includes(f.id)
    else if (roleId === 'user') allowed = ['hitung-cetakan', 'riwayat'].includes(f.id)

    features.push({ featureId: f.id, featureName: f.name, allowed })
  }

  for (const g of GROUP_FEATURES) {
    const subs: SubPermission[] = g.subPermissions.map(sp => ({
      id: sp.id,
      name: sp.name,
      icon: sp.icon,
      allowed: roleId === 'admin',
    }))

    if (roleId === 'manager') {
      for (const sp of subs) {
        if (sp.icon === 'add' || sp.icon === 'edit') sp.allowed = true
      }
    }

    const anyAllowed = subs.some(s => s.allowed)

    features.push({
      featureId: g.id,
      featureName: g.name,
      allowed: anyAllowed,
      subPermissions: subs,
      isGroup: true,
    })
  }

  return features
}

function getIconForSub(iconType: string) {
  switch (iconType) {
    case 'view': return <Eye className="w-3.5 h-3.5" />
    case 'add': return <Plus className="w-3.5 h-3.5" />
    case 'edit': return <Edit className="w-3.5 h-3.5" />
    case 'delete': return <Trash2 className="w-3.5 h-3.5" />
    case 'print': return <span className="text-[10px] font-bold">🖨</span>
    default: return null
  }
}

function getColorForSub(iconType: string) {
  switch (iconType) {
    case 'add': return 'text-emerald-600'
    case 'edit': return 'text-blue-600'
    case 'delete': return 'text-red-600'
    case 'view': return 'text-slate-600'
    case 'print': return 'text-purple-600'
    default: return 'text-slate-600'
  }
}

export default function HakAksesPage() {
  const [roles, setRoles] = useState<Role[]>([
    { id: 'admin', name: 'Admin', features: buildDefaultFeatures('admin') },
    { id: 'manager', name: 'Manager', features: buildDefaultFeatures('manager') },
    { id: 'user', name: 'User', features: buildDefaultFeatures('user') },
  ])

  const [isEditing, setIsEditing] = useState(false)
  const [editRoles, setEditRoles] = useState<Role[]>(JSON.parse(JSON.stringify(roles)))
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(GROUP_FEATURES.map(g => g.id))
  )

  // Demo & Security settings
  const [demoDays, setDemoDays] = useState('7')
  const [popupMessage, setPopupMessage] = useState('')
  const [autoLogoutMinutes, setAutoLogoutMinutes] = useState('30')
  const [savingSettings, setSavingSettings] = useState(false)
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
        if (data.demo_days) setDemoDays(data.demo_days)
        if (data.popup_message) setPopupMessage(data.popup_message)
        if (data.auto_logout_minutes) setAutoLogoutMinutes(data.auto_logout_minutes)
      } catch {}
    }
    fetchSettings()
  }, [])

  const handleEditToggle = () => {
    if (isEditing) {
      setEditRoles(JSON.parse(JSON.stringify(roles)))
    } else {
      setEditRoles(JSON.parse(JSON.stringify(roles)))
    }
    setIsEditing(!isEditing)
  }

  const handleSave = () => {
    setRoles(JSON.parse(JSON.stringify(editRoles)))
    setIsEditing(false)
    toast.success('Hak akses berhasil disimpan!')
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      await Promise.all([
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
    } catch {
      toast.error('Gagal menyimpan pengaturan')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleAddRole = () => {
    if (!newRoleName.trim()) {
      toast.error('Nama role wajib diisi')
      return
    }

    const newRole: Role = {
      id: Date.now().toString(),
      name: newRoleName,
      features: buildDefaultFeatures('new'),
    }

    setEditRoles([...editRoles, newRole])
    setNewRoleName('')
    toast.success('Role baru ditambahkan')
  }

  const toggleSimplePermission = (roleId: string, featureId: string) => {
    setEditRoles(prev =>
      prev.map(role =>
        role.id === roleId
          ? {
              ...role,
              features: role.features.map(f =>
                f.featureId === featureId ? { ...f, allowed: !f.allowed } : f
              )
            }
          : role
      )
    )
  }

  const toggleSubPermission = (roleId: string, featureId: string, subId: string) => {
    setEditRoles(prev =>
      prev.map(role =>
        role.id === roleId
          ? {
              ...role,
              features: role.features.map(f => {
                if (f.featureId !== featureId || !f.subPermissions) return f
                const updatedSubs = f.subPermissions.map(sp =>
                  sp.id === subId ? { ...sp, allowed: !sp.allowed } : sp
                )
                const anyAllowed = updatedSubs.some(s => s.allowed)
                return { ...f, subPermissions: updatedSubs, allowed: anyAllowed }
              })
            }
          : role
      )
    )
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  const toggleGroupAll = (roleId: string, featureId: string) => {
    setEditRoles(prev =>
      prev.map(role => {
        if (role.id !== roleId) return role
        return {
          ...role,
          features: role.features.map(f => {
            if (f.featureId !== featureId || !f.subPermissions) return f
            const anyAllowed = f.subPermissions.some(s => s.allowed)
            const updatedSubs = f.subPermissions.map(sp => ({ ...sp, allowed: !anyAllowed }))
            return { ...f, subPermissions: updatedSubs, allowed: !anyAllowed }
          })
        }
      })
    )
  }

  return (
    <DashboardLayout
      title="Hak Akses"
      subtitle="Kelola hak akses pengguna"
    >
      <div className="space-y-6">
        {/* Hak Akses Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="p-4 lg:p-6 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 text-center sm:text-left">Hak Akses</h1>
                <p className="text-sm text-slate-600 mt-1 text-center sm:text-left">
                  Atur akses pengguna untuk setiap fitur aplikasi
                </p>
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button onClick={handleSave} size="sm" className="gap-2">
                      <Save className="w-4 h-4" />
                      Simpan
                    </Button>
                    <Button onClick={handleEditToggle} variant="outline" size="sm" className="gap-2">
                      <X className="w-4 h-4" />
                      Batal
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Tambah Role
                    </Button>
                    <Button onClick={handleEditToggle} size="sm" className="gap-2">
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 min-w-[220px]">
                    Fitur
                  </th>
                  {editRoles.map((role) => (
                    <th key={role.id} className="px-4 py-3 text-center min-w-[100px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          role.name === 'Admin' ? 'bg-purple-100 text-purple-700' :
                          role.name === 'Manager' ? 'bg-emerald-100 text-emerald-700' :
                          role.name === 'User' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {role.name}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SIMPLE_FEATURES.map((feature) => (
                  <tr key={feature.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-slate-800">{feature.name}</span>
                    </td>
                    {editRoles.map((role) => {
                      const fp = role.features.find(f => f.featureId === feature.id)
                      return (
                        <td key={role.id} className="px-4 py-3">
                          <div className="flex items-center justify-center">
                            <Switch
                              checked={fp?.allowed || false}
                              onCheckedChange={() => toggleSimplePermission(role.id, feature.id)}
                              disabled={!isEditing}
                            />
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}

                {GROUP_FEATURES.map((group) => {
                  const isExpanded = expandedGroups.has(group.id)
                  return (
                    <tbody key={group.id}>
                      <tr className="border-b border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleGroup(group.id)}
                              className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              {isExpanded
                                ? <ChevronDown className="w-4 h-4" />
                                : <ChevronRight className="w-4 h-4" />
                              }
                            </button>
                            <span className="text-sm font-semibold text-slate-800">{group.name}</span>
                          </div>
                        </td>
                        {editRoles.map((role) => {
                          const fp = role.features.find(f => f.featureId === group.id)
                          const allCount = fp?.subPermissions?.length || 0
                          const allowedCount = fp?.subPermissions?.filter(s => s.allowed).length || 0
                          return (
                            <td key={role.id} className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                {isEditing && (
                                  <button
                                    type="button"
                                    onClick={() => toggleGroupAll(role.id, group.id)}
                                    className="text-[10px] font-medium text-slate-500 hover:text-slate-800 underline underline-offset-2 transition-colors"
                                  >
                                    Semua
                                  </button>
                                )}
                                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                                  allowedCount === allCount && allCount > 0
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : allowedCount > 0
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {allowedCount}/{allCount}
                                </span>
                              </div>
                            </td>
                          )
                        })}
                      </tr>

                      {isExpanded && group.subPermissions.map((sp) => (
                        <tr key={sp.id} className="border-b border-slate-50 hover:bg-white transition-colors">
                          <td className="px-4 py-2.5 pl-12">
                            <div className="flex items-center gap-2">
                              <span className={`flex items-center justify-center w-5 h-5 rounded ${getColorForSub(sp.icon)} bg-slate-50`}>
                                {getIconForSub(sp.icon)}
                              </span>
                              <span className="text-sm text-slate-700">{sp.name}</span>
                            </div>
                          </td>
                          {editRoles.map((role) => {
                            const fp = role.features.find(f => f.featureId === group.id)
                            const sub = fp?.subPermissions?.find(s => s.id === sp.id)
                            return (
                              <td key={role.id} className="px-4 py-2.5">
                                <div className="flex items-center justify-center">
                                  <Switch
                                    checked={sub?.allowed || false}
                                    onCheckedChange={() => toggleSubPermission(role.id, group.id, sp.id)}
                                    disabled={!isEditing}
                                  />
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <span className="font-medium text-slate-700">Legend:</span>
              <div className="flex items-center gap-1.5">
                <span className="flex items-center justify-center w-4 h-4 rounded text-emerald-600 bg-slate-100"><Plus className="w-3 h-3" /></span>
                <span>Tambah</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="flex items-center justify-center w-4 h-4 rounded text-blue-600 bg-slate-100"><Edit className="w-3 h-3" /></span>
                <span>Edit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="flex items-center justify-center w-4 h-4 rounded text-red-600 bg-slate-100"><Trash2 className="w-3 h-3" /></span>
                <span>Hapus</span>
              </div>
              <span className="text-slate-400">|</span>
              <span>Klik <strong>Edit</strong> untuk mengubah hak akses</span>
            </div>
          </div>
        </div>

        {/* Demo & Security Settings */}
        {isAdmin && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 lg:p-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Pengaturan Demo & Keamanan</h2>
                  <p className="text-sm text-slate-500">Konfigurasi akun demo dan keamanan sesi</p>
                </div>
              </div>
            </div>

            <div className="p-4 lg:p-6 space-y-6">

              {/* Pesan Popup Akun Demo */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-blue-800">Pesan Popup Akun Demo</h3>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">OTOMATIS</span>
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  Pesan ini akan tampil otomatis saat pengguna login menggunakan akun Demo. Pesan dapat diedit kapan saja.
                </p>
                <textarea
                  rows={4}
                  value={popupMessage}
                  onChange={(e) => setPopupMessage(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Tulis pesan popup untuk pengguna demo..."
                />
              </div>

              {/* Masa Aktif Demo Otomatis */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Timer className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-bold text-amber-800">Masa Aktif Demo Otomatis</h3>
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">OTOMATIS</span>
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  Masa aktif akun demo dihitung otomatis dari tanggal akun dibuat. Jumlah hari dapat diubah sesuai kebutuhan.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Masa Aktif Demo</Label>
                    <div className="relative mt-1.5">
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={demoDays}
                        onChange={(e) => setDemoDays(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">hari</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Contoh: 3 hari, 7 hari, 30 hari</p>
                  </div>
                </div>
              </div>

              {/* Logout Otomatis */}
              <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <LogOut className="w-5 h-5 text-red-600" />
                  <h3 className="text-sm font-bold text-red-800">Logout Otomatis</h3>
                  <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">OTOMATIS</span>
                </div>
                <p className="text-xs text-slate-600 mb-3">
                  Semua pengguna akan logout secara otomatis apabila akun tidak aktif selama waktu yang ditentukan.
                  <strong> Peringatan akan muncul 60 detik sebelum logout otomatis berupa popup.</strong>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Batas Waktu Tidak Aktif</Label>
                    <div className="relative mt-1.5">
                      <input
                        type="number"
                        min="1"
                        max="1440"
                        value={autoLogoutMinutes}
                        onChange={(e) => setAutoLogoutMinutes(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">menit</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Contoh: 2 menit, 30 menit, 60 menit</p>
                  </div>
                </div>

                {/* Info box */}
                <div className="mt-3 p-3 bg-white/70 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-700">
                    <strong>Peringatan:</strong> Popup countdown akan muncul 60 detik sebelum logout.
                    Pengguna bisa memilih "Tetap Masuk" untuk membatalkan logout.
                  </p>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-slate-200">
                <Button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="w-full sm:w-auto"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan Demo & Keamanan'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Role Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Role Baru</DialogTitle>
            <DialogDescription>
              Masukkan nama role baru untuk ditambahkan ke tabel hak akses
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="roleName">Nama Role *</Label>
              <Input
                id="roleName"
                placeholder="Contoh: Supervisor"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAddRole}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

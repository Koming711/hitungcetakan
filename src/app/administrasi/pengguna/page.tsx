'use client'

import { Users, Plus, Search, Eye, EyeOff, Bell } from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { MobileTable } from '@/components/mobile-table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface Pengguna {
  id: string
  namaLengkap: string
  nomorHP: string
  email: string
  username: string
  password: string
  role: string
  createdAt: string
  validUntil: string
  isDemo?: boolean
  demoUntil?: string
}

const ROLE_OPTIONS = ['admin', 'user', 'manager']

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  user: 'bg-blue-100 text-blue-700',
  manager: 'bg-emerald-100 text-emerald-700',
}

export default function PenggunaPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [penggunaList, setPenggunaList] = useState<Pengguna[]>([])
  const [loading, setLoading] = useState(true)

  // Form state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Pengguna | null>(null)
  const [formNamaLengkap, setFormNamaLengkap] = useState('')
  const [formNomorHP, setFormNomorHP] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formUsername, setFormUsername] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formRole, setFormRole] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)

  // Notification state
  const [notificationCount, setNotificationCount] = useState(0)
  const lastKnownCountRef = useRef(0)

  const fetchPengguna = useCallback(async () => {
    try {
      const res = await fetch('/api/pengguna')
      if (res.ok) {
        const data = await res.json()
        const currentCount = penggunaList.length

        setPenggunaList(data)

        // Deteksi user baru yang mendaftar dari form Daftar Akun
        const newUsers = data.filter((u: Pengguna) =>
          u.role === 'user' && !penggunaList.find(existing => existing.id === u.id)
        )

        if (currentCount > 0 && newUsers.length > 0) {
          for (const newUser of newUsers) {
            toast.info(`🔔 Pengguna baru "${newUser.namaLengkap}" mendaftar!`, {
              duration: 5000,
              description: `Username: ${newUser.username}`,
            })
          }
          setNotificationCount(prev => prev + newUsers.length)
        }

        lastKnownCountRef.current = data.length
      }
    } catch (err) {
      console.error('Fetch pengguna error:', err)
    }
  }, [penggunaList.length])

  // Fetch data saat pertama kali
  useEffect(() => {
    fetchPengguna().finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Polling setiap 5 detik untuk deteksi pendaftaran baru
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPengguna()
    }, 5000)

    return () => clearInterval(interval)
  }, [fetchPengguna])

  const filteredUsers = penggunaList.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const resetForm = () => {
    setFormNamaLengkap('')
    setFormNomorHP('')
    setFormEmail('')
    setFormUsername('')
    setFormPassword('')
    setFormRole('')
    setShowPassword(false)
    setEditingUser(null)
  }

  const handleAdd = () => {
    resetForm()
    setDialogOpen(true)
  }

  const handleEdit = (user: Pengguna) => {
    setEditingUser(user)
    setFormNamaLengkap(user.namaLengkap)
    setFormNomorHP(user.nomorHP)
    setFormEmail(user.email)
    setFormUsername(user.username)
    setFormPassword('')
    setFormRole(user.role)
    setShowPassword(false)
    setDialogOpen(true)
  }

  const handleDelete = async (user: Pengguna) => {
    if (user.username === 'admin') {
      toast.error('Tidak dapat menghapus user admin')
      return
    }
    if (confirm(`Apakah Anda yakin ingin menghapus user "${user.username}"?`)) {
      try {
        const res = await fetch(`/api/pengguna?id=${user.id}`, { method: 'DELETE' })
        if (res.ok) {
          setPenggunaList(penggunaList.filter(u => u.id !== user.id))
          toast.success('User berhasil dihapus')
        } else {
          const data = await res.json()
          toast.error(data.error || 'Gagal menghapus user')
        }
      } catch {
        toast.error('Terjadi kesalahan jaringan')
      }
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formNamaLengkap.trim() || !formUsername.trim() || !formRole) {
      toast.error('Nama lengkap, username, dan role wajib diisi')
      return
    }

    setSaving(true)

    try {
      if (editingUser) {
        const res = await fetch('/api/pengguna', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingUser.id,
            namaLengkap: formNamaLengkap.trim(),
            nomorHP: formNomorHP.trim(),
            email: formEmail.trim(),
            username: formUsername.trim(),
            password: formPassword || undefined,
            role: formRole,
          })
        })

        if (res.ok) {
          toast.success('User berhasil diperbarui')
          fetchPengguna()
        } else {
          const data = await res.json()
          toast.error(data.error || 'Gagal memperbarui user')
        }
      } else {
        if (!formPassword) {
          toast.error('Password wajib diisi untuk pengguna baru')
          setSaving(false)
          return
        }
        // Admin menambah user langsung via POST
        const res = await fetch('/api/pengguna', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            namaLengkap: formNamaLengkap.trim(),
            nomorHP: formNomorHP.trim(),
            email: formEmail.trim(),
            username: formUsername.trim(),
            password: formPassword,
            role: formRole,
          })
        })

        if (res.ok) {
          toast.success('User berhasil ditambahkan')
          fetchPengguna()
        } else {
          const data = await res.json()
          toast.error(data.error || 'Gagal menambahkan user')
        }
      }

      setDialogOpen(false)
      resetForm()
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const columns = [
    {
      key: 'username',
      title: 'Username',
      render: (user: Pengguna) => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <span className="font-medium text-slate-800">{user.username}</span>
        </div>
      )
    },
    {
      key: 'role',
      title: 'Role',
      render: (user: Pengguna) => (
        <div className="flex flex-wrap items-center gap-1.5">
          {user.isDemo && (
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">DEMO</span>
          )}
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${roleColors[user.role] || 'bg-slate-100 text-slate-700'}`}>
            {user.role}
          </span>
        </div>
      )
    },
    {
      key: 'createdAt',
      title: 'Tanggal Dibuat',
      render: (user: Pengguna) => (
        <span className="text-sm text-slate-600">{formatDate(user.createdAt)}</span>
      )
    },
    {
      key: 'validUntil',
      title: 'Demo s/d',
      render: (user: Pengguna) => (
        <span className="text-sm text-slate-600">
          {user.isDemo && user.demoUntil ? formatDate(user.demoUntil) : user.validUntil ? formatDate(user.validUntil) : '-'}
        </span>
      )
    },
  ]

  return (
    <DashboardLayout
      title="Pengguna"
      subtitle="Kelola data pengguna aplikasi"
    >
      {/* Notification bar */}
      {notificationCount > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <Bell className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-800">
                {notificationCount} pendaftaran baru
              </p>
              <p className="text-xs text-amber-600">
                Pengguna baru telah mendaftar melalui form Daftar Akun
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNotificationCount(0)}
            className="text-amber-700 border-amber-300 hover:bg-amber-100"
          >
            Tutup
          </Button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {/* Search & Add Button */}
        <div className="p-4 lg:p-6 border-b border-slate-200 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari pengguna..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 lg:pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button onClick={handleAdd} className="w-full lg:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Pengguna
          </Button>
        </div>

        {/* Table */}
        <div className="p-4 lg:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-sm text-slate-500">Memuat data pengguna...</span>
            </div>
          ) : (
            <MobileTable
              data={filteredUsers}
              columns={columns}
              keyField="id"
              onEdit={handleEdit}
              onDelete={handleDelete}
              showAsButtons
              emptyMessage="Tidak ada pengguna ditemukan"
              emptyIcon={<Users className="w-12 h-12 mx-auto text-slate-400" />}
            />
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open) }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Ubah data pengguna. Kosongkan password jika tidak ingin mengubah.' : 'Isi data pengguna baru.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              {/* Nama Lengkap */}
              <div className="grid gap-2">
                <Label htmlFor="namaLengkap">Nama Lengkap</Label>
                <Input
                  id="namaLengkap"
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  required
                  value={formNamaLengkap}
                  onChange={(e) => setFormNamaLengkap(e.target.value)}
                />
              </div>

              {/* Nomor HP */}
              <div className="grid gap-2">
                <Label htmlFor="nomorHP">Nomor Handphone</Label>
                <Input
                  id="nomorHP"
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={formNomorHP}
                  onChange={(e) => setFormNomorHP(e.target.value)}
                />
              </div>

              {/* Email */}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@contoh.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>

              {/* Username */}
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Masukkan username"
                  required
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                />
              </div>

              {/* Password */}
              <div className="grid gap-2">
                <Label htmlFor="password">
                  Password {editingUser && <span className="text-xs text-slate-400 font-normal">(kosongkan jika tidak diubah)</span>}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={editingUser ? '••••••••' : 'Masukkan password'}
                    required={!editingUser}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role */}
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select value={formRole} onValueChange={setFormRole} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((role) => (
                      <SelectItem key={role} value={role} className="capitalize">
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { resetForm(); setDialogOpen(false) }}>
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </>
                ) : (
                  editingUser ? 'Simpan Perubahan' : 'Tambah Pengguna'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

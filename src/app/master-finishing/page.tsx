'use client'

import { useState, useEffect } from 'react'
import { Layers, Plus, Search, Printer, Trash2, Edit2 } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { getAuthHeaders } from '@/lib/auth'
import { MobileTable } from '@/components/mobile-table'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

interface Finishing {
  id: string
  name: string
  minimumSheets: number
  minimumPrice: number
  additionalPrice: number
  pricePerCm: number
  createdAt: string
  updatedAt: string
}

export default function MasterFinishingPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [finishings, setFinishings] = useState<Finishing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFinishing, setEditingFinishing] = useState<Finishing | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    minimumSheets: '',
    minimumPrice: '',
    additionalPrice: '',
    pricePerCm: '',
    optMinimumSheets: false,
    optMinimumPrice: false,
    optAdditionalPrice: false,
    optPricePerCm: false,
  })
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    fetchFinishings()
  }, [])

  const fetchFinishings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/finishings', { headers: getAuthHeaders() })
      const data = await response.json()
      
      console.log('API Response:', data)
      console.log('Is array:', Array.isArray(data))
      
      // Ensure data is always an array
      if (Array.isArray(data)) {
        setFinishings(data)
      } else {
        console.error('API did not return an array:', data)
        setFinishings([])
      }
    } catch (error) {
      console.error('Error fetching finishings:', error)
      setFinishings([]) // Ensure it's always an array even on error
    } finally {
      setIsLoading(false)
    }
  }

  const filteredFinishings = Array.isArray(finishings) ? finishings.filter(finishing =>
    finishing.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) : []

  const handleAdd = () => {
    setEditingFinishing(null)
    setFormData({
      name: '',
      minimumSheets: '',
      minimumPrice: '',
      additionalPrice: '',
      pricePerCm: '',
      optMinimumSheets: false,
      optMinimumPrice: false,
      optAdditionalPrice: false,
      optPricePerCm: false,
    })
    // Reset dialog position to center
    setDialogPosition({ x: 0, y: 0 })
    setIsDialogOpen(true)
  }

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - dialogPosition.x,
      y: e.clientY - dialogPosition.y
    })
  }

  const handleDrag = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault()
      setDialogPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setDialogPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragStart])

  const handleEdit = (finishing: Finishing) => {
    setEditingFinishing(finishing)
    setFormData({
      name: finishing.name,
      minimumSheets: finishing.minimumSheets.toString(),
      minimumPrice: finishing.minimumPrice.toString(),
      additionalPrice: finishing.additionalPrice.toString(),
      pricePerCm: finishing.pricePerCm.toString(),
      optMinimumSheets: finishing.minimumSheets <= 0,
      optMinimumPrice: finishing.minimumPrice <= 0,
      optAdditionalPrice: finishing.additionalPrice <= 0,
      optPricePerCm: finishing.pricePerCm <= 0,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (finishing: Finishing) => {
    if (confirm(`Apakah Anda yakin ingin menghapus ${finishing.name}?`)) {
      try {
        await fetch(`/api/finishings/${finishing.id}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        })
        fetchFinishings()
      } catch (error) {
        console.error('Error deleting finishing:', error)
        alert('Gagal menghapus finishing')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Build payload — optional fields default to 0 when toggled
      const payload = {
        name: formData.name,
        minimumSheets: formData.optMinimumSheets ? 0 : (parseFloat(formData.minimumSheets) || 0),
        minimumPrice: formData.optMinimumPrice ? 0 : (parseFloat(formData.minimumPrice) || 0),
        additionalPrice: formData.optAdditionalPrice ? 0 : (parseFloat(formData.additionalPrice) || 0),
        pricePerCm: formData.optPricePerCm ? 0 : (parseFloat(formData.pricePerCm) || 0),
      }

      const url = editingFinishing
        ? `/api/finishings/${editingFinishing.id}`
        : '/api/finishings'

      const method = editingFinishing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Gagal menyimpan finishing')
        return
      }

      setIsDialogOpen(false)
      fetchFinishings()
    } catch (error) {
      console.error('Error saving finishing:', error)
      alert('Gagal menyimpan finishing')
    }
  }

  const handlePrint = () => {
    const printContent = finishings.map(f => 
      `${f.name} | Min: ${f.minimumSheets} lbr | Harga Min: Rp ${f.minimumPrice.toLocaleString('id-ID')} | Harga Lebih: Rp ${f.additionalPrice.toLocaleString('id-ID')}/lbr | Harga/cm: Rp ${f.pricePerCm.toLocaleString('id-ID')}`
    ).join('\n')

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Tabel Finishing</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { text-align: center; margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #333; padding: 10px; text-align: left; }
              th { background-color: #f0f0f0; }
              @media print {
                body { padding: 0; }
                button { display: none; }
              }
            </style>
          </head>
          <body>
            <h1>Master Finishing</h1>
            <table>
              <thead>
                <tr>
                  <th>Nama Finishing</th>
                  <th>Minim Lembar</th>
                  <th>Harga Minimum (Rp)</th>
                  <th>Harga Lebih (Rp/lembar)</th>
                  <th>Harga per cm (Rp)</th>
                </tr>
              </thead>
              <tbody>
                ${finishings.map(f => `
                  <tr>
                    <td>${f.name}</td>
                    <td>${f.minimumSheets}</td>
                    <td>${f.minimumPrice.toLocaleString('id-ID')}</td>
                    <td>${f.additionalPrice.toLocaleString('id-ID')}</td>
                    <td>${f.pricePerCm.toLocaleString('id-ID')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">Total: ${finishings.length} finishing</p>
            <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer;">Cetak</button>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  const columns = [
    {
      key: 'name',
      title: 'Nama Finishing',
      render: (finishing: Finishing) => (
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-purple-600 flex-shrink-0" />
          <span className="font-medium text-slate-800 truncate">{finishing.name}</span>
        </div>
      )
    },
    {
      key: 'minimumSheets',
      title: 'Minim Lembar',
      render: (finishing: Finishing) => finishing.minimumSheets
    },
    {
      key: 'minimumPrice',
      title: 'Harga Minimum',
      render: (finishing: Finishing) => `Rp ${finishing.minimumPrice.toLocaleString('id-ID')}`
    },
    {
      key: 'additionalPrice',
      title: 'Harga Lebih',
      render: (finishing: Finishing) => `Rp ${finishing.additionalPrice.toLocaleString('id-ID')}/lbr`
    },
    {
      key: 'pricePerCm',
      title: 'Harga/cm',
      render: (finishing: Finishing) => `Rp ${finishing.pricePerCm.toLocaleString('id-ID')}`
    }
  ]

  return (
    <DashboardLayout
      title="Master Finishing"
      subtitle="Kelola data finishing"
    >
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {/* Search & Action Buttons */}
        <div className="p-4 lg:p-6 border-b border-slate-200 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari finishing..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 lg:pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="w-full lg:w-auto"
            >
              <Printer className="w-4 h-4 mr-2" />
              Cetak Tabel
            </Button>
            <Button className="w-full lg:w-auto" onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Baru
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="p-4 lg:p-6">
          <MobileTable
            data={filteredFinishings}
            columns={columns}
            keyField="id"
            onEdit={handleEdit}
            onDelete={handleDelete}
            showAsButtons={true}
            emptyMessage="Tidak ada data finishing ditemukan"
            emptyIcon={<Layers className="w-12 h-12 mx-auto text-slate-400" />}
          />
        </div>
      </div>

      {/* Dialog Form */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto cursor-move"
            style={{
              transform: `translate(${dialogPosition.x}px, ${dialogPosition.y}px)`,
              position: 'absolute'
            }}
            onMouseDown={handleDragStart}
          >
            <div className="p-6 border-b border-slate-200 cursor-move flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-300" />
              <h2 className="text-xl font-semibold text-slate-800">
                {editingFinishing ? 'Edit Finishing' : 'Tambah Finishing Baru'}
              </h2>
              <p className="text-xs text-slate-500 ml-auto">Geser untuk memindahkan</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nama Finishing <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Laminating Glossy"
                  required
                />
              </div>

              {/* Minimum Berapa Lembar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-slate-700">
                    Minimum Berapa Lembar
                    {!formData.optMinimumSheets && <span className="text-red-500"> *</span>}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">Tidak perlu</span>
                    <Switch
                      checked={formData.optMinimumSheets}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, optMinimumSheets: checked, minimumSheets: '' })
                      }
                    />
                    <span className="text-xs text-slate-500">O/Tidak</span>
                  </div>
                </div>
                {formData.optMinimumSheets && (
                  <p className="text-xs text-emerald-600 mb-1">✓ Tidak perlu minimum lembar</p>
                )}
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.optMinimumSheets ? '' : formData.minimumSheets}
                  onChange={(e) => setFormData({ ...formData, minimumSheets: e.target.value })}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formData.optMinimumSheets
                      ? 'border-slate-200 bg-slate-50 text-slate-400'
                      : 'border-slate-300'
                  }`}
                  placeholder={formData.optMinimumSheets ? 'Tidak perlu diisi' : '100'}
                  disabled={formData.optMinimumSheets}
                  required={!formData.optMinimumSheets}
                />
              </div>

              {/* Harga Minimum */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-slate-700">
                    Harga Minimum (Rp)
                    {!formData.optMinimumPrice && <span className="text-red-500"> *</span>}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">Tidak perlu</span>
                    <Switch
                      checked={formData.optMinimumPrice}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, optMinimumPrice: checked, minimumPrice: '' })
                      }
                    />
                    <span className="text-xs text-slate-500">O/Tidak</span>
                  </div>
                </div>
                {formData.optMinimumPrice && (
                  <p className="text-xs text-emerald-600 mb-1">✓ Tidak perlu harga minimum</p>
                )}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.optMinimumPrice ? '' : formData.minimumPrice}
                  onChange={(e) => setFormData({ ...formData, minimumPrice: e.target.value })}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formData.optMinimumPrice
                      ? 'border-slate-200 bg-slate-50 text-slate-400'
                      : 'border-slate-300'
                  }`}
                  placeholder={formData.optMinimumPrice ? 'Tidak perlu diisi' : '50000'}
                  disabled={formData.optMinimumPrice}
                  required={!formData.optMinimumPrice}
                />
              </div>

              {/* Harga Lebih */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-slate-700">
                    Harga Lebih (Rp/lembar)
                    {!formData.optAdditionalPrice && <span className="text-red-500"> *</span>}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">Tidak perlu</span>
                    <Switch
                      checked={formData.optAdditionalPrice}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, optAdditionalPrice: checked, additionalPrice: '' })
                      }
                    />
                    <span className="text-xs text-slate-500">O/Tidak</span>
                  </div>
                </div>
                {formData.optAdditionalPrice && (
                  <p className="text-xs text-emerald-600 mb-1">✓ Tidak perlu harga lebih</p>
                )}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.optAdditionalPrice ? '' : formData.additionalPrice}
                  onChange={(e) => setFormData({ ...formData, additionalPrice: e.target.value })}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formData.optAdditionalPrice
                      ? 'border-slate-200 bg-slate-50 text-slate-400'
                      : 'border-slate-300'
                  }`}
                  placeholder={formData.optAdditionalPrice ? 'Tidak perlu diisi' : '500'}
                  disabled={formData.optAdditionalPrice}
                  required={!formData.optAdditionalPrice}
                />
                <p className="text-xs text-slate-500 mt-1">Harga tambahan per lembar di atas minimum</p>
              </div>

              {/* Harga per cm */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-slate-700">
                    Harga per cm (Rp)
                    {!formData.optPricePerCm && <span className="text-red-500"> *</span>}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">Tidak perlu</span>
                    <Switch
                      checked={formData.optPricePerCm}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, optPricePerCm: checked, pricePerCm: '' })
                      }
                    />
                    <span className="text-xs text-slate-500">O/Tidak</span>
                  </div>
                </div>
                {formData.optPricePerCm && (
                  <p className="text-xs text-emerald-600 mb-1">✓ Tidak perlu harga per cm</p>
                )}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.optPricePerCm ? '' : formData.pricePerCm}
                  onChange={(e) => setFormData({ ...formData, pricePerCm: e.target.value })}
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formData.optPricePerCm
                      ? 'border-slate-200 bg-slate-50 text-slate-400'
                      : 'border-slate-300'
                  }`}
                  placeholder={formData.optPricePerCm ? 'Tidak perlu diisi' : '100'}
                  disabled={formData.optPricePerCm}
                  required={!formData.optPricePerCm}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button type="submit" className="flex-1">
                  {editingFinishing ? 'Update' : 'Tambah'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

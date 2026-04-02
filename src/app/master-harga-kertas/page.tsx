'use client'

import { FileText, Plus, Search, Loader2, Printer, Download } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { MobileTable } from '@/components/mobile-table'
import { Button } from '@/components/ui/button'
import { DialogForm } from '@/components/dialog-form'
import { toast } from 'sonner'

interface Paper {
  id: string
  name: string
  grammage: number
  width: number
  height: number
  pricePerRim: number
  createdAt: string
  updatedAt: string
}

export default function MasterHargaKertasPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPaper, setEditingPaper] = useState<Paper | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchPapers()
  }, [])

  const fetchPapers = async () => {
    try {
      const response = await fetch('/api/papers')
      const data = await response.json()
      setPapers(data)
    } catch (error) {
      console.error('Error fetching papers:', error)
      toast.error('Gagal memuat data kertas')
    } finally {
      setLoading(false)
    }
  }

  const calculatePricePerSheet = (pricePerRim: number): number => {
    return pricePerRim / 500
  }

  const filteredPapers = papers.filter(paper =>
    paper.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAdd = () => {
    setEditingPaper(null)
    setDialogOpen(true)
  }

  const handleEdit = (paper: Paper) => {
    setEditingPaper(paper)
    setDialogOpen(true)
  }

  const handleDelete = async (paper: Paper) => {
    if (confirm(`Apakah Anda yakin ingin menghapus ${paper.name}?`)) {
      try {
        const response = await fetch(`/api/papers/${paper.id}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          setPapers(papers.filter(p => p.id !== paper.id))
          toast.success('Kertas berhasil dihapus')
        } else {
          toast.error('Gagal menghapus kertas')
        }
      } catch (error) {
        console.error('Error deleting paper:', error)
        toast.error('Gagal menghapus kertas')
      }
    }
  }

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open('', '', 'height=800,width=800')
    if (!printWindow) {
      toast.error('Gagal membuka jendela print')
      return
    }

    printWindow.document.write('<html><head><title>Master Harga Kertas</title>')
    printWindow.document.write(`
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { text-align: center; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .right { text-align: right; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
      </style>
    `)
    printWindow.document.write('</head><body>')

    // Add title
    printWindow.document.write('<h1>Master Harga Kertas</h1>')

    // Add print date
    printWindow.document.write(`<p style="text-align: right; font-size: 12px; margin-bottom: 10px;">Dicetak: ${new Date().toLocaleString('id-ID')}</p>`)

    // Add table
    printWindow.document.write('<table>')
    printWindow.document.write('<thead><tr><th>No</th><th>Nama Bahan</th><th>Gramatur</th><th>Ukuran (cm)</th><th>Harga/Rim</th><th>Harga/Lembar</th></tr></thead>')
    printWindow.document.write('<tbody>')

    filteredPapers.forEach((paper, index) => {
      const pricePerSheet = calculatePricePerSheet(paper.pricePerRim)
      printWindow.document.write(`
        <tr>
          <td>${index + 1}</td>
          <td>${paper.name}</td>
          <td>${paper.grammage} gsm</td>
          <td>${paper.width} x ${paper.height}</td>
          <td class="right">Rp ${paper.pricePerRim.toLocaleString('id-ID')}</td>
          <td class="right">Rp ${pricePerSheet.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      `)
    })

    printWindow.document.write('</tbody></table>')

    // Add footer
    printWindow.document.write('<div class="footer">Total Data: ' + filteredPapers.length + '</div>')
    printWindow.document.write('</body></html>')
    printWindow.document.close()

    setTimeout(() => {
      printWindow.print()
    }, 250)

    toast.success('Mencetak tabel...')
  }

  const handleSave = async (data: any) => {
    try {
      if (editingPaper) {
        // Update existing paper
        const response = await fetch(`/api/papers/${editingPaper.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        if (response.ok) {
          const updatedPaper = await response.json()
          setPapers(papers.map(p => p.id === editingPaper.id ? updatedPaper : p))
          toast.success('Kertas berhasil diperbarui')
        } else {
          toast.error('Gagal memperbarui kertas')
        }
      } else {
        // Add new paper
        const response = await fetch('/api/papers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        if (response.ok) {
          const newPaper = await response.json()
          setPapers([newPaper, ...papers])
          toast.success('Kertas berhasil ditambahkan')
        } else {
          toast.error('Gagal menambahkan kertas')
        }
      }
      setDialogOpen(false)
    } catch (error) {
      console.error('Error saving paper:', error)
      toast.error('Gagal menyimpan kertas')
    }
  }

  const columns = [
    {
      key: 'name',
      title: 'Nama Bahan',
      render: (paper: Paper) => (
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <span className="font-medium text-slate-800 truncate">{paper.name}</span>
        </div>
      )
    },
    {
      key: 'grammage',
      title: 'Gramatur',
      render: (paper: Paper) => `${paper.grammage} gsm`
    },
    {
      key: 'size',
      title: 'Ukuran (cm)',
      render: (paper: Paper) => `${paper.width} x ${paper.height}`
    },
    {
      key: 'pricePerRim',
      title: 'Harga/Rim',
      render: (paper: Paper) => (
        <span className="text-emerald-600 font-medium">
          Rp {paper.pricePerRim.toLocaleString('id-ID')}
        </span>
      )
    },
    {
      key: 'pricePerSheet',
      title: 'Harga/Lembar',
      render: (paper: Paper) => (
        <span className="text-blue-600 font-medium">
          Rp {calculatePricePerSheet(paper.pricePerRim).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    }
  ]

  return (
    <DashboardLayout
      title="Master Harga Kertas"
      subtitle="Kelola data harga kertas"

    >
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {/* Search & Add Button */}
        <div className="p-4 lg:p-6 border-b border-slate-200 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kertas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 lg:pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 w-full lg:w-auto">
            <Button onClick={handlePrint} variant="outline" className="flex-1 lg:flex-none">
              <Printer className="w-4 h-4 mr-2" />
              Cetak Tabel
            </Button>
            <Button onClick={handleAdd} className="flex-1 lg:flex-none">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Baru
            </Button>
          </div>
        </div>

        {/* Hidden printable content */}
        <div ref={printRef} className="hidden">
          {filteredPapers.map((paper, index) => (
            <div key={paper.id}>
              {index + 1}. {paper.name} - {paper.grammage} gsm - {paper.width} x {paper.height} cm -
              Rp {paper.pricePerRim.toLocaleString('id-ID')}/rim -
              Rp {calculatePricePerSheet(paper.pricePerRim).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/lembar
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="p-4 lg:p-6 min-h-[600px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="w-full">
              <MobileTable
                data={filteredPapers}
                columns={columns}
                keyField="id"
                onEdit={handleEdit}
                onDelete={handleDelete}
                showAsButtons={true}
                emptyMessage="Tidak ada data kertas ditemukan"
                emptyIcon={<FileText className="w-16 h-16 mx-auto text-slate-400" />}
              />
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <DialogForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingPaper ? 'Edit Data Kertas' : 'Tambah Kertas Baru'}
        description={editingPaper ? 'Edit informasi kertas' : 'Isi informasi kertas baru'}
        fields={[
          { name: 'name', label: 'Nama Bahan', type: 'text', placeholder: 'Contoh: Art Paper 150', required: true },
          { name: 'grammage', label: 'Gramatur (gsm)', type: 'number', placeholder: '150', required: true },
          { name: 'width', label: 'Lebar Kertas (cm)', type: 'number', placeholder: '65', required: true },
          { name: 'height', label: 'Tinggi Kertas (cm)', type: 'number', placeholder: '100', required: true },
          { name: 'pricePerRim', label: 'Harga Per Rim (500 lembar)', type: 'number', placeholder: '12500000', required: true }
        ]}
        initialData={editingPaper ? {
          name: editingPaper.name,
          grammage: editingPaper.grammage.toString(),
          width: editingPaper.width.toString(),
          height: editingPaper.height.toString(),
          pricePerRim: editingPaper.pricePerRim.toString()
        } : undefined}
        onSave={handleSave}
      />
    </DashboardLayout>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Scissors, Calculator, Search, Printer, Trash2, Eye, Pencil, X } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { getAuthHeaders } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface PotongKertas {
  id: string
  customerName: string
  paperName: string
  grammage: number
  paperWidth: number
  paperHeight: number
  cutWidth: number
  cutHeight: number
  quantity: number
  totalPieces: number
  sheetsNeeded: number
  pricePerSheet: number
  totalPrice: number
  strategy: string
  scenarioType: string
  totalWasteArea: number
  steps: string
  efficiency: number
  createdAt: string
  updatedAt?: string
}

interface HitungCetakan {
  id: string
  printName: string
  paperName: string
  paperGrammage: string
  paperLength: string
  paperWidth: string
  cutWidth: string
  cutHeight: string
  quantity: string
  warna: string
  warnaKhusus: string
  machineName: string
  hargaPlat: number
  ongkosCetak: number
  ongkosCetakDetail: string
  totalPaperPrice: number
  finishingNames: string
  finishingBreakdown: string
  finishingCost: number
  packingCost: number
  shippingCost: number
  subTotal: number
  profitPercent: number
  profitAmount: number
  grandTotal: number
  createdAt: string
  updatedAt?: string
}

const fmt = (n: number | string) => `Rp ${Number(n).toLocaleString('id-ID')}`
const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  catch { return d }
}
const fmtDateShort = (d: string) => {
  try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return d }
}
export default function RiwayatPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'potong' | 'cetakan'>('potong')
  const [searchTerm, setSearchTerm] = useState('')
  const [dataPotong, setDataPotong] = useState<PotongKertas[]>([])
  const [dataCetakan, setDataCetakan] = useState<HitungCetakan[]>([])
  const [detailItem, setDetailItem] = useState<PotongKertas | HitungCetakan | null>(null)

  const fetchPotong = useCallback(async () => {
    try { const r = await fetch('/api/riwayat-potong', { headers: getAuthHeaders() }); const d = await r.json(); if (Array.isArray(d)) setDataPotong(d) } catch {}
  }, [])
  const fetchCetakan = useCallback(async () => {
    try { const r = await fetch('/api/riwayat-cetakan', { headers: getAuthHeaders() }); const d = await r.json(); if (Array.isArray(d)) setDataCetakan(d) } catch {}
  }, [])
  useEffect(() => { fetchPotong(); fetchCetakan() }, [fetchPotong, fetchCetakan])

  // ============ DELETE ============
  const handleDeletePotong = async (id: string) => {
    if (!confirm('Hapus riwayat potong kertas ini?')) return
    try { await fetch(`/api/riwayat-potong?id=${id}`, { method: 'DELETE', headers: getAuthHeaders() }); setDataPotong(p => p.filter(d => d.id !== id)); toast.success('Dihapus') } catch { toast.error('Gagal') }
  }
  const handleDeleteCetakan = async (id: string) => {
    if (!confirm('Hapus riwayat hitung cetakan ini?')) return
    try { await fetch(`/api/riwayat-cetakan?id=${id}`, { method: 'DELETE', headers: getAuthHeaders() }); setDataCetakan(p => p.filter(d => d.id !== id)); toast.success('Dihapus') } catch { toast.error('Gagal') }
  }

  // ============ EDIT → Navigate to form pages ============
  const handleEditPotong = (item: PotongKertas) => {
    sessionStorage.setItem('edit_potong_data', JSON.stringify(item))
    toast.info('Membuka form Potong Kertas untuk edit...')
    router.push('/')
  }
  const handleEditCetakan = (item: HitungCetakan) => {
    sessionStorage.setItem('edit_cetakan_data', JSON.stringify(item))
    toast.info('Membuka form Hitung Cetakan untuk edit...')
    router.push('/hitung-cetakan')
  }

  // ============ FILTER ============
  const filteredPotong = dataPotong.filter(d =>
    d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.paperName.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const filteredCetakan = dataCetakan.filter(d =>
    d.printName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.paperName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.machineName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // ============ DETAIL POTONG KERTAS ============
  const renderDetailPotong = (item: PotongKertas) => {
    const pps = item.pricePerSheet || 0
    const totalArea = item.paperWidth * item.paperHeight
    const cutArea = item.cutWidth * item.cutHeight
    const wasteArea = item.totalWasteArea || 0
    const stepsList = item.steps ? item.steps.split('|').map(s => s.trim()).filter(Boolean) : []
    return (
      <div className="space-y-3">
        {/* Informasi Umum */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-1.5">
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-2">Informasi Umum</p>
          <DetailRow label="Customer" value={item.customerName || '-'} />
          <DetailRow label="Jenis Kertas" value={item.paperName || '-'} />
          <DetailRow label="Gramatur" value={`${item.grammage || 0} gsm`} />
          <DetailRow label="Harga / Lembar" value={pps > 0 ? fmt(pps) : '-'} />
          <DetailRow label="Harga / Rim" value={pps > 0 ? fmt(pps * 500) : '-'} />
        </div>

        {/* Ukuran */}
        <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 space-y-1.5">
          <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-2">Ukuran</p>
          <DetailRow label="Ukuran Kertas" value={`${item.paperWidth} cm × ${item.paperHeight} cm`} />
          <DetailRow label="Ukuran Potongan" value={`${item.cutWidth} cm × ${item.cutHeight} cm`} />
          <DetailRow label="Luas Kertas" value={`${totalArea.toFixed(1)} cm²`} />
          <DetailRow label="Luas Potongan" value={`${cutArea.toFixed(1)} cm²`} />
          <DetailRow label="Luas Sisa (Waste)" value={`${wasteArea.toFixed(1)} cm²`} highlight />
        </div>

        {/* Perhitungan */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 space-y-1.5">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-2">Perhitungan</p>
          <DetailRow label="Jumlah Pesanan" value={`${Number(item.quantity).toLocaleString()} lembar`} />
          <DetailRow label="Potongan / Lembar" value={`${item.totalPieces} potongan`} bold />
          <DetailRow label="Lembar Dibutuhkan" value={`${item.sheetsNeeded} lembar`} bold />
          <DetailRow label="Strategi" value={item.strategy} />
          {item.scenarioType && <DetailRow label="Jenis Strategi" value={item.scenarioType} />}
        </div>

        {/* Langkah Potong */}
        {stepsList.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-2">Langkah-langkah Potong</p>
            <ol className="space-y-1 ml-4">
              {stepsList.map((s, i) => (
                <li key={i} className="text-xs text-slate-700 list-decimal">{s}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Efisiensi */}
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-600 font-medium">Efisiensi Pemotongan</span>
            <span className="text-sm font-bold text-amber-700">{item.efficiency.toFixed(1)}%</span>
          </div>
          <div className="w-full h-3 bg-amber-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all" style={{ width: `${Math.min(item.efficiency, 100)}%` }} />
          </div>
        </div>

        {/* Total */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 rounded-xl text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-emerald-200">Total Harga Kertas</p>
              <p className="text-[10px] text-emerald-300 mt-0.5">{item.sheetsNeeded} lbr × Rp {pps.toLocaleString('id-ID', { maximumFractionDigits: 2 })}/lbr</p>
            </div>
            <span className="text-xl font-bold">{fmt(item.totalPrice)}</span>
          </div>
        </div>
      </div>
    )
  }

  // ============ DETAIL HITUNG CETAKAN ============
  const renderDetailCetakan = (item: HitungCetakan) => {
    const finishingList = item.finishingNames ? item.finishingNames.split(',').map(f => f.trim()).filter(Boolean) : []
    const finishingBreakdownList = item.finishingBreakdown ? item.finishingBreakdown.split('|').map(f => f.trim()).filter(Boolean) : []
    const stepsList = item.ongkosCetakDetail ? [item.ongkosCetakDetail] : []
    return (
      <div className="space-y-3">
        {/* Informasi Umum */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-1.5">
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-2">Informasi Umum</p>
          <DetailRow label="Customer" value={item.printName} />
          <DetailRow label="Jumlah Cetakan" value={`${Number(item.quantity).toLocaleString()} lembar`} />
        </div>

        {/* Bahan & Ukuran */}
        <div className="bg-teal-50 border border-teal-100 rounded-lg p-3 space-y-1.5">
          <p className="text-[10px] font-bold text-teal-500 uppercase tracking-wider mb-2">Bahan & Ukuran</p>
          <DetailRow label="Jenis Kertas" value={item.paperName} />
          <DetailRow label="Gramatur" value={`${item.paperGrammage || 0} gsm`} />
          <DetailRow label="Ukuran Bahan" value={`${item.paperLength} cm × ${item.paperWidth} cm`} />
          <DetailRow label="Ukuran Potongan" value={`${item.cutWidth} cm × ${item.cutHeight} cm`} />
        </div>

        {/* Ongkos Cetak */}
        <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 space-y-1.5">
          <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-2">Ongkos Cetak</p>
          <DetailRow label="Mesin Cetak" value={item.machineName || '-'} />
          <DetailRow label="Jumlah Warna" value={`${item.warna} warna`} />
          {Number(item.warnaKhusus) > 0 && <DetailRow label="Warna Khusus" value={`${item.warnaKhusus} warna`} />}
          <DetailRow label="Harga Plat" value={fmt(item.hargaPlat || 0)} />
          <DetailRow label="Total Ongkos Cetak" value={fmt(item.ongkosCetak)} bold highlight />
          {/* Rumus ongkos cetak */}
          {stepsList.length > 0 && (
            <div className="mt-1 p-2 bg-purple-100/50 rounded-md">
              <p className="text-[10px] text-purple-600 font-medium">Rumus:</p>
              <p className="text-[10px] text-purple-800 mt-0.5 break-all">{stepsList[0]}</p>
            </div>
          )}
        </div>

        {/* Finishing */}
        <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 space-y-1.5">
          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-2">Finishing</p>
          {finishingList.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-1">
                {finishingList.map((f, i) => (
                  <span key={i} className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-medium">{f}</span>
                ))}
              </div>
              <DetailRow label="Total Harga Finishing" value={fmt(item.finishingCost)} bold />
              {/* Perincian tiap finishing */}
              {finishingBreakdownList.length > 0 && (
                <div className="mt-1 space-y-1">
                  {finishingBreakdownList.map((fb, i) => (
                    <div key={i} className="text-[10px] text-slate-600 bg-white/60 rounded p-1.5">
                      <span className="font-medium text-rose-700">{fb}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-400 italic">Tidak ada finishing</p>
          )}
        </div>

        {/* Biaya Tambahan */}
        {(item.packingCost > 0 || item.shippingCost > 0) && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Biaya Tambahan</p>
            {item.packingCost > 0 && <DetailRow label="Ongkos Packing" value={fmt(item.packingCost)} />}
            {item.shippingCost > 0 && <DetailRow label="Ongkos Kirim" value={fmt(item.shippingCost)} />}
          </div>
        )}

        {/* Ringkasan Harga */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 space-y-1.5">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-2">Ringkasan Harga</p>
          <DetailRow label="Total Harga Kertas" value={fmt(item.totalPaperPrice)} />
          <DetailRow label="Ongkos Cetak" value={fmt(item.ongkosCetak)} />
          {item.finishingCost > 0 && <DetailRow label="Harga Finishing" value={fmt(item.finishingCost)} />}
          {item.packingCost > 0 && <DetailRow label="Ongkos Packing" value={fmt(item.packingCost)} />}
          {item.shippingCost > 0 && <DetailRow label="Ongkos Kirim" value={fmt(item.shippingCost)} />}
        </div>

        {/* Sub Total + Profit */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5">
          <DetailRow label="Sub Total" value={fmt(item.subTotal)} bold />
          <DetailRow label={`Profit (${item.profitPercent}%)`} value={fmt(item.profitAmount)} isProfit />
        </div>

        {/* Grand Total */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 rounded-xl text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-emerald-200">Total Hitung Cetakan</p>
              <p className="text-[10px] text-emerald-300 mt-0.5">Sub Total + Profit {item.profitPercent}%</p>
            </div>
            <span className="text-xl font-bold">{fmt(item.grandTotal)}</span>
          </div>
        </div>
      </div>
    )
  }

  // ============ PRINT POTONG KERTAS ============
  const handlePrintPotong = (item: PotongKertas) => {
    const pps = item.pricePerSheet || 0
    const totalArea = item.paperWidth * item.paperHeight
    const cutArea = item.cutWidth * item.cutHeight
    const wasteArea = item.totalWasteArea || 0
    const stepsList = item.steps ? item.steps.split('|').map(s => s.trim()).filter(Boolean) : []
    const w = window.open('', '', 'height=900,width=700')
    if (!w) return
    w.document.write(`<html><head><title>Riwayat Potong Kertas</title>
    <style>
      @media print { body { padding: 10px; } }
      body { font-family: Arial, sans-serif; padding: 20px; color: #1e293b; font-size: 12px; }
      .header { text-align: center; margin-bottom: 20px; border-bottom: 3px double #334155; padding-bottom: 12px; }
      .header h1 { font-size: 16px; margin: 0 0 2px 0; color: #0f172a; letter-spacing: 2px; }
      .header p { font-size: 10px; color: #64748b; margin: 0; }
      .date { text-align: right; font-size: 10px; color: #64748b; margin-bottom: 12px; }
      h2 { font-size: 12px; color: #0f172a; margin: 16px 0 6px; padding: 4px 10px; background: #f1f5f9; border-left: 3px solid #3b82f6; }
      h2.green { border-left-color: #22c55e; }
      h2.amber { border-left-color: #f59e0b; }
      h2.purple { border-left-color: #8b5cf6; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
      th, td { border: 1px solid #e2e8f0; padding: 6px 10px; text-align: left; font-size: 11px; }
      th { background: #f8fafc; color: #475569; width: 36%; font-weight: 600; }
      td { color: #1e293b; }
      .bold { font-weight: 700; }
      .highlight { background: #f0fdf4; }
      .amber-bg { background: #fffbeb; }
      .total-box { margin-top: 16px; padding: 14px; background: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; text-align: right; }
      .total-box .label { font-size: 11px; color: #166534; }
      .total-box .value { font-size: 20px; font-weight: bold; color: #15803d; }
      .formula { margin: 8px 0; padding: 8px; background: #fef3c7; border: 1px solid #fde68a; border-radius: 4px; font-size: 10px; color: #92400e; }
      ol { margin: 4px 0; padding-left: 20px; }
      ol li { margin-bottom: 3px; font-size: 11px; color: #334155; }
      .eff-bar { display: flex; align-items: center; gap: 6px; }
      .eff-bar .bar { flex: 1; height: 10px; background: #e2e8f0; border-radius: 5px; }
      .eff-bar .fill { height: 100%; background: #f59e0b; border-radius: 5px; }
    </style></head><body>
    <div class="header"><h1>RIWAYAT POTONG KERTAS</h1><p>Detail Perhitungan Pemotongan Kertas</p></div>
    <div class="date">${fmtDate(item.createdAt)}</div>

    <h2>Informasi Umum</h2>
    <table>
      <tr><th>Customer</th><td>${item.customerName || '-'}</td></tr>
      <tr><th>Jenis Kertas</th><td>${item.paperName || '-'}</td></tr>
      <tr><th>Gramatur</th><td>${item.grammage || 0} gsm</td></tr>
      <tr><th>Harga / Lembar</th><td>${pps > 0 ? fmt(pps) : '-'}</td></tr>
      <tr><th>Harga / Rim (500 lbr)</th><td>${pps > 0 ? fmt(pps * 500) : '-'}</td></tr>
    </table>

    <h2 class="purple">Ukuran</h2>
    <table>
      <tr><th>Ukuran Kertas</th><td>${item.paperWidth} cm &times; ${item.paperHeight} cm</td></tr>
      <tr><th>Ukuran Potongan</th><td>${item.cutWidth} cm &times; ${item.cutHeight} cm</td></tr>
      <tr><th>Luas Kertas</th><td>${totalArea.toFixed(1)} cm&sup2;</td></tr>
      <tr><th>Luas Potongan</th><td>${cutArea.toFixed(1)} cm&sup2;</td></tr>
      <tr class="amber-bg"><th>Luas Sisa (Waste)</th><td>${wasteArea.toFixed(1)} cm&sup2;</td></tr>
    </table>

    <h2 class="green">Perhitungan</h2>
    <table>
      <tr><th>Jumlah Pesanan</th><td>${Number(item.quantity).toLocaleString()} lembar</td></tr>
      <tr><th>Potongan / Lembar</th><td class="bold">${item.totalPieces} potongan</td></tr>
      <tr><th>Lembar Dibutuhkan</th><td class="bold">${item.sheetsNeeded} lembar</td></tr>
      <tr><th>Strategi Potong</th><td>${item.strategy}</td></tr>
      ${item.scenarioType ? `<tr><th>Jenis Strategi</th><td>${item.scenarioType}</td></tr>` : ''}
    </table>

    ${stepsList.length > 0 ? `<h2 class="amber">Langkah-langkah Potong</h2>
    <ol>${stepsList.map(s => `<li>${s}</li>`).join('')}</ol>` : ''}

    <h2 class="amber">Efisiensi</h2>
    <table>
      <tr><th>Tingkat Efisiensi</th><td>
        <div class="eff-bar">
          <span>${item.efficiency.toFixed(1)}%</span>
          <div class="bar"><div class="fill" style="width:${Math.min(item.efficiency, 100)}%"></div></div>
        </div>
      </td></tr>
    </table>

    <div class="formula"><strong>Rumus:</strong> ${item.sheetsNeeded} lembar &times; Rp ${pps.toLocaleString('id-ID', { maximumFractionDigits: 2 })}/lbr = <strong>${fmt(item.totalPrice)}</strong></div>

    <div class="total-box"><div class="label">TOTAL HARGA KERTAS</div><div class="value">${fmt(item.totalPrice)}</div></div>
    </body></html>`)
    w.document.close(); setTimeout(() => w.print(), 300)
  }

  // ============ PRINT HITUNG CETAKAN ============
  const handlePrintCetakan = (item: HitungCetakan) => {
    const finishingList = item.finishingNames ? item.finishingNames.split(',').map(f => f.trim()).filter(Boolean) : []
    const finishingBreakdownList = item.finishingBreakdown ? item.finishingBreakdown.split('|').map(f => f.trim()).filter(Boolean) : []
    const w = window.open('', '', 'height=900,width=700')
    if (!w) return
    w.document.write(`<html><head><title>Riwayat Hitung Cetakan</title>
    <style>
      @media print { body { padding: 10px; } }
      body { font-family: Arial, sans-serif; padding: 20px; color: #1e293b; font-size: 12px; }
      .header { text-align: center; margin-bottom: 20px; border-bottom: 3px double #334155; padding-bottom: 12px; }
      .header h1 { font-size: 16px; margin: 0 0 2px 0; color: #0f172a; letter-spacing: 2px; }
      .header p { font-size: 10px; color: #64748b; margin: 0; }
      .date { text-align: right; font-size: 10px; color: #64748b; margin-bottom: 12px; }
      h2 { font-size: 12px; color: #0f172a; margin: 16px 0 6px; padding: 4px 10px; background: #f1f5f9; border-left: 3px solid #3b82f6; }
      h2.green { border-left-color: #22c55e; }
      h2.purple { border-left-color: #8b5cf6; }
      h2.rose { border-left-color: #f43f5e; }
      h2.amber { border-left-color: #f59e0b; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
      th, td { border: 1px solid #e2e8f0; padding: 6px 10px; text-align: left; font-size: 11px; }
      th { background: #f8fafc; color: #475569; width: 36%; font-weight: 600; }
      td { color: #1e293b; }
      .bold { font-weight: 700; }
      .highlight { background: #f0fdf4; }
      .warna-badge { display: inline-block; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 3px; padding: 1px 6px; margin-right: 3px; font-size: 10px; color: #1d4ed8; }
      .finishing-tag { display: inline-block; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 3px; padding: 1px 6px; margin: 1px 2px; font-size: 10px; color: #9f1239; }
      .formula { margin: 6px 0; padding: 6px; background: #f5f3ff; border: 1px solid #e9d5ff; border-radius: 4px; font-size: 10px; color: #6b21a8; break-all; }
      .fb-item { margin: 3px 0; padding: 4px 6px; background: #fff1f2; border-radius: 3px; font-size: 10px; color: #9f1239; }
      .total-box { margin-top: 16px; padding: 14px; background: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; text-align: right; }
      .total-box .label { font-size: 11px; color: #166534; }
      .total-box .value { font-size: 20px; font-weight: bold; color: #15803d; }
      .summary th { background: #f0f9ff; color: #0369a1; width: 50%; }
    </style></head><body>
    <div class="header"><h1>RIWAYAT HITUNG CETAKAN</h1><p>Detail Estimasi Harga Cetakan</p></div>
    <div class="date">${fmtDate(item.createdAt)}</div>

    <h2>Informasi Umum</h2>
    <table>
      <tr><th>Customer</th><td>${item.printName}</td></tr>
      <tr><th>Jumlah Cetakan</th><td>${Number(item.quantity).toLocaleString()} lembar</td></tr>
    </table>

    <h2>Bahan & Ukuran</h2>
    <table>
      <tr><th>Jenis Kertas</th><td>${item.paperName}</td></tr>
      <tr><th>Gramatur</th><td>${item.paperGrammage || 0} gsm</td></tr>
      <tr><th>Ukuran Bahan</th><td>${item.paperLength} cm &times; ${item.paperWidth} cm</td></tr>
      <tr><th>Ukuran Potongan</th><td>${item.cutWidth} cm &times; ${item.cutHeight} cm</td></tr>
    </table>

    <h2 class="purple">Ongkos Cetak</h2>
    <table>
      <tr><th>Mesin Cetak</th><td>${item.machineName || '-'}</td></tr>
      <tr><th>Warna</th><td><span class="warna-badge">${item.warna} warna</span>${Number(item.warnaKhusus) > 0 ? `<span class="warna-badge" style="background:#fffbeb;border-color:#fde68a;color:#92400e;">${item.warnaKhusus} khusus</span>` : ''}</td></tr>
      <tr><th>Harga Plat</th><td>${fmt(item.hargaPlat || 0)}</td></tr>
      <tr class="highlight"><th>Total Ongkos Cetak</th><td class="bold">${fmt(item.ongkosCetak)}</td></tr>
    </table>
    ${item.ongkosCetakDetail ? `<div class="formula"><strong>Rumus:</strong> ${item.ongkosCetakDetail}</div>` : ''}

    <h2 class="rose">Finishing</h2>
    ${finishingList.length > 0 ? `
      <table>
        <tr><th>Jenis Finishing</th><td>${finishingList.map(f => `<span class="finishing-tag">${f}</span>`).join('')}</td></tr>
        <tr><th>Total Harga Finishing</th><td>${fmt(item.finishingCost)}</td></tr>
      </table>
      <p style="font-size:10px;color:#9f1239;font-weight:600;margin:6px 0 2px 0;">Perincian Finishing:</p>
      ${finishingBreakdownList.map(fb => `<div class="fb-item">${fb}</div>`).join('')}
    ` : '<p style="color:#94a3b8;font-size:11px;">Tidak ada finishing</p>'}

    ${item.packingCost > 0 || item.shippingCost > 0 ? `<h2 class="amber">Biaya Tambahan</h2>
    <table>
      ${item.packingCost > 0 ? `<tr><th>Ongkos Packing</th><td>${fmt(item.packingCost)}</td></tr>` : ''}
      ${item.shippingCost > 0 ? `<tr><th>Ongkos Kirim</th><td>${fmt(item.shippingCost)}</td></tr>` : ''}
    </table>` : ''}

    <h2 class="green">Ringkasan Harga</h2>
    <table class="summary">
      <tr><th>Total Harga Kertas</th><td>${fmt(item.totalPaperPrice)}</td></tr>
      <tr><th>Ongkos Cetak</th><td>${fmt(item.ongkosCetak)}</td></tr>
      ${item.finishingCost > 0 ? `<tr><th>Harga Finishing</th><td>${fmt(item.finishingCost)}</td></tr>` : ''}
      ${item.packingCost > 0 ? `<tr><th>Ongkos Packing</th><td>${fmt(item.packingCost)}</td></tr>` : ''}
      ${item.shippingCost > 0 ? `<tr><th>Ongkos Kirim</th><td>${fmt(item.shippingCost)}</td></tr>` : ''}
    </table>

    <table class="summary">
      <tr><th>Sub Total</th><td class="bold">${fmt(item.subTotal)}</td></tr>
      <tr><th>Profit (${item.profitPercent}%)</th><td style="color:#92400e;">${fmt(item.profitAmount)}</td></tr>
      <tr class="highlight"><th>Grand Total</th><td class="bold" style="font-size:13px;color:#15803d;">${fmt(item.grandTotal)}</td></tr>
    </table>

    <div class="total-box"><div class="label">TOTAL HITUNG CETAKAN</div><div class="value">${fmt(item.grandTotal)}</div></div>
    </body></html>`)
    w.document.close(); setTimeout(() => w.print(), 300)
  }

  return (
    <DashboardLayout title="Riwayat" subtitle="Lihat semua riwayat pengerjaan">
      <div className="space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-2">
              <button onClick={() => setActiveTab('potong')} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'potong' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <Scissors className="w-4 h-4" />
                Riwayat Potong Kertas
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'potong' ? 'bg-white/20' : 'bg-slate-200'}`}>{dataPotong.length}</span>
              </button>
              <button onClick={() => setActiveTab('cetakan')} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'cetakan' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                <Calculator className="w-4 h-4" />
                Riwayat Hitung Cetakan
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'cetakan' ? 'bg-white/20' : 'bg-slate-200'}`}>{dataCetakan.length}</span>
              </button>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Cari..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* Tabel Potong Kertas */}
        {activeTab === 'potong' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {filteredPotong.length === 0 ? (
              <div className="p-12 text-center"><Scissors className="w-12 h-12 mx-auto text-slate-300 mb-3" /><p className="text-sm text-slate-500">Belum ada riwayat potong kertas</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Tanggal</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Kertas</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Ukuran</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Potongan</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Jumlah</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Lembar</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Total</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600">Aksi</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPotong.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-500 text-xs">{fmtDateShort(item.createdAt)}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{item.customerName}</td>
                        <td className="px-4 py-3 text-slate-600">{item.paperName}</td>
                        <td className="px-4 py-3 text-slate-600">{item.paperWidth}×{item.paperHeight}</td>
                        <td className="px-4 py-3 text-slate-600">{item.cutWidth}×{item.cutHeight}</td>
                        <td className="px-4 py-3 text-slate-600">{Number(item.quantity).toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-600">{item.sheetsNeeded}</td>
                        <td className="px-4 py-3 font-semibold text-emerald-700">{fmt(item.totalPrice)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setDetailItem(item)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Detail"><Eye className="w-4 h-4" /></button>
                            <button onClick={() => handleEditPotong(item)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => handlePrintPotong(item)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors" title="Cetak"><Printer className="w-4 h-4" /></button>
                            <button onClick={() => handleDeletePotong(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tabel Hitung Cetakan */}
        {activeTab === 'cetakan' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {filteredCetakan.length === 0 ? (
              <div className="p-12 text-center"><Calculator className="w-12 h-12 mx-auto text-slate-300 mb-3" /><p className="text-sm text-slate-500">Belum ada riwayat hitung cetakan</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Tanggal</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Kertas</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Mesin</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Jumlah</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Sub Total</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Profit</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">Grand Total</th>
                    <th className="text-center px-4 py-3 font-medium text-slate-600">Aksi</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCetakan.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-500 text-xs">{fmtDateShort(item.createdAt)}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{item.printName}</td>
                        <td className="px-4 py-3 text-slate-600">{item.paperName}</td>
                        <td className="px-4 py-3 text-slate-600">{item.machineName || '-'}</td>
                        <td className="px-4 py-3 text-slate-600">{Number(item.quantity).toLocaleString()} lbr</td>
                        <td className="px-4 py-3 text-slate-600">{fmt(item.subTotal)}</td>
                        <td className="px-4 py-3 text-amber-600">{fmt(item.profitAmount)} ({item.profitPercent}%)</td>
                        <td className="px-4 py-3 font-semibold text-emerald-700">{fmt(item.grandTotal)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setDetailItem(item)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Detail"><Eye className="w-4 h-4" /></button>
                            <button onClick={() => handleEditCetakan(item)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => handlePrintCetakan(item)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors" title="Cetak"><Printer className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteCetakan(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===================== DETAIL MODAL ===================== */}
        {detailItem && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setDetailItem(null)}>
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeTab === 'potong' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                    {activeTab === 'potong' ? <Scissors className="w-3.5 h-3.5 text-blue-600" /> : <Calculator className="w-3.5 h-3.5 text-purple-600" />}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800">Detail {activeTab === 'potong' ? 'Potong Kertas' : 'Hitung Cetakan'}</h3>
                </div>
                <button onClick={() => setDetailItem(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-4">
                {activeTab === 'potong' ? renderDetailPotong(detailItem as PotongKertas) : renderDetailCetakan(detailItem as HitungCetakan)}
              </div>
              <div className="p-3 border-t border-slate-100 flex gap-2 justify-end sticky bottom-0 bg-white rounded-b-2xl">
                <Button size="sm" variant="outline" onClick={() => { if (activeTab === 'potong') handlePrintPotong(detailItem as PotongKertas); else handlePrintCetakan(detailItem as HitungCetakan); setDetailItem(null) }}>
                  <Printer className="w-3.5 h-3.5 mr-1" /> Cetak
                </Button>
                <Button size="sm" variant="outline" onClick={() => { if (activeTab === 'potong') handleEditPotong(detailItem as PotongKertas); else handleEditCetakan(detailItem as HitungCetakan); setDetailItem(null) }}>
                  <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
              </div>
            </div>
          </div>
        )}


      </div>
    </DashboardLayout>
  )
}

function DetailRow({ label, value, bold, highlight, isProfit }: { label: string; value: string; bold?: boolean; highlight?: boolean; isProfit?: boolean }) {
  return (
    <div className={`flex justify-between text-xs ${highlight ? 'bg-amber-50 -mx-2 px-2 py-1 rounded' : ''} ${isProfit ? 'bg-yellow-50 -mx-2 px-2 py-1 rounded' : ''}`}>
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium ${bold ? 'text-slate-900 font-bold' : 'text-slate-800'} ${isProfit ? 'text-amber-700' : ''}`}>{value}</span>
    </div>
  )
}

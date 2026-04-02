'use client'

import { Calculator, Printer, Plus, Users, FileText, Ruler, Cog, Layers, Package, Truck, Banknote, RotateCcw, Trash2, Palette, Minus, X, Percent, Save } from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Paper {
  id: string
  name: string
  grammage: number
  width: number
  height: number
  pricePerRim: number
}

interface PrintingCost {
  id: string
  machineName: string
  grammage: number
  printAreaWidth: number
  printAreaHeight: number
  pricePerColor: number
  specialColorPrice: number
  minimumPrintQuantity: number
  priceAboveMinimumPerSheet: number
  platePricePerSheet: number
}

interface Finishing {
  id: string
  name: string
  minimumSheets: number
  minimumPrice: number
  additionalPrice: number
  pricePerCm: number
}

interface Customer {
  id: string
  name: string
}

interface PrintCalculation {
  id: string
  printName: string
  paperLength: string
  paperWidth: string
  quantity: string
  warna: string
  warnaKhusus: string
  paperId: string
  paperName: string
  machineId: string
  machineName: string
  printingCost: number
  finishingId: string
  finishingName: string
  packingCost: string
  shippingCost: string
  pricePerSheet: string
  hargaPlat: string
  totalPrice: number
}

const inputClass = 'w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
const selectClass = 'w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white appearance-none cursor-pointer'
const labelClass = 'flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-2'

export default function HitungCetakanPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
      <HitungCetakanPage />
    </Suspense>
  )
}

function HitungCetakanPage() {
  const searchParams = useSearchParams()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [papers, setPapers] = useState<Paper[]>([])
  const [printingCosts, setPrintingCosts] = useState<PrintingCost[]>([])
  const [finishings, setFinishings] = useState<Finishing[]>([])
  const [calculations, setCalculations] = useState<PrintCalculation[]>([])

  // State for multiple finishings
  const [selectedFinishings, setSelectedFinishings] = useState<string[]>([])

  const [formData, setFormData] = useState({
    printName: '',
    paperLength: '',
    paperWidth: '',
    cutWidth: '',
    cutHeight: '',
    quantity: '',
    warna: '',
    warnaKhusus: '',
    hargaPlat: '',
    paperId: '',
    machineId: '',
    packingCost: '',
    shippingCost: '',
    pricePerSheet: ''
  })

  const [totalPaperPrice, setTotalPaperPrice] = useState<number>(0)
  const [calculatedPrintingCost, setCalculatedPrintingCost] = useState<number>(0)
  const [calculatedCost, setCalculatedCost] = useState<number>(0)
  const [isFinishingMin, setIsFinishingMin] = useState<boolean>(false)
  const [calculatedFinishingCost, setCalculatedFinishingCost] = useState<number>(0)
  const [calculatedPaperCost, setCalculatedPaperCost] = useState<number>(0)
  const [prefilled, setPrefilled] = useState(false)
  const [profitPercent, setProfitPercent] = useState<number>(0)

  // Add a finishing to the list
  const handleAddFinishing = (finishingId: string) => {
    if (finishingId && !selectedFinishings.includes(finishingId)) {
      setSelectedFinishings([...selectedFinishings, finishingId])
      toast.success('Finishing berhasil ditambahkan')
    } else if (selectedFinishings.includes(finishingId)) {
      toast.error('Finishing ini sudah ditambahkan')
    }
  }

  // Remove a finishing from the list
  const handleRemoveFinishing = (finishingId: string) => {
    setSelectedFinishings(selectedFinishings.filter(id => id !== finishingId))
    toast.success('Finishing berhasil dihapus')
  }

  // Calculate individual finishing cost
  // Formula: ((jumlah cetakan - minim lembar) × harga lebih) + ((ukuran potongan × harga/cm) × jumlah cetakan)
  // Jika total ≤ harga minimum, hitung harga minimum saja
  const getFinishingCost = (finishing: Finishing): { cost: number; isMin: boolean; breakdown: string } => {
    const qty = parseInt(formData.quantity) || 0
    const cw = parseFloat(formData.cutWidth) || 0
    const ch = parseFloat(formData.cutHeight) || 0

    const minSheets = finishing.minimumSheets
    const minPrice = finishing.minimumPrice
    const hargaLebih = finishing.additionalPrice
    const hargaPerCm = finishing.pricePerCm

    // Jika belum ada qty, pakai harga minimum
    if (qty <= 0) {
      return { cost: minPrice, isMin: true, breakdown: `Harga minimum: Rp ${minPrice.toLocaleString('id-ID')}` }
    }

    // Part 1: (jumlah cetakan - minim lembar) × harga lebih
    let part1 = 0
    let part1Text = ''
    if (qty > minSheets && hargaLebih > 0) {
      const selisih = qty - minSheets
      part1 = selisih * hargaLebih
      part1Text = `(${qty} - ${minSheets}) × Rp ${hargaLebih.toLocaleString('id-ID')} = Rp ${part1.toLocaleString('id-ID')}`
    }

    // Part 2: (ukuran potongan × harga/cm) × jumlah cetakan
    let part2 = 0
    let part2Text = ''
    if (cw > 0 && ch > 0 && hargaPerCm > 0) {
      const areaCost = cw * ch * hargaPerCm
      part2 = areaCost * qty
      part2Text = `(${cw} × ${ch}) × Rp ${hargaPerCm.toLocaleString('id-ID')} × ${qty} = Rp ${part2.toLocaleString('id-ID')}`
    }

    const total = part1 + part2

    // Jika total ≤ harga minimum, hitung harga minimum
    if (total <= minPrice) {
      const parts = [part1Text, part2Text].filter(Boolean)
      const calcText = parts.length > 0 ? `${parts.join(' + ')} = Rp ${total.toLocaleString('id-ID')} ≤ Rp ${minPrice.toLocaleString('id-ID')}` : ''
      return {
        cost: minPrice,
        isMin: true,
        breakdown: calcText ? `${calcText} → Harga minimum: Rp ${minPrice.toLocaleString('id-ID')}` : `Harga minimum: Rp ${minPrice.toLocaleString('id-ID')}`
      }
    }

    // Build breakdown
    const parts = [part1Text, part2Text].filter(Boolean)
    const breakdown = parts.join(' + ') + ` = Rp ${total.toLocaleString('id-ID')}`

    return { cost: total, isMin: false, breakdown }
  }

  // Pre-fill form from Potong Kertas search params
  useEffect(() => {
    const printName = searchParams.get('printName')
    const paperLength = searchParams.get('paperLength')
    const paperWidthParam = searchParams.get('paperWidth')
    const cutWidthParam = searchParams.get('cutWidth')
    const cutHeightParam = searchParams.get('cutHeight')
    const quantityParam = searchParams.get('quantity')
    const paperId = searchParams.get('paperId')
    const pricePerSheet = searchParams.get('pricePerSheet')
    const totalPaperPriceParam = searchParams.get('totalPaperPrice')

    if (totalPaperPriceParam) {
      setTotalPaperPrice(parseFloat(totalPaperPriceParam) || 0)
    }

    if (printName || paperLength || quantityParam || paperId) {
      setFormData(prev => ({
        ...prev,
        printName: printName || prev.printName,
        paperLength: paperLength || prev.paperLength,
        paperWidth: paperWidthParam || prev.paperWidth,
        cutWidth: cutWidthParam || prev.cutWidth,
        cutHeight: cutHeightParam || prev.cutHeight,
        quantity: quantityParam || prev.quantity,
        paperId: paperId || prev.paperId,
        pricePerSheet: pricePerSheet || prev.pricePerSheet,
      }))
      setPrefilled(true)
    }
  }, [searchParams])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      const data = await response.json()
      if (Array.isArray(data)) setCustomers(data)
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchPapers = async () => {
    try {
      const response = await fetch('/api/papers')
      const data = await response.json()
      if (Array.isArray(data)) setPapers(data)
    } catch (error) {
      console.error('Error fetching papers:', error)
    }
  }

  const fetchPrintingCosts = async () => {
    try {
      const response = await fetch('/api/printing-costs')
      const data = await response.json()
      if (Array.isArray(data)) setPrintingCosts(data)
    } catch (error) {
      console.error('Error fetching printing costs:', error)
    }
  }

  const fetchFinishings = async () => {
    try {
      const response = await fetch('/api/finishings')
      const data = await response.json()
      if (Array.isArray(data)) setFinishings(data)
    } catch (error) {
      console.error('Error fetching finishings:', error)
    }
  }

  useEffect(() => {
    fetchCustomers()
    fetchPapers()
    fetchPrintingCosts()
    fetchFinishings()
    // Fetch profit setting
    fetch('/api/settings?key=profit')
      .then(res => res.json())
      .then(data => {
        if (data.value) setProfitPercent(parseFloat(data.value) || 0)
      })
      .catch(() => {})
  }, [])

  const selectedPaper = papers.find(p => p.id === formData.paperId)
  const selectedMachine = printingCosts.find(m => m.id === formData.machineId)
  // Get all selected finishing objects
  const selectedFinishingItems = selectedFinishings.map(id => finishings.find(f => f.id === id)).filter(Boolean) as Finishing[]

  // Auto-fill harga plat when machine changes
  useEffect(() => {
    if (selectedMachine && !formData.hargaPlat) {
      setFormData(prev => ({ ...prev, hargaPlat: selectedMachine.platePricePerSheet?.toString() || '' }))
    }
  }, [selectedMachine])

  // Auto-fill pricePerSheet from selected paper
  useEffect(() => {
    if (selectedPaper && !formData.pricePerSheet) {
      setFormData(prev => ({ ...prev, pricePerSheet: (selectedPaper.pricePerRim / 500).toFixed(2) }))
    }
  }, [selectedPaper])

  // Total Ongkos Cetak:
  // (harga/warna x berapa warna) + (harga warna khusus x berapa warna khusus)
  // + ((jumlah cetakan - minim cetak) x lebih cetak)
  // + harga plat x (berapa warna + berapa warna khusus)
  // Jika jumlah <= minimum cetak, hitung harga minimum saja
  useEffect(() => {
    const qty = parseInt(formData.quantity) || 0
    const warna = parseInt(formData.warna) || 0
    const warnaKhusus = parseInt(formData.warnaKhusus) || 0
    const hargaPlat = parseFloat(formData.hargaPlat) || 0

    // --- Ongkos Cetak ---
    if (selectedMachine && qty > 0 && warna > 0) {
      const minimum = selectedMachine.minimumPrintQuantity
      let ongkos = 0

      // (harga/warna x berapa warna) + (harga warna khusus x berapa warna khusus)
      ongkos += (selectedMachine.pricePerColor * warna) + (selectedMachine.specialColorPrice * warnaKhusus)

      // + ((jumlah cetakan - minim cetak) x lebih cetak) -- hanya jika qty > minimum
      if (qty > minimum) {
        ongkos += (qty - minimum) * selectedMachine.priceAboveMinimumPerSheet
      }

      // + harga plat x (berapa warna + berapa warna khusus)
      ongkos += hargaPlat * (warna + warnaKhusus)

      setCalculatedPrintingCost(ongkos)
    } else {
      setCalculatedPrintingCost(0)
    }

    // --- Finishing cost: sum of all selected finishings
    // Langsung tampilkan harga minimum ketika finishing ditambahkan
    if (selectedFinishingItems.length > 0) {
      let totalFinCost = 0
      let anyMin = false
      selectedFinishingItems.forEach(fin => {
        const result = getFinishingCost(fin)
        totalFinCost += result.cost
        if (result.isMin) anyMin = true
      })
      setCalculatedFinishingCost(totalFinCost)
      setIsFinishingMin(anyMin)
    } else {
      setCalculatedFinishingCost(0)
      setIsFinishingMin(false)
    }

    // --- Total = Ongkos + Finishing ---
    setCalculatedCost(calculatedPrintingCost + calculatedFinishingCost)
  }, [selectedMachine, selectedFinishingItems, formData.quantity, formData.warna, formData.warnaKhusus, formData.hargaPlat, formData.cutWidth, formData.cutHeight, calculatedPrintingCost, calculatedFinishingCost])


  const handlePrint = (calc: PrintCalculation) => {
    const printWindow = window.open('', '', 'height=800,width=800')
    if (!printWindow) {
      toast.error('Gagal membuka jendela print')
      return
    }

    printWindow.document.write('<html><head><title>Detail Cetakan</title>')
    printWindow.document.write(`
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { text-align: center; margin-bottom: 20px; }
        .info-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .info-table th, .info-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        .info-table th { background-color: #f0f0f0; width: 40%; }
        .total { margin-top: 20px; font-size: 18px; font-weight: bold; text-align: right; }
      </style>
    `)
    printWindow.document.write('</head><body>')

    printWindow.document.write(`<h1>Detail Cetakan: ${calc.printName}</h1>`)
    printWindow.document.write('<table class="info-table">')
    printWindow.document.write(`<tr><th>Ukuran Bahan</th><td>${calc.paperLength} x ${calc.paperWidth} cm</td></tr>`)
    printWindow.document.write(`<tr><th>Jumlah Cetakan</th><td>${calc.quantity} lembar</td></tr>`)
    printWindow.document.write(`<tr><th>Nama Bahan</th><td>${calc.paperName}</td></tr>`)
    printWindow.document.write(`<tr><th>Nama Mesin</th><td>${calc.machineName}</td></tr>`)
    printWindow.document.write(`<tr><th>Warna</th><td>${calc.warna} warna${calc.warnaKhusus && parseInt(calc.warnaKhusus) > 0 ? ` + ${calc.warnaKhusus} khusus` : ''}</td></tr>`)
    printWindow.document.write(`<tr><th>Ongkos Cetak</th><td>Rp ${calc.printingCost.toLocaleString('id-ID')}</td></tr>`)
    if (calc.finishingName) {
      printWindow.document.write(`<tr><th>Finishing</th><td>${calc.finishingName}</td></tr>`)
    }
    if (calc.packingCost) {
      printWindow.document.write(`<tr><th>Ongkos Packing</th><td>Rp ${parseInt(calc.packingCost).toLocaleString('id-ID')}</td></tr>`)
    }
    if (calc.shippingCost) {
      printWindow.document.write(`<tr><th>Ongkos Kirim</th><td>Rp ${parseInt(calc.shippingCost).toLocaleString('id-ID')}</td></tr>`)
    }
    if (calc.pricePerSheet) {
      printWindow.document.write(`<tr><th>Harga per Lembar</th><td>Rp ${parseInt(calc.pricePerSheet).toLocaleString('id-ID')}</td></tr>`)
    }
    printWindow.document.write('</table>')
    printWindow.document.write(`<div class="total">Total Harga: Rp ${calc.totalPrice.toLocaleString('id-ID')}</div>`)
    printWindow.document.write('</body></html>')
    printWindow.document.close()

    setTimeout(() => {
      printWindow.print()
    }, 250)

    toast.success('Mencetak detail cetakan...')
  }

  const handleAddCalculation = () => {
    if (!formData.printName || !formData.quantity || !formData.paperId || !formData.machineId) {
      toast.error('Mohon lengkapi data wajib (Nama Cetakan, Jumlah, Bahan, dan Mesin)')
      return
    }

    const packing = parseFloat(formData.packingCost) || 0
    const shipping = parseFloat(formData.shippingCost) || 0
    const priceSheet = parseFloat(formData.pricePerSheet) || 0
    const qty = parseInt(formData.quantity) || 0

    const totalCost = calculatedCost + packing + shipping + (priceSheet * qty)

    const newCalculation: PrintCalculation = {
      id: Date.now().toString(),
      printName: formData.printName,
      paperLength: formData.paperLength,
      paperWidth: formData.paperWidth,
      quantity: formData.quantity,
      warna: formData.warna,
      warnaKhusus: formData.warnaKhusus,
      hargaPlat: formData.hargaPlat,
      paperId: formData.paperId,
      paperName: selectedPaper?.name || '',
      machineId: formData.machineId,
      machineName: selectedMachine?.machineName || '',
      printingCost: calculatedCost,
      finishingId: selectedFinishings.join(','),
      finishingName: selectedFinishingItems.map(f => f.name).join(', '),
      packingCost: formData.packingCost,
      shippingCost: formData.shippingCost,
      pricePerSheet: formData.pricePerSheet,
      totalPrice: totalCost
    }

    setCalculations([...calculations, newCalculation])
    toast.success('Cetakan berhasil ditambahkan ke daftar')

    setFormData({
      printName: '',
      paperLength: '',
      paperWidth: '',
      cutWidth: '',
      cutHeight: '',
      quantity: '',
      warna: '',
      warnaKhusus: '',
      hargaPlat: '',
      paperId: '',
      machineId: '',
      packingCost: '',
      shippingCost: '',
      pricePerSheet: ''
    })
    setSelectedFinishings([])
    setCalculatedCost(0)
  }

  const handleDeleteCalculation = (id: string) => {
    setCalculations(calculations.filter(c => c.id !== id))
    toast.success('Cetakan berhasil dihapus dari daftar')
  }

  const resetForm = () => {
    setFormData({
      printName: '',
      paperLength: '',
      paperWidth: '',
      cutWidth: '',
      cutHeight: '',
      quantity: '',
      warna: '',
      warnaKhusus: '',
      hargaPlat: '',
      paperId: '',
      machineId: '',
      packingCost: '',
      shippingCost: '',
      pricePerSheet: ''
    })
    setSelectedFinishings([])
    setCalculatedCost(0)
  }

  return (
    <DashboardLayout
      title="Hitung Cetakan"
      subtitle="Kalkulator estimasi harga cetakan"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Form Input */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Section 1: Informasi Cetakan */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-base font-semibold text-slate-800">Informasi Cetakan</h2>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nama cetakan */}
              <div>
                <label className={labelClass}>
                  Nama Cetakan <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.printName}
                  onChange={(e) => setFormData({ ...formData, printName: e.target.value })}
                  className={selectClass}
                >
                  <option value="">Pilih nama customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.name}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Jumlah cetakan */}
              <div>
                <label className={labelClass}>
                  Jumlah Cetakan <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="Contoh: 1000"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Harga Bahan */}
          <div className="p-5 border-t border-slate-200 bg-slate-50/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-teal-600" />
              </div>
              <h2 className="text-base font-semibold text-slate-800">Harga Bahan</h2>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Nama Bahan */}
              <div>
                <label className={labelClass}>
                  Nama Bahan <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.paperId}
                  onChange={(e) => setFormData({ ...formData, paperId: e.target.value })}
                  className={selectClass}
                >
                  <option value="">Pilih bahan kertas</option>
                  {papers.map((paper) => (
                    <option key={paper.id} value={paper.id}>
                      {paper.name} ({paper.grammage} gsm)
                    </option>
                  ))}
                </select>
                {selectedPaper && (
                  <p className="text-xs text-teal-600 mt-1">Rp {selectedPaper.pricePerRim.toLocaleString('id-ID')}/rim (500 lbr)</p>
                )}
              </div>

              {/* Ukuran Bahan (P x L cm) */}
              <div>
                <label className={labelClass}>Ukuran Bahan (P × L cm)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Panjang"
                    value={formData.paperLength}
                    onChange={(e) => setFormData({ ...formData, paperLength: e.target.value })}
                    className={inputClass}
                  />
                  <span className="flex items-center text-slate-400 font-medium">×</span>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Lebar"
                    value={formData.paperWidth}
                    onChange={(e) => setFormData({ ...formData, paperWidth: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Ukuran Potongan */}
              <div>
                <label className={labelClass}>Ukuran Potongan (P × L cm)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Panjang"
                    value={formData.cutWidth}
                    onChange={(e) => setFormData({ ...formData, cutWidth: e.target.value })}
                    className={inputClass}
                  />
                  <span className="flex items-center text-slate-400 font-medium">×</span>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Lebar"
                    value={formData.cutHeight}
                    onChange={(e) => setFormData({ ...formData, cutHeight: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Total Harga Kertas dari Potong Kertas */}
              <div>
                <label className={labelClass}>Total Harga Kertas</label>
                <div className="w-full h-[42px] flex items-center justify-between px-3 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-lg">
                  <span className="text-xs text-teal-600 font-medium">Kertas</span>
                  <span className="text-sm font-bold text-teal-700">
                    {totalPaperPrice > 0 ? `Rp ${totalPaperPrice.toLocaleString('id-ID')}` : 'Rp 0'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Ongkos Cetak */}
          <div className="p-5 border-t border-slate-200 bg-slate-50/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Calculator className="w-4 h-4 text-purple-600" />
              </div>
              <h2 className="text-base font-semibold text-slate-800">Ongkos Cetak</h2>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Nama Mesin */}
              <div>
                <label className={labelClass}>
                  Nama Mesin <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.machineId}
                  onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
                  className={selectClass}
                >
                  <option value="">Pilih mesin cetak</option>
                  {printingCosts.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.machineName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Berapa Warna */}
              <div>
                <label className={labelClass}>
                  Berapa Warna <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Palette className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    min="1"
                    placeholder="Contoh: 4"
                    value={formData.warna}
                    onChange={(e) => setFormData({ ...formData, warna: e.target.value })}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              {/* Warna Khusus */}
              <div>
                <label className={labelClass}>Berapa Warna Khusus</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-500">★</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.warnaKhusus}
                    onChange={(e) => setFormData({ ...formData, warnaKhusus: e.target.value })}
                    className={`${inputClass} pl-10`}
                  />
                </div>
                {selectedMachine && (
                  <p className="text-xs text-amber-600 mt-1">Rp {selectedMachine.specialColorPrice.toLocaleString('id-ID')}/warna</p>
                )}
              </div>

              {/* Harga Plat */}
              <div>
                <label className={labelClass}>Harga Plat</label>
                <div className="w-full h-[42px] flex items-center justify-between px-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <span className="text-xs text-blue-600 font-medium">Plat</span>
                  <span className="text-sm font-bold text-blue-700">
                    {(() => {
                      const warna = parseInt(formData.warna) || 0
                      const wk = parseInt(formData.warnaKhusus) || 0
                      const plat = selectedMachine?.platePricePerSheet || 0
                      const total = plat * (warna + wk)
                      return total > 0 ? `Rp ${total.toLocaleString('id-ID')}` : 'Rp 0'
                    })()}
                  </span>
                </div>
                {(parseInt(formData.warna) > 0 || parseInt(formData.warnaKhusus) > 0) && selectedMachine && (
                  <p className="text-xs text-blue-600 mt-1">Rp {selectedMachine.platePricePerSheet.toLocaleString('id-ID')} × ({formData.warna || 0} + {formData.warnaKhusus || '0'}) warna</p>
                )}
              </div>

              {/* Ongkos Cetak (display only) */}
              <div>
                <label className={labelClass}>Total Ongkos Cetak</label>
                <div className="w-full h-[42px] flex items-center justify-between px-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <span className="text-xs text-blue-600 font-medium">Ongkos Cetak</span>
                  <span className="text-sm font-bold text-blue-700">
                    {calculatedPrintingCost > 0 ? `Rp ${calculatedPrintingCost.toLocaleString('id-ID')}` : 'Rp 0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Info bar for selected machine */}
            {selectedMachine && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span>Min. cetak: <strong className="text-slate-700">{selectedMachine.minimumPrintQuantity} lembar</strong></span>
                </div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>Harga/warna: <strong className="text-slate-700">Rp {selectedMachine.pricePerColor.toLocaleString('id-ID')}</strong></span>
                </div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Warna khusus: <strong className="text-slate-700">Rp {selectedMachine.specialColorPrice.toLocaleString('id-ID')}</strong></span>
                </div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>Harga lebih/lbr: <strong className="text-slate-700">Rp {selectedMachine.priceAboveMinimumPerSheet.toLocaleString('id-ID')}</strong></span>
                </div>
              </div>
            )}

            {/* Formula explanation */}
            {selectedMachine && formData.warna && formData.quantity && (
              <div className="mt-2 text-xs text-slate-500 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2">
                <span className="font-medium text-purple-700">Rumus:</span>{' '}
                (Rp {selectedMachine.pricePerColor.toLocaleString('id-ID')} × {formData.warna} warna)
                {formData.warnaKhusus && parseInt(formData.warnaKhusus) > 0 && (
                  <> + (Rp {selectedMachine.specialColorPrice.toLocaleString('id-ID')} × {formData.warnaKhusus} warna khusus)</>
                )}
                {parseInt(formData.quantity) > selectedMachine.minimumPrintQuantity && (
                  <> + ({parseInt(formData.quantity)} - {selectedMachine.minimumPrintQuantity}) × Rp {selectedMachine.priceAboveMinimumPerSheet.toLocaleString('id-ID')}</>
                )}
              </div>
            )}
          </div>

          {/* Section 4: Finishing */}
          <div className="p-5 border-t border-slate-200 bg-slate-50/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-rose-600" />
                </div>
                <h2 className="text-base font-semibold text-slate-800">Finishing</h2>
                {selectedFinishingItems.length > 0 && (
                  <span className="text-xs font-medium text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">{selectedFinishingItems.length} item</span>
                )}
              </div>
            </div>
          </div>
          <div className="p-5">
            {/* Dropdown + Tambah Finishing button */}
            <div className="flex gap-2">
              <div className="flex-1">
                <select
                  id="finishing-select"
                  className={selectClass}
                  defaultValue=""
                >
                  <option value="">-- Pilih jenis finishing --</option>
                  {finishings
                    .filter(fin => !selectedFinishings.includes(fin.id))
                    .map((fin) => (
                      <option key={fin.id} value={fin.id}>
                        {fin.name} (Min. {fin.minimumSheets} lbr)
                      </option>
                    ))}
                </select>
              </div>
              <Button
                onClick={() => {
                  const select = document.getElementById('finishing-select') as HTMLSelectElement
                  if (select && select.value) {
                    handleAddFinishing(select.value)
                    select.value = ''
                  } else {
                    toast.error('Pilih finishing terlebih dahulu')
                  }
                }}
                className="h-[42px] px-4 bg-rose-600 hover:bg-rose-700 text-white"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Tambah Finishing
              </Button>
            </div>

            {/* List of added finishings */}
            {selectedFinishingItems.length > 0 && (
              <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                {selectedFinishingItems.map((fin) => {
                  const { cost, isMin, breakdown } = getFinishingCost(fin)
                  return (
                    <div key={fin.id} className="p-3 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                          <Layers className="w-4 h-4 text-rose-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{fin.name}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                            <span className="text-xs text-slate-500">Min. {fin.minimumSheets} lbr</span>
                            <span className="text-xs text-slate-300">|</span>
                            <span className="text-xs text-slate-500">Harga min: Rp {fin.minimumPrice.toLocaleString('id-ID')}</span>
                            {fin.additionalPrice > 0 && (
                              <>
                                <span className="text-xs text-slate-300">|</span>
                                <span className="text-xs text-slate-500">Rp {fin.additionalPrice.toLocaleString('id-ID')}/lebih</span>
                              </>
                            )}
                            {fin.pricePerCm > 0 && (
                              <>
                                <span className="text-xs text-slate-300">|</span>
                                <span className="text-xs text-slate-500">Rp {fin.pricePerCm.toLocaleString('id-ID')}/cm</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-rose-700 flex-shrink-0">
                          Rp {cost.toLocaleString('id-ID')}
                        </span>
                        <button
                          onClick={() => handleRemoveFinishing(fin.id)}
                          className="w-7 h-7 rounded-lg bg-white border border-rose-200 hover:bg-rose-100 flex items-center justify-center flex-shrink-0 transition-colors"
                          title="Hapus finishing"
                        >
                          <X className="w-3.5 h-3.5 text-rose-500" />
                        </button>
                      </div>
                      {/* Perincian perhitungan */}
                      <div className="mt-2 text-xs text-slate-500 bg-white/70 border border-rose-100 rounded-lg px-3 py-2">
                        <span className="font-medium text-rose-700">Perincian:</span>{' '}
                        {breakdown}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Total Finishing Cost */}
            <div className="mt-4">
              <label className={labelClass}>Total Harga Finishing</label>
              <div className="w-full h-[42px] flex items-center justify-between px-3 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-lg">
                <span className="text-xs text-rose-600 font-medium">Finishing ({selectedFinishingItems.length} item)</span>
                <span className="text-sm font-bold text-rose-700">
                  {calculatedFinishingCost > 0 ? `Rp ${calculatedFinishingCost.toLocaleString('id-ID')}` : 'Rp 0'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Biaya Tambahan */}
          <div className="p-5 border-t border-slate-200 bg-slate-50/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Banknote className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="text-base font-semibold text-slate-800">Biaya Tambahan</h2>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Ongkos packing */}
              <div>
                <label className={labelClass}>Ongkos Packing</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">Rp</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.packingCost}
                    onChange={(e) => setFormData({ ...formData, packingCost: e.target.value })}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              {/* Ongkos kirim */}
              <div>
                <label className={labelClass}>Ongkos Kirim</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">Rp</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.shippingCost}
                    onChange={(e) => setFormData({ ...formData, shippingCost: e.target.value })}
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Summary Section */}
          {(() => {
            const packing = parseFloat(formData.packingCost) || 0
            const shipping = parseFloat(formData.shippingCost) || 0
            const subTotal = totalPaperPrice + calculatedPrintingCost + calculatedFinishingCost + packing + shipping
            const profitAmount = subTotal * (profitPercent / 100)
            const grandTotal = subTotal + profitAmount
            return (
              <div className="mx-5 mb-5 space-y-3">
                {/* Sub Total Hitung Cetakan */}
                <div className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-600 flex items-center justify-center shadow-sm">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Sub Total Hitung Cetakan</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Kertas Rp {totalPaperPrice.toLocaleString('id-ID')}
                          {calculatedPrintingCost > 0 && ` + Ongkos Rp ${calculatedPrintingCost.toLocaleString('id-ID')}`}
                          {calculatedFinishingCost > 0 && ` + Finishing Rp ${calculatedFinishingCost.toLocaleString('id-ID')}`}
                          {packing > 0 && ` + Packing Rp ${packing.toLocaleString('id-ID')}`}
                          {shipping > 0 && ` + Kirim Rp ${shipping.toLocaleString('id-ID')}`}
                        </p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-slate-700">
                      Rp {subTotal.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Profit */}
                <div className="p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800">Profit ({profitPercent}%)</span>
                    </div>
                    <p className="text-sm font-bold text-amber-700">
                      Rp {profitAmount.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Total Hitung Cetakan */}
                <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-sm">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <Calculator className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">Total Hitung Cetakan</p>
                        <p className="text-xs text-emerald-100 mt-0.5">
                          Sub Total + Profit {profitPercent}%
                        </p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      Rp {grandTotal.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Buttons */}
          <div className="px-5 pb-5 flex flex-col sm:flex-row gap-3">
            <Button
              onClick={async () => {
                const packing = parseFloat(formData.packingCost) || 0
                const shipping = parseFloat(formData.shippingCost) || 0
                const subTotal = totalPaperPrice + calculatedPrintingCost + calculatedFinishingCost + packing + shipping
                const profitAmount = subTotal * (profitPercent / 100)
                const grandTotal = subTotal + profitAmount

                const payload = {
                  printName: formData.printName,
                  paperName: selectedPaper?.name || '',
                  paperGrammage: selectedPaper?.grammage?.toString() || '0',
                  paperLength: formData.paperLength,
                  paperWidth: formData.paperWidth,
                  cutWidth: formData.cutWidth,
                  cutHeight: formData.cutHeight,
                  quantity: formData.quantity,
                  warna: formData.warna,
                  warnaKhusus: formData.warnaKhusus,
                  machineName: selectedMachine?.machineName || '',
                  hargaPlat: parseFloat(formData.hargaPlat) || 0,
                  ongkosCetak: calculatedPrintingCost,
                  ongkosCetakDetail: selectedMachine ? `(Rp ${selectedMachine.pricePerColor.toLocaleString('id-ID')} × ${formData.warna || 0} warna)${parseInt(formData.warnaKhusus || '0') > 0 ? ` + (Rp ${selectedMachine.specialColorPrice.toLocaleString('id-ID')} × ${formData.warnaKhusus} khusus)` : ''}${parseInt(formData.quantity) > selectedMachine.minimumPrintQuantity ? ` + (${formData.quantity} - ${selectedMachine.minimumPrintQuantity}) × Rp ${selectedMachine.priceAboveMinimumPerSheet.toLocaleString('id-ID')}` : ''} + Rp ${selectedMachine.platePricePerSheet.toLocaleString('id-ID')} × ${parseInt(formData.warna || '0') + parseInt(formData.warnaKhusus || '0')} plat` : '',
                  totalPaperPrice,
                  finishingNames: selectedFinishingItems.map(f => f.name).join(', '),
                  finishingBreakdown: selectedFinishingItems.map(f => {
                    const r = getFinishingCost(f)
                    return `${f.name}: ${r.breakdown} = Rp ${r.cost.toLocaleString('id-ID')}`
                  }).join(' | '),
                  finishingCost: calculatedFinishingCost,
                  packingCost: packing,
                  shippingCost: shipping,
                  subTotal,
                  profitPercent,
                  profitAmount,
                  grandTotal
                }

                try {
                  const res = await fetch('/api/riwayat-cetakan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  })
                  if (res.ok) {
                    toast.success('Riwayat hitung cetakan berhasil disimpan!')
                  } else {
                    toast.error('Gagal menyimpan riwayat')
                  }
                } catch {
                  toast.error('Gagal menyimpan riwayat')
                }
              }}
              className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Simpan Riwayat
            </Button>
            <Button
              onClick={handleAddCalculation}
              className="flex-1 h-11"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Cetakan
            </Button>
            <Button
              onClick={resetForm}
              variant="outline"
              className="flex-1 h-11"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset Form
            </Button>
          </div>
        </div>

        {/* Daftar Cetakan */}
        {calculations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-emerald-600" />
                  </div>
                  <h2 className="text-base font-semibold text-slate-800">Daftar Cetakan</h2>
                </div>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  {calculations.length} item
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {calculations.map((calc) => (
                <div key={calc.id} className="p-5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 mb-2 truncate">{calc.printName}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                        <div className="flex items-center gap-2">
                          <Ruler className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="text-slate-500">Ukuran:</span>
                          <span className="font-medium text-slate-700">{calc.paperLength} × {calc.paperWidth} cm</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="text-slate-500">Jumlah:</span>
                          <span className="font-medium text-slate-700">{parseInt(calc.quantity).toLocaleString('id-ID')} lembar</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="text-slate-500">Bahan:</span>
                          <span className="font-medium text-slate-700 truncate">{calc.paperName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Cog className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="text-slate-500">Mesin:</span>
                          <span className="font-medium text-slate-700">{calc.machineName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Palette className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="text-slate-500">Warna:</span>
                          <span className="font-medium text-slate-700">{calc.warna} warna</span>
                          {calc.warnaKhusus && parseInt(calc.warnaKhusus) > 0 && (
                            <span className="text-amber-600">+ {calc.warnaKhusus} khusus</span>
                          )}
                        </div>
                        {calc.finishingName && (
                          <div className="flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="text-slate-500">Finishing:</span>
                            <span className="font-medium text-slate-700">{calc.finishingName}</span>
                          </div>
                        )}
                        {calc.packingCost && (
                          <div className="flex items-center gap-2">
                            <Package className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="text-slate-500">Packing:</span>
                            <span className="font-medium text-slate-700">Rp {parseInt(calc.packingCost).toLocaleString('id-ID')}</span>
                          </div>
                        )}
                        {calc.shippingCost && (
                          <div className="flex items-center gap-2">
                            <Truck className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="text-slate-500">Kirim:</span>
                            <span className="font-medium text-slate-700">Rp {parseInt(calc.shippingCost).toLocaleString('id-ID')}</span>
                          </div>
                        )}
                        {calc.pricePerSheet && (
                          <div className="flex items-center gap-2">
                            <Banknote className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="text-slate-500">Harga/Lbr:</span>
                            <span className="font-medium text-slate-700">Rp {parseInt(calc.pricePerSheet).toLocaleString('id-ID')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                      <p className="text-lg font-bold text-emerald-600 whitespace-nowrap">
                        Rp {calc.totalPrice.toLocaleString('id-ID')}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handlePrint(calc)}
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                        >
                          <Printer className="w-3.5 h-3.5 mr-1" />
                          Cetak
                        </Button>
                        <Button
                          onClick={() => handleDeleteCalculation(calc.id)}
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Hapus
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total semua */}
            <div className="p-5 border-t border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm">
                    <Banknote className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-900">Total Semua Harga</p>
                    <p className="text-xs text-emerald-600 mt-0.5">{calculations.length} item cetakan</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-emerald-700">
                  Rp {calculations.reduce((sum, calc) => sum + calc.totalPrice, 0).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

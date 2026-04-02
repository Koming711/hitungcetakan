'use client'

// Fixed redirect loop and SVG rendering - Mar 29 15:30

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calculator, Save, RotateCcw } from 'lucide-react'
import { getAuthUser } from '@/lib/auth'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Customer {
  id: string
  name: string
  address: string
  phone: string
  email: string
}

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

interface Block {
  name: string
  x: number
  y: number
  width: number
  height: number
  horizontal: number
  vertical: number
  pieces: number
  pieceWidth: number
  pieceHeight: number
  rotated: boolean
  usedWidth: number
  usedHeight: number
  wasteWidth: number
  wasteHeight: number
  children?: Block[]
}

interface CuttingResult {
  totalPieces: number
  quantity: number
  sheetsNeeded: number
  totalPrice: number
  pricePerSheet: number
  cutPosition?: number
  cutPositionY?: number
  blocks: Block[]
  paperWidth: number
  paperHeight: number
  cutWidth: number
  cutHeight: number
  customerName: string
  paperMaterial: string
  grammage: number
  scenarioType: string
  totalWasteArea: number
  efficiency: number
  steps: string[]
  strategy: string
}

interface Scenario {
  strategy: string
  type: string
  cutPosition?: number
  cutPositionY?: number
  blocks: Block[]
  total: number
  steps: string[]
}

// Calculator Page Component
function CalculatorPage() {
  const [paperWidth, setPaperWidth] = useState('')
  const [paperHeight, setPaperHeight] = useState('')
  const [cutWidth, setCutWidth] = useState('')
  const [cutHeight, setCutHeight] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedPaperId, setSelectedPaperId] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [papers, setPapers] = useState<Paper[]>([])
  const [grammage, setGrammage] = useState('')
  const [pricePerSheet, setPricePerSheet] = useState('')
  const [quantity, setQuantity] = useState('')
  const [isCustomPaper, setIsCustomPaper] = useState(false)
  const [results, setResults] = useState<CuttingResult | null>(null)
  const [optimizationMode, setOptimizationMode] = useState<'fast' | 'maximal'>('maximal')
  const [isCalculating, setIsCalculating] = useState(false)

  // Restore state dari sessionStorage saat kembali dari halaman lain
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('potong_kertas_state')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.paperWidth) setPaperWidth(parsed.paperWidth)
        if (parsed.paperHeight) setPaperHeight(parsed.paperHeight)
        if (parsed.cutWidth) setCutWidth(parsed.cutWidth)
        if (parsed.cutHeight) setCutHeight(parsed.cutHeight)
        if (parsed.selectedCustomerId) setSelectedCustomerId(parsed.selectedCustomerId)
        if (parsed.selectedPaperId) setSelectedPaperId(parsed.selectedPaperId)
        if (parsed.grammage) setGrammage(parsed.grammage)
        if (parsed.pricePerSheet) setPricePerSheet(parsed.pricePerSheet)
        if (parsed.quantity) setQuantity(parsed.quantity)
        if (parsed.isCustomPaper) setIsCustomPaper(parsed.isCustomPaper)
        if (parsed.optimizationMode) setOptimizationMode(parsed.optimizationMode)
      }
      const savedResults = sessionStorage.getItem('potong_kertas_results')
      if (savedResults) {
        setResults(JSON.parse(savedResults))
      }
    } catch (e) {
      // ignore restore errors
    }
  }, [])

  useEffect(() => {
    fetch('/api/customers')
      .then(res => {
        if (!res.ok) {
          console.error('Error fetching customers:', res.status)
          return []
        }
        return res.json()
      })
      .then(data => {
        if (Array.isArray(data)) {
          setCustomers(data)
        } else {
          console.error('Invalid customers data:', data)
          setCustomers([])
        }
      })
      .catch(err => {
        console.error('Error fetching customers:', err)
        setCustomers([])
      })

    fetch('/api/papers')
      .then(res => {
        if (!res.ok) {
          console.error('Error fetching papers:', res.status)
          return []
        }
        return res.json()
      })
      .then(data => {
        if (Array.isArray(data)) {
          setPapers(data)
        } else {
          console.error('Invalid papers data:', data)
          setPapers([])
        }
      })
      .catch(err => {
        console.error('Error fetching papers:', err)
        setPapers([])
      })
  }, [])

  const selectedPaper = papers.find(p => p.id === selectedPaperId)
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId)

  useEffect(() => {
    if (selectedPaper) {
      setGrammage(selectedPaper.grammage.toString())
      setPricePerSheet((selectedPaper.pricePerRim / 500).toString())
      setPaperWidth(selectedPaper.width.toString())
      setPaperHeight(selectedPaper.height.toString())
      setIsCustomPaper(false)
    }
  }, [selectedPaper])

  const handlePaperChange = (value: string) => {
    if (value === 'custom') {
      setSelectedPaperId('custom')
      setIsCustomPaper(true)
      setPaperWidth('')
      setPaperHeight('')
      setGrammage('')
      setPricePerSheet('')
    } else {
      setSelectedPaperId(value)
      setIsCustomPaper(false)
    }
  }

  // Calculate pieces in a rectangle with optional rotation
  const calculatePiecesInRect = (
    rectWidth: number,
    rectHeight: number,
    pieceWidth: number,
    pieceHeight: number
  ) => {
    // Normal orientation
    const hNormal = Math.floor(rectWidth / pieceWidth)
    const vNormal = Math.floor(rectHeight / pieceHeight)
    const totalNormal = hNormal * vNormal

    // Rotated orientation
    const hRotated = Math.floor(rectWidth / pieceHeight)
    const vRotated = Math.floor(rectHeight / pieceWidth)
    const totalRotated = hRotated * vRotated

    if (totalRotated > totalNormal) {
      return { pieces: totalRotated, horizontal: hRotated, vertical: vRotated, rotated: true }
    }
    return { pieces: totalNormal, horizontal: hNormal, vertical: vNormal, rotated: false }
  }

  // Normal grid layout (no rotation)
  const normalGridLayout = (pw: number, ph: number, cw: number, ch: number): Scenario => {
    const { pieces, horizontal, vertical, rotated } = calculatePiecesInRect(pw, ph, cw, ch)
    
    return {
      strategy: 'Grid Normal',
      type: 'normal',
      blocks: [{
        name: 'Blok A',
        x: 0,
        y: 0,
        width: horizontal * (rotated ? ch : cw),
        height: vertical * (rotated ? cw : ch),
        horizontal,
        vertical,
        pieces,
        pieceWidth: rotated ? ch : cw,
        pieceHeight: rotated ? cw : ch,
        rotated,
        usedWidth: horizontal * (rotated ? ch : cw),
        usedHeight: vertical * (rotated ? cw : ch),
        wasteWidth: pw - (horizontal * (rotated ? ch : cw)),
        wasteHeight: ph - (vertical * (rotated ? cw : ch))
      }],
      total: pieces,
      steps: [`Langkah 1: Potong ${horizontal}×${vertical} grid ${rotated ? '(rotasi 90°)' : ''}`]
    }
  }

  // Guillotine cutting - single cut
  const guillotineSingleCut = (pw: number, ph: number, cw: number, ch: number): Scenario[] => {
    const scenarios: Scenario[] = []

    // Try all possible cut positions
    const step = optimizationMode === 'fast' ? 2 : 0.5
    const minSize = Math.max(cw, ch)

    // Vertical cuts
    for (let x = minSize; x <= pw - minSize; x += step) {
      const leftWidth = x
      const rightWidth = pw - x

      const leftResult = calculatePiecesInRect(leftWidth, ph, cw, ch)
      const rightResult = calculatePiecesInRect(rightWidth, ph, cw, ch)

      const total = leftResult.pieces + rightResult.pieces

      if (total > 0) {
        scenarios.push({
          strategy: `Guillotine Vertikal (potong di ${x.toFixed(1)}cm)`,
          type: 'block-cut',
          cutPosition: x,
          cutPositionY: undefined,
          blocks: [
            {
              name: 'Blok A',
              x: 0,
              y: 0,
              width: leftResult.horizontal * (leftResult.rotated ? ch : cw),
              height: leftResult.vertical * (leftResult.rotated ? cw : ch),
              horizontal: leftResult.horizontal,
              vertical: leftResult.vertical,
              pieces: leftResult.pieces,
              pieceWidth: leftResult.rotated ? ch : cw,
              pieceHeight: leftResult.rotated ? cw : ch,
              rotated: leftResult.rotated,
              usedWidth: leftResult.horizontal * (leftResult.rotated ? ch : cw),
              usedHeight: leftResult.vertical * (leftResult.rotated ? cw : ch),
              wasteWidth: leftWidth - (leftResult.horizontal * (leftResult.rotated ? ch : cw)),
              wasteHeight: ph - (leftResult.vertical * (leftResult.rotated ? cw : ch))
            },
            {
              name: 'Blok B',
              x: x,
              y: 0,
              width: rightResult.horizontal * (rightResult.rotated ? ch : cw),
              height: rightResult.vertical * (rightResult.rotated ? cw : ch),
              horizontal: rightResult.horizontal,
              vertical: rightResult.vertical,
              pieces: rightResult.pieces,
              pieceWidth: rightResult.rotated ? ch : cw,
              pieceHeight: rightResult.rotated ? cw : ch,
              rotated: rightResult.rotated,
              usedWidth: rightResult.horizontal * (rightResult.rotated ? ch : cw),
              usedHeight: rightResult.vertical * (rightResult.rotated ? cw : ch),
              wasteWidth: rightWidth - (rightResult.horizontal * (rightResult.rotated ? ch : cw)),
              wasteHeight: ph - (rightResult.vertical * (rightResult.rotated ? cw : ch))
            }
          ],
          total,
          steps: [
            `Langkah 1: Potong vertikal pada posisi ${x.toFixed(1)}cm dari kiri`,
            `Langkah 2: Bagian kiri (${leftWidth.toFixed(1)}×${ph}cm) → ${leftResult.pieces} potongan ${leftResult.rotated ? '(rotasi 90°)' : ''}`,
            `Langkah 3: Bagian kanan (${rightWidth.toFixed(1)}×${ph}cm) → ${rightResult.pieces} potongan ${rightResult.rotated ? '(rotasi 90°)' : ''}`
          ]
        })
      }
    }

    // Horizontal cuts
    for (let y = minSize; y <= ph - minSize; y += step) {
      const bottomHeight = y
      const topHeight = ph - y

      const bottomResult = calculatePiecesInRect(pw, bottomHeight, cw, ch)
      const topResult = calculatePiecesInRect(pw, topHeight, cw, ch)

      const total = bottomResult.pieces + topResult.pieces

      if (total > 0) {
        scenarios.push({
          strategy: `Guillotine Horizontal (potong di ${y.toFixed(1)}cm)`,
          type: 'block-cut',
          cutPosition: undefined,
          cutPositionY: y,
          blocks: [
            {
              name: 'Blok A',
              x: 0,
              y: 0,
              width: bottomResult.horizontal * (bottomResult.rotated ? ch : cw),
              height: bottomResult.vertical * (bottomResult.rotated ? cw : ch),
              horizontal: bottomResult.horizontal,
              vertical: bottomResult.vertical,
              pieces: bottomResult.pieces,
              pieceWidth: bottomResult.rotated ? ch : cw,
              pieceHeight: bottomResult.rotated ? cw : ch,
              rotated: bottomResult.rotated,
              usedWidth: bottomResult.horizontal * (bottomResult.rotated ? ch : cw),
              usedHeight: bottomResult.vertical * (bottomResult.rotated ? cw : ch),
              wasteWidth: pw - (bottomResult.horizontal * (bottomResult.rotated ? ch : cw)),
              wasteHeight: bottomHeight - (bottomResult.vertical * (bottomResult.rotated ? cw : ch))
            },
            {
              name: 'Blok B',
              x: 0,
              y: y,
              width: topResult.horizontal * (topResult.rotated ? ch : cw),
              height: topResult.vertical * (topResult.rotated ? cw : ch),
              horizontal: topResult.horizontal,
              vertical: topResult.vertical,
              pieces: topResult.pieces,
              pieceWidth: topResult.rotated ? ch : cw,
              pieceHeight: topResult.rotated ? cw : ch,
              rotated: topResult.rotated,
              usedWidth: topResult.horizontal * (topResult.rotated ? ch : cw),
              usedHeight: topResult.vertical * (topResult.rotated ? cw : ch),
              wasteWidth: pw - (topResult.horizontal * (topResult.rotated ? ch : cw)),
              wasteHeight: topHeight - (topResult.vertical * (topResult.rotated ? cw : ch))
            }
          ],
          total,
          steps: [
            `Langkah 1: Potong horizontal pada posisi ${y.toFixed(1)}cm dari bawah`,
            `Langkah 2: Bagian bawah (${pw}×${bottomHeight.toFixed(1)}cm) → ${bottomResult.pieces} potongan ${bottomResult.rotated ? '(rotasi 90°)' : ''}`,
            `Langkah 3: Bagian atas (${pw}×${topHeight.toFixed(1)}cm) → ${topResult.pieces} potongan ${topResult.rotated ? '(rotasi 90°)' : ''}`
          ]
        })
      }
    }

    return scenarios
  }

  // Two-stage guillotine cutting
  const twoStageGuillotine = (pw: number, ph: number, cw: number, ch: number): Scenario[] => {
    const scenarios: Scenario[] = []
    const step = optimizationMode === 'fast' ? 5 : 1
    const minSize = Math.max(cw, ch)

    // First cut vertical, then horizontal on main section
    for (let x = minSize; x <= pw - minSize; x += step) {
      const leftWidth = x
      const rightWidth = pw - x
      const mainWidth = Math.max(leftWidth, rightWidth)
      const mainX = leftWidth >= rightWidth ? 0 : x

      for (let y = minSize; y <= ph - minSize; y += step) {
        const mainResult = calculatePiecesInRect(mainWidth, ph, cw, ch)
        const otherWidth = leftWidth >= rightWidth ? rightWidth : leftWidth
        const otherX = leftWidth >= rightWidth ? x : 0
        const otherResult = calculatePiecesInRect(otherWidth, ph, cw, ch)

        const total = mainResult.pieces + otherResult.pieces

        if (total > 0) {
          scenarios.push({
            strategy: `2-Stage V-H (${x.toFixed(1)}cm, ${y.toFixed(1)}cm)`,
            type: 'block-cut',
            cutPosition: x,
            cutPositionY: y,
            blocks: [
              {
                name: 'Blok A',
                x: mainX,
                y: 0,
                width: mainResult.horizontal * (mainResult.rotated ? ch : cw),
                height: mainResult.vertical * (mainResult.rotated ? cw : ch),
                horizontal: mainResult.horizontal,
                vertical: mainResult.vertical,
                pieces: mainResult.pieces,
                pieceWidth: mainResult.rotated ? ch : cw,
                pieceHeight: mainResult.rotated ? cw : ch,
                rotated: mainResult.rotated,
                usedWidth: mainResult.horizontal * (mainResult.rotated ? ch : cw),
                usedHeight: mainResult.vertical * (mainResult.rotated ? cw : ch),
                wasteWidth: mainWidth - (mainResult.horizontal * (mainResult.rotated ? ch : cw)),
                wasteHeight: ph - (mainResult.vertical * (mainResult.rotated ? cw : ch))
              },
              ...(otherResult.pieces > 0 ? [{
                name: 'Blok B',
                x: otherX,
                y: 0,
                width: otherResult.horizontal * (otherResult.rotated ? ch : cw),
                height: otherResult.vertical * (otherResult.rotated ? cw : ch),
                horizontal: otherResult.horizontal,
                vertical: otherResult.vertical,
                pieces: otherResult.pieces,
                pieceWidth: otherResult.rotated ? ch : cw,
                pieceHeight: otherResult.rotated ? cw : ch,
                rotated: otherResult.rotated,
                usedWidth: otherResult.horizontal * (otherResult.rotated ? ch : cw),
                usedHeight: otherResult.vertical * (otherResult.rotated ? cw : ch),
                wasteWidth: otherWidth - (otherResult.horizontal * (otherResult.rotated ? ch : cw)),
                wasteHeight: ph - (otherResult.vertical * (otherResult.rotated ? cw : ch))
              }] : [])
            ],
            total,
            steps: [
              `Langkah 1: Potong vertikal pada posisi ${x.toFixed(1)}cm`,
              `Langkah 2: Potong horizontal pada posisi ${y.toFixed(1)}cm`,
              `Langkah 3: Blok A → ${mainResult.pieces} potongan ${mainResult.rotated ? '(rotasi 90°)' : ''}`,
              ...(otherResult.pieces > 0 ? [`Langkah 4: Blok B → ${otherResult.pieces} potongan ${otherResult.rotated ? '(rotasi 90°)' : ''}`] : [])
            ]
          })
        }
      }
    }

    // First cut horizontal, then vertical on main section
    for (let y = minSize; y <= ph - minSize; y += step) {
      const bottomHeight = y
      const topHeight = ph - y
      const mainHeight = Math.max(bottomHeight, topHeight)
      const mainY = bottomHeight >= topHeight ? 0 : y

      for (let x = minSize; x <= pw - minSize; x += step) {
        const mainResult = calculatePiecesInRect(pw, mainHeight, cw, ch)
        const otherHeight = bottomHeight >= topHeight ? topHeight : bottomHeight
        const otherY = bottomHeight >= topHeight ? y : 0
        const otherResult = calculatePiecesInRect(pw, otherHeight, cw, ch)

        const total = mainResult.pieces + otherResult.pieces

        if (total > 0) {
          scenarios.push({
            strategy: `2-Stage H-V (${y.toFixed(1)}cm, ${x.toFixed(1)}cm)`,
            type: 'block-cut',
            cutPosition: x,
            cutPositionY: y,
            blocks: [
              {
                name: 'Blok A',
                x: 0,
                y: mainY,
                width: mainResult.horizontal * (mainResult.rotated ? ch : cw),
                height: mainResult.vertical * (mainResult.rotated ? cw : ch),
                horizontal: mainResult.horizontal,
                vertical: mainResult.vertical,
                pieces: mainResult.pieces,
                pieceWidth: mainResult.rotated ? ch : cw,
                pieceHeight: mainResult.rotated ? cw : ch,
                rotated: mainResult.rotated,
                usedWidth: mainResult.horizontal * (mainResult.rotated ? ch : cw),
                usedHeight: mainResult.vertical * (mainResult.rotated ? cw : ch),
                wasteWidth: pw - (mainResult.horizontal * (mainResult.rotated ? ch : cw)),
                wasteHeight: mainHeight - (mainResult.vertical * (mainResult.rotated ? cw : ch))
              },
              ...(otherResult.pieces > 0 ? [{
                name: 'Blok B',
                x: 0,
                y: otherY,
                width: otherResult.horizontal * (otherResult.rotated ? ch : cw),
                height: otherResult.vertical * (otherResult.rotated ? cw : ch),
                horizontal: otherResult.horizontal,
                vertical: otherResult.vertical,
                pieces: otherResult.pieces,
                pieceWidth: otherResult.rotated ? ch : cw,
                pieceHeight: otherResult.rotated ? cw : ch,
                rotated: otherResult.rotated,
                usedWidth: otherResult.horizontal * (otherResult.rotated ? ch : cw),
                usedHeight: otherResult.vertical * (otherResult.rotated ? cw : ch),
                wasteWidth: pw - (otherResult.horizontal * (otherResult.rotated ? ch : cw)),
                wasteHeight: otherHeight - (otherResult.vertical * (otherResult.rotated ? cw : ch))
              }] : [])
            ],
            total,
            steps: [
              `Langkah 1: Potong horizontal pada posisi ${y.toFixed(1)}cm`,
              `Langkah 2: Potong vertikal pada posisi ${x.toFixed(1)}cm`,
              `Langkah 3: Blok A → ${mainResult.pieces} potongan ${mainResult.rotated ? '(rotasi 90°)' : ''}`,
              ...(otherResult.pieces > 0 ? [`Langkah 4: Blok B → ${otherResult.pieces} potongan ${otherResult.rotated ? '(rotasi 90°)' : ''}`] : [])
            ]
          })
        }
      }
    }

    return scenarios
  }

  // Hybrid layout - grid + rotated pieces in waste
  const hybridLayout = (pw: number, ph: number, cw: number, ch: number): Scenario[] => {
    const scenarios: Scenario[] = []

    // Normal grid first
    const normalResult = normalGridLayout(pw, ph, cw, ch)
    const mainBlock = normalResult.blocks[0]

    // Check if there's waste area that can fit rotated pieces
    const wasteWidth = pw - mainBlock.usedWidth
    const wasteHeight = ph - mainBlock.usedHeight

    if (wasteWidth > 0 || wasteHeight > 0) {
      // Try to fit rotated pieces in waste areas
      if (wasteWidth >= Math.min(cw, ch)) {
        const rotatedInWaste = calculatePiecesInRect(wasteWidth, ph, cw, ch)
        if (rotatedInWaste.pieces > 0 && rotatedInWaste.rotated !== mainBlock.rotated) {
          scenarios.push({
            strategy: 'Hybrid (Grid + Sisa Rotasi)',
            type: 'block-cut',
            cutPosition: mainBlock.usedWidth,
            cutPositionY: undefined,
            blocks: [
              mainBlock,
              {
                name: 'Blok B',
                x: mainBlock.usedWidth,
                y: 0,
                width: rotatedInWaste.horizontal * (rotatedInWaste.rotated ? ch : cw),
                height: rotatedInWaste.vertical * (rotatedInWaste.rotated ? cw : ch),
                horizontal: rotatedInWaste.horizontal,
                vertical: rotatedInWaste.vertical,
                pieces: rotatedInWaste.pieces,
                pieceWidth: rotatedInWaste.rotated ? ch : cw,
                pieceHeight: rotatedInWaste.rotated ? cw : ch,
                rotated: rotatedInWaste.rotated,
                usedWidth: rotatedInWaste.horizontal * (rotatedInWaste.rotated ? ch : cw),
                usedHeight: rotatedInWaste.vertical * (rotatedInWaste.rotated ? cw : ch),
                wasteWidth: wasteWidth - (rotatedInWaste.horizontal * (rotatedInWaste.rotated ? ch : cw)),
                wasteHeight: ph - (rotatedInWaste.vertical * (rotatedInWaste.rotated ? cw : ch))
              }
            ],
            total: mainBlock.pieces + rotatedInWaste.pieces,
            steps: [
              `Langkah 1: Potong grid normal ${mainBlock.horizontal}×${mainBlock.vertical}`,
              `Langkah 2: Gunakan sisa (${wasteWidth.toFixed(1)}×${ph}cm) untuk ${rotatedInWaste.pieces} potongan rotasi`
            ]
          })
        }
      }

      if (wasteHeight >= Math.min(cw, ch)) {
        const rotatedInWaste = calculatePiecesInRect(pw, wasteHeight, cw, ch)
        if (rotatedInWaste.pieces > 0 && rotatedInWaste.rotated !== mainBlock.rotated) {
          scenarios.push({
            strategy: 'Hybrid (Grid + Sisa Rotasi Vertikal)',
            type: 'block-cut',
            cutPosition: undefined,
            cutPositionY: mainBlock.usedHeight,
            blocks: [
              mainBlock,
              {
                name: 'Blok B',
                x: 0,
                y: mainBlock.usedHeight,
                width: rotatedInWaste.horizontal * (rotatedInWaste.rotated ? ch : cw),
                height: rotatedInWaste.vertical * (rotatedInWaste.rotated ? cw : ch),
                horizontal: rotatedInWaste.horizontal,
                vertical: rotatedInWaste.vertical,
                pieces: rotatedInWaste.pieces,
                pieceWidth: rotatedInWaste.rotated ? ch : cw,
                pieceHeight: rotatedInWaste.rotated ? cw : ch,
                rotated: rotatedInWaste.rotated,
                usedWidth: rotatedInWaste.horizontal * (rotatedInWaste.rotated ? ch : cw),
                usedHeight: rotatedInWaste.vertical * (rotatedInWaste.rotated ? cw : ch),
                wasteWidth: pw - (rotatedInWaste.horizontal * (rotatedInWaste.rotated ? ch : cw)),
                wasteHeight: wasteHeight - (rotatedInWaste.vertical * (rotatedInWaste.rotated ? cw : ch))
              }
            ],
            total: mainBlock.pieces + rotatedInWaste.pieces,
            steps: [
              `Langkah 1: Potong grid normal ${mainBlock.horizontal}×${mainBlock.vertical}`,
              `Langkah 2: Gunakan sisa (${pw}×${wasteHeight.toFixed(1)}cm) untuk ${rotatedInWaste.pieces} potongan rotasi`
            ]
          })
        }
      }
    }

    return scenarios
  }

  const calculateCuts = async () => {
    setIsCalculating(true)

    // Small delay to allow UI to update
    await new Promise(resolve => setTimeout(resolve, 50))

    const pw = parseFloat(paperWidth)
    const ph = parseFloat(paperHeight)
    const cw = parseFloat(cutWidth)
    const ch = parseFloat(cutHeight)
    const qty = parseInt(quantity) || 0

    if (!pw || !ph || !cw || !ch) {
      alert('Mohon lengkapi semua ukuran!')
      setIsCalculating(false)
      return
    }

    if (cw > pw || ch > ph) {
      alert('Ukuran potongan lebih besar dari ukuran kertas!')
      setIsCalculating(false)
      return
    }

    const scenarios: Scenario[] = []

    // 1. Normal grid layout
    scenarios.push(normalGridLayout(pw, ph, cw, ch))

    // 2. Guillotine single cut
    if (optimizationMode === 'maximal') {
      scenarios.push(...guillotineSingleCut(pw, ph, cw, ch))
    } else {
      // Fast mode - fewer cut positions
      const fastScenarios = guillotineSingleCut(pw, ph, cw, ch)
      scenarios.push(...fastScenarios.slice(0, Math.min(20, fastScenarios.length)))
    }

    // 3. Two-stage guillotine
    if (optimizationMode === 'maximal') {
      scenarios.push(...twoStageGuillotine(pw, ph, cw, ch))
    } else {
      // Fast mode - fewer cut positions
      const fastScenarios = twoStageGuillotine(pw, ph, cw, ch)
      scenarios.push(...fastScenarios.slice(0, Math.min(15, fastScenarios.length)))
    }

    // 4. Hybrid layout
    if (optimizationMode === 'maximal') {
      scenarios.push(...hybridLayout(pw, ph, cw, ch))
    }

    // Find best scenario (prioritize: 1. max pieces, 2. min waste)
    let bestScenario = scenarios[0]
    for (const scenario of scenarios) {
      if (scenario.total > bestScenario.total) {
        bestScenario = scenario
      } else if (scenario.total === bestScenario.total) {
        // Calculate waste for tie-breaking
        const currentWaste = scenario.blocks.reduce((sum, b) => 
          sum + (b.wasteWidth * b.height + b.width * b.wasteHeight - b.wasteWidth * b.wasteHeight), 0)
        const bestWaste = bestScenario.blocks.reduce((sum, b) => 
          sum + (b.wasteWidth * b.height + b.width * b.wasteHeight - b.wasteWidth * b.wasteHeight), 0)
        
        if (currentWaste < bestWaste) {
          bestScenario = scenario
        }
      }
    }

    // Calculate total waste and efficiency
    const totalUsedArea = bestScenario.blocks.reduce((sum, b) =>
      sum + (b.usedWidth * b.usedHeight), 0)
    const totalPaperArea = pw * ph
    const totalWasteArea = totalPaperArea - totalUsedArea
    const efficiency = ((totalUsedArea / totalPaperArea) * 100)

    // Calculate sheets needed and price
    const sheetsNeeded = qty > 0 ? Math.ceil(qty / bestScenario.total) : 1
    const price = parseFloat(pricePerSheet) || 0
    const totalPrice = sheetsNeeded * price

    setResults({
      totalPieces: bestScenario.total,
      quantity: qty,
      sheetsNeeded,
      totalPrice,
      pricePerSheet: price,
      cutPosition: bestScenario.cutPosition,
      cutPositionY: bestScenario.cutPositionY,
      blocks: bestScenario.blocks,
      paperWidth: pw,
      paperHeight: ph,
      cutWidth: cw,
      cutHeight: ch,
      customerName: selectedCustomer?.name || '',
      paperMaterial: selectedPaper?.name || '',
      grammage: selectedPaper?.grammage || 0,
      scenarioType: bestScenario.type,
      totalWasteArea,
      efficiency,
      steps: bestScenario.steps,
      strategy: bestScenario.strategy
    })

    setIsCalculating(false)
  }

  return (
    <DashboardLayout
      title="Potong Kertas"
      subtitle="Kalkulator pemotongan kertas profesional"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Informasi Cetak</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nama Cetakan / Customer
              </label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nama Bahan Kertas
              </label>
              <Select value={selectedPaperId} onValueChange={handlePaperChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih kertas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Custom (Input Manual)
                    </div>
                  </SelectItem>
                  {papers.map((paper) => (
                    <SelectItem key={paper.id} value={paper.id}>
                      {paper.name} ({paper.width}×{paper.height} cm, {paper.grammage} gsm)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Gramatur (gsm)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="150"
                  value={grammage}
                  onChange={(e) => setGrammage(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Harga / Lembar (Rp)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  value={pricePerSheet}
                  onChange={(e) => setPricePerSheet(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            {pricePerSheet && (
              <p className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                <span className="font-medium">Harga per Rim (500 lembar):</span>{' '}
                <span className="text-emerald-600 font-semibold">
                  Rp {(parseFloat(pricePerSheet) * 500).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </p>
            )}
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Ukuran Kertas</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Lebar Kertas (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="21.0"
                  value={paperWidth}
                  onChange={(e) => setPaperWidth(e.target.value)}
                  disabled={!isCustomPaper}
                  className={`w-full border rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    !isCustomPaper
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-300'
                      : 'border-slate-300'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tinggi Kertas (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="29.7"
                  value={paperHeight}
                  onChange={(e) => setPaperHeight(e.target.value)}
                  disabled={!isCustomPaper}
                  className={`w-full border rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    !isCustomPaper
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-300'
                      : 'border-slate-300'
                  }`}
                />
              </div>
            </div>
            {selectedPaper && !isCustomPaper && (
              <p className="text-xs text-blue-600 flex items-center gap-1 mt-2">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ukuran otomatis dari {selectedPaper.name} ({selectedPaper.width}×{selectedPaper.height} cm, {selectedPaper.grammage} gsm)
              </p>
            )}
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Ukuran Potongan</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Lebar Potongan (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="10.0"
                  value={cutWidth}
                  onChange={(e) => setCutWidth(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tinggi Potongan (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="15.0"
                  value={cutHeight}
                  onChange={(e) => setCutHeight(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Mode Optimasi</h2>
            <div>
              <Select value={optimizationMode} onValueChange={(v: any) => setOptimizationMode(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fast">Cepat (Greedy)</SelectItem>
                  <SelectItem value="maximal">Maksimal (Brute Force)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Jumlah</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Jumlah Cetakan yang Diperlukan
              </label>
              <input
                type="number"
                step="1"
                min="0"
                placeholder="100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={calculateCuts}
                disabled={isCalculating}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isCalculating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Menghitung...
                  </>
                ) : (
                  'Hitung Potongan'
                )}
              </button>
              <button
                onClick={async () => {
                  if (!results) {
                    alert('Silakan hitung potongan terlebih dahulu!')
                    return
                  }
                  // Save to database (riwayat)
                  try {
                    const res = await fetch('/api/riwayat-potong', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        customerName: results.customerName || '',
                        paperName: results.paperMaterial || '',
                        grammage: results.grammage || 0,
                        paperWidth: results.paperWidth,
                        paperHeight: results.paperHeight,
                        cutWidth: results.cutWidth,
                        cutHeight: results.cutHeight,
                        quantity: results.quantity,
                        totalPieces: results.totalPieces,
                        sheetsNeeded: results.sheetsNeeded,
                        pricePerSheet: results.pricePerSheet || 0,
                        totalPrice: results.totalPrice,
                        strategy: results.strategy,
                        scenarioType: results.scenarioType || '',
                        totalWasteArea: results.totalWasteArea || 0,
                        steps: (results.steps || []).join(' | '),
                        efficiency: results.efficiency,
                      })
                    })
                    if (res.ok) {
                      alert('Riwayat berhasil disimpan!')
                    } else {
                      alert('Gagal menyimpan riwayat')
                    }
                  } catch {
                    alert('Gagal menyimpan riwayat')
                  }
                  // Also save to localStorage as backup
                  const saveData = {
                    paperWidth: results.paperWidth,
                    paperHeight: results.paperHeight,
                    cutWidth: results.cutWidth,
                    cutHeight: results.cutHeight,
                    totalPieces: results.totalPieces,
                    quantity: results.quantity,
                    sheetsNeeded: results.sheetsNeeded,
                    totalPrice: results.totalPrice,
                    customerName: results.customerName,
                    paperMaterial: results.paperMaterial,
                    grammage: results.grammage,
                    strategy: results.strategy,
                    efficiency: results.efficiency,
                    savedAt: new Date().toISOString()
                  }
                  localStorage.setItem('saved_cutting_' + Date.now(), JSON.stringify(saveData))
                }}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Simpan
              </button>
              <button
                onClick={() => {
                  // Simpan state form ke sessionStorage agar tidak hilang saat kembali
                  sessionStorage.setItem('potong_kertas_state', JSON.stringify({
                    paperWidth, paperHeight, cutWidth, cutHeight,
                    selectedCustomerId, selectedPaperId, grammage, pricePerSheet,
                    quantity, isCustomPaper, optimizationMode
                  }))
                  // Simpan hasil jika ada
                  if (results) {
                    sessionStorage.setItem('potong_kertas_results', JSON.stringify(results))
                    
                  }
                  const params = new URLSearchParams()
                  if (selectedCustomer?.name) params.set('printName', selectedCustomer.name)
                  if (selectedCustomerId) params.set('customerId', selectedCustomerId)
                  if (paperWidth) params.set('paperLength', paperWidth)
                  if (paperHeight) params.set('paperWidth', paperHeight)
                  if (quantity) params.set('quantity', quantity)
                  if (selectedPaperId) params.set('paperId', selectedPaperId)
                  if (pricePerSheet) params.set('pricePerSheet', pricePerSheet)
                  if (results) params.set('totalPaperPrice', results.totalPrice.toString())
                  if (results) params.set('cutWidth', results.cutWidth.toString())
                  if (results) params.set('cutHeight', results.cutHeight.toString())
                  window.location.href = `/hitung-cetakan?${params.toString()}`
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Calculator className="w-5 h-5" />
                Hitung Cetakan
              </button>
              <button
                onClick={() => {
                  sessionStorage.removeItem('potong_kertas_state')
                  sessionStorage.removeItem('potong_kertas_results')
                  setPaperWidth('')
                  setPaperHeight('')
                  setCutWidth('')
                  setCutHeight('')
                  setSelectedCustomerId('')
                  setSelectedPaperId('')
                  setGrammage('')
                  setPricePerSheet('')
                  setQuantity('')
                  setIsCustomPaper(false)
                  setResults(null)
                  setOptimizationMode('maximal')
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {results ? (
            <>
              {/* Detail Perhitungan */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-6">Detail Perhitungan</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-xs text-blue-600 font-medium mb-1">Jumlah Cetakan yang Diperlukan</p>
                    <p className="text-2xl font-bold text-blue-600">{results.quantity}</p>
                    <p className="text-xs text-blue-600 mt-1">lembar</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4">
                    <p className="text-xs text-purple-600 font-medium mb-1">Potongan per Lembar Kertas</p>
                    <p className="text-2xl font-bold text-purple-600">{results.totalPieces}</p>
                    <p className="text-xs text-purple-600 mt-1">lembar</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-emerald-50 rounded-xl p-4">
                    <p className="text-xs text-emerald-600 font-medium mb-1">Lembar Kertas yang Dibutuhkan</p>
                    <p className="text-2xl font-bold text-emerald-600">{results.sheetsNeeded}</p>
                    <p className="text-xs text-emerald-600 mt-1">lembar</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4">
                    <p className="text-xs text-orange-600 font-medium mb-1">Total Harga Kertas</p>
                    <p className="text-lg font-bold text-orange-600">
                      Rp {results.totalPrice.toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      ({results.sheetsNeeded} × Rp {results.pricePerSheet.toLocaleString('id-ID')})
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-rose-50 rounded-xl p-4">
                    <p className="text-xs text-rose-600 font-medium mb-1">Sisa Potongan Ukuran :</p>
                    <p className="text-2xl font-bold text-rose-600">{results.totalWasteArea.toFixed(2)}</p>
                    <p className="text-xs text-rose-600 mt-1">cm²</p>
                  </div>
                  <div className="bg-teal-50 rounded-xl p-4">
                    <p className="text-xs text-teal-600 font-medium mb-1">Efisiensi Bahan</p>
                    <p className="text-2xl font-bold text-teal-600">{results.efficiency.toFixed(2)}%</p>
                    <p className="text-xs text-teal-600 mt-1">penggunaan bahan</p>
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-indigo-800 mb-2">Strategi Optimasi:</p>
                  <p className="text-sm text-indigo-700 font-medium">{results.strategy}</p>
                </div>
              </div>

              {/* Cara Potong */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-6">Cara Potong</h2>
                <div className="space-y-3">
                  {results.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </div>
                      <p className="text-sm text-slate-700 pt-0.5">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diagram Potong */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-6">Diagram Potong</h2>
                <div className="flex justify-center items-center">
                  <svg
                    width="550"
                    height={550 * (results.paperHeight / results.paperWidth)}
                    viewBox={`0 0 ${results.paperWidth * 5} ${results.paperHeight * 5}`}
                    className="border border-slate-200 bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-lg"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <defs>
                      {/* Soft gradient for pieces */}
                      <linearGradient id="softGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#dbeafe" />
                        <stop offset="100%" stopColor="#bfdbfe" />
                      </linearGradient>
                      <linearGradient id="softGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#d1fae5" />
                        <stop offset="100%" stopColor="#a7f3d0" />
                      </linearGradient>
                      <linearGradient id="softGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fef3c7" />
                        <stop offset="100%" stopColor="#fde68a" />
                      </linearGradient>
                      <linearGradient id="softGradient4" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fecaca" />
                        <stop offset="100%" stopColor="#fca5a5" />
                      </linearGradient>
                      <linearGradient id="softGradient5" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#e9d5ff" />
                        <stop offset="100%" stopColor="#d8b4fe" />
                      </linearGradient>

                      {/* Subtle grid pattern */}
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
                      </pattern>

                      {/* Soft shadow */}
                      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#94a3b8" floodOpacity="0.2" />
                      </filter>
                    </defs>
                    <rect
                      x="0"
                      y="0"
                      width={results.paperWidth * 5}
                      height={results.paperHeight * 5}
                      fill="url(#grid)"
                    />
                    <rect
                      x="0"
                      y="0"
                      width={results.paperWidth * 5}
                      height={results.paperHeight * 5}
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="4"
                      rx="2"
                    />

                    {/* Garis potong - soft red */}
                    {results.blocks.length > 1 && results.cutPosition !== undefined && (
                      <line
                        x1={results.cutPosition * 5}
                        y1="0"
                        x2={results.cutPosition * 5}
                        y2={results.paperHeight * 5}
                        stroke="#f87171"
                        strokeWidth="2"
                        strokeDasharray="6,3"
                        opacity="0.8"
                      />
                    )}
                    {results.blocks.length > 1 && results.cutPositionY !== undefined && (
                      <line
                        x1="0"
                        y1={results.cutPositionY * 5}
                        x2={results.paperWidth * 5}
                        y2={results.cutPositionY * 5}
                        stroke="#f87171"
                        strokeWidth="2"
                        strokeDasharray="6,3"
                        opacity="0.8"
                      />
                    )}

                    {/* Sisa kertas (waste) - soft pastel gray */}
                    {(() => {
                      const scale = 5
                      const wasteAreas: Array<{x: number; y: number; width: number; height: number; label: string}> = []

                      results.blocks.forEach((block, blockIdx) => {
                        const blockRight = (block.x + block.width) * scale
                        const wasteWidth = (results.paperWidth * scale) - blockRight

                        if (wasteWidth > 2) {
                          wasteAreas.push({
                            x: blockRight,
                            y: block.y * scale,
                            width: wasteWidth,
                            height: block.height * scale,
                            label: `${(wasteWidth / scale).toFixed(1)}×${block.height.toFixed(1)}cm`
                          })
                        }
                      })

                      results.blocks.forEach((block) => {
                        const blockBottom = (block.y + block.height) * scale
                        const wasteHeight = (results.paperHeight * scale) - blockBottom

                        if (wasteHeight > 2) {
                          wasteAreas.push({
                            x: block.x * scale,
                            y: blockBottom,
                            width: block.width * scale,
                            height: wasteHeight,
                            label: `${block.width.toFixed(1)}×${(wasteHeight / scale).toFixed(1)}cm`
                          })
                        }
                      })

                      return wasteAreas.map((waste, idx) => (
                        <g key={`waste-${idx}`}>
                          <rect
                            x={waste.x}
                            y={waste.y}
                            width={waste.width}
                            height={waste.height}
                            fill="#f1f5f9"
                            stroke="#cbd5e1"
                            strokeWidth="1.5"
                            strokeDasharray="3,2"
                            opacity="0.6"
                            rx="1"
                          />
                          <text
                            x={waste.x + waste.width / 2}
                            y={waste.y + waste.height / 2}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="11"
                            fontWeight="500"
                            fill="#94a3b8"
                          >
                            {waste.label}
                          </text>
                        </g>
                      ))
                    })()}

                    {/* Blok potongan - soft pastel colors with gradients */}
                    {results.blocks.map((block: Block, blockIdx: number) => {
                      const scale = 5
                      const blockX = block.x * scale
                      const blockY = block.y * scale
                      const pieceWidth = block.pieceWidth * scale
                      const pieceHeight = block.pieceHeight * scale

                      const gradientIds = [
                        'softGradient1',
                        'softGradient2',
                        'softGradient3',
                        'softGradient4',
                        'softGradient5'
                      ]
                      const strokeColors = [
                        '#93c5fd',
                        '#6ee7b7',
                        '#fcd34d',
                        '#fca5a5',
                        '#c4b5fd'
                      ]
                      const gradientId = gradientIds[blockIdx % gradientIds.length]
                      const strokeColor = strokeColors[blockIdx % strokeColors.length]

                      let pieceNumber = 1
                      const pieces: React.ReactNode[] = []
                      for (let i = 0; i < block.horizontal; i++) {
                        for (let j = 0; j < block.vertical; j++) {
                          pieces.push(
                            <g key={`${blockIdx}-${i}-${j}`}>
                              <rect
                                x={blockX + i * pieceWidth + 1}
                                y={blockY + j * pieceHeight + 1}
                                width={pieceWidth - 3}
                                height={pieceHeight - 3}
                                fill={`url(#${gradientId})`}
                                stroke={strokeColor}
                                strokeWidth="1.5"
                                filter="url(#softShadow)"
                              />
                              {/* Nomor kertas dengan soft background */}
                              <circle
                                cx={blockX + i * pieceWidth + pieceWidth / 2}
                                cy={blockY + j * pieceHeight + pieceHeight / 2}
                                r={Math.min(pieceWidth, pieceHeight) / 4}
                                fill="white"
                                opacity="0.9"
                              />
                              <text
                                x={blockX + i * pieceWidth + pieceWidth / 2}
                                y={blockY + j * pieceHeight + pieceHeight / 2}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="13"
                                fontWeight="500"
                                fill="#64748b"
                              >
                                {pieceNumber++}
                              </text>
                            </g>
                          )
                        }
                      }

                      return (
                        <g key={`block-${blockIdx}`}>
                          {pieces}
                        </g>
                      )
                    })}
                  </svg>
                </div>
              </div>

              {/* Detail Blok */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-6">Detail per Blok</h2>
                <div className="space-y-4">
                  {results.blocks.map((block: Block, idx: number) => (
                    <div key={idx} className="border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-slate-800">{block.name}</h3>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {block.pieces} lembar
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">Ukuran Blok</p>
                          <p className="font-medium text-slate-800">{block.width.toFixed(1)} × {block.height.toFixed(1)} cm</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Layout</p>
                          <p className="font-medium text-slate-800">{block.horizontal} × {block.vertical} {block.rotated ? '(Rotasi 90°)' : ''}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Sisa Kanan</p>
                          <p className="font-medium text-slate-800">{block.wasteWidth.toFixed(1)} × {block.height.toFixed(1)} cm</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Sisa Bawah</p>
                          <p className="font-medium text-slate-800">{block.width.toFixed(1)} × {block.wasteHeight.toFixed(1)} cm</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
              <p className="text-sm text-slate-500">Masukkan ukuran dan klik "Hitung Potongan"</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function Home() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    try {
      const authUser = getAuthUser()
      setUser(authUser)
    } catch (error) {
      console.error('Error getting auth user:', error)
      setUser(null)
    }
  }, [])

  useEffect(() => {
    if (mounted && !user) {
      router.push('/login')
    }
  }, [mounted, user, router])

  if (!mounted) {
    return null
  }

  if (!user) {
    return null
  }

  return <CalculatorPage />
}

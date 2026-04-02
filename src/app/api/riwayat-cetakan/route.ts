import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toSnakeCase, toCamelCase } from '@/lib/case-converter'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('RiwayatHitungCetakan')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching riwayat cetakan:', error)
      return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
    }

    return NextResponse.json(toCamelCase(data))
  } catch (error) {
    console.error('Error fetching riwayat cetakan:', error)
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const { error } = await supabase
      .from('RiwayatHitungCetakan')
      .insert([toSnakeCase({
        printName: data.printName || '',
        paperName: data.paperName || '',
        paperGrammage: data.paperGrammage || '0',
        paperLength: data.paperLength || '0',
        paperWidth: data.paperWidth || '0',
        cutWidth: data.cutWidth || '0',
        cutHeight: data.cutHeight || '0',
        quantity: data.quantity || '0',
        warna: data.warna || '0',
        warnaKhusus: data.warnaKhusus || '0',
        machineName: data.machineName || '',
        hargaPlat: data.hargaPlat || 0,
        ongkosCetak: data.ongkosCetak || 0,
        ongkosCetakDetail: data.ongkosCetakDetail || '',
        totalPaperPrice: data.totalPaperPrice || 0,
        finishingNames: data.finishingNames || '',
        finishingBreakdown: data.finishingBreakdown || '',
        finishingCost: data.finishingCost || 0,
        packingCost: data.packingCost || 0,
        shippingCost: data.shippingCost || 0,
        subTotal: data.subTotal || 0,
        profitPercent: data.profitPercent || 0,
        profitAmount: data.profitAmount || 0,
        grandTotal: data.grandTotal || 0,
      })])

    if (error) {
      console.error('Error saving riwayat cetakan:', error)
      return NextResponse.json({ error: 'Gagal menyimpan' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving riwayat cetakan:', error)
    return NextResponse.json({ error: 'Gagal menyimpan' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const { id, ...fields } = data
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })

    const allowedFields = [
      'printName', 'paperName', 'paperGrammage', 'paperLength', 'paperWidth',
      'cutWidth', 'cutHeight', 'quantity', 'warna', 'warnaKhusus',
      'machineName', 'hargaPlat', 'ongkosCetak', 'ongkosCetakDetail',
      'totalPaperPrice', 'finishingNames', 'finishingBreakdown', 'finishingCost',
      'packingCost', 'shippingCost', 'subTotal', 'profitPercent',
      'profitAmount', 'grandTotal',
    ] as const

    const updateData: Record<string, unknown> = {}
    for (const field of allowedFields) {
      if (fields[field] !== undefined) {
        updateData[field] = fields[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Tidak ada field yang diubah' }, { status: 400 })
    }

    const { error } = await supabase
      .from('RiwayatHitungCetakan')
      .update(toSnakeCase(updateData))
      .eq('id', id)

    if (error) {
      console.error('Error updating riwayat cetakan:', error)
      return NextResponse.json({ error: 'Gagal mengubah' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating riwayat cetakan:', error)
    return NextResponse.json({ error: 'Gagal mengubah' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })

    const { error } = await supabase
      .from('RiwayatHitungCetakan')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting riwayat cetakan:', error)
      return NextResponse.json({ error: 'Gagal menghapus' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting riwayat cetakan:', error)
    return NextResponse.json({ error: 'Gagal menghapus' }, { status: 500 })
  }
}

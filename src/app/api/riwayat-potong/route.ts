import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toSnakeCase, toCamelCase } from '@/lib/case-converter'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('RiwayatPotongKertas')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching riwayat potong:', error)
      return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
    }

    return NextResponse.json(toCamelCase(data))
  } catch (error) {
    console.error('Error fetching riwayat potong:', error)
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const { error } = await supabase
      .from('RiwayatPotongKertas')
      .insert([toSnakeCase({
        customerName: data.customerName || '',
        paperName: data.paperName || '',
        grammage: data.grammage || 0,
        paperWidth: data.paperWidth || 0,
        paperHeight: data.paperHeight || 0,
        cutWidth: data.cutWidth || 0,
        cutHeight: data.cutHeight || 0,
        quantity: data.quantity || 0,
        totalPieces: data.totalPieces || 0,
        sheetsNeeded: data.sheetsNeeded || 0,
        pricePerSheet: data.pricePerSheet || 0,
        totalPrice: data.totalPrice || 0,
        strategy: data.strategy || '',
        scenarioType: data.scenarioType || '',
        totalWasteArea: data.totalWasteArea || 0,
        steps: data.steps || '',
        efficiency: data.efficiency || 0,
      })])

    if (error) {
      console.error('Error saving riwayat potong:', error)
      return NextResponse.json({ error: 'Gagal menyimpan' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving riwayat potong:', error)
    return NextResponse.json({ error: 'Gagal menyimpan' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const { id, ...fields } = data
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })

    const allowedFields = [
      'customerName', 'paperName', 'grammage', 'paperWidth', 'paperHeight',
      'cutWidth', 'cutHeight', 'quantity', 'totalPieces', 'sheetsNeeded',
      'pricePerSheet', 'totalPrice', 'strategy', 'scenarioType',
      'totalWasteArea', 'steps', 'efficiency',
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
      .from('RiwayatPotongKertas')
      .update(toSnakeCase(updateData))
      .eq('id', id)

    if (error) {
      console.error('Error updating riwayat potong:', error)
      return NextResponse.json({ error: 'Gagal mengubah' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating riwayat potong:', error)
    return NextResponse.json({ error: 'Gagal mengubah' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID diperlukan' }, { status: 400 })

    const { error } = await supabase
      .from('RiwayatPotongKertas')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting riwayat potong:', error)
      return NextResponse.json({ error: 'Gagal menghapus' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting riwayat potong:', error)
    return NextResponse.json({ error: 'Gagal menghapus' }, { status: 500 })
  }
}

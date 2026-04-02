import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toSnakeCase, toCamelCase } from '@/lib/case-converter'

// GET single finishing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await supabase
      .from('Finishing')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Finishing not found' }, { status: 404 })
    }

    return NextResponse.json(toCamelCase(data))
  } catch (error) {
    console.error('Error fetching finishing:', error)
    return NextResponse.json({ error: 'Failed to fetch finishing' }, { status: 500 })
  }
}

// PUT update finishing
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, minimumSheets, minimumPrice, additionalPrice, pricePerCm } = body

    const { data, error } = await supabase
      .from('Finishing')
      .update(toSnakeCase({
        name,
        minimumSheets: parseFloat(minimumSheets) || 0,
        minimumPrice: parseFloat(minimumPrice) || 0,
        additionalPrice: parseFloat(additionalPrice) || 0,
        pricePerCm: parseFloat(pricePerCm) || 0
      }))
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating finishing:', error)
      return NextResponse.json({ error: 'Failed to update finishing' }, { status: 500 })
    }

    return NextResponse.json(toCamelCase(data?.[0]))
  } catch (error) {
    console.error('Error updating finishing:', error)
    return NextResponse.json({ error: 'Failed to update finishing' }, { status: 500 })
  }
}

// DELETE finishing
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error } = await supabase
      .from('Finishing')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting finishing:', error)
      return NextResponse.json({ error: 'Failed to delete finishing' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Finishing deleted successfully' })
  } catch (error) {
    console.error('Error deleting finishing:', error)
    return NextResponse.json({ error: 'Failed to delete finishing' }, { status: 500 })
  }
}

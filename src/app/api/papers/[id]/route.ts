import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toSnakeCase, toCamelCase } from '@/lib/case-converter'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await supabase
      .from('Paper')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Paper not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(toCamelCase(data))
  } catch (error) {
    console.error('Error fetching paper:', error)
    return NextResponse.json(
      { error: 'Failed to fetch paper' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, grammage, width, height, pricePerRim } = body

    const { data, error } = await supabase
      .from('Paper')
      .update(toSnakeCase({
        name,
        grammage: parseInt(grammage),
        width: parseFloat(width),
        height: parseFloat(height),
        pricePerRim: parseFloat(pricePerRim)
      }))
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating paper:', error)
      return NextResponse.json(
        { error: 'Failed to update paper' },
        { status: 500 }
      )
    }

    return NextResponse.json(toCamelCase(data?.[0]))
  } catch (error) {
    console.error('Error updating paper:', error)
    return NextResponse.json(
      { error: 'Failed to update paper' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error } = await supabase
      .from('Paper')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting paper:', error)
      return NextResponse.json(
        { error: 'Failed to delete paper' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Paper deleted successfully' })
  } catch (error) {
    console.error('Error deleting paper:', error)
    return NextResponse.json(
      { error: 'Failed to delete paper' },
      { status: 500 }
    )
  }
}

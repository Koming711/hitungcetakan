import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toSnakeCase, toCamelCase } from '@/lib/case-converter'

// GET all finishings
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    let query = supabase
      .from('Finishing')
      .select('*')
      .order('created_at', { ascending: false })
    if (userId && userRole !== 'admin') {
      query = query.eq('user_id', userId)
    }
    const { data, error } = await query

    if (error) {
      console.error('Error fetching finishings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch finishings', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(toCamelCase(data))
  } catch (error) {
    console.error('Error fetching finishings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch finishings' },
      { status: 500 }
    )
  }
}

// POST create finishing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, minimumSheets, minimumPrice, additionalPrice, pricePerCm } = body

    if (!name || minimumSheets === undefined || minimumPrice === undefined || additionalPrice === undefined || pricePerCm === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const userId = request.headers.get('x-user-id') || ''
    const { data, error } = await supabase
      .from('Finishing')
      .insert([toSnakeCase({
        name,
        minimumSheets: parseInt(minimumSheets) || 0,
        minimumPrice: parseFloat(minimumPrice) || 0,
        additionalPrice: parseFloat(additionalPrice) || 0,
        pricePerCm: parseFloat(pricePerCm) || 0,
        userId,
      })])
      .select()

    if (error) {
      console.error('Error creating finishing:', error)
      return NextResponse.json(
        { error: 'Failed to create finishing', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(toCamelCase(data?.[0]), { status: 201 })
  } catch (error) {
    console.error('Error creating finishing:', error)
    return NextResponse.json(
      { error: 'Failed to create finishing' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toSnakeCase, toCamelCase } from '@/lib/case-converter'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('Customer')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching customers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch customers', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(toCamelCase(data))
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers', details: message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, address, phone, email } = body

    if (!name || !address || !phone || !email) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('Customer')
      .insert([toSnakeCase({ name, address, phone, email })])
      .select()

    if (error) {
      console.error('Error creating customer:', error)
      return NextResponse.json(
        { error: 'Failed to create customer', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(toCamelCase(data?.[0]), { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Failed to create customer', details: message },
      { status: 500 }
    )
  }
}

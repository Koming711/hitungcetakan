import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/settings?key=profit
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (key) {
      const { data, error } = await supabase
        .from('Setting')
        .select('*')
        .eq('key', key)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = not found (no rows returned)
        console.error('Error fetching setting:', error)
        return NextResponse.json({ error: 'Gagal mengambil pengaturan' }, { status: 500 })
      }

      return NextResponse.json({ key, value: data?.value || '0' })
    }

    const { data, error } = await supabase
      .from('Setting')
      .select('*')

    if (error) {
      console.error('Error fetching settings:', error)
      return NextResponse.json({ error: 'Gagal mengambil pengaturan' }, { status: 500 })
    }

    const result: Record<string, string> = {}
    if (data) {
      data.forEach((s: { key: string; value: string }) => {
        result[s.key] = s.value
      })
    }
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Gagal mengambil pengaturan' }, { status: 500 })
  }
}

// PUT /api/settings { key, value }
export async function PUT(request: Request) {
  try {
    const { key, value } = await request.json()

    if (!key) {
      return NextResponse.json({ error: 'Key diperlukan' }, { status: 400 })
    }

    const { error } = await supabase
      .from('Setting')
      .upsert({
        key,
        value: String(value),
        updated_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error saving setting:', error)
      return NextResponse.json({ error: 'Gagal menyimpan pengaturan' }, { status: 500 })
    }

    return NextResponse.json({ key, value })
  } catch (error) {
    console.error('Error saving setting:', error)
    return NextResponse.json({ error: 'Gagal menyimpan pengaturan' }, { status: 500 })
  }
}

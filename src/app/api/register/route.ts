// Registration endpoint using Supabase
// New users automatically become demo users
import { supabase } from '@/lib/supabase'
import { toSnakeCase, toCamelCase } from '@/lib/case-converter'
import { NextRequest, NextResponse } from 'next/server'

const TABLE = 'Pengguna'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { namaLengkap, nomorHP, email, username, password } = body

    // Validasi field wajib
    if (!namaLengkap || !nomorHP || !email || !username || !password) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 }
      )
    }

    // Validasi username minimal 8 karakter
    if (username.length < 8) {
      return NextResponse.json(
        { error: 'Username minimal 8 karakter' },
        { status: 400 }
      )
    }

    // Validasi password minimal 8 karakter
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password minimal 8 karakter' },
        { status: 400 }
      )
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      )
    }

    // Validasi format nomor HP
    const phoneRegex = /^(\+62|62|0)[0-9]{8,13}$/
    if (!phoneRegex.test(nomorHP.replace(/[\s\-]/g, ''))) {
      return NextResponse.json(
        { error: 'Format nomor handphone tidak valid' },
        { status: 400 }
      )
    }

    // Cek username sudah digunakan
    const { data: existingUser } = await supabase
      .from(TABLE)
      .select('id')
      .eq('username', username)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username sudah digunakan' },
        { status: 409 }
      )
    }

    // Cek email sudah digunakan
    const { data: existingEmail } = await supabase
      .from(TABLE)
      .select('id')
      .eq('email', email)
      .single()

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 409 }
      )
    }

    // Ambil setting demo_days
    const demoDays = 7
    try {
      const { data: demoDaysSetting } = await supabase
        .from('Setting')
        .select('value')
        .eq('key', 'demo_days')
        .single()
      if (demoDaysSetting?.value) {
        const parsed = parseInt(demoDaysSetting.value, 10)
        if (!isNaN(parsed)) parsed
      }
    } catch {}

    // Hitung tanggal berakhir demo
    const demoUntil = new Date()
    demoUntil.setDate(demoUntil.getDate() + demoDays)

    // Berlaku 1 tahun dari sekarang
    const validUntil = new Date()
    validUntil.setFullYear(validUntil.getFullYear() + 1)

    // Build insert data - only include fields that exist in the table
    const insertData: Record<string, unknown> = {
      nama_lengkap: namaLengkap,
      nomor_hp: nomorHP,
      email,
      username,
      password,
      role: 'user',
      valid_until: validUntil.toISOString(),
      is_demo: true,
      demo_until: demoUntil.toISOString(),
    }

    let insertQuery = supabase.from(TABLE).insert(insertData).select()

    // Try inserting with all fields
    let { data: pengguna, error } = await insertQuery.single()

    // If error about missing column, try without is_demo/demo_until
    if (error && (error.message?.includes('does not exist') || error.code === '42703')) {
      console.log('Retrying without is_demo/demo_until columns...')
      const simpleData: Record<string, unknown> = {
        nama_lengkap: namaLengkap,
        nomor_hp: nomorHP,
        email,
        username,
        password,
        role: 'user',
        valid_until: validUntil.toISOString(),
      }
      const retry = await supabase.from(TABLE).insert(simpleData).select().single()
      pengguna = retry.data
      error = retry.error
    }

    if (error) {
      console.error('Register error:', error.message || error)
      return NextResponse.json(
        { error: 'Terjadi kesalahan server', details: error.message || 'Unknown error' },
        { status: 500 }
      )
    }

    const camelData = toCamelCase(pengguna) as Record<string, unknown>

    return NextResponse.json(
      {
        message: 'Pendaftaran berhasil',
        data: {
          id: camelData.id,
          namaLengkap: camelData.namaLengkap,
          username: camelData.username,
          email: camelData.email,
          role: camelData.role,
          createdAt: camelData.createdAt,
        }
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('Register error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Terjadi kesalahan server', details: message },
      { status: 500 }
    )
  }
}

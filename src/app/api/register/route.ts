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
    const { data: demoDaysSetting } = await supabase
      .from('Setting')
      .select('value')
      .eq('key', 'demo_days')
      .single()

    const demoDays = parseInt(demoDaysSetting?.value || '7', 10)

    // Hitung tanggal berakhir demo
    const demoUntil = new Date()
    demoUntil.setDate(demoUntil.getDate() + demoDays)

    // Berlaku 1 tahun dari sekarang
    const validUntil = new Date()
    validUntil.setFullYear(validUntil.getFullYear() + 1)

    const insertData = toSnakeCase({
      namaLengkap,
      nomorHP,
      email,
      username,
      password,
      role: 'user',
      validUntil,
      isDemo: true,
      demoUntil,
    })

    const { data: pengguna, error } = await supabase
      .from(TABLE)
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Register error:', error)
      return NextResponse.json(
        { error: 'Terjadi kesalahan server' },
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
          isDemo: camelData.isDemo,
          demoUntil: camelData.demoUntil,
          createdAt: camelData.createdAt,
          validUntil: camelData.validUntil,
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

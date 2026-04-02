// Login endpoint - checks against Supabase Pengguna table
import { supabase } from '@/lib/supabase'
import { toCamelCase } from '@/lib/case-converter'
import { NextRequest, NextResponse } from 'next/server'

const TABLE = 'Pengguna'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password wajib diisi' },
        { status: 400 }
      )
    }

    // Cek user di database
    const { data: user, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Username atau password salah' },
        { status: 401 }
      )
    }

    const camelUser = toCamelCase(user) as Record<string, unknown>

    // Cek apakah demo sudah berakhir
    if (camelUser.isDemo && camelUser.demoUntil) {
      const demoUntil = new Date(camelUser.demoUntil as string)
      if (new Date() > demoUntil) {
        return NextResponse.json(
          { 
            error: 'Masa demo Anda sudah berakhir',
            demoExpired: true,
            demoUntil: camelUser.demoUntil,
          },
          { status: 403 }
        )
      }
    }

    // Cek apakah akun sudah expired
    if (camelUser.validUntil) {
      const validUntil = new Date(camelUser.validUntil as string)
      if (new Date() > validUntil) {
        return NextResponse.json(
          { error: 'Akun Anda sudah expired' },
          { status: 403 }
        )
      }
    }

    // Ambil settings popup dan auto logout
    const { data: popupSetting } = await supabase
      .from('Setting')
      .select('value')
      .eq('key', 'popup_message')
      .single()

    const { data: autoLogoutSetting } = await supabase
      .from('Setting')
      .select('value')
      .eq('key', 'auto_logout_minutes')
      .single()

    return NextResponse.json({
      message: 'Login berhasil',
      user: {
        id: camelUser.id,
        username: camelUser.username,
        namaLengkap: camelUser.namaLengkap,
        nomorHP: camelUser.nomorHP,
        email: camelUser.email,
        role: camelUser.role,
        isDemo: camelUser.isDemo,
        demoUntil: camelUser.demoUntil,
        validUntil: camelUser.validUntil,
      },
      settings: {
        popupMessage: popupSetting?.value || '',
        autoLogoutMinutes: parseInt(autoLogoutSetting?.value || '30', 10),
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

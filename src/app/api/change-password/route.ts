// Change password endpoint
import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

const TABLE = 'Pengguna'

export async function POST(request: NextRequest) {
  try {
    const { userId, oldPassword, newPassword } = await request.json()

    if (!userId || !oldPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Semua field wajib diisi' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password baru minimal 8 karakter' },
        { status: 400 }
      )
    }

    // Cek user dan password lama
    const { data: user, error: findError } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', userId)
      .eq('password', oldPassword)
      .single()

    if (findError || !user) {
      return NextResponse.json(
        { error: 'Password lama tidak sesuai' },
        { status: 401 }
      )
    }

    // Update password
    const { error: updateError } = await supabase
      .from(TABLE)
      .update({ password: newPassword })
      .eq('id', userId)

    if (updateError) {
      console.error('Change password error:', updateError)
      return NextResponse.json(
        { error: 'Gagal mengubah password' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Password berhasil diubah' })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

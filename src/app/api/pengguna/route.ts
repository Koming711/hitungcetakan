// v2 - CRUD pengguna (Supabase)
import { supabase } from '@/lib/supabase'
import { toSnakeCase, toCamelCase } from '@/lib/case-converter'
import { NextRequest, NextResponse } from 'next/server'

const TABLE = 'Pengguna'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Get pengguna error:', error)
      return NextResponse.json(
        { error: 'Gagal mengambil data pengguna' },
        { status: 500 }
      )
    }

    return NextResponse.json(toCamelCase(data))
  } catch (error) {
    console.error('Get pengguna error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data pengguna' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { namaLengkap, nomorHP, email, username, password, role } = body

    if (!namaLengkap || !username || !password || !role) {
      return NextResponse.json(
        { error: 'Nama lengkap, username, password dan role wajib diisi' },
        { status: 400 }
      )
    }

    // Cek duplikat username
    const { data: existing } = await supabase
      .from(TABLE)
      .select('id')
      .eq('username', username)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Username sudah digunakan' },
        { status: 409 }
      )
    }

    const validUntil = new Date()
    validUntil.setFullYear(validUntil.getFullYear() + 1)

    const insertData = toSnakeCase({
      namaLengkap,
      nomorHP: nomorHP || '',
      email: email || '',
      username,
      password,
      role,
      validUntil,
    })

    const { data: pengguna, error } = await supabase
      .from(TABLE)
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Create pengguna error:', error)
      return NextResponse.json(
        { error: 'Gagal menambahkan pengguna' },
        { status: 500 }
      )
    }

    return NextResponse.json(toCamelCase(pengguna), { status: 201 })
  } catch (error) {
    console.error('Create pengguna error:', error)
    return NextResponse.json(
      { error: 'Gagal menambahkan pengguna' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID pengguna diperlukan' },
        { status: 400 }
      )
    }

    // Cek apakah pengguna ada
    const { data: pengguna, error: findError } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single()

    if (findError || !pengguna) {
      return NextResponse.json(
        { error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      )
    }

    if (pengguna.username === 'admin') {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus user admin' },
        { status: 403 }
      )
    }

    const { error: deleteError } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Delete pengguna error:', deleteError)
      return NextResponse.json(
        { error: 'Gagal menghapus pengguna' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Pengguna berhasil dihapus' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete pengguna error:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus pengguna' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, namaLengkap, nomorHP, email, username, password, role } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID pengguna diperlukan' },
        { status: 400 }
      )
    }

    // Cek pengguna ada
    const { data: existing, error: findError } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single()

    if (findError || !existing) {
      return NextResponse.json(
        { error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      )
    }

    // Cek duplikat username jika diubah
    if (username && username !== existing.username) {
      const { data: duplicate } = await supabase
        .from(TABLE)
        .select('id')
        .eq('username', username)
        .single()

      if (duplicate) {
        return NextResponse.json(
          { error: 'Username sudah digunakan' },
          { status: 409 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (namaLengkap) updateData.nama_lengkap = namaLengkap
    if (nomorHP !== undefined) updateData.nomor_hp = nomorHP
    if (email !== undefined) updateData.email = email
    if (username) updateData.username = username
    if (password) updateData.password = password
    if (role) updateData.role = role

    const { data: updated, error: updateError } = await supabase
      .from(TABLE)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Update pengguna error:', updateError)
      return NextResponse.json(
        { error: 'Gagal mengupdate pengguna' },
        { status: 500 }
      )
    }

    return NextResponse.json(toCamelCase(updated))
  } catch (error) {
    console.error('Update pengguna error:', error)
    return NextResponse.json(
      { error: 'Gagal mengupdate pengguna' },
      { status: 500 }
    )
  }
}

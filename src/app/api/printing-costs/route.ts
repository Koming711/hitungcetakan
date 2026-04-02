import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { toSnakeCase, toCamelCase } from '@/lib/case-converter'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')
    let query = supabase
      .from('PrintingCost')
      .select('*')
      .order('created_at', { ascending: false })
    if (userId && userRole !== 'admin') {
      query = query.eq('user_id', userId)
    }
    const { data, error } = await query

    if (error) {
      console.error('Error fetching printing costs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch printing costs', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(toCamelCase(data))
  } catch (error) {
    console.error('Error fetching printing costs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch printing costs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      machineName,
      grammage,
      printAreaWidth,
      printAreaHeight,
      pricePerColor,
      specialColorPrice,
      minimumPrintQuantity,
      priceAboveMinimumPerSheet,
      platePricePerSheet
    } = body

    if (!machineName || !grammage || !printAreaWidth || !printAreaHeight ||
        !pricePerColor || !specialColorPrice || !minimumPrintQuantity ||
        !priceAboveMinimumPerSheet || !platePricePerSheet) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const userId = request.headers.get('x-user-id') || ''
    const { data, error } = await supabase
      .from('PrintingCost')
      .insert([toSnakeCase({
        machineName,
        grammage: parseInt(grammage),
        printAreaWidth: parseFloat(printAreaWidth),
        printAreaHeight: parseFloat(printAreaHeight),
        pricePerColor: parseFloat(pricePerColor),
        specialColorPrice: parseFloat(specialColorPrice),
        minimumPrintQuantity: parseInt(minimumPrintQuantity),
        priceAboveMinimumPerSheet: parseFloat(priceAboveMinimumPerSheet),
        platePricePerSheet: parseFloat(platePricePerSheet),
        userId,
      })])
      .select()

    if (error) {
      console.error('Error creating printing cost:', error)
      return NextResponse.json(
        { error: 'Failed to create printing cost', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(toCamelCase(data?.[0]), { status: 201 })
  } catch (error) {
    console.error('Error creating printing cost:', error)
    return NextResponse.json(
      { error: 'Failed to create printing cost' },
      { status: 500 }
    )
  }
}

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
      .from('PrintingCost')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Printing cost not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(toCamelCase(data))
  } catch (error) {
    console.error('Error fetching printing cost:', error)
    return NextResponse.json(
      { error: 'Failed to fetch printing cost' },
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

    const { data, error } = await supabase
      .from('PrintingCost')
      .update(toSnakeCase({
        machineName,
        grammage: parseInt(grammage),
        printAreaWidth: parseFloat(printAreaWidth),
        printAreaHeight: parseFloat(printAreaHeight),
        pricePerColor: parseFloat(pricePerColor),
        specialColorPrice: parseFloat(specialColorPrice),
        minimumPrintQuantity: parseInt(minimumPrintQuantity),
        priceAboveMinimumPerSheet: parseFloat(priceAboveMinimumPerSheet),
        platePricePerSheet: parseFloat(platePricePerSheet)
      }))
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating printing cost:', error)
      return NextResponse.json(
        { error: 'Failed to update printing cost' },
        { status: 500 }
      )
    }

    return NextResponse.json(toCamelCase(data?.[0]))
  } catch (error) {
    console.error('Error updating printing cost:', error)
    return NextResponse.json(
      { error: 'Failed to update printing cost' },
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
      .from('PrintingCost')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting printing cost:', error)
      return NextResponse.json(
        { error: 'Failed to delete printing cost' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Printing cost deleted successfully' })
  } catch (error) {
    console.error('Error deleting printing cost:', error)
    return NextResponse.json(
      { error: 'Failed to delete printing cost' },
      { status: 500 }
    )
  }
}

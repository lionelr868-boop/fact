import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالوصول' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const existing = await db.inventory.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'العنصر غير موجود' }, { status: 404 })
    }

    const qtyIn = body.qtyIn !== undefined ? parseFloat(body.qtyIn) : existing.qtyIn
    const qtyOut = body.qtyOut !== undefined ? parseFloat(body.qtyOut) : existing.qtyOut
    const qtyBalance = qtyIn - qtyOut

    const item = await db.inventory.update({
      where: { id },
      data: {
        ...(body.itemType && { itemType: body.itemType }),
        ...(body.itemName && { itemName: body.itemName }),
        ...(body.unit && { unit: body.unit }),
        ...(body.qtyIn !== undefined && { qtyIn }),
        ...(body.qtyOut !== undefined && { qtyOut }),
        qtyBalance,
        ...(body.unitCost !== undefined && { unitCost: parseFloat(body.unitCost) }),
        ...(body.alertThreshold !== undefined && { alertThreshold: parseFloat(body.alertThreshold) }),
      },
    })

    const warning = item.alertThreshold > 0 && qtyBalance <= item.alertThreshold

    return NextResponse.json({ success: true, data: { ...item, warning } })
  } catch (error) {
    console.error('Inventory PUT error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء تعديل المخزون' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالوصول' }, { status: 401 })
    }

    const { id } = await params

    const existing = await db.inventory.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'العنصر غير موجود' }, { status: 404 })
    }

    await db.inventory.delete({ where: { id } })
    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('Inventory DELETE error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء حذف المخزون' }, { status: 500 })
  }
}

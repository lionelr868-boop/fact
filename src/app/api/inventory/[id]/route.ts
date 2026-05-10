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

    // Track if qtyIn increased → update lastRestocked
    const restocked = body.qtyIn !== undefined && parseFloat(body.qtyIn) > existing.qtyIn

    const item = await db.inventory.update({
      where: { id },
      data: {
        ...(body.itemType && { itemType: body.itemType }),
        ...(body.subCategory !== undefined && { subCategory: body.subCategory || null }),
        ...(body.itemName && { itemName: body.itemName }),
        ...(body.unit && { unit: body.unit }),
        ...(body.qtyIn !== undefined && { qtyIn }),
        ...(body.qtyOut !== undefined && { qtyOut }),
        qtyBalance,
        ...(body.unitCost !== undefined && { unitCost: parseFloat(body.unitCost) }),
        ...(body.alertThreshold !== undefined && { alertThreshold: parseFloat(body.alertThreshold) }),
        ...(body.supplier !== undefined && { supplier: body.supplier || null }),
        ...(body.expiryDate !== undefined && { expiryDate: body.expiryDate ? new Date(body.expiryDate) : null }),
        ...(body.storageLocation !== undefined && { storageLocation: body.storageLocation || null }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.batchNumber !== undefined && { batchNumber: body.batchNumber || null }),
        ...(body.minimumStock !== undefined && { minimumStock: parseFloat(body.minimumStock) || 0 }),
        ...(body.reorderQuantity !== undefined && { reorderQuantity: parseFloat(body.reorderQuantity) || 0 }),
        ...(body.unitPrice !== undefined && { unitPrice: parseFloat(body.unitPrice) || 0 }),
        ...(restocked && { lastRestocked: new Date() }),
        ...(body.lastRestocked !== undefined && { lastRestocked: body.lastRestocked ? new Date(body.lastRestocked) : null }),
      },
    })

    const warning = item.alertThreshold > 0 && qtyBalance <= item.alertThreshold
    const needsReorder = item.minimumStock > 0 && qtyBalance <= item.minimumStock

    return NextResponse.json({ success: true, data: { ...item, warning, needsReorder } })
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

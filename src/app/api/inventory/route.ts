import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالوصول' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const farmId = searchParams.get('farmId')
    const seasonId = searchParams.get('seasonId')

    const where: Record<string, string> = {}
    if (farmId) where.farmId = farmId
    if (seasonId) where.seasonId = seasonId

    const items = await db.inventory.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    })

    // Add status based on alertThreshold and balance, and include minimumStock/reorder logic
    const enriched = items.map(item => {
      const balance = item.qtyIn - item.qtyOut
      let status = 'green'
      if (item.alertThreshold > 0 && balance <= item.alertThreshold) status = 'red'
      else if (item.alertThreshold > 0 && balance <= item.alertThreshold * 1.5) status = 'yellow'

      // Also check minimumStock for reorder status
      const needsReorder = item.minimumStock > 0 && balance <= item.minimumStock

      return {
        ...item,
        qtyBalance: balance,
        status,
        needsReorder,
      }
    })

    return NextResponse.json({ success: true, data: enriched })
  } catch (error) {
    console.error('Inventory GET error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء جلب المخزون' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالوصول' }, { status: 401 })
    }

    const body = await request.json()
    const {
      farmId, seasonId, itemType, itemName, unit,
      qtyIn, qtyOut, unitCost, alertThreshold,
      subCategory, supplier, expiryDate, storageLocation,
      description, batchNumber, minimumStock, reorderQuantity,
      unitPrice, lastRestocked,
    } = body

    if (!farmId || !seasonId || !itemType || !itemName || !unit) {
      return NextResponse.json({ success: false, error: 'جميع الحقول المطلوبة يجب ملؤها' }, { status: 400 })
    }

    const qtyInVal = parseFloat(qtyIn) || 0
    const qtyOutVal = parseFloat(qtyOut) || 0

    const item = await db.inventory.create({
      data: {
        farmId,
        seasonId,
        itemType,
        subCategory: subCategory || null,
        itemName,
        unit,
        qtyIn: qtyInVal,
        qtyOut: qtyOutVal,
        qtyBalance: qtyInVal - qtyOutVal,
        unitCost: parseFloat(unitCost) || 0,
        alertThreshold: parseFloat(alertThreshold) || 0,
        supplier: supplier || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        storageLocation: storageLocation || null,
        description: description || null,
        batchNumber: batchNumber || null,
        minimumStock: parseFloat(minimumStock) || 0,
        reorderQuantity: parseFloat(reorderQuantity) || 0,
        unitPrice: parseFloat(unitPrice) || 0,
        lastRestocked: lastRestocked ? new Date(lastRestocked) : (qtyInVal > 0 ? new Date() : null),
      },
    })

    return NextResponse.json({ success: true, data: item }, { status: 201 })
  } catch (error) {
    console.error('Inventory POST error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء إضافة المخزون' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'غير مصرح بالوصول' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const itemType = searchParams.get('itemType') || ''
    const farmId = searchParams.get('farmId') || ''
    const seasonId = searchParams.get('seasonId') || ''
    const lowStock = searchParams.get('lowStock') || ''
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (itemType) where.itemType = itemType
    if (farmId) where.farmId = farmId
    if (seasonId) where.seasonId = seasonId
    if (search) {
      where.OR = [
        { itemName: { contains: search } },
        { subCategory: { contains: search } },
        { supplier: { contains: search } },
        { storageLocation: { contains: search } },
      ]
    }
    if (lowStock === 'true') {
      // Items where balance is at or below alert threshold
      where.qtyBalance = { lte: db.inventory.fields.alertThreshold }
    }

    const [inventories, total] = await Promise.all([
      db.inventory.findMany({
        where,
        include: {
          farm: { select: { id: true, name: true, user: { select: { name: true } } } },
          season: { select: { id: true, seasonType: true, year: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.inventory.count({ where }),
    ])

    // Add computed fields
    const formatted = inventories.map(inv => ({
      ...inv,
      totalValue: inv.qtyBalance * inv.unitCost,
      isLowStock: inv.qtyBalance <= inv.alertThreshold && inv.alertThreshold > 0,
    }))

    return NextResponse.json({
      success: true,
      data: formatted,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Admin inventory GET error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء جلب المخزونات' }, { status: 500 })
  }
}

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
    const type = searchParams.get('type') || ''
    const farmId = searchParams.get('farmId') || ''
    const seasonId = searchParams.get('seasonId') || ''
    const categoryId = searchParams.get('categoryId') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (type) where.type = type
    if (seasonId) where.seasonId = seasonId
    if (categoryId) where.categoryId = categoryId
    if (dateFrom || dateTo) {
      where.txnDate = {}
      if (dateFrom) where.txnDate.gte = new Date(dateFrom)
      if (dateTo) where.txnDate.lte = new Date(dateTo)
    }
    if (farmId) {
      where.season = { farmId }
    }

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        include: {
          season: {
            select: {
              id: true, seasonType: true, year: true,
              farm: { select: { id: true, name: true, user: { select: { name: true } } } },
            },
          },
          category: { select: { id: true, nameAr: true, icon: true, color: true } },
        },
        orderBy: { txnDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.transaction.count({ where }),
    ])

    const formatted = transactions.map(tx => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      quantity: tx.quantity,
      unitPrice: tx.unitPrice,
      note: tx.note,
      txnDate: tx.txnDate,
      createdAt: tx.createdAt,
      linkedInventoryId: tx.linkedInventoryId,
      season: tx.season,
      category: tx.category,
      farm: tx.season.farm,
    }))

    return NextResponse.json({
      success: true,
      data: formatted,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Admin transactions GET error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء جلب العمليات' }, { status: 500 })
  }
}

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
    const search = searchParams.get('search') || ''
    const wilaya = searchParams.get('wilaya') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { contractRef: { contains: search } },
        { locationWilaya: { contains: search } },
      ]
    }
    if (wilaya) where.locationWilaya = wilaya

    const [farms, total] = await Promise.all([
      db.farm.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, frozen: true } },
          seasons: {
            select: {
              id: true, seasonType: true, year: true,
              transactions: { select: { type: true, amount: true } },
              inventories: { select: { id: true, itemName: true, qtyBalance: true, unitCost: true } },
            },
          },
          inventories: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.farm.count({ where }),
    ])

    const farmsWithStats = farms.map(farm => {
      let totalIncome = 0
      let totalExpense = 0
      farm.seasons.forEach(season => {
        season.transactions.forEach(tx => {
          if (tx.type === 'income') totalIncome += tx.amount
          else totalExpense += tx.amount
        })
      })
      const profit = totalIncome - totalExpense
      const profitability = totalIncome > 0 ? (profit / totalIncome) * 100 : 0
      const inventoryCount = farm.inventories.length
      const seasonCount = farm.seasons.length
      const transactionCount = farm.seasons.reduce((sum, s) => sum + s.transactions.length, 0)

      return {
        id: farm.id,
        name: farm.name,
        areaHectares: farm.areaHectares,
        locationWilaya: farm.locationWilaya,
        contractRef: farm.contractRef,
        createdAt: farm.createdAt,
        owner: farm.user,
        seasons: farm.seasons.map(s => ({
          id: s.id,
          seasonType: s.seasonType,
          year: s.year,
          transactionCount: s.transactions.length,
          inventoryCount: s.inventories.length,
        })),
        stats: {
          totalIncome,
          totalExpense,
          profit,
          profitability: Math.round(profitability * 100) / 100,
          inventoryCount,
          seasonCount,
          transactionCount,
        },
      }
    })

    return NextResponse.json({
      success: true,
      data: farmsWithStats,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Admin farms GET error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء جلب المستغلات' }, { status: 500 })
  }
}

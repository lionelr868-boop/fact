import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالوصول' }, { status: 401 })
    }

    if (authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'هذه الصفحة مخصصة للمسؤولين فقط' }, { status: 403 })
    }

    // Total counts
    const totalFarms = await db.farm.count()
    const totalUsers = await db.user.count()
    const totalTransactions = await db.transaction.count()
    const totalFarmers = await db.user.count({ where: { role: 'FARMER' } })

    // Financial summary across all farms
    const allTransactions = await db.transaction.findMany()
    const totalIncome = allTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const totalExpense = allTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const avgProfitability = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0

    // Farms by wilaya
    const farms = await db.farm.findMany()
    const farmsByWilaya: Record<string, number> = {}
    farms.forEach(f => {
      farmsByWilaya[f.locationWilaya] = (farmsByWilaya[f.locationWilaya] || 0) + 1
    })

    // Top performing farms
    const topFarms = await Promise.all(
      farms.slice(0, 10).map(async (farm) => {
        const txns = await db.transaction.findMany({
          where: { season: { farmId: farm.id } },
        })
        const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
        const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
        const profit = income - expense
        const profitability = income > 0 ? (profit / income) * 100 : 0
        const user = await db.user.findUnique({ where: { id: farm.userId } })
        return {
          id: farm.id,
          name: farm.name,
          owner: user?.name || 'غير معروف',
          wilaya: farm.locationWilaya,
          area: farm.areaHectares,
          income,
          expense,
          profit,
          profitability: Math.round(profitability * 100) / 100,
        }
      })
    )

    topFarms.sort((a, b) => b.profitability - a.profitability)

    // Recent registrations
    const recentUsers = await db.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, wilaya: true, createdAt: true },
    })

    // Wilaya distribution for chart
    const wilayaDistribution = Object.entries(farmsByWilaya).map(([name, count]) => ({ name, count }))

    return NextResponse.json({
      success: true,
      data: {
        totalFarms,
        totalUsers,
        totalFarmers,
        totalTransactions,
        totalIncome,
        totalExpense,
        avgProfitability: Math.round(avgProfitability * 100) / 100,
        farmsByWilaya: wilayaDistribution,
        topFarms,
        recentUsers,
      },
    })
  } catch (error) {
    console.error('Admin GET error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء جلب بيانات الإدارة' }, { status: 500 })
  }
}

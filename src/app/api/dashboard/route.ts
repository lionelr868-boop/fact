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
    const seasonId = searchParams.get('seasonId')

    // Get user's farm
    const farm = await db.farm.findUnique({
      where: { userId: authUser.id },
    })

    if (!farm) {
      return NextResponse.json({ success: false, error: 'المزرعة غير موجودة' }, { status: 404 })
    }

    // Get or determine current season
    let currentSeasonId = seasonId
    if (!currentSeasonId) {
      const now = new Date()
      const month = now.getMonth() + 1
      const seasonType = month >= 9 || month <= 2 ? 'autumn' : 'spring'
      const year = now.getFullYear()
      const season = await db.season.findFirst({
        where: { farmId: farm.id, seasonType, year },
      })
      if (season) {
        currentSeasonId = season.id
      } else {
        // Fallback to the latest season
        const latestSeason = await db.season.findFirst({
          where: { farmId: farm.id },
          orderBy: { startDate: 'desc' },
        })
        if (latestSeason) currentSeasonId = latestSeason.id
      }
    }

    if (!currentSeasonId) {
      return NextResponse.json({
        success: true,
        data: {
          farm,
          currentSeason: null,
          kpis: [],
          summaries: { totalIncome: 0, totalExpense: 0, netProfit: 0, profitabilityRate: 0 },
          recentTransactions: [],
          inventorySummary: [],
          monthlyData: [],
          seasonComparison: [],
        },
      })
    }

    const currentSeason = await db.season.findUnique({ where: { id: currentSeasonId } })

    // Get all transactions for the season
    const transactions = await db.transaction.findMany({
      where: { seasonId: currentSeasonId },
      include: { category: true },
      orderBy: { txnDate: 'desc' },
    })

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const netProfit = totalIncome - totalExpense
    const profitabilityRate = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0

    // Get inventory
    const inventory = await db.inventory.findMany({
      where: { farmId: farm.id, seasonId: currentSeasonId },
    })

    const totalQtyIn = inventory.reduce((s, i) => s + i.qtyIn, 0)
    const totalQtyOut = inventory.reduce((s, i) => s + i.qtyOut, 0)
    const inventoryUsageRate = totalQtyIn > 0 ? (totalQtyOut / totalQtyIn) * 100 : 0

    // Get previous season for comparison
    const prevSeason = await db.season.findFirst({
      where: {
        farmId: farm.id,
        startDate: { lt: currentSeason?.startDate },
      },
      orderBy: { startDate: 'desc' },
    })

    let prevProfitability = 0
    let profitabilityTrend = 0
    if (prevSeason) {
      const prevTransactions = await db.transaction.findMany({
        where: { seasonId: prevSeason.id },
      })
      const prevIncome = prevTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const prevExpense = prevTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      const prevNet = prevIncome - prevExpense
      prevProfitability = prevIncome > 0 ? (prevNet / prevIncome) * 100 : 0
      profitabilityTrend = profitabilityRate - prevProfitability
    }

    // Count active income categories
    const activeIncomeCategories = new Set(
      transactions.filter(t => t.type === 'income' && t.amount > 0).map(t => t.categoryId)
    ).size

    // Income per hectare
    const incomePerHectare = farm.areaHectares > 0 ? totalIncome / farm.areaHectares : 0

    // Expense coverage ratio
    const expenseCoverageRate = totalExpense > 0 ? (totalIncome / totalExpense) * 100 : 0

    // Calculate governance index (KPI-08)
    const kpiWeights: Record<string, number> = {
      kpi01: 0.25, kpi02: 0.15, kpi03: 0.10,
      kpi04: 0.15, kpi05: 0.10, kpi06: 0.15, kpi07: 0.10
    }

    const kpiValues: Record<string, number> = {
      kpi01: profitabilityRate,
      kpi02: expenseCoverageRate,
      kpi03: Math.min(100, (incomePerHectare / 200000) * 100), // Normalize to 200k DA/hectare
      kpi04: inventoryUsageRate,
      kpi05: 50, // Default for production cost
      kpi06: prevSeason ? Math.max(0, 50 + profitabilityTrend) : 50,
      kpi07: (activeIncomeCategories / 3) * 100,
    }

    const totalWeight = Object.values(kpiWeights).reduce((s, w) => s + w, 0)
    const governanceIndex = Object.entries(kpiWeights).reduce((s, [key, w]) => {
      return s + (kpiValues[key] || 0) * w
    }, 0) / totalWeight

    // Monthly breakdown for charts
    const monthlyData: { month: string; income: number; expense: number }[] = []
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    for (let m = 0; m < 12; m++) {
      const monthIncome = transactions
        .filter(t => t.type === 'income' && new Date(t.txnDate).getMonth() === m)
        .reduce((s, t) => s + t.amount, 0)
      const monthExpense = transactions
        .filter(t => t.type === 'expense' && new Date(t.txnDate).getMonth() === m)
        .reduce((s, t) => s + t.amount, 0)
      if (monthIncome > 0 || monthExpense > 0) {
        monthlyData.push({ month: monthNames[m], income: monthIncome, expense: monthExpense })
      }
    }

    // Category breakdown for pie chart
    const incomeByCategory = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => {
        const name = t.category?.nameAr || 'أخرى'
        acc[name] = (acc[name] || 0) + t.amount
        return acc
      }, {} as Record<string, number>)

    const expenseByCategory = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const name = t.category?.nameAr || 'أخرى'
        acc[name] = (acc[name] || 0) + t.amount
        return acc
      }, {} as Record<string, number>)

    // Season comparison data
    const allSeasons = await db.season.findMany({
      where: { farmId: farm.id },
      orderBy: { startDate: 'asc' },
    })

    const seasonComparison = await Promise.all(
      allSeasons.map(async (s) => {
        const txns = await db.transaction.findMany({ where: { seasonId: s.id } })
        const inc = txns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
        const exp = txns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
        return {
          season: `${s.seasonType === 'autumn' ? 'خريف' : 'ربيع'} ${s.year}`,
          income: inc,
          expense: exp,
          profitability: inc > 0 ? ((inc - exp) / inc) * 100 : 0,
        }
      })
    )

    // Inventory summary
    const inventorySummary = inventory.map(i => ({
      ...i,
      qtyBalance: i.qtyIn - i.qtyOut,
      status: i.qtyIn - i.qtyOut <= i.alertThreshold ? 'red' :
              i.qtyIn - i.qtyOut <= i.alertThreshold * 1.5 ? 'yellow' : 'green'
    }))

    const kpis = [
      { id: 'kpi01', name: 'نسبة الربحية الموسمية', value: Math.round(profitabilityRate * 100) / 100, unit: '%', type: 'gauge', weight: 0.25 },
      { id: 'kpi02', name: 'نسبة تغطية المصاريف', value: Math.round(expenseCoverageRate * 100) / 100, unit: '%', type: 'progress', weight: 0.15 },
      { id: 'kpi03', name: 'هامش المدخول/هكتار', value: Math.round(incomePerHectare), unit: 'دج/هكتار', type: 'number', weight: 0.10 },
      { id: 'kpi04', name: 'نسبة استخدام المخزون', value: Math.round(inventoryUsageRate * 100) / 100, unit: '%', type: 'progress', weight: 0.15 },
      { id: 'kpi05', name: 'تكلفة الإنتاج/وحدة', value: Math.round(totalExpense / (totalQtyOut || 1)), unit: 'دج', type: 'number', weight: 0.10 },
      { id: 'kpi06', name: 'اتجاه الربحية', value: Math.round(profitabilityTrend * 100) / 100, unit: 'نقاط', type: 'trend', weight: 0.15 },
      { id: 'kpi07', name: 'تنويع مصادر الدخل', value: activeIncomeCategories, unit: '/3', type: 'icons', weight: 0.10 },
      { id: 'kpi08', name: 'مؤشر الحوكمة الشامل', value: Math.round(governanceIndex * 100) / 100, unit: '%', type: 'gauge', weight: 1.0 },
    ]

    return NextResponse.json({
      success: true,
      data: {
        farm,
        currentSeason,
        seasons: allSeasons,
        kpis,
        summaries: {
          totalIncome,
          totalExpense,
          netProfit,
          profitabilityRate: Math.round(profitabilityRate * 100) / 100,
        },
        recentTransactions: transactions.slice(0, 5),
        inventorySummary,
        monthlyData,
        incomeByCategory: Object.entries(incomeByCategory).map(([name, value]) => ({ name, value })),
        expenseByCategory: Object.entries(expenseByCategory).map(([name, value]) => ({ name, value })),
        seasonComparison,
      },
    })
  } catch (error) {
    console.error('Dashboard GET error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء جلب بيانات لوحة القيادة' }, { status: 500 })
  }
}

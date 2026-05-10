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
          seasons: [],
          kpis: [],
          summaries: { totalIncome: 0, totalExpense: 0, netProfit: 0, profitabilityRate: 0 },
          recentTransactions: [],
          inventorySummary: [],
          monthlyData: [],
          seasonComparison: [],
          cashFlowData: [],
          inventoryMovement: [],
          inventoryByType: [],
          linkedTransactionsCount: 0,
          inventoryValue: 0,
          inventoryAlerts: [],
        },
      })
    }

    const currentSeason = await db.season.findUnique({ where: { id: currentSeasonId } })

    // Get all transactions for the season with category
    const transactions = await db.transaction.findMany({
      where: { seasonId: currentSeasonId },
      include: { category: true },
      orderBy: { txnDate: 'desc' },
    })

    const incomeTransactions = transactions.filter(t => t.type === 'income')
    const expenseTransactions = transactions.filter(t => t.type === 'expense')

    const totalIncome = incomeTransactions.reduce((s, t) => s + t.amount, 0)
    const totalExpense = expenseTransactions.reduce((s, t) => s + t.amount, 0)
    const netProfit = totalIncome - totalExpense
    const profitabilityRate = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0

    // Linked transactions count (inventory-synced)
    const linkedTransactionsCount = transactions.filter(t => t.linkedInventoryId).length

    // Get inventory
    const inventory = await db.inventory.findMany({
      where: { farmId: farm.id, seasonId: currentSeasonId },
    })

    const totalQtyIn = inventory.reduce((s, i) => s + i.qtyIn, 0)
    const totalQtyOut = inventory.reduce((s, i) => s + i.qtyOut, 0)
    const inventoryUsageRate = totalQtyIn > 0 ? (totalQtyOut / totalQtyIn) * 100 : 0

    // Inventory value (balance * unitCost)
    const inventoryValue = inventory.reduce((s, i) => {
      const balance = i.qtyIn - i.qtyOut
      return s + (balance * (i.unitCost || 0))
    }, 0)

    // Inventory by type with value and balance
    const inventoryByType = inventory.reduce((acc, i) => {
      const balance = i.qtyIn - i.qtyOut
      const existing = acc.find(a => a.type === i.itemType)
      if (existing) {
        existing.qtyIn += i.qtyIn
        existing.qtyOut += i.qtyOut
        existing.balance += balance
        existing.value += balance * (i.unitCost || 0)
        existing.count += 1
      } else {
        acc.push({
          type: i.itemType,
          qtyIn: i.qtyIn,
          qtyOut: i.qtyOut,
          balance,
          value: balance * (i.unitCost || 0),
          count: 1,
        })
      }
      return acc
    }, [] as { type: string; qtyIn: number; qtyOut: number; balance: number; value: number; count: number }[])

    // Inventory alerts (items below threshold or needing reorder)
    const inventoryAlerts = inventory
      .map(i => ({
        ...i,
        qtyBalance: i.qtyIn - i.qtyOut,
        status: i.qtyIn - i.qtyOut <= i.alertThreshold ? 'red' :
                i.qtyIn - i.qtyOut <= i.alertThreshold * 1.5 ? 'yellow' : 'green',
        needsReorder: i.minimumStock > 0 && (i.qtyIn - i.qtyOut) <= i.minimumStock,
      }))
      .filter(i => i.status === 'red' || i.status === 'yellow' || i.needsReorder)

    // Inventory movement data for chart (by subCategory)
    const inventoryMovement = inventory
      .filter(i => i.subCategory)
      .reduce((acc, i) => {
        const existing = acc.find(a => a.category === i.subCategory)
        if (existing) {
          existing.qtyIn += i.qtyIn
          existing.qtyOut += i.qtyOut
        } else {
          acc.push({ category: i.subCategory!, qtyIn: i.qtyIn, qtyOut: i.qtyOut })
        }
        return acc
      }, [] as { category: string; qtyIn: number; qtyOut: number }[])

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
    let prevIncome = 0
    let prevExpense = 0
    if (prevSeason) {
      const prevTransactions = await db.transaction.findMany({
        where: { seasonId: prevSeason.id },
      })
      prevIncome = prevTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      prevExpense = prevTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      const prevNet = prevIncome - prevExpense
      prevProfitability = prevIncome > 0 ? (prevNet / prevIncome) * 100 : 0
      profitabilityTrend = profitabilityRate - prevProfitability
    }

    // Income trend (% change from previous season)
    const incomeTrend = prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : 0
    const expenseTrend = prevExpense > 0 ? ((totalExpense - prevExpense) / prevExpense) * 100 : 0

    // Count active income categories
    const activeIncomeCategories = new Set(
      incomeTransactions.filter(t => t.amount > 0).map(t => t.categoryId)
    ).size
    const totalIncomeCategories = 16 // total possible income categories

    // Income per hectare
    const incomePerHectare = farm.areaHectares > 0 ? totalIncome / farm.areaHectares : 0

    // Expense coverage ratio
    const expenseCoverageRate = totalExpense > 0 ? (totalIncome / totalExpense) * 100 : 0

    // Inventory turnover rate (how quickly inventory is sold/used)
    const avgInventoryValue = inventoryValue > 0 ? inventoryValue : 1
    const inventoryTurnover = (totalExpense / avgInventoryValue)

    // Calculate governance KPIs with more realistic weights
    const kpiWeights: Record<string, number> = {
      kpi01: 0.20, // Profitability
      kpi02: 0.15, // Expense coverage
      kpi03: 0.10, // Income per hectare
      kpi04: 0.12, // Inventory usage
      kpi05: 0.10, // Production cost
      kpi06: 0.13, // Profitability trend
      kpi07: 0.10, // Income diversification
      kpi09: 0.10, // Inventory turnover
    }

    const kpiValues: Record<string, number> = {
      kpi01: Math.max(0, profitabilityRate),
      kpi02: Math.min(200, expenseCoverageRate),
      kpi03: Math.min(100, (incomePerHectare / 200000) * 100),
      kpi04: Math.min(100, inventoryUsageRate),
      kpi05: Math.max(0, 100 - (totalExpense / (totalIncome || 1)) * 100), // Cost efficiency
      kpi06: prevSeason ? Math.max(0, Math.min(100, 50 + profitabilityTrend)) : 50,
      kpi07: Math.min(100, (activeIncomeCategories / totalIncomeCategories) * 100 * 3), // Scale to 100
      kpi09: Math.min(100, inventoryTurnover * 20), // Scale turnover to 0-100
    }

    const totalWeight = Object.values(kpiWeights).reduce((s, w) => s + w, 0)
    const governanceIndex = Object.entries(kpiWeights).reduce((s, [key, w]) => {
      return s + (kpiValues[key] || 0) * w
    }, 0) / totalWeight

    // Monthly breakdown for charts
    const monthlyData: { month: string; income: number; expense: number; net: number }[] = []
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    for (let m = 0; m < 12; m++) {
      const monthIncome = transactions
        .filter(t => t.type === 'income' && new Date(t.txnDate).getMonth() === m)
        .reduce((s, t) => s + t.amount, 0)
      const monthExpense = transactions
        .filter(t => t.type === 'expense' && new Date(t.txnDate).getMonth() === m)
        .reduce((s, t) => s + t.amount, 0)
      if (monthIncome > 0 || monthExpense > 0) {
        monthlyData.push({
          month: monthNames[m],
          income: monthIncome,
          expense: monthExpense,
          net: monthIncome - monthExpense,
        })
      }
    }

    // Category breakdown for pie chart
    const incomeByCategory = incomeTransactions
      .reduce((acc, t) => {
        const name = t.category?.nameAr || 'أخرى'
        acc[name] = (acc[name] || 0) + t.amount
        return acc
      }, {} as Record<string, number>)

    const expenseByCategory = expenseTransactions
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

    // Inventory summary with enriched data
    const inventorySummary = inventory.map(i => ({
      ...i,
      qtyBalance: i.qtyIn - i.qtyOut,
      status: i.qtyIn - i.qtyOut <= i.alertThreshold ? 'red' :
              i.qtyIn - i.qtyOut <= i.alertThreshold * 1.5 ? 'yellow' : 'green',
      needsReorder: i.minimumStock > 0 && (i.qtyIn - i.qtyOut) <= i.minimumStock,
    }))

    // Revenue by category trend (top categories over time)
    const topIncomeCategories = Object.entries(incomeByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name]) => name)

    const revenueTrend = monthlyData.map(m => {
      const entry: Record<string, any> = { month: m.month }
      topIncomeCategories.forEach(cat => {
        entry[cat] = 0
      })
      return entry
    })

    // Fill revenue trend data
    incomeTransactions.forEach(t => {
      const catName = t.category?.nameAr || 'أخرى'
      if (topIncomeCategories.includes(catName)) {
        const monthIdx = new Date(t.txnDate).getMonth()
        const monthName = monthNames[monthIdx]
        const trendEntry = revenueTrend.find(e => e.month === monthName)
        if (trendEntry) {
          trendEntry[catName] = (trendEntry[catName] || 0) + t.amount
        }
      }
    })

    const kpis = [
      { id: 'kpi01', name: 'نسبة الربحية الموسمية', value: Math.round(profitabilityRate * 100) / 100, unit: '%', type: 'gauge', weight: 0.20, desc: 'صافي الربح / إجمالي المداخيل' },
      { id: 'kpi02', name: 'نسبة تغطية المصاريف', value: Math.round(expenseCoverageRate * 100) / 100, unit: '%', type: 'progress', weight: 0.15, desc: 'المداخيل / المصاريف' },
      { id: 'kpi03', name: 'هامش المدخول/هكتار', value: Math.round(incomePerHectare), unit: 'دج/هكتار', type: 'number', weight: 0.10, desc: 'إجمالي المداخيل / المساحة' },
      { id: 'kpi04', name: 'نسبة استخدام المخزون', value: Math.round(inventoryUsageRate * 100) / 100, unit: '%', type: 'progress', weight: 0.12, desc: 'الكمية الخارجة / الكمية الداخلة' },
      { id: 'kpi05', name: 'كفاءة التكلفة', value: Math.round(kpiValues.kpi05 * 100) / 100, unit: '%', type: 'progress', weight: 0.10, desc: '100 - (المصاريف/المداخيل)×100' },
      { id: 'kpi06', name: 'اتجاه الربحية', value: Math.round(profitabilityTrend * 100) / 100, unit: 'نقاط', type: 'trend', weight: 0.13, desc: 'الفرق عن الموسم السابق' },
      { id: 'kpi07', name: 'تنويع مصادر الدخل', value: activeIncomeCategories, unit: `/${totalIncomeCategories}`, type: 'icons', weight: 0.10, desc: 'عدد بنود الدخل النشطة' },
      { id: 'kpi09', name: 'معدل دوران المخزون', value: Math.round(inventoryTurnover * 100) / 100, unit: 'مرة', type: 'number', weight: 0.10, desc: 'المصاريف / متوسط قيمة المخزون' },
      { id: 'kpi08', name: 'مؤشر الحوكمة الشامل', value: Math.round(governanceIndex * 100) / 100, unit: '%', type: 'gauge', weight: 1.0, desc: 'متوسط مرجح لجميع المؤشرات' },
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
          incomeTrend: Math.round(incomeTrend * 100) / 100,
          expenseTrend: Math.round(expenseTrend * 100) / 100,
        },
        recentTransactions: transactions.slice(0, 8),
        inventorySummary,
        monthlyData,
        cashFlowData: monthlyData,
        incomeByCategory: Object.entries(incomeByCategory).map(([name, value]) => ({ name, value })),
        expenseByCategory: Object.entries(expenseByCategory).map(([name, value]) => ({ name, value })),
        seasonComparison,
        inventoryMovement,
        inventoryByType,
        inventoryValue,
        inventoryAlerts,
        linkedTransactionsCount,
        revenueTrend,
        topIncomeCategories,
      },
    })
  } catch (error) {
    console.error('Dashboard GET error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء جلب بيانات لوحة القيادة' }, { status: 500 })
  }
}

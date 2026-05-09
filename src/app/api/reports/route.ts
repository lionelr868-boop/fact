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

    if (!farmId) {
      return NextResponse.json({ success: false, error: 'معرف المزرعة مطلوب' }, { status: 400 })
    }

    const reports = await db.report.findMany({
      where: { farmId },
      orderBy: { generatedAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: reports })
  } catch (error) {
    console.error('Reports GET error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء جلب التقارير' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالوصول' }, { status: 401 })
    }

    const body = await request.json()
    const { farmId, seasonId, reportType } = body

    if (!farmId || !seasonId || !reportType) {
      return NextResponse.json({ success: false, error: 'جميع الحقول مطلوبة' }, { status: 400 })
    }

    // Get season data
    const season = await db.season.findUnique({ where: { id: seasonId } })
    const farm = await db.farm.findUnique({ where: { id: farmId } })
    const user = await db.user.findUnique({ where: { id: farm?.userId } })
    const transactions = await db.transaction.findMany({
      where: { seasonId },
      include: { category: true },
      orderBy: { txnDate: 'asc' },
    })
    const inventory = await db.inventory.findMany({
      where: { farmId, seasonId },
    })

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const netProfit = totalIncome - totalExpense
    const profitabilityRate = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0

    // Get previous season for comparison
    const prevSeason = await db.season.findFirst({
      where: { farmId, startDate: { lt: season?.startDate } },
      orderBy: { startDate: 'desc' },
    })
    let prevTotalIncome = 0, prevTotalExpense = 0, prevNetProfit = 0, prevProfitability = 0
    if (prevSeason) {
      const prevTxns = await db.transaction.findMany({ where: { seasonId: prevSeason.id } })
      prevTotalIncome = prevTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      prevTotalExpense = prevTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      prevNetProfit = prevTotalIncome - prevTotalExpense
      prevProfitability = prevTotalIncome > 0 ? (prevNetProfit / prevTotalIncome) * 100 : 0
    }
    const profitabilityTrend = profitabilityRate - prevProfitability

    // Income per hectare
    const incomePerHectare = (farm?.areaHectares || 0) > 0 ? totalIncome / farm.areaHectares : 0
    const profitPerHectare = (farm?.areaHectares || 0) > 0 ? netProfit / farm.areaHectares : 0

    // Expense coverage
    const expenseCoverageRate = totalExpense > 0 ? (totalIncome / totalExpense) * 100 : 0

    // Inventory usage
    const totalQtyIn = inventory.reduce((s, i) => s + i.qtyIn, 0)
    const totalQtyOut = inventory.reduce((s, i) => s + i.qtyOut, 0)
    const inventoryUsageRate = totalQtyIn > 0 ? (totalQtyOut / totalQtyIn) * 100 : 0

    // Active income categories
    const activeIncomeCategories = new Set(
      transactions.filter(t => t.type === 'income' && t.amount > 0).map(t => t.categoryId)
    ).size

    // Category breakdowns
    const incomeByCategory = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => {
        const name = t.category?.nameAr || 'أخرى'
        if (!acc[name]) acc[name] = 0
        acc[name] += t.amount
        return acc
      }, {} as Record<string, number>)

    const expenseByCategory = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const name = t.category?.nameAr || 'أخرى'
        if (!acc[name]) acc[name] = 0
        acc[name] += t.amount
        return acc
      }, {} as Record<string, number>)

    // Monthly breakdown
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    const monthlyData: { month: string; income: number; expense: number }[] = []
    for (let m = 0; m < 12; m++) {
      const monthIncome = transactions.filter(t => t.type === 'income' && new Date(t.txnDate).getMonth() === m).reduce((s, t) => s + t.amount, 0)
      const monthExpense = transactions.filter(t => t.type === 'expense' && new Date(t.txnDate).getMonth() === m).reduce((s, t) => s + t.amount, 0)
      if (monthIncome > 0 || monthExpense > 0) {
        monthlyData.push({ month: monthNames[m], income: monthIncome, expense: monthExpense })
      }
    }

    // Production cost per unit
    const productionCostPerUnit = totalQtyOut > 0 ? totalExpense / totalQtyOut : 0

    // Governance index (KPI-08)
    const kpiWeights: Record<string, number> = {
      kpi01: 0.25, kpi02: 0.15, kpi03: 0.10,
      kpi04: 0.15, kpi05: 0.10, kpi06: 0.15, kpi07: 0.10
    }
    const kpiValues: Record<string, number> = {
      kpi01: profitabilityRate,
      kpi02: expenseCoverageRate,
      kpi03: Math.min(100, (incomePerHectare / 200000) * 100),
      kpi04: inventoryUsageRate,
      kpi05: 50,
      kpi06: prevSeason ? Math.max(0, 50 + profitabilityTrend) : 50,
      kpi07: (activeIncomeCategories / 3) * 100,
    }
    const totalWeight = Object.values(kpiWeights).reduce((s, w) => s + w, 0)
    const governanceIndex = Object.entries(kpiWeights).reduce((s, [key, w]) => {
      return s + (kpiValues[key] || 0) * w
    }, 0) / totalWeight

    // KPIs array
    const kpis = [
      { id: 'kpi01', name: 'نسبة الربحية الموسمية', value: Math.round(profitabilityRate * 100) / 100, formula: '(صافي الربح ÷ إجمالي المداخيل) × 100', calculation: `(${Math.round(netProfit).toLocaleString('en-US')} ÷ ${Math.round(totalIncome).toLocaleString('en-US')}) × 100 = ${Math.round(profitabilityRate * 100) / 100}%` },
      { id: 'kpi02', name: 'نسبة تغطية المصاريف', value: Math.round(expenseCoverageRate * 100) / 100, formula: '(إجمالي المداخيل ÷ إجمالي المصاريف) × 100', calculation: `(${Math.round(totalIncome).toLocaleString('en-US')} ÷ ${Math.round(totalExpense).toLocaleString('en-US')}) × 100 = ${Math.round(expenseCoverageRate * 100) / 100}%` },
      { id: 'kpi03', name: 'هامش المدخول لكل هكتار', value: Math.round(incomePerHectare), formula: 'إجمالي المداخيل ÷ المساحة بالهكتار', calculation: `${Math.round(totalIncome).toLocaleString('en-US')} ÷ ${farm?.areaHectares || 0} = ${Math.round(incomePerHectare).toLocaleString('en-US')} دج/هكتار` },
      { id: 'kpi04', name: 'نسبة استخدام المخزون', value: Math.round(inventoryUsageRate * 100) / 100, formula: '(إجمالي الكميات الخارجة ÷ إجمالي الكميات الداخلة) × 100', calculation: `(${totalQtyOut} ÷ ${totalQtyIn}) × 100 = ${Math.round(inventoryUsageRate * 100) / 100}%` },
      { id: 'kpi05', name: 'تكلفة الإنتاج لكل وحدة', value: Math.round(productionCostPerUnit), formula: 'إجمالي المصاريف ÷ إجمالي الوحدات المنتجة', calculation: `${Math.round(totalExpense).toLocaleString('en-US')} ÷ ${totalQtyOut} = ${Math.round(productionCostPerUnit).toLocaleString('en-US')} دج` },
      { id: 'kpi06', name: 'اتجاه الربحية', value: Math.round(profitabilityTrend * 100) / 100, formula: 'ربحية الموسم الحالي - ربحية الموسم السابق', calculation: `${Math.round(profitabilityRate * 100) / 100} - ${Math.round(prevProfitability * 100) / 100} = ${Math.round(profitabilityTrend * 100) / 100} نقطة` },
      { id: 'kpi07', name: 'تنويع مصادر الدخل', value: activeIncomeCategories, formula: 'عدد بنود الدخل النشطة', calculation: `${activeIncomeCategories} بنود نشطة من أصل 5` },
      { id: 'kpi08', name: 'مؤشر الحوكمة الشامل', value: Math.round(governanceIndex * 100) / 100, formula: 'المتوسط المرجح لجميع المؤشرات', calculation: `∑(قيمة المؤشر × وزنه) ÷ إجمالي الأوزان = ${Math.round(governanceIndex * 100) / 100}%` },
    ]

    let reportData: Record<string, unknown> = {}

    const commonData = {
      farm: { name: farm?.name, area: farm?.areaHectares, wilaya: farm?.locationWilaya, contractRef: farm?.contractRef },
      owner: user?.name,
      season: { type: season?.seasonType === 'autumn' ? 'خريف' : 'ربيع', year: season?.year, start: season?.startDate, end: season?.endDate },
      generatedAt: new Date().toISOString(),
      summary: {
        totalIncome,
        totalExpense,
        netProfit,
        profitabilityRate: Math.round(profitabilityRate * 100) / 100,
        incomePerHectare: Math.round(incomePerHectare),
        profitPerHectare: Math.round(profitPerHectare),
        expenseCoverageRate: Math.round(expenseCoverageRate * 100) / 100,
      },
      kpis,
    }

    switch (reportType) {
      case 'seasonal_account':
        reportData = {
          title: 'كشف حساب موسمي',
          ...commonData,
          incomeDetails: transactions.filter(t => t.type === 'income').map(t => ({
            category: t.category?.nameAr || 'أخرى',
            amount: t.amount,
            date: t.txnDate,
            note: t.note || '',
          })),
          expenseDetails: transactions.filter(t => t.type === 'expense').map(t => ({
            category: t.category?.nameAr || 'أخرى',
            amount: t.amount,
            date: t.txnDate,
            note: t.note || '',
          })),
          incomeByCategory: Object.entries(incomeByCategory).map(([name, value]) => ({ name, value, pct: totalIncome > 0 ? Math.round((value / totalIncome) * 100) : 0 })),
          expenseByCategory: Object.entries(expenseByCategory).map(([name, value]) => ({ name, value, pct: totalExpense > 0 ? Math.round((value / totalExpense) * 100) : 0 })),
          monthlyData,
          inventorySummary: inventory.map(i => ({
            name: i.itemName,
            type: i.itemType,
            unit: i.unit,
            qtyIn: i.qtyIn,
            qtyOut: i.qtyOut,
            balance: i.qtyIn - i.qtyOut,
            unitCost: i.unitCost,
            totalValue: (i.qtyIn - i.qtyOut) * i.unitCost,
          })),
        }
        break
      case 'profitability':
        reportData = {
          title: 'تقرير الربحية التفصيلي',
          ...commonData,
          byCategory: Object.entries(
            transactions.reduce((acc, t) => {
              const cat = t.category?.nameAr || 'أخرى'
              if (!acc[cat]) acc[cat] = { income: 0, expense: 0, profit: 0, profitability: 0 }
              if (t.type === 'income') acc[cat].income += t.amount
              else acc[cat].expense += t.amount
              acc[cat].profit = acc[cat].income - acc[cat].expense
              acc[cat].profitability = acc[cat].income > 0 ? Math.round(((acc[cat].profit / acc[cat].income) * 100) * 100) / 100 : 0
              return acc
            }, {} as Record<string, { income: number; expense: number; profit: number; profitability: number }>)
          ).map(([name, data]) => ({ name, ...data })),
          monthlyData,
          prevSeasonComparison: prevSeason ? {
            season: `${prevSeason.seasonType === 'autumn' ? 'خريف' : 'ربيع'} ${prevSeason.year}`,
            income: prevTotalIncome,
            expense: prevTotalExpense,
            profit: prevNetProfit,
            profitability: Math.round(prevProfitability * 100) / 100,
            incomeChange: totalIncome - prevTotalIncome,
            expenseChange: totalExpense - prevTotalExpense,
            profitChange: netProfit - prevNetProfit,
          } : null,
        }
        break
      case 'financial_certificate':
        reportData = {
          title: 'شهادة أداء مالي',
          ...commonData,
          financialHealth: profitabilityRate > 30 ? 'ممتاز' : profitabilityRate > 15 ? 'جيد' : 'ضعيف',
          healthScore: Math.round(governanceIndex),
          healthColor: profitabilityRate > 30 ? '#1B5E20' : profitabilityRate > 15 ? '#b8860b' : '#c62828',
        }
        break
      case 'compliance':
        reportData = {
          title: 'تقرير الامتثال والحوكمة',
          ...commonData,
          hasRecords: transactions.length > 0,
          hasInventory: inventory.length > 0,
          recordCount: transactions.length,
          inventoryCount: inventory.length,
          incomeRecordCount: transactions.filter(t => t.type === 'income').length,
          expenseRecordCount: transactions.filter(t => t.type === 'expense').length,
          complianceChecks: [
            { name: 'تسجيل العمليات المالية', status: transactions.length > 0, details: `${transactions.length} عملية مسجلة` },
            { name: 'تسجيل المداخيل', status: transactions.filter(t => t.type === 'income').length > 0, details: `${transactions.filter(t => t.type === 'income').length} عملية مداخيل` },
            { name: 'تسجيل المصاريف', status: transactions.filter(t => t.type === 'expense').length > 0, details: `${transactions.filter(t => t.type === 'expense').length} عملية مصاريف` },
            { name: 'إدارة المخزون', status: inventory.length > 0, details: `${inventory.length} صنف مخزوني` },
            { name: 'ربحية إيجابية', status: netProfit > 0, details: `صافي الربح: ${Math.round(netProfit).toLocaleString('en-US')} دج` },
            { name: 'تنويع مصادر الدخل', status: activeIncomeCategories >= 2, details: `${activeIncomeCategories} مصادر دخل نشطة` },
            { name: 'تغطية المصاريف', status: expenseCoverageRate > 100, details: `${Math.round(expenseCoverageRate)}% نسبة التغطية` },
          ],
        }
        break
      default:
        return NextResponse.json({ success: false, error: 'نوع التقرير غير معروف' }, { status: 400 })
    }

    const report = await db.report.create({
      data: {
        farmId,
        seasonId,
        reportType,
        data: JSON.stringify(reportData),
      },
    })

    return NextResponse.json({ success: true, data: { report, reportData } }, { status: 201 })
  } catch (error) {
    console.error('Reports POST error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء إنشاء التقرير' }, { status: 500 })
  }
}

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
    const transactions = await db.transaction.findMany({
      where: { seasonId },
      include: { category: true },
    })
    const inventory = await db.inventory.findMany({
      where: { farmId, seasonId },
    })

    const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const netProfit = totalIncome - totalExpense
    const profitabilityRate = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0

    let reportData: Record<string, unknown> = {}

    switch (reportType) {
      case 'seasonal_account':
        reportData = {
          title: 'كشف حساب موسمي',
          farm: { name: farm?.name, area: farm?.areaHectares, wilaya: farm?.locationWilaya },
          season: { type: season?.seasonType, year: season?.year },
          summary: { totalIncome, totalExpense, netProfit, profitabilityRate: Math.round(profitabilityRate * 100) / 100 },
          incomeDetails: transactions.filter(t => t.type === 'income').map(t => ({
            category: t.category?.nameAr || 'أخرى', amount: t.amount, date: t.txnDate
          })),
          expenseDetails: transactions.filter(t => t.type === 'expense').map(t => ({
            category: t.category?.nameAr || 'أخرى', amount: t.amount, date: t.txnDate
          })),
        }
        break
      case 'profitability':
        reportData = {
          title: 'تقرير ربحية المحاصيل',
          summary: { totalIncome, totalExpense, netProfit, profitabilityRate: Math.round(profitabilityRate * 100) / 100 },
          byCategory: transactions.reduce((acc, t) => {
            const cat = t.category?.nameAr || 'أخرى'
            if (!acc[cat]) acc[cat] = { income: 0, expense: 0 }
            if (t.type === 'income') acc[cat].income += t.amount
            else acc[cat].expense += t.amount
            return acc
          }, {} as Record<string, { income: number; expense: number }>),
        }
        break
      case 'financial_certificate':
        reportData = {
          title: 'شهادة أداء مالي',
          farm: { name: farm?.name, area: farm?.areaHectares, wilaya: farm?.locationWilaya },
          season: { type: season?.seasonType, year: season?.year },
          financialHealth: profitabilityRate > 30 ? 'ممتاز' : profitabilityRate > 15 ? 'جيد' : 'ضعيف',
          summary: { totalIncome, totalExpense, netProfit },
        }
        break
      case 'compliance':
        reportData = {
          title: 'تقرير الامتثال',
          farm: { name: farm?.name, area: farm?.areaHectares, wilaya: farm?.locationWilaya, contractRef: farm?.contractRef },
          hasRecords: transactions.length > 0,
          hasInventory: inventory.length > 0,
          recordCount: transactions.length,
          inventoryCount: inventory.length,
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

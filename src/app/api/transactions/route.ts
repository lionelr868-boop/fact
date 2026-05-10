import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح بالوصول' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const seasonId = searchParams.get('seasonId')

    if (!seasonId) {
      return NextResponse.json(
        { success: false, error: 'معرف الموسم مطلوب' },
        { status: 400 }
      )
    }

    // Verify season belongs to user's farm
    const season = await db.season.findUnique({
      where: { id: seasonId },
      include: { farm: true },
    })

    if (!season || (authUser.role === 'FARMER' && season.farm.userId !== authUser.id)) {
      return NextResponse.json(
        { success: false, error: 'الموسم غير موجود' },
        { status: 404 }
      )
    }

    // Get transactions with category data
    const transactions = await db.transaction.findMany({
      where: { seasonId },
      include: { category: true },
      orderBy: { txnDate: 'desc' },
    })

    // Calculate summaries
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const netProfit = totalIncome - totalExpense
    const profitabilityRate = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        summaries: {
          totalIncome,
          totalExpense,
          netProfit,
          profitabilityRate: Math.round(profitabilityRate * 100) / 100,
        },
      },
    })
  } catch (error) {
    console.error('Transactions GET error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء جلب المعاملات' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح بالوصول' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, categoryId, amount, txnDate, note, seasonId } = body

    // Validate type
    if (!type || !['income', 'expense'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'نوع المعاملة يجب أن يكون دخل أو مصروف' },
        { status: 400 }
      )
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'المبلغ يجب أن يكون أكبر من صفر' },
        { status: 400 }
      )
    }

    // Determine season
    let targetSeasonId = seasonId
    if (!targetSeasonId && txnDate) {
      // Auto-determine season from date
      const date = new Date(txnDate)
      const month = date.getMonth() + 1 // 0-indexed
      const year = date.getFullYear()
      const seasonType = month >= 9 || month <= 2 ? 'autumn' : 'spring'
      const seasonYear = month >= 9 ? year : year

      // Find user's farm
      const farm = await db.farm.findUnique({ where: { userId: authUser.id } })
      if (farm) {
        const existingSeason = await db.season.findFirst({
          where: { farmId: farm.id, seasonType, year: seasonYear },
        })
        if (existingSeason) {
          targetSeasonId = existingSeason.id
        }
      }
    }

    if (!targetSeasonId) {
      return NextResponse.json(
        { success: false, error: 'معرف الموسم مطلوب أو حدد تاريخ المعاملة' },
        { status: 400 }
      )
    }

    // Verify season exists and belongs to user
    const season = await db.season.findUnique({
      where: { id: targetSeasonId },
      include: { farm: true },
    })

    if (!season || (authUser.role === 'FARMER' && season.farm.userId !== authUser.id)) {
      return NextResponse.json(
        { success: false, error: 'الموسم غير موجود' },
        { status: 404 }
      )
    }

    // Create transaction
    const transaction = await db.transaction.create({
      data: {
        seasonId: targetSeasonId,
        type,
        categoryId: categoryId || null,
        amount: parseFloat(amount),
        txnDate: new Date(txnDate || new Date()),
        note: note || null,
      },
      include: { category: true },
    })

    // Calculate updated summaries
    const allTransactions = await db.transaction.findMany({
      where: { seasonId: targetSeasonId },
    })

    const totalIncome = allTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpense = allTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const netProfit = totalIncome - totalExpense
    const profitabilityRate = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0

    return NextResponse.json({
      success: true,
      data: {
        transaction,
        summaries: {
          totalIncome,
          totalExpense,
          netProfit,
          profitabilityRate: Math.round(profitabilityRate * 100) / 100,
        },
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Transactions POST error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء إنشاء المعاملة' },
      { status: 500 }
    )
  }
}

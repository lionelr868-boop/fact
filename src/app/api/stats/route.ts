import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Total farms
    const totalFarms = await db.farm.count()

    // Total transactions
    const totalTransactions = await db.transaction.count()

    // Total farmers (users with role FARMER)
    const totalFarmers = await db.user.count({
      where: { role: 'FARMER' },
    })

    // Number of wilayas covered (unique wilayas from Farm model)
    const wilayaResult = await db.farm.findMany({
      select: { locationWilaya: true },
      distinct: ['locationWilaya'],
    })
    const totalWilayas = wilayaResult.length

    // Total income and expense across all transactions
    const incomeAgg = await db.transaction.aggregate({
      _sum: { amount: true },
      where: { type: 'income' },
    })
    const expenseAgg = await db.transaction.aggregate({
      _sum: { amount: true },
      where: { type: 'expense' },
    })

    const totalIncome = incomeAgg._sum.amount ?? 0
    const totalExpense = expenseAgg._sum.amount ?? 0
    const netProfit = totalIncome - totalExpense

    // Average profitability rate across farms
    // For each farm, profitability = ((income - expense) / income) * 100
    // We need to compute per-farm income/expense
    const farms = await db.farm.findMany({
      select: {
        id: true,
        seasons: {
          select: {
            transactions: {
              select: { type: true, amount: true },
            },
          },
        },
      },
    })

    let profitabilitySum = 0
    let farmsWithIncome = 0

    for (const farm of farms) {
      let farmIncome = 0
      let farmExpense = 0
      for (const season of farm.seasons) {
        for (const tx of season.transactions) {
          if (tx.type === 'income') farmIncome += tx.amount
          else farmExpense += tx.amount
        }
      }
      if (farmIncome > 0) {
        const profitability = ((farmIncome - farmExpense) / farmIncome) * 100
        profitabilitySum += profitability
        farmsWithIncome++
      }
    }

    const avgProfitability = farmsWithIncome > 0
      ? Math.round((profitabilitySum / farmsWithIncome) * 10) / 10
      : 0

    return NextResponse.json({
      success: true,
      data: {
        totalFarms,
        totalTransactions,
        totalFarmers,
        totalWilayas,
        totalIncome: Math.round(totalIncome),
        totalExpense: Math.round(totalExpense),
        netProfit: Math.round(netProfit),
        avgProfitability,
      },
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}

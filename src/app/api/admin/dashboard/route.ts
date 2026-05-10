import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'غير مصرح بالوصول' }, { status: 403 })
    }

    // Parallel queries for performance
    const [
      totalFarms, totalUsers, totalFarmers, totalAdmins,
      totalTransactions, totalInventory,
      frozenUsers, allTransactions, farms, recentUsers, allInventory,
    ] = await Promise.all([
      db.farm.count(),
      db.user.count(),
      db.user.count({ where: { role: 'FARMER' } }),
      db.user.count({ where: { role: 'ADMIN' } }),
      db.transaction.count(),
      db.inventory.count(),
      db.user.count({ where: { frozen: true } }),
      db.transaction.findMany(),
      db.farm.findMany({
        include: {
          user: { select: { name: true, frozen: true } },
          seasons: { select: { transactions: { select: { type: true, amount: true } } } },
        },
      }),
      db.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, wilaya: true, frozen: true, createdAt: true },
      }),
      db.inventory.findMany(),
    ])

    // Financial calculations
    const totalIncome = allTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const totalExpense = allTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const netProfit = totalIncome - totalExpense
    const avgProfitability = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0

    // Monthly cash flow (last 12 months)
    const now = new Date()
    const monthlyData = []
    const months = ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthIncome = allTransactions
        .filter(t => t.type === 'income' && new Date(t.txnDate).getMonth() === d.getMonth() && new Date(t.txnDate).getFullYear() === d.getFullYear())
        .reduce((s, t) => s + t.amount, 0)
      const monthExpense = allTransactions
        .filter(t => t.type === 'expense' && new Date(t.txnDate).getMonth() === d.getMonth() && new Date(t.txnDate).getFullYear() === d.getFullYear())
        .reduce((s, t) => s + t.amount, 0)
      monthlyData.push({
        month: months[d.getMonth()],
        year: d.getFullYear(),
        income: monthIncome,
        expense: monthExpense,
        net: monthIncome - monthExpense,
      })
    }

    // Farms by wilaya
    const farmsByWilaya: Record<string, number> = {}
    farms.forEach(f => {
      farmsByWilaya[f.locationWilaya] = (farmsByWilaya[f.locationWilaya] || 0) + 1
    })
    const wilayaDistribution = Object.entries(farmsByWilaya).map(([name, count]) => ({ name, count }))

    // Top farms with full stats
    const topFarms = farms.map(farm => {
      let income = 0
      let expense = 0
      farm.seasons.forEach(s => {
        s.transactions.forEach(t => {
          if (t.type === 'income') income += t.amount
          else expense += t.amount
        })
      })
      const profit = income - expense
      const profitability = income > 0 ? (profit / income) * 100 : 0
      return {
        id: farm.id,
        name: farm.name,
        owner: farm.user.name,
        ownerFrozen: farm.user.frozen,
        area: farm.areaHectares,
        wilaya: farm.locationWilaya,
        income, expense, profit,
        profitability: Math.round(profitability * 100) / 100,
      }
    }).sort((a, b) => b.profitability - a.profitability)

    // Inventory by type
    const inventoryByType: Record<string, { count: number; value: number; balance: number }> = {}
    const typeLabels: Record<string, string> = {
      input: 'مدخلات', crop: 'محاصيل', animal_product: 'منتجات حيوانية',
      equipment: 'معدات', feed: 'أعلاف', medication: 'أدوية بيطرية',
    }
    allInventory.forEach(inv => {
      const key = inv.itemType
      if (!inventoryByType[key]) inventoryByType[key] = { count: 0, value: 0, balance: 0 }
      inventoryByType[key].count++
      inventoryByType[key].value += inv.qtyBalance * inv.unitCost
      inventoryByType[key].balance += inv.qtyBalance
    })
    const inventoryByTypeData = Object.entries(inventoryByType).map(([type, data]) => ({
      type: typeLabels[type] || type,
      typeKey: type,
      ...data,
      value: Math.round(data.value),
    }))

    // Low stock alerts
    const lowStockCount = allInventory.filter(inv => inv.qtyBalance <= inv.alertThreshold && inv.alertThreshold > 0).length

    // Transaction type distribution
    const incomeTransactions = allTransactions.filter(t => t.type === 'income').length
    const expenseTransactions = allTransactions.filter(t => t.type === 'expense').length

    // Inventory total value
    const totalInventoryValue = allInventory.reduce((sum, inv) => sum + (inv.qtyBalance * inv.unitCost), 0)

    return NextResponse.json({
      success: true,
      data: {
        // Core counts
        totalFarms, totalUsers, totalFarmers, totalAdmins,
        totalTransactions, totalInventory,
        frozenUsers,

        // Financial
        totalIncome, totalExpense, netProfit,
        avgProfitability: Math.round(avgProfitability * 100) / 100,

        // Inventory
        totalInventoryValue: Math.round(totalInventoryValue),
        lowStockCount,
        inventoryByType: inventoryByTypeData,

        // Distribution
        farmsByWilaya: wilayaDistribution,
        topFarms: topFarms.slice(0, 10),

        // Monthly trend
        monthlyData,

        // Transaction stats
        incomeTransactions, expenseTransactions,

        // Recent
        recentUsers,
      },
    })
  } catch (error) {
    console.error('Admin dashboard GET error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء جلب بيانات لوحة التحكم' }, { status: 500 })
  }
}

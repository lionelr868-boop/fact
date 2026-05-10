import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح بالوصول' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { type, categoryId, amount, txnDate, note } = body

    // Find existing transaction
    const existing = await db.transaction.findUnique({
      where: { id },
      include: { season: { include: { farm: true } } },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'المعاملة غير موجودة' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (authUser.role === 'FARMER' && existing.season.farm.userId !== authUser.id) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح بتعديل هذه المعاملة' },
        { status: 403 }
      )
    }

    // Validate type if provided
    if (type && !['income', 'expense'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'نوع المعاملة يجب أن يكون دخل أو مصروف' },
        { status: 400 }
      )
    }

    // Validate amount if provided
    if (amount !== undefined && amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'المبلغ يجب أن يكون أكبر من صفر' },
        { status: 400 }
      )
    }

    // Update transaction
    const transaction = await db.transaction.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(txnDate && { txnDate: new Date(txnDate) }),
        ...(note !== undefined && { note: note || null }),
      },
      include: { category: true },
    })

    // Recalculate summaries
    const allTransactions = await db.transaction.findMany({
      where: { seasonId: existing.seasonId },
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
    })
  } catch (error) {
    console.error('Transaction PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء تعديل المعاملة' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح بالوصول' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Find existing transaction
    const existing = await db.transaction.findUnique({
      where: { id },
      include: { season: { include: { farm: true } } },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'المعاملة غير موجودة' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (authUser.role === 'FARMER' && existing.season.farm.userId !== authUser.id) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح بحذف هذه المعاملة' },
        { status: 403 }
      )
    }

    const seasonId = existing.seasonId

    // Reverse inventory changes if transaction was linked to inventory
    if (existing.linkedInventoryId) {
      const inventoryItem = await db.inventory.findUnique({
        where: { id: existing.linkedInventoryId },
      })

      if (inventoryItem) {
        const reverseQuantity = existing.quantity || 0

        if (reverseQuantity > 0) {
          if (existing.type === 'income') {
            // Was a sale → had decreased inventory → reverse by decreasing qtyOut
            const newQtyOut = Math.max(0, inventoryItem.qtyOut - reverseQuantity)
            const newQtyBalance = inventoryItem.qtyIn - newQtyOut

            await db.inventory.update({
              where: { id: existing.linkedInventoryId },
              data: {
                qtyOut: newQtyOut,
                qtyBalance: newQtyBalance,
              },
            })
          } else if (existing.type === 'expense') {
            // Was a purchase → had increased inventory → reverse by decreasing qtyIn
            const newQtyIn = Math.max(0, inventoryItem.qtyIn - reverseQuantity)
            const newQtyBalance = newQtyIn - inventoryItem.qtyOut

            await db.inventory.update({
              where: { id: existing.linkedInventoryId },
              data: {
                qtyIn: newQtyIn,
                qtyBalance: newQtyBalance,
              },
            })
          }
        }
      }
    }

    // Delete transaction
    await db.transaction.delete({ where: { id } })

    // Recalculate summaries
    const allTransactions = await db.transaction.findMany({
      where: { seasonId },
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
        summaries: {
          totalIncome,
          totalExpense,
          netProfit,
          profitabilityRate: Math.round(profitabilityRate * 100) / 100,
        },
      },
    })
  } catch (error) {
    console.error('Transaction DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء حذف المعاملة' },
      { status: 500 }
    )
  }
}

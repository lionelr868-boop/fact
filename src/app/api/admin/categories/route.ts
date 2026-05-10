import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'غير مصرح بالوصول' }, { status: 403 })
    }

    const categories = await db.category.findMany({
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }],
      include: {
        _count: { select: { transactions: true } },
      },
    })

    return NextResponse.json({ success: true, data: categories })
  } catch (error) {
    console.error('Admin categories GET error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء جلب البنود' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'غير مصرح بالوصول' }, { status: 403 })
    }

    const body = await request.json()
    const { type, nameAr, icon, color, sortOrder } = body

    if (!type || !nameAr) {
      return NextResponse.json({ success: false, error: 'النوع والاسم مطلوبان' }, { status: 400 })
    }

    const category = await db.category.create({
      data: { type, nameAr, icon: icon || 'Tag', color: color || '#6366f1', sortOrder: sortOrder || 0 },
    })

    return NextResponse.json({ success: true, data: category, message: 'تم إضافة البند بنجاح' })
  } catch (error) {
    console.error('Admin categories POST error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء إضافة البند' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'غير مصرح بالوصول' }, { status: 403 })
    }

    const body = await request.json()
    const { id, type, nameAr, icon, color, sortOrder } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'معرف البند مطلوب' }, { status: 400 })
    }

    const category = await db.category.update({
      where: { id },
      data: { type, nameAr, icon, color, sortOrder },
    })

    return NextResponse.json({ success: true, data: category, message: 'تم تحديث البند بنجاح' })
  } catch (error) {
    console.error('Admin categories PUT error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء تحديث البند' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'غير مصرح بالوصول' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'معرف البند مطلوب' }, { status: 400 })
    }

    // Check if category has transactions
    const transactionCount = await db.transaction.count({ where: { categoryId: id } })
    if (transactionCount > 0) {
      return NextResponse.json({
        success: false,
        error: `لا يمكن حذف هذا البند لأنه مرتبط بـ ${transactionCount} عملية`,
      }, { status: 400 })
    }

    await db.category.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'تم حذف البند بنجاح' })
  } catch (error) {
    console.error('Admin categories DELETE error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء حذف البند' }, { status: 500 })
  }
}

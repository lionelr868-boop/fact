import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'غير مصرح بالوصول' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const frozen = searchParams.get('frozen') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { wilaya: { contains: search } },
      ]
    }
    if (role) where.role = role
    if (frozen === 'true') where.frozen = true
    if (frozen === 'false') where.frozen = false

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, role: true, phone: true,
          wilaya: true, areaHectares: true, productionType: true,
          frozen: true, frozenReason: true, frozenAt: true, lastLoginAt: true,
          createdAt: true,
          farm: {
            select: { id: true, name: true, areaHectares: true, locationWilaya: true, contractRef: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.user.count({ where }),
    ])

    // Get transaction counts per user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        if (user.role === 'FARMER' && user.farm) {
          const seasons = await db.season.findMany({
            where: { farmId: user.farm.id },
            select: { id: true },
          })
          const seasonIds = seasons.map(s => s.id)
          const transactionCount = seasonIds.length > 0
            ? await db.transaction.count({ where: { seasonId: { in: seasonIds } } })
            : 0
          const inventoryCount = seasonIds.length > 0
            ? await db.inventory.count({ where: { seasonId: { in: seasonIds } } })
            : 0
          return { ...user, transactionCount, inventoryCount }
        }
        return { ...user, transactionCount: 0, inventoryCount: 0 }
      })
    )

    return NextResponse.json({
      success: true,
      data: usersWithStats,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Admin users GET error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء جلب المستخدمين' }, { status: 500 })
  }
}

// Freeze/unfreeze user
export async function PUT(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'غير مصرح بالوصول' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, frozen, frozenReason } = body

    if (!userId) {
      return NextResponse.json({ success: false, error: 'معرف المستخدم مطلوب' }, { status: 400 })
    }

    const targetUser = await db.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 })
    }

    if (targetUser.role === 'ADMIN') {
      return NextResponse.json({ success: false, error: 'لا يمكن تجميد حساب المدير' }, { status: 400 })
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        frozen: frozen ?? true,
        frozenReason: frozen ? (frozenReason || 'تجميد من قبل الإدارة') : null,
        frozenAt: frozen ? new Date() : null,
      },
      select: {
        id: true, name: true, email: true, role: true, frozen: true,
        frozenReason: true, frozenAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: frozen ? 'تم تجميد الحساب بنجاح' : 'تم فك تجميد الحساب بنجاح',
    })
  } catch (error) {
    console.error('Admin users PUT error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء تحديث المستخدم' }, { status: 500 })
  }
}

// Delete user
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'غير مصرح بالوصول' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ success: false, error: 'معرف المستخدم مطلوب' }, { status: 400 })
    }

    const targetUser = await db.user.findUnique({ where: { id: userId } })
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 })
    }

    if (targetUser.role === 'ADMIN') {
      return NextResponse.json({ success: false, error: 'لا يمكن حذف حساب المدير' }, { status: 400 })
    }

    await db.user.delete({ where: { id: userId } })

    return NextResponse.json({
      success: true,
      message: 'تم حذف المستخدم وجميع بياناته بنجاح',
    })
  } catch (error) {
    console.error('Admin users DELETE error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء حذف المستخدم' }, { status: 500 })
  }
}

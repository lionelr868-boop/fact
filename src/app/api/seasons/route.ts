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

    if (!farmId && authUser.role === 'FARMER') {
      const farm = await db.farm.findUnique({ where: { userId: authUser.id } })
      if (farm) {
        const seasons = await db.season.findMany({
          where: { farmId: farm.id },
          orderBy: { startDate: 'desc' },
        })
        return NextResponse.json({ success: true, data: seasons })
      }
    }

    const where = farmId ? { farmId } : {}
    const seasons = await db.season.findMany({
      where,
      orderBy: { startDate: 'desc' },
    })

    return NextResponse.json({ success: true, data: seasons })
  } catch (error) {
    console.error('Seasons GET error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء جلب المواسم' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالوصول' }, { status: 401 })
    }

    const body = await request.json()
    const { farmId, seasonType, year } = body

    if (!farmId) {
      return NextResponse.json({ success: false, error: 'معرف المزرعة مطلوب' }, { status: 400 })
    }

    // Auto-determine season type if not provided
    const now = new Date()
    const month = now.getMonth() + 1
    const resolvedType = seasonType || (month >= 9 || month <= 2 ? 'autumn' : 'spring')
    const resolvedYear = year || now.getFullYear()

    // Set dates based on season type
    let startDate: Date
    let endDate: Date
    if (resolvedType === 'autumn') {
      startDate = new Date(resolvedYear, 8, 1) // Sep 1
      endDate = new Date(resolvedYear + 1, 1, 28) // Feb 28
    } else {
      startDate = new Date(resolvedYear, 2, 1) // Mar 1
      endDate = new Date(resolvedYear, 7, 31) // Aug 31
    }

    // Check if season already exists
    const existing = await db.season.findFirst({
      where: { farmId, seasonType: resolvedType, year: resolvedYear },
    })

    if (existing) {
      return NextResponse.json({ success: true, data: existing })
    }

    const season = await db.season.create({
      data: {
        farmId,
        seasonType: resolvedType,
        year: resolvedYear,
        startDate,
        endDate,
      },
    })

    return NextResponse.json({ success: true, data: season }, { status: 201 })
  } catch (error) {
    console.error('Seasons POST error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء إنشاء الموسم' }, { status: 500 })
  }
}

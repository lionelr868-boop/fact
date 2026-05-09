import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role, phone, wilaya, areaHectares, productionType } = body

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبون' },
        { status: 400 }
      )
    }

    // Validate role
    const userRole = role === 'ADMIN' ? 'ADMIN' : 'FARMER'

    // Check if email already exists
    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole,
        phone: phone || null,
        wilaya: wilaya || null,
        areaHectares: areaHectares ? parseFloat(areaHectares) : null,
        productionType: productionType || null,
      },
    })

    // If FARMER role, create farm
    let farm = null
    if (userRole === 'FARMER') {
      farm = await db.farm.create({
        data: {
          userId: user.id,
          name: `مزرعة ${name}`,
          areaHectares: areaHectares ? parseFloat(areaHectares) : 0,
          locationWilaya: wilaya || 'غير محدد',
        },
      })
    }

    // Generate token
    const token = generateToken(user.id)

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      data: {
        user: userWithoutPassword,
        farm,
        token,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء التسجيل' },
      { status: 500 }
    )
  }
}

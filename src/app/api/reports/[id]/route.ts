import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { db } from '@/lib/db'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالوصول' }, { status: 401 })
    }

    const { id } = await params

    const report = await db.report.findUnique({
      where: { id },
      include: { farm: true }
    })

    if (!report) {
      return NextResponse.json({ success: false, error: 'التقرير غير موجود' }, { status: 404 })
    }

    // Verify access
    if (authUser.role === 'FARMER' && report.farm.userId !== authUser.id) {
      return NextResponse.json({ success: false, error: 'غير مصرح لك بحذف هذا التقرير' }, { status: 403 })
    }

    await db.report.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'تم حذف التقرير بنجاح' })
  } catch (error) {
    console.error('Report DELETE error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء حذف التقرير' }, { status: 500 })
  }
}

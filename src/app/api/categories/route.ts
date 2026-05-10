import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Query real categories from database instead of using hardcoded fake IDs
    const categories = await db.category.findMany({
      orderBy: { sortOrder: 'asc' },
    })

    // If no categories exist yet, return the default set (but this shouldn't happen after seed)
    if (categories.length === 0) {
      // Fallback: create default categories with detailed sub-categories
      const defaults = [
        // Income categories
        { type: 'income', nameAr: 'بيع القمح', icon: 'Wheat', color: '#4ade80', sortOrder: 1 },
        { type: 'income', nameAr: 'بيع الشعير', icon: 'Wheat', color: '#86efac', sortOrder: 2 },
        { type: 'income', nameAr: 'بيع البطاطا', icon: 'Carrot', color: '#fbbf24', sortOrder: 3 },
        { type: 'income', nameAr: 'بيع الطماطم', icon: 'Carrot', color: '#ef4444', sortOrder: 4 },
        { type: 'income', nameAr: 'بيع الخضروات', icon: 'Carrot', color: '#34d399', sortOrder: 5 },
        { type: 'income', nameAr: 'بيع الحليب', icon: 'Milk', color: '#f0abfc', sortOrder: 6 },
        { type: 'income', nameAr: 'بيع الأجبان', icon: 'Milk', color: '#e879f9', sortOrder: 7 },
        { type: 'income', nameAr: 'بيع البيض', icon: 'Milk', color: '#fde68a', sortOrder: 8 },
        { type: 'income', nameAr: 'بيع اللحوم', icon: 'Milk', color: '#f87171', sortOrder: 9 },
        { type: 'income', nameAr: 'بيع زيت الزيتون', icon: 'Droplets', color: '#a3e635', sortOrder: 10 },
        { type: 'income', nameAr: 'بيع الحمضيات', icon: 'Carrot', color: '#fb923c', sortOrder: 11 },
        { type: 'income', nameAr: 'بيع البقوليات', icon: 'Wheat', color: '#d4a017', sortOrder: 12 },
        { type: 'income', nameAr: 'دعم حكومي', icon: 'Landmark', color: '#8b5cf6', sortOrder: 13 },
        { type: 'income', nameAr: 'إعانة البذور', icon: 'Landmark', color: '#a78bfa', sortOrder: 14 },
        { type: 'income', nameAr: 'إعانة الري', icon: 'Landmark', color: '#93c5fd', sortOrder: 15 },
        { type: 'income', nameAr: 'أخرى', icon: 'Plus', color: '#6366f1', sortOrder: 16 },
        // Expense categories
        { type: 'expense', nameAr: 'بذور القمح', icon: 'Sprout', color: '#f97316', sortOrder: 1 },
        { type: 'expense', nameAr: 'بذور الخضروات', icon: 'Sprout', color: '#fb923c', sortOrder: 2 },
        { type: 'expense', nameAr: 'بذور البقوليات', icon: 'Sprout', color: '#fdba74', sortOrder: 3 },
        { type: 'expense', nameAr: 'أسمدة NPK', icon: 'FlaskConical', color: '#ef4444', sortOrder: 4 },
        { type: 'expense', nameAr: 'أسمدة عضوية', icon: 'FlaskConical', color: '#dc2626', sortOrder: 5 },
        { type: 'expense', nameAr: 'مبيدات أعشاب', icon: 'FlaskConical', color: '#b91c1c', sortOrder: 6 },
        { type: 'expense', nameAr: 'مبيدات حشرية', icon: 'FlaskConical', color: '#991b1b', sortOrder: 7 },
        { type: 'expense', nameAr: 'ري بالرش', icon: 'Droplets', color: '#3b82f6', sortOrder: 8 },
        { type: 'expense', nameAr: 'ري بالتنقيط', icon: 'Droplets', color: '#60a5fa', sortOrder: 9 },
        { type: 'expense', nameAr: 'عمالة موسمية', icon: 'Users', color: '#a855f7', sortOrder: 10 },
        { type: 'expense', nameAr: 'عمالة دائمة', icon: 'Users', color: '#7c3aed', sortOrder: 11 },
        { type: 'expense', nameAr: 'نقل المحاصيل', icon: 'Truck', color: '#14b8a6', sortOrder: 12 },
        { type: 'expense', nameAr: 'تسويق', icon: 'Truck', color: '#0d9488', sortOrder: 13 },
        { type: 'expense', nameAr: 'صيانة معدات', icon: 'Wrench', color: '#f59e0b', sortOrder: 14 },
        { type: 'expense', nameAr: 'صيانة مباني', icon: 'Wrench', color: '#d97706', sortOrder: 15 },
        { type: 'expense', nameAr: 'أعلاف الماشية', icon: 'Wheat', color: '#65a30d', sortOrder: 16 },
        { type: 'expense', nameAr: 'وقود', icon: 'Truck', color: '#737373', sortOrder: 17 },
        { type: 'expense', nameAr: 'أخرى', icon: 'Plus', color: '#64748b', sortOrder: 18 },
      ]

      const created = await Promise.all(
        defaults.map(d => db.category.create({ data: d }))
      )

      return NextResponse.json({ success: true, data: created })
    }

    return NextResponse.json({ success: true, data: categories })
  } catch (error) {
    console.error('Categories GET error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء جلب البنود' },
      { status: 500 }
    )
  }
}

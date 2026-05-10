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
      // Fallback: create default categories
      const defaults = [
        { type: 'income', nameAr: 'حبوب', icon: 'Wheat', color: '#4ade80', sortOrder: 1 },
        { type: 'income', nameAr: 'خضروات', icon: 'Carrot', color: '#34d399', sortOrder: 2 },
        { type: 'income', nameAr: 'منتجات حيوانية', icon: 'Milk', color: '#fbbf24', sortOrder: 3 },
        { type: 'income', nameAr: 'دعم حكومي', icon: 'Landmark', color: '#8b5cf6', sortOrder: 4 },
        { type: 'income', nameAr: 'أخرى', icon: 'Plus', color: '#6366f1', sortOrder: 5 },
        { type: 'expense', nameAr: 'بذور', icon: 'Sprout', color: '#f97316', sortOrder: 1 },
        { type: 'expense', nameAr: 'أسمدة ومبيدات', icon: 'FlaskConical', color: '#ef4444', sortOrder: 2 },
        { type: 'expense', nameAr: 'ري', icon: 'Droplets', color: '#3b82f6', sortOrder: 3 },
        { type: 'expense', nameAr: 'عمالة', icon: 'HardHat', color: '#a855f7', sortOrder: 4 },
        { type: 'expense', nameAr: 'نقل وتسويق', icon: 'Truck', color: '#14b8a6', sortOrder: 5 },
        { type: 'expense', nameAr: 'صيانة', icon: 'Wrench', color: '#f59e0b', sortOrder: 6 },
        { type: 'expense', nameAr: 'أخرى', icon: 'Plus', color: '#64748b', sortOrder: 7 },
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

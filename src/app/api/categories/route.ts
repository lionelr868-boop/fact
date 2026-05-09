import { NextResponse } from 'next/server'

const categories = [
  // Income categories
  { id: 'inc-1', type: 'income', nameAr: 'حبوب', icon: 'Wheat', color: '#4ade80', sortOrder: 1 },
  { id: 'inc-2', type: 'income', nameAr: 'خضروات', icon: 'Carrot', color: '#34d399', sortOrder: 2 },
  { id: 'inc-3', type: 'income', nameAr: 'منتجات حيوانية', icon: 'Milk', color: '#fbbf24', sortOrder: 3 },
  { id: 'inc-4', type: 'income', nameAr: 'دعم حكومي', icon: 'Landmark', color: '#8b5cf6', sortOrder: 4 },
  { id: 'inc-5', type: 'income', nameAr: 'أخرى', icon: 'Plus', color: '#6366f1', sortOrder: 5 },
  // Expense categories
  { id: 'exp-1', type: 'expense', nameAr: 'بذور', icon: 'Sprout', color: '#f97316', sortOrder: 1 },
  { id: 'exp-2', type: 'expense', nameAr: 'أسمدة ومبيدات', icon: 'FlaskConical', color: '#ef4444', sortOrder: 2 },
  { id: 'exp-3', type: 'expense', nameAr: 'ري', icon: 'Droplets', color: '#3b82f6', sortOrder: 3 },
  { id: 'exp-4', type: 'expense', nameAr: 'عمالة', icon: 'HardHat', color: '#a855f7', sortOrder: 4 },
  { id: 'exp-5', type: 'expense', nameAr: 'نقل وتسويق', icon: 'Truck', color: '#14b8a6', sortOrder: 5 },
  { id: 'exp-6', type: 'expense', nameAr: 'صيانة', icon: 'Wrench', color: '#f59e0b', sortOrder: 6 },
  { id: 'exp-7', type: 'expense', nameAr: 'أخرى', icon: 'Plus', color: '#64748b', sortOrder: 7 },
]

export async function GET() {
  return NextResponse.json({ success: true, data: categories })
}

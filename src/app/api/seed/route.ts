import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    // Check if already seeded
    const existingAdmin = await db.user.findUnique({ where: { email: 'admin@fact.dz' } })
    if (existingAdmin) {
      return NextResponse.json({ success: true, message: 'البيانات موجودة بالفعل', data: { adminEmail: 'admin@fact.dz', farmerEmail: 'fellah@fact.dz' } })
    }

    // Create categories
    const categoriesData = [
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

    const categories = await Promise.all(
      categoriesData.map(c => db.category.create({ data: c }))
    )

    // Create admin user
    const adminHash = await bcrypt.hash('admin123', 12)
    const admin = await db.user.create({
      data: {
        name: 'مدير المنصة',
        email: 'admin@fact.dz',
        password: adminHash,
        role: 'ADMIN',
      },
    })

    // Create farmer user
    const farmerHash = await bcrypt.hash('fellah123', 12)
    const farmer = await db.user.create({
      data: {
        name: 'محمد',
        email: 'fellah@fact.dz',
        password: farmerHash,
        role: 'FARMER',
        phone: '0555123456',
        wilaya: 'مسيلة',
        areaHectares: 5,
        productionType: 'حبوب + خضروات + تربية ماشية صغيرة',
      },
    })

    // Create farm
    const farm = await db.farm.create({
      data: {
        userId: farmer.id,
        name: 'مزرعة محمد',
        areaHectares: 5,
        locationWilaya: 'مسيلة',
        contractRef: 'CN-2024-0042',
      },
    })

    // Create seasons
    const autumnSeason = await db.season.create({
      data: {
        farmId: farm.id,
        seasonType: 'autumn',
        year: 2024,
        startDate: new Date(2024, 8, 1),
        endDate: new Date(2025, 1, 28),
      },
    })

    const springSeason = await db.season.create({
      data: {
        farmId: farm.id,
        seasonType: 'spring',
        year: 2025,
        startDate: new Date(2025, 2, 1),
        endDate: new Date(2025, 7, 31),
      },
    })

    // Find category IDs
    const catMap: Record<string, string> = {}
    categories.forEach(c => { catMap[c.nameAr] = c.id })

    // Create transactions for autumn season (as per spec)
    const transactionsData = [
      { seasonId: autumnSeason.id, type: 'expense', categoryId: catMap['بذور'], amount: 85000, txnDate: new Date(2024, 8, 15), note: 'بذور الحبوب والخضروات' },
      { seasonId: autumnSeason.id, type: 'expense', categoryId: catMap['أسمدة ومبيدات'], amount: 120000, txnDate: new Date(2024, 9, 1), note: 'أسمدة ومبيدات' },
      { seasonId: autumnSeason.id, type: 'expense', categoryId: catMap['ري'], amount: 45000, txnDate: new Date(2024, 9, 15), note: 'تكاليف الري' },
      { seasonId: autumnSeason.id, type: 'expense', categoryId: catMap['عمالة'], amount: 180000, txnDate: new Date(2024, 10, 1), note: 'أجرة العمالة الموسمية' },
      { seasonId: autumnSeason.id, type: 'expense', categoryId: catMap['نقل وتسويق'], amount: 60000, txnDate: new Date(2024, 11, 1), note: 'تكاليف النقل والتسويق' },
      { seasonId: autumnSeason.id, type: 'income', categoryId: catMap['حبوب'], amount: 350000, txnDate: new Date(2025, 0, 15), note: 'إيرادات بيع الحبوب' },
      { seasonId: autumnSeason.id, type: 'income', categoryId: catMap['خضروات'], amount: 280000, txnDate: new Date(2025, 1, 1), note: 'إيرادات بيع الخضروات' },
      { seasonId: autumnSeason.id, type: 'income', categoryId: catMap['منتجات حيوانية'], amount: 95000, txnDate: new Date(2025, 1, 15), note: 'إيرادات بيع المنتجات الحيوانية' },
    ]

    await Promise.all(transactionsData.map(t => db.transaction.create({ data: t })))

    // Create some transactions for spring season too
    const springTransactions = [
      { seasonId: springSeason.id, type: 'expense', categoryId: catMap['بذور'], amount: 92000, txnDate: new Date(2025, 2, 10), note: 'بذور الموسم الربيعي' },
      { seasonId: springSeason.id, type: 'expense', categoryId: catMap['أسمدة ومبيدات'], amount: 95000, txnDate: new Date(2025, 3, 1), note: 'أسمدة' },
      { seasonId: springSeason.id, type: 'expense', categoryId: catMap['ري'], amount: 38000, txnDate: new Date(2025, 3, 15), note: 'ري' },
      { seasonId: springSeason.id, type: 'expense', categoryId: catMap['عمالة'], amount: 150000, txnDate: new Date(2025, 4, 1), note: 'عمالة' },
      { seasonId: springSeason.id, type: 'income', categoryId: catMap['خضروات'], amount: 320000, txnDate: new Date(2025, 5, 15), note: 'بيع خضروات' },
      { seasonId: springSeason.id, type: 'income', categoryId: catMap['حبوب'], amount: 280000, txnDate: new Date(2025, 6, 1), note: 'بيع حبوب' },
    ]

    await Promise.all(springTransactions.map(t => db.transaction.create({ data: t })))

    // Create inventory items
    const inventoryData = [
      { farmId: farm.id, seasonId: autumnSeason.id, itemType: 'input', itemName: 'بذور القمح', unit: 'كيلو', qtyIn: 500, qtyOut: 450, unitCost: 170, alertThreshold: 50 },
      { farmId: farm.id, seasonId: autumnSeason.id, itemType: 'input', itemName: 'أسمدة NPK', unit: 'كيس', qtyIn: 30, qtyOut: 25, unitCost: 4000, alertThreshold: 5 },
      { farmId: farm.id, seasonId: autumnSeason.id, itemType: 'crop', itemName: 'قمح صلب', unit: 'قنطار', qtyIn: 40, qtyOut: 35, unitCost: 8750, alertThreshold: 5 },
      { farmId: farm.id, seasonId: autumnSeason.id, itemType: 'crop', itemName: 'خضروات متنوعة', unit: 'كيلو', qtyIn: 2000, qtyOut: 1800, unitCost: 140, alertThreshold: 200 },
      { farmId: farm.id, seasonId: autumnSeason.id, itemType: 'animal_product', itemName: 'حليب', unit: 'لتر', qtyIn: 500, qtyOut: 500, unitCost: 190, alertThreshold: 50 },
    ]

    await Promise.all(inventoryData.map(i => db.inventory.create({
      data: { ...i, qtyBalance: i.qtyIn - i.qtyOut }
    })))

    return NextResponse.json({
      success: true,
      message: 'تم تهيئة البيانات بنجاح',
      data: {
        admin: { email: 'admin@fact.dz', password: 'admin123' },
        farmer: { email: 'fellah@fact.dz', password: 'fellah123' },
        farm: farm.name,
        seasons: 2,
        transactions: transactionsData.length + springTransactions.length,
        inventory: inventoryData.length,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء تهيئة البيانات' }, { status: 500 })
  }
}

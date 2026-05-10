import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    // Create categories if they don't exist
    const existingCategories = await db.category.findFirst()
    let catMap: Record<string, string> = {}

    if (!existingCategories) {
      const categoriesData = [
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

      const categories = await Promise.all(
        categoriesData.map(c => db.category.create({ data: c }))
      )
      categories.forEach(c => { catMap[c.nameAr] = c.id })
    } else {
      const allCategories = await db.category.findMany()
      allCategories.forEach(c => { catMap[c.nameAr] = c.id })
    }

    // Create admin user if not exists
    const existingAdmin = await db.user.findUnique({ where: { email: 'admin@fact.dz' } })
    if (!existingAdmin) {
      const adminHash = await bcrypt.hash('admin123', 12)
      await db.user.create({
        data: {
          name: 'مدير المنصة',
          email: 'admin@fact.dz',
          password: adminHash,
          role: 'ADMIN',
        },
      })
    }

    // Define all 5 farmers with updated detailed categories and expanded inventory
    const farmersData = [
      {
        name: 'محمد بن أحمد',
        email: 'fellah@fact.dz',
        phone: '0555123456',
        wilaya: 'مسيلة',
        areaHectares: 5,
        productionType: 'حبوب + خضروات + تربية ماشية',
        farmName: 'مزرعة محمد',
        farmWilaya: 'مسيلة',
        farmArea: 5,
        contractRef: 'CN-2024-0042',
        autumnTransactions: [
          { type: 'expense', category: 'بذور القمح', amount: 85000, month: 8, day: 15, note: 'بذور الحبوب والخضروات' },
          { type: 'expense', category: 'أسمدة NPK', amount: 120000, month: 9, day: 1, note: 'أسمدة ومبيدات' },
          { type: 'expense', category: 'ري بالرش', amount: 45000, month: 9, day: 15, note: 'تكاليف الري' },
          { type: 'expense', category: 'عمالة موسمية', amount: 180000, month: 10, day: 1, note: 'أجرة العمالة الموسمية' },
          { type: 'expense', category: 'نقل المحاصيل', amount: 60000, month: 11, day: 1, note: 'تكاليف النقل والتسويق' },
          { type: 'income', category: 'بيع القمح', amount: 350000, month: 0, day: 15, note: 'إيرادات بيع الحبوب' },
          { type: 'income', category: 'بيع الخضروات', amount: 280000, month: 1, day: 1, note: 'إيرادات بيع الخضروات' },
          { type: 'income', category: 'بيع الحليب', amount: 95000, month: 1, day: 15, note: 'إيرادات بيع المنتجات الحيوانية' },
        ],
        springTransactions: [
          { type: 'expense', category: 'بذور الخضروات', amount: 92000, month: 2, day: 10, note: 'بذور الموسم الربيعي' },
          { type: 'expense', category: 'أسمدة NPK', amount: 95000, month: 3, day: 1, note: 'أسمدة' },
          { type: 'expense', category: 'ري بالتنقيط', amount: 38000, month: 3, day: 15, note: 'ري' },
          { type: 'expense', category: 'عمالة موسمية', amount: 150000, month: 4, day: 1, note: 'عمالة' },
          { type: 'income', category: 'بيع الخضروات', amount: 320000, month: 5, day: 15, note: 'بيع خضروات' },
          { type: 'income', category: 'بيع القمح', amount: 280000, month: 6, day: 1, note: 'بيع حبوب' },
        ],
        autumnInventory: [
          { itemType: 'input', itemName: 'بذور القمح', unit: 'كيلو', qtyIn: 500, qtyOut: 450, unitCost: 170, alertThreshold: 50, subCategory: 'بذور', supplier: 'مؤسسة وطنية للبذور', storageLocation: 'مستودع الحبوب', description: 'بذور قمح صلب معتمدة من المعهد الوطني', batchNumber: 'LOT-2024-0012', minimumStock: 50, reorderQuantity: 500, unitPrice: 0, lastRestocked: new Date(2024, 8, 15) },
          { itemType: 'input', itemName: 'بذور الشعير', unit: 'كيلو', qtyIn: 300, qtyOut: 270, unitCost: 140, alertThreshold: 30, subCategory: 'بذور', supplier: 'مؤسسة وطنية للبذور', storageLocation: 'مستودع الحبوب', description: 'بذور شعير عجوة الشتاء', batchNumber: 'LOT-2024-0013', minimumStock: 30, reorderQuantity: 300, unitPrice: 0, lastRestocked: new Date(2024, 8, 18) },
          { itemType: 'input', itemName: 'بذور بطاطا', unit: 'كيلو', qtyIn: 200, qtyOut: 180, unitCost: 220, alertThreshold: 20, subCategory: 'بذور', supplier: 'شركة البذور الممتازة', storageLocation: 'المخزن الرئيسي', description: 'بطاطا بذرة صنف سبودا', expiryDate: new Date(2025, 2, 1), batchNumber: 'LOT-2024-0014', minimumStock: 20, reorderQuantity: 200, unitPrice: 0, lastRestocked: new Date(2024, 9, 5) },
          { itemType: 'input', itemName: 'أسمدة NPK', unit: 'كيس', qtyIn: 30, qtyOut: 25, unitCost: 4000, alertThreshold: 5, subCategory: 'أسمدة', supplier: 'شركة الأمل للأسمدة', storageLocation: 'سقيفة B', description: 'سماد مركب 15-15-15', expiryDate: new Date(2025, 8, 1), batchNumber: 'LOT-2024-0020', minimumStock: 5, reorderQuantity: 30, unitPrice: 0, lastRestocked: new Date(2024, 9, 1) },
          { itemType: 'input', itemName: 'أسمدة فوسفاتية', unit: 'كيس', qtyIn: 20, qtyOut: 17, unitCost: 3500, alertThreshold: 3, subCategory: 'أسمدة', supplier: 'شركة الأمل للأسمدة', storageLocation: 'سقيفة B', description: 'سماد فوسفات ثلاثي 46%', expiryDate: new Date(2026, 0, 1), batchNumber: 'LOT-2024-0021', minimumStock: 3, reorderQuantity: 20, unitPrice: 0, lastRestocked: new Date(2024, 9, 3) },
          { itemType: 'input', itemName: 'مبيدات أعشاب', unit: 'لتر', qtyIn: 15, qtyOut: 12, unitCost: 2800, alertThreshold: 3, subCategory: 'مبيدات', supplier: 'مؤسسة الحماية النباتية', storageLocation: 'المخزن الرئيسي', description: 'مبيد أعشاب عريض الأوراق للقمح', expiryDate: new Date(2025, 5, 1), batchNumber: 'LOT-2024-0030', minimumStock: 3, reorderQuantity: 15, unitPrice: 0, lastRestocked: new Date(2024, 10, 10) },
          { itemType: 'crop', itemName: 'قمح صلب', unit: 'قنطار', qtyIn: 40, qtyOut: 35, unitCost: 8750, alertThreshold: 5, subCategory: 'حبوب', supplier: null, storageLocation: 'مستودع الحبوب', description: 'محصول قمح صلب الموسم الخريفي', batchNumber: 'LOT-2024-0100', minimumStock: 5, reorderQuantity: 0, unitPrice: 11000, lastRestocked: new Date(2025, 0, 15) },
          { itemType: 'crop', itemName: 'شعير', unit: 'قنطار', qtyIn: 25, qtyOut: 22, unitCost: 7000, alertThreshold: 3, subCategory: 'حبوب', supplier: null, storageLocation: 'مستودع الحبوب', description: 'محصول شعير عجوة', batchNumber: 'LOT-2024-0101', minimumStock: 3, reorderQuantity: 0, unitPrice: 8500, lastRestocked: new Date(2025, 1, 5) },
          { itemType: 'crop', itemName: 'خضروات متنوعة', unit: 'كيلو', qtyIn: 2000, qtyOut: 1800, unitCost: 140, alertThreshold: 200, subCategory: 'خضروات', supplier: null, storageLocation: 'سقيفة A', description: 'خضروات شتوية: جزر، لفت، بصل أخضر', batchNumber: 'LOT-2024-0110', minimumStock: 200, reorderQuantity: 0, unitPrice: 200, lastRestocked: new Date(2024, 11, 20) },
          { itemType: 'crop', itemName: 'بطاطا', unit: 'كيلو', qtyIn: 3000, qtyOut: 2600, unitCost: 50, alertThreshold: 300, subCategory: 'خضروات', supplier: null, storageLocation: 'مستودع الحبوب', description: 'بطاطا صنف سبودا محلية', batchNumber: 'LOT-2024-0111', minimumStock: 300, reorderQuantity: 0, unitPrice: 80, lastRestocked: new Date(2024, 11, 25) },
          { itemType: 'animal_product', itemName: 'حليب بقر', unit: 'لتر', qtyIn: 500, qtyOut: 500, unitCost: 190, alertThreshold: 50, subCategory: 'ألبان', supplier: null, storageLocation: 'الإسطبل', description: 'حليب بقر طازج يومي', batchNumber: 'LOT-2024-0200', minimumStock: 50, reorderQuantity: 0, unitPrice: 250, lastRestocked: new Date(2025, 1, 10) },
          { itemType: 'animal_product', itemName: 'بيض دجاج', unit: 'وحدة', qtyIn: 1500, qtyOut: 1400, unitCost: 12, alertThreshold: 100, subCategory: 'بيض', supplier: null, storageLocation: 'قاعة الدواجن', description: 'بيض دجاج طازج', batchNumber: 'LOT-2024-0201', minimumStock: 100, reorderQuantity: 0, unitPrice: 15, lastRestocked: new Date(2025, 1, 12) },
          { itemType: 'feed', itemName: 'أعلاف مركزة', unit: 'كيس', qtyIn: 50, qtyOut: 45, unitCost: 2800, alertThreshold: 5, subCategory: 'أعلاف مركزة', supplier: 'مؤسسة الأعلاف الوطنية', storageLocation: 'الإسطبل', description: 'أعلاف مركزة للماشية 18% بروتين', expiryDate: new Date(2025, 5, 1), batchNumber: 'LOT-2024-0300', minimumStock: 5, reorderQuantity: 50, unitPrice: 0, lastRestocked: new Date(2024, 10, 1) },
        ],
        springInventory: [
          { itemType: 'input', itemName: 'بذور خضروات صيفية', unit: 'كيلو', qtyIn: 200, qtyOut: 180, unitCost: 460, alertThreshold: 20, subCategory: 'بذور', supplier: 'شركة البذور الممتازة', storageLocation: 'المخزن الرئيسي', description: 'بذور خضروات صيفية متنوعة: خيار، كوسا، فاصوليا', expiryDate: new Date(2025, 8, 1), batchNumber: 'LOT-2025-0015', minimumStock: 20, reorderQuantity: 200, unitPrice: 0, lastRestocked: new Date(2025, 2, 10) },
          { itemType: 'input', itemName: 'بذور طماطم', unit: 'غرام', qtyIn: 400, qtyOut: 350, unitCost: 90, alertThreshold: 50, subCategory: 'بذور', supplier: 'شركة البذور الممتازة', storageLocation: 'المخزن الرئيسي', description: 'بذور طماطم صنف مارمندي', expiryDate: new Date(2026, 0, 1), batchNumber: 'LOT-2025-0016', minimumStock: 50, reorderQuantity: 400, unitPrice: 0, lastRestocked: new Date(2025, 2, 12) },
          { itemType: 'input', itemName: 'أسمدة NPK', unit: 'كيس', qtyIn: 25, qtyOut: 20, unitCost: 4000, alertThreshold: 5, subCategory: 'أسمدة', supplier: 'شركة الأمل للأسمدة', storageLocation: 'سقيفة B', description: 'سماد مركب 15-15-15 للموسم الربيعي', expiryDate: new Date(2026, 2, 1), batchNumber: 'LOT-2025-0020', minimumStock: 5, reorderQuantity: 25, unitPrice: 0, lastRestocked: new Date(2025, 3, 1) },
          { itemType: 'input', itemName: 'مبيدات حشرية', unit: 'لتر', qtyIn: 10, qtyOut: 7, unitCost: 3500, alertThreshold: 2, subCategory: 'مبيدات', supplier: 'مؤسسة الحماية النباتية', storageLocation: 'المخزن الرئيسي', description: 'مبيد حشري للخضروات الصيفية', expiryDate: new Date(2025, 8, 1), batchNumber: 'LOT-2025-0031', minimumStock: 2, reorderQuantity: 10, unitPrice: 0, lastRestocked: new Date(2025, 3, 15) },
          { itemType: 'crop', itemName: 'خضروات صيفية', unit: 'كيلو', qtyIn: 2500, qtyOut: 2000, unitCost: 120, alertThreshold: 200, subCategory: 'خضروات', supplier: null, storageLocation: 'سقيفة A', description: 'خضروات صيفية: طماطم، خيار، فلفل', batchNumber: 'LOT-2025-0110', minimumStock: 200, reorderQuantity: 0, unitPrice: 180, lastRestocked: new Date(2025, 5, 15) },
          { itemType: 'crop', itemName: 'بطاطا', unit: 'كيلو', qtyIn: 3000, qtyOut: 2500, unitCost: 50, alertThreshold: 300, subCategory: 'خضروات', supplier: null, storageLocation: 'مستودع الحبوب', description: 'بطاطا ربيعية صنف سبودا', batchNumber: 'LOT-2025-0111', minimumStock: 300, reorderQuantity: 0, unitPrice: 75, lastRestocked: new Date(2025, 5, 20) },
          { itemType: 'crop', itemName: 'قمح ربيعي', unit: 'قنطار', qtyIn: 30, qtyOut: 25, unitCost: 8200, alertThreshold: 5, subCategory: 'حبوب', supplier: null, storageLocation: 'مستودع الحبوب', description: 'قمح ربيعي حصاد يونيو', batchNumber: 'LOT-2025-0102', minimumStock: 5, reorderQuantity: 0, unitPrice: 10500, lastRestocked: new Date(2025, 6, 1) },
          { itemType: 'animal_product', itemName: 'حليب بقر', unit: 'لتر', qtyIn: 600, qtyOut: 550, unitCost: 190, alertThreshold: 50, subCategory: 'ألبان', supplier: null, storageLocation: 'الإسطبل', description: 'حليب بقر ربيعي', batchNumber: 'LOT-2025-0200', minimumStock: 50, reorderQuantity: 0, unitPrice: 250, lastRestocked: new Date(2025, 5, 10) },
          { itemType: 'feed', itemName: 'أعلاف مركزة', unit: 'كيس', qtyIn: 60, qtyOut: 52, unitCost: 2800, alertThreshold: 8, subCategory: 'أعلاف مركزة', supplier: 'مؤسسة الأعلاف الوطنية', storageLocation: 'الإسطبل', description: 'أعلاف مركزة للماشية - الموسم الربيعي', expiryDate: new Date(2025, 10, 1), batchNumber: 'LOT-2025-0300', minimumStock: 8, reorderQuantity: 60, unitPrice: 0, lastRestocked: new Date(2025, 3, 5) },
          { itemType: 'medication', itemName: 'لقاحات ماشية', unit: 'جرعة', qtyIn: 30, qtyOut: 25, unitCost: 1500, alertThreshold: 5, subCategory: 'لقاحات', supplier: 'المعهد الوطني للطب البيطري', storageLocation: 'الإسطبل', description: 'لقاحات حمى الوادي المتصدع والجمرة الخبيثة', expiryDate: new Date(2025, 8, 1), batchNumber: 'LOT-2025-0400', minimumStock: 5, reorderQuantity: 30, unitPrice: 0, lastRestocked: new Date(2025, 3, 20) },
        ],
      },
      {
        name: 'عبد الرحمن بوزيد',
        email: 'abdelrahman@fact.dz',
        phone: '0661234567',
        wilaya: 'سطيف',
        areaHectares: 12,
        productionType: 'حبوب + بقوليات',
        farmName: 'مزرعة بوزيد',
        farmWilaya: 'سطيف',
        farmArea: 12,
        contractRef: 'CN-2024-0108',
        autumnTransactions: [
          { type: 'expense', category: 'بذور القمح', amount: 240000, month: 8, day: 10, note: 'بذور القمح والعدس' },
          { type: 'expense', category: 'أسمدة NPK', amount: 310000, month: 9, day: 5, note: 'أسمدة فوسفاتية ونيتروجينية' },
          { type: 'expense', category: 'ري بالرش', amount: 85000, month: 9, day: 20, note: 'ري بالرش' },
          { type: 'expense', category: 'عمالة موسمية', amount: 420000, month: 10, day: 1, note: 'أجور العمال الموسميين' },
          { type: 'expense', category: 'صيانة معدات', amount: 65000, month: 11, day: 15, note: 'صيانة معدات الري' },
          { type: 'expense', category: 'نقل المحاصيل', amount: 95000, month: 11, day: 25, note: 'نقل المحاصيل للسوق' },
          { type: 'income', category: 'بيع القمح', amount: 850000, month: 0, day: 20, note: 'بيع القمح الصلب' },
          { type: 'income', category: 'بيع الشعير', amount: 420000, month: 1, day: 5, note: 'بيع الشعير' },
          { type: 'income', category: 'إعانة البذور', amount: 180000, month: 1, day: 10, note: 'دعم البذور الحكومي' },
          { type: 'income', category: 'بيع البقوليات', amount: 350000, month: 1, day: 20, note: 'بيع العدس والحمص' },
        ],
        springTransactions: [
          { type: 'expense', category: 'بذور البقوليات', amount: 195000, month: 2, day: 15, note: 'بذور الربيع' },
          { type: 'expense', category: 'أسمدة NPK', amount: 220000, month: 3, day: 1, note: 'أسمدة ومبيدات' },
          { type: 'expense', category: 'ري بالرش', amount: 72000, month: 3, day: 20, note: 'ري' },
          { type: 'expense', category: 'عمالة موسمية', amount: 380000, month: 4, day: 1, note: 'عمالة موسمية' },
          { type: 'expense', category: 'صيانة معدات', amount: 45000, month: 5, day: 10, note: 'صيانة الجرار' },
          { type: 'income', category: 'بيع القمح', amount: 680000, month: 6, day: 15, note: 'بيع حبوب ربيعية' },
          { type: 'income', category: 'بيع البقوليات', amount: 290000, month: 7, day: 1, note: 'بيع بقوليات' },
          { type: 'income', category: 'دعم حكومي', amount: 96000, month: 7, day: 10, note: 'إعانة حكومية' },
        ],
        autumnInventory: [
          { itemType: 'input', itemName: 'بذور القمح الصلب', unit: 'كيلو', qtyIn: 1200, qtyOut: 1100, unitCost: 200, alertThreshold: 100, subCategory: 'بذور', supplier: 'مؤسسة وطنية للبذور', storageLocation: 'مستودع الحبوب', description: 'بذور قمح صلب معتمدة صنف وحدة', batchNumber: 'LOT-2024-0040', minimumStock: 100, reorderQuantity: 1200, unitPrice: 0, lastRestocked: new Date(2024, 8, 10) },
          { itemType: 'input', itemName: 'بذور العدس', unit: 'كيلو', qtyIn: 400, qtyOut: 380, unitCost: 350, alertThreshold: 30, subCategory: 'بذور', supplier: 'شركة البذور الممتازة', storageLocation: 'مستودع الحبوب', description: 'بذور عدس بليوي معتمدة', expiryDate: new Date(2025, 5, 1), batchNumber: 'LOT-2024-0041', minimumStock: 30, reorderQuantity: 400, unitPrice: 0, lastRestocked: new Date(2024, 8, 12) },
          { itemType: 'input', itemName: 'بذور الحمص', unit: 'كيلو', qtyIn: 350, qtyOut: 320, unitCost: 320, alertThreshold: 30, subCategory: 'بذور', supplier: 'شركة البذور الممتازة', storageLocation: 'مستودع الحبوب', description: 'بذور حمص بلدي', expiryDate: new Date(2025, 5, 1), batchNumber: 'LOT-2024-0042', minimumStock: 30, reorderQuantity: 350, unitPrice: 0, lastRestocked: new Date(2024, 8, 15) },
          { itemType: 'input', itemName: 'أسمدة فوسفاتية', unit: 'كيس', qtyIn: 60, qtyOut: 50, unitCost: 3500, alertThreshold: 10, subCategory: 'أسمدة', supplier: 'شركة الأمل للأسمدة', storageLocation: 'سقيفة B', description: 'سماد فوسفات ثلاثي 46% للبقوليات', expiryDate: new Date(2026, 0, 1), batchNumber: 'LOT-2024-0050', minimumStock: 10, reorderQuantity: 60, unitPrice: 0, lastRestocked: new Date(2024, 9, 5) },
          { itemType: 'input', itemName: 'أسمدة NPK', unit: 'كيس', qtyIn: 50, qtyOut: 42, unitCost: 4000, alertThreshold: 8, subCategory: 'أسمدة', supplier: 'شركة الأمل للأسمدة', storageLocation: 'سقيفة B', description: 'سماد مركب 15-15-15 للحبوب', expiryDate: new Date(2025, 8, 1), batchNumber: 'LOT-2024-0051', minimumStock: 8, reorderQuantity: 50, unitPrice: 0, lastRestocked: new Date(2024, 9, 8) },
          { itemType: 'input', itemName: 'مبيدات أعشاب', unit: 'لتر', qtyIn: 25, qtyOut: 20, unitCost: 2500, alertThreshold: 5, subCategory: 'مبيدات', supplier: 'مؤسسة الحماية النباتية', storageLocation: 'المخزن الرئيسي', description: 'مبيد أعشاب ضيق الأوراق للقمح', expiryDate: new Date(2025, 5, 1), batchNumber: 'LOT-2024-0060', minimumStock: 5, reorderQuantity: 25, unitPrice: 0, lastRestocked: new Date(2024, 10, 5) },
          { itemType: 'crop', itemName: 'قمح صلب', unit: 'قنطار', qtyIn: 120, qtyOut: 100, unitCost: 8500, alertThreshold: 10, subCategory: 'حبوب', supplier: null, storageLocation: 'مستودع الحبوب', description: 'محصول قمح صلب سطيف عالي الجودة', batchNumber: 'LOT-2024-0120', minimumStock: 10, reorderQuantity: 0, unitPrice: 11500, lastRestocked: new Date(2025, 0, 20) },
          { itemType: 'crop', itemName: 'شعير', unit: 'قنطار', qtyIn: 60, qtyOut: 50, unitCost: 7200, alertThreshold: 5, subCategory: 'حبوب', supplier: null, storageLocation: 'مستودع الحبوب', description: 'محصول شعير عجوة', batchNumber: 'LOT-2024-0121', minimumStock: 5, reorderQuantity: 0, unitPrice: 9000, lastRestocked: new Date(2025, 1, 5) },
          { itemType: 'crop', itemName: 'عدس', unit: 'كيلو', qtyIn: 800, qtyOut: 750, unitCost: 250, alertThreshold: 50, subCategory: 'بقوليات', supplier: null, storageLocation: 'سقيفة A', description: 'عدس بليوي درجة أولى', batchNumber: 'LOT-2024-0130', minimumStock: 50, reorderQuantity: 0, unitPrice: 380, lastRestocked: new Date(2025, 1, 10) },
          { itemType: 'crop', itemName: 'حمص', unit: 'كيلو', qtyIn: 600, qtyOut: 550, unitCost: 280, alertThreshold: 40, subCategory: 'بقوليات', supplier: null, storageLocation: 'سقيفة A', description: 'حمص بلدي درجة ممتازة', batchNumber: 'LOT-2024-0131', minimumStock: 40, reorderQuantity: 0, unitPrice: 400, lastRestocked: new Date(2025, 1, 15) },
        ],
        springInventory: [
          { itemType: 'input', itemName: 'بذور الحمص', unit: 'كيلو', qtyIn: 500, qtyOut: 450, unitCost: 300, alertThreshold: 40, subCategory: 'بذور', supplier: 'شركة البذور الممتازة', storageLocation: 'مستودع الحبوب', description: 'بذور حمص ربيعي صنف عبود', expiryDate: new Date(2026, 0, 1), batchNumber: 'LOT-2025-0043', minimumStock: 40, reorderQuantity: 500, unitPrice: 0, lastRestocked: new Date(2025, 2, 15) },
          { itemType: 'input', itemName: 'بذور الفول', unit: 'كيلو', qtyIn: 600, qtyOut: 550, unitCost: 180, alertThreshold: 50, subCategory: 'بذور', supplier: 'مؤسسة وطنية للبذور', storageLocation: 'مستودع الحبوب', description: 'بذور فول محلية معتمدة', expiryDate: new Date(2025, 10, 1), batchNumber: 'LOT-2025-0044', minimumStock: 50, reorderQuantity: 600, unitPrice: 0, lastRestocked: new Date(2025, 2, 18) },
          { itemType: 'input', itemName: 'أسمدة NPK', unit: 'كيس', qtyIn: 45, qtyOut: 38, unitCost: 4000, alertThreshold: 7, subCategory: 'أسمدة', supplier: 'شركة الأمل للأسمدة', storageLocation: 'سقيفة B', description: 'سماد مركب للبقوليات الربيعية', expiryDate: new Date(2026, 3, 1), batchNumber: 'LOT-2025-0052', minimumStock: 7, reorderQuantity: 45, unitPrice: 0, lastRestocked: new Date(2025, 3, 1) },
          { itemType: 'input', itemName: 'مبيدات أعشاب', unit: 'لتر', qtyIn: 40, qtyOut: 35, unitCost: 2500, alertThreshold: 5, subCategory: 'مبيدات', supplier: 'مؤسسة الحماية النباتية', storageLocation: 'المخزن الرئيسي', description: 'مبيد أعشاب للبقوليات', expiryDate: new Date(2025, 9, 1), batchNumber: 'LOT-2025-0061', minimumStock: 5, reorderQuantity: 40, unitPrice: 0, lastRestocked: new Date(2025, 3, 10) },
          { itemType: 'input', itemName: 'مستلزمات ري', unit: 'قطعة', qtyIn: 100, qtyOut: 85, unitCost: 350, alertThreshold: 10, subCategory: 'مستلزمات ري', supplier: 'شركة الري الحديث', storageLocation: 'المخزن الرئيسي', description: 'رشاشات وخراطيم ري بالرش', batchNumber: 'LOT-2025-0070', minimumStock: 10, reorderQuantity: 100, unitPrice: 0, lastRestocked: new Date(2025, 3, 20) },
          { itemType: 'crop', itemName: 'حمص', unit: 'كيلو', qtyIn: 600, qtyOut: 500, unitCost: 280, alertThreshold: 50, subCategory: 'بقوليات', supplier: null, storageLocation: 'سقيفة A', description: 'حمص ربيعي درجة أولى', batchNumber: 'LOT-2025-0132', minimumStock: 50, reorderQuantity: 0, unitPrice: 420, lastRestocked: new Date(2025, 6, 1) },
          { itemType: 'crop', itemName: 'فول', unit: 'كيلو', qtyIn: 1500, qtyOut: 1200, unitCost: 180, alertThreshold: 100, subCategory: 'بقوليات', supplier: null, storageLocation: 'سقيفة A', description: 'فول بلدي طازج', batchNumber: 'LOT-2025-0133', minimumStock: 100, reorderQuantity: 0, unitPrice: 280, lastRestocked: new Date(2025, 5, 20) },
          { itemType: 'crop', itemName: 'قمح ربيعي', unit: 'قنطار', qtyIn: 80, qtyOut: 65, unitCost: 8200, alertThreshold: 8, subCategory: 'حبوب', supplier: null, storageLocation: 'مستودع الحبوب', description: 'محصول قمح ربيعي', batchNumber: 'LOT-2025-0122', minimumStock: 8, reorderQuantity: 0, unitPrice: 10500, lastRestocked: new Date(2025, 6, 15) },
          { itemType: 'equipment', itemName: 'أدوات يدوية', unit: 'قطعة', qtyIn: 15, qtyOut: 12, unitCost: 2500, alertThreshold: 3, subCategory: 'أدوات يدوية', supplier: 'مؤسسة المستلزمات الزراعية', storageLocation: 'المخزن الرئيسي', description: 'معاول ومجارف ومناجل', batchNumber: 'LOT-2025-0500', minimumStock: 3, reorderQuantity: 10, unitPrice: 0, lastRestocked: new Date(2025, 2, 25) },
          { itemType: 'crop', itemName: 'عدس ربيعي', unit: 'كيلو', qtyIn: 700, qtyOut: 600, unitCost: 260, alertThreshold: 50, subCategory: 'بقوليات', supplier: null, storageLocation: 'سقيفة A', description: 'عدس ربيعي صنف محلي', batchNumber: 'LOT-2025-0134', minimumStock: 50, reorderQuantity: 0, unitPrice: 400, lastRestocked: new Date(2025, 7, 1) },
        ],
      },
      {
        name: 'فاطمة زهراء',
        email: 'fatima@fact.dz',
        phone: '0778234567',
        wilaya: 'بليدة',
        areaHectares: 3,
        productionType: 'خضروات + أشجار فاكهة',
        farmName: 'مزرعة فاطمة الزهراء',
        farmWilaya: 'بليدة',
        farmArea: 3,
        contractRef: 'CN-2024-0215',
        autumnTransactions: [
          { type: 'expense', category: 'بذور الخضروات', amount: 45000, month: 8, day: 20, note: 'بذور خضروات شتوية' },
          { type: 'expense', category: 'أسمدة عضوية', amount: 65000, month: 9, day: 5, note: 'أسمدة عضوية' },
          { type: 'expense', category: 'ري بالتنقيط', amount: 35000, month: 9, day: 25, note: 'ري بالتنقيط' },
          { type: 'expense', category: 'عمالة موسمية', amount: 120000, month: 10, day: 1, note: 'عمالة جمع المحاصيل' },
          { type: 'expense', category: 'نقل المحاصيل', amount: 40000, month: 11, day: 10, note: 'نقل للسوق الجواري' },
          { type: 'income', category: 'بيع الطماطم', amount: 280000, month: 0, day: 10, note: 'بيع طماطم وخيار' },
          { type: 'income', category: 'بيع البطاطا', amount: 150000, month: 1, day: 5, note: 'بيع بطاطا وبصل' },
          { type: 'income', category: 'بيع الحمضيات', amount: 95000, month: 1, day: 20, note: 'بيع برتقال (أشجار فاكهة)' },
        ],
        springTransactions: [
          { type: 'expense', category: 'بذور الخضروات', amount: 52000, month: 2, day: 20, note: 'بذور خضروات صيفية' },
          { type: 'expense', category: 'مبيدات حشرية', amount: 58000, month: 3, day: 10, note: 'أسمدة ومبيدات' },
          { type: 'expense', category: 'ري بالتنقيط', amount: 42000, month: 4, day: 1, note: 'ري' },
          { type: 'expense', category: 'عمالة موسمية', amount: 95000, month: 5, day: 1, note: 'عمالة' },
          { type: 'expense', category: 'صيانة معدات', amount: 28000, month: 5, day: 20, note: 'صيانة شبكة الري' },
          { type: 'income', category: 'بيع الخضروات', amount: 320000, month: 6, day: 10, note: 'بيع خضروات صيفية' },
          { type: 'income', category: 'بيع الخضروات', amount: 180000, month: 7, day: 5, note: 'بيع فلفل وباذنجان' },
          { type: 'income', category: 'إعانة الري', amount: 60000, month: 7, day: 15, note: 'دعم الري' },
        ],
        autumnInventory: [
          { itemType: 'input', itemName: 'بذور طماطم', unit: 'غرام', qtyIn: 500, qtyOut: 450, unitCost: 90, alertThreshold: 50, subCategory: 'بذور', supplier: 'شركة البذور الممتازة', storageLocation: 'المخزن الرئيسي', description: 'بذور طماطم صنف مارمندي', expiryDate: new Date(2025, 8, 1), batchNumber: 'LOT-2024-0080', minimumStock: 50, reorderQuantity: 500, unitPrice: 0, lastRestocked: new Date(2024, 8, 20) },
          { itemType: 'input', itemName: 'بذور خيار', unit: 'غرام', qtyIn: 300, qtyOut: 260, unitCost: 110, alertThreshold: 30, subCategory: 'بذور', supplier: 'شركة البذور الممتازة', storageLocation: 'المخزن الرئيسي', description: 'بذور خيار صنف بيت ألفا', expiryDate: new Date(2025, 8, 1), batchNumber: 'LOT-2024-0081', minimumStock: 30, reorderQuantity: 300, unitPrice: 0, lastRestocked: new Date(2024, 8, 22) },
          { itemType: 'input', itemName: 'سماد عضوي', unit: 'كيس', qtyIn: 20, qtyOut: 18, unitCost: 2500, alertThreshold: 3, subCategory: 'أسمدة', supplier: 'مؤسسة الأسمدة العضوية', storageLocation: 'سقيفة B', description: 'سماد عضوي مركب من الكمبوست', batchNumber: 'LOT-2024-0090', minimumStock: 3, reorderQuantity: 20, unitPrice: 0, lastRestocked: new Date(2024, 9, 5) },
          { itemType: 'input', itemName: 'أسمدة NPK', unit: 'كيس', qtyIn: 15, qtyOut: 12, unitCost: 4000, alertThreshold: 3, subCategory: 'أسمدة', supplier: 'شركة الأمل للأسمدة', storageLocation: 'سقيفة B', description: 'سماد مركب للخضروات والفواكه', expiryDate: new Date(2025, 8, 1), batchNumber: 'LOT-2024-0091', minimumStock: 3, reorderQuantity: 15, unitPrice: 0, lastRestocked: new Date(2024, 9, 8) },
          { itemType: 'input', itemName: 'مبيدات حشرية', unit: 'لتر', qtyIn: 8, qtyOut: 6, unitCost: 3800, alertThreshold: 2, subCategory: 'مبيدات', supplier: 'مؤسسة الحماية النباتية', storageLocation: 'المخزن الرئيسي', description: 'مبيد حشري بيولوجي للخضروات', expiryDate: new Date(2025, 5, 1), batchNumber: 'LOT-2024-0095', minimumStock: 2, reorderQuantity: 8, unitPrice: 0, lastRestocked: new Date(2024, 10, 10) },
          { itemType: 'crop', itemName: 'طماطم', unit: 'كيلو', qtyIn: 1500, qtyOut: 1400, unitCost: 80, alertThreshold: 100, subCategory: 'خضروات', supplier: null, storageLocation: 'سقيفة A', description: 'طماطم مارمندي بيضاء', batchNumber: 'LOT-2024-0140', minimumStock: 100, reorderQuantity: 0, unitPrice: 120, lastRestocked: new Date(2025, 0, 10) },
          { itemType: 'crop', itemName: 'برتقال', unit: 'كيلو', qtyIn: 2000, qtyOut: 1800, unitCost: 60, alertThreshold: 200, subCategory: 'فواكه', supplier: null, storageLocation: 'مستودع الفواكه', description: 'برتقال أبو سرة بلدي', batchNumber: 'LOT-2024-0150', minimumStock: 200, reorderQuantity: 0, unitPrice: 95, lastRestocked: new Date(2025, 0, 20) },
          { itemType: 'crop', itemName: 'خضروات متنوعة', unit: 'كيلو', qtyIn: 1200, qtyOut: 1000, unitCost: 130, alertThreshold: 100, subCategory: 'خضروات', supplier: null, storageLocation: 'سقيفة A', description: 'خضروات شتوية: جزر، ملفوف، لفت', batchNumber: 'LOT-2024-0141', minimumStock: 100, reorderQuantity: 0, unitPrice: 190, lastRestocked: new Date(2024, 11, 15) },
          { itemType: 'equipment', itemName: 'أدوات يدوية', unit: 'قطعة', qtyIn: 10, qtyOut: 8, unitCost: 2200, alertThreshold: 2, subCategory: 'أدوات يدوية', supplier: 'مؤسسة المستلزمات الزراعية', storageLocation: 'المخزن الرئيسي', description: 'أدوات تقليم وجمع: مقصات، سلال', batchNumber: 'LOT-2024-0510', minimumStock: 2, reorderQuantity: 8, unitPrice: 0, lastRestocked: new Date(2024, 9, 15) },
          { itemType: 'equipment', itemName: 'شبكات ري', unit: 'متر', qtyIn: 500, qtyOut: 420, unitCost: 80, alertThreshold: 50, subCategory: 'شبكات ري', supplier: 'شركة الري الحديث', storageLocation: 'المخزن الرئيسي', description: 'شبكة ري بالتنقيط كاملة', batchNumber: 'LOT-2024-0520', minimumStock: 50, reorderQuantity: 500, unitPrice: 0, lastRestocked: new Date(2024, 9, 20) },
        ],
        springInventory: [
          { itemType: 'input', itemName: 'بذور فلفل', unit: 'غرام', qtyIn: 300, qtyOut: 280, unitCost: 120, alertThreshold: 30, subCategory: 'بذور', supplier: 'شركة البذور الممتازة', storageLocation: 'المخزن الرئيسي', description: 'بذور فلفل أخضر وأحمر', expiryDate: new Date(2026, 0, 1), batchNumber: 'LOT-2025-0082', minimumStock: 30, reorderQuantity: 300, unitPrice: 0, lastRestocked: new Date(2025, 2, 20) },
          { itemType: 'input', itemName: 'بذور باذنجان', unit: 'غرام', qtyIn: 250, qtyOut: 220, unitCost: 100, alertThreshold: 25, subCategory: 'بذور', supplier: 'شركة البذور الممتازة', storageLocation: 'المخزن الرئيسي', description: 'بذور باذنجان أسود بلدي', expiryDate: new Date(2026, 0, 1), batchNumber: 'LOT-2025-0083', minimumStock: 25, reorderQuantity: 250, unitPrice: 0, lastRestocked: new Date(2025, 2, 22) },
          { itemType: 'input', itemName: 'أسمدة NPK', unit: 'كيس', qtyIn: 18, qtyOut: 15, unitCost: 4000, alertThreshold: 3, subCategory: 'أسمدة', supplier: 'شركة الأمل للأسمدة', storageLocation: 'سقيفة B', description: 'سماد مركب للخضروات الصيفية', expiryDate: new Date(2026, 3, 1), batchNumber: 'LOT-2025-0092', minimumStock: 3, reorderQuantity: 18, unitPrice: 0, lastRestocked: new Date(2025, 3, 5) },
          { itemType: 'input', itemName: 'مبيدات حشرية', unit: 'لتر', qtyIn: 12, qtyOut: 9, unitCost: 3800, alertThreshold: 3, subCategory: 'مبيدات', supplier: 'مؤسسة الحماية النباتية', storageLocation: 'المخزن الرئيسي', description: 'مبيد حشري للفواكه والخضروات', expiryDate: new Date(2025, 9, 1), batchNumber: 'LOT-2025-0096', minimumStock: 3, reorderQuantity: 12, unitPrice: 0, lastRestocked: new Date(2025, 4, 10) },
          { itemType: 'input', itemName: 'مستلزمات ري', unit: 'قطعة', qtyIn: 80, qtyOut: 65, unitCost: 400, alertThreshold: 10, subCategory: 'مستلزمات ري', supplier: 'شركة الري الحديث', storageLocation: 'المخزن الرئيسي', description: 'نقاطات وفلترات ري بالتنقيط', batchNumber: 'LOT-2025-0071', minimumStock: 10, reorderQuantity: 80, unitPrice: 0, lastRestocked: new Date(2025, 3, 15) },
          { itemType: 'crop', itemName: 'فلفل', unit: 'كيلو', qtyIn: 800, qtyOut: 700, unitCost: 150, alertThreshold: 80, subCategory: 'خضروات', supplier: null, storageLocation: 'سقيفة A', description: 'فلفل أخضر وأحمر', batchNumber: 'LOT-2025-0142', minimumStock: 80, reorderQuantity: 0, unitPrice: 220, lastRestocked: new Date(2025, 6, 10) },
          { itemType: 'crop', itemName: 'خوخ', unit: 'كيلو', qtyIn: 600, qtyOut: 500, unitCost: 200, alertThreshold: 50, subCategory: 'فواكه', supplier: null, storageLocation: 'مستودع الفواكه', description: 'خوخ بلدي طازج', batchNumber: 'LOT-2025-0151', minimumStock: 50, reorderQuantity: 0, unitPrice: 300, lastRestocked: new Date(2025, 5, 25) },
          { itemType: 'crop', itemName: 'خضروات صيفية', unit: 'كيلو', qtyIn: 1800, qtyOut: 1500, unitCost: 110, alertThreshold: 150, subCategory: 'خضروات', supplier: null, storageLocation: 'سقيفة A', description: 'خضروات صيفية: كوسا، فاصوليا، باذنجان', batchNumber: 'LOT-2025-0143', minimumStock: 150, reorderQuantity: 0, unitPrice: 170, lastRestocked: new Date(2025, 6, 5) },
          { itemType: 'crop', itemName: 'ليمون', unit: 'كيلو', qtyIn: 400, qtyOut: 350, unitCost: 80, alertThreshold: 40, subCategory: 'فواكه', supplier: null, storageLocation: 'مستودع الفواكه', description: 'ليمون بلدي', batchNumber: 'LOT-2025-0152', minimumStock: 40, reorderQuantity: 0, unitPrice: 130, lastRestocked: new Date(2025, 6, 15) },
          { itemType: 'input', itemName: 'مبيدات أعشاب', unit: 'لتر', qtyIn: 6, qtyOut: 4, unitCost: 2800, alertThreshold: 2, subCategory: 'مبيدات', supplier: 'مؤسسة الحماية النباتية', storageLocation: 'المخزن الرئيسي', description: 'مبيد أعشاب بين الخطوط', expiryDate: new Date(2025, 9, 1), batchNumber: 'LOT-2025-0097', minimumStock: 2, reorderQuantity: 6, unitPrice: 0, lastRestocked: new Date(2025, 4, 5) },
        ],
      },
      {
        name: 'يوسف مرابط',
        email: 'youssef@fact.dz',
        phone: '0550987654',
        wilaya: 'تيبازة',
        areaHectares: 8,
        productionType: 'زيتون + حبوب',
        farmName: 'مزرعة مرابط',
        farmWilaya: 'تيبازة',
        farmArea: 8,
        contractRef: 'CN-2024-0332',
        autumnTransactions: [
          { type: 'expense', category: 'بذور القمح', amount: 95000, month: 8, day: 25, note: 'بذور حبوب' },
          { type: 'expense', category: 'أسمدة NPK', amount: 140000, month: 9, day: 10, note: 'أسمدة للزيتون والحبوب' },
          { type: 'expense', category: 'ري بالرش', amount: 55000, month: 10, day: 1, note: 'ري الزيتون' },
          { type: 'expense', category: 'عمالة موسمية', amount: 250000, month: 10, day: 15, note: 'قطف الزيتون' },
          { type: 'expense', category: 'نقل المحاصيل', amount: 70000, month: 11, day: 1, note: 'نقل الزيتون للمعصرة' },
          { type: 'expense', category: 'صيانة معدات', amount: 35000, month: 11, day: 20, note: 'صيانة المعصرة' },
          { type: 'income', category: 'بيع زيت الزيتون', amount: 720000, month: 0, day: 10, note: 'بيع زيت الزيتون' },
          { type: 'income', category: 'بيع القمح', amount: 380000, month: 1, day: 5, note: 'بيع القمح' },
          { type: 'income', category: 'أخرى', amount: 180000, month: 1, day: 20, note: 'بيع زيتون مائدة' },
          { type: 'income', category: 'دعم حكومي', amount: 120000, month: 1, day: 25, note: 'دعم زراعة الزيتون' },
        ],
        springTransactions: [
          { type: 'expense', category: 'بذور القمح', amount: 78000, month: 2, day: 25, note: 'بذور الربيع' },
          { type: 'expense', category: 'أسمدة NPK', amount: 110000, month: 3, day: 10, note: 'أسمدة' },
          { type: 'expense', category: 'ري بالرش', amount: 48000, month: 4, day: 1, note: 'ري' },
          { type: 'expense', category: 'عمالة موسمية', amount: 200000, month: 5, day: 1, note: 'عمالة' },
          { type: 'expense', category: 'تسويق', amount: 55000, month: 6, day: 1, note: 'تسويق' },
          { type: 'income', category: 'بيع القمح', amount: 450000, month: 6, day: 15, note: 'بيع حبوب' },
          { type: 'income', category: 'بيع زيت الزيتون', amount: 350000, month: 7, day: 10, note: 'بيع زيت زيتون جديد' },
          { type: 'income', category: 'دعم حكومي', amount: 85000, month: 7, day: 20, note: 'إعانة' },
        ],
        autumnInventory: [
          { itemType: 'input', itemName: 'بذور القمح', unit: 'كيلو', qtyIn: 800, qtyOut: 750, unitCost: 190, alertThreshold: 80, subCategory: 'بذور', supplier: 'مؤسسة وطنية للبذور', storageLocation: 'مستودع الحبوب', description: 'بذور قمح ربيعي صنف وحدة', batchNumber: 'LOT-2024-0060', minimumStock: 80, reorderQuantity: 800, unitPrice: 0, lastRestocked: new Date(2024, 8, 25) },
          { itemType: 'input', itemName: 'أسمدة بوتاسية', unit: 'كيس', qtyIn: 40, qtyOut: 35, unitCost: 3800, alertThreshold: 5, subCategory: 'أسمدة', supplier: 'شركة الأمل للأسمدة', storageLocation: 'سقيفة B', description: 'سماد بوتاسي للزيتون - يعزز جودة الثمار', expiryDate: new Date(2025, 8, 1), batchNumber: 'LOT-2024-0093', minimumStock: 5, reorderQuantity: 40, unitPrice: 0, lastRestocked: new Date(2024, 9, 10) },
          { itemType: 'input', itemName: 'أسمدة NPK', unit: 'كيس', qtyIn: 35, qtyOut: 30, unitCost: 4000, alertThreshold: 5, subCategory: 'أسمدة', supplier: 'شركة الأمل للأسمدة', storageLocation: 'سقيفة B', description: 'سماد مركب للزيتون والحبوب', expiryDate: new Date(2025, 8, 1), batchNumber: 'LOT-2024-0094', minimumStock: 5, reorderQuantity: 35, unitPrice: 0, lastRestocked: new Date(2024, 9, 12) },
          { itemType: 'input', itemName: 'مبيدات أعشاب', unit: 'لتر', qtyIn: 20, qtyOut: 17, unitCost: 2600, alertThreshold: 3, subCategory: 'مبيدات', supplier: 'مؤسسة الحماية النباتية', storageLocation: 'المخزن الرئيسي', description: 'مبيد أعشاب بين أشجار الزيتون', expiryDate: new Date(2025, 5, 1), batchNumber: 'LOT-2024-0098', minimumStock: 3, reorderQuantity: 20, unitPrice: 0, lastRestocked: new Date(2024, 10, 5) },
          { itemType: 'crop', itemName: 'زيت الزيتون', unit: 'لتر', qtyIn: 2000, qtyOut: 1800, unitCost: 350, alertThreshold: 200, subCategory: 'زيوت', supplier: null, storageLocation: 'المعصرة', description: 'زيت زيتون بكر ممتاز - عصر أول', batchNumber: 'LOT-2024-0160', minimumStock: 200, reorderQuantity: 0, unitPrice: 550, lastRestocked: new Date(2025, 0, 10) },
          { itemType: 'crop', itemName: 'زيتون مائدة', unit: 'كيلو', qtyIn: 1500, qtyOut: 1200, unitCost: 120, alertThreshold: 150, subCategory: 'زيوت', supplier: null, storageLocation: 'سقيفة A', description: 'زيتون أخضر معلب للمائدة', batchNumber: 'LOT-2024-0161', minimumStock: 150, reorderQuantity: 0, unitPrice: 200, lastRestocked: new Date(2025, 0, 15) },
          { itemType: 'crop', itemName: 'قمح', unit: 'قنطار', qtyIn: 60, qtyOut: 50, unitCost: 8000, alertThreshold: 5, subCategory: 'حبوب', supplier: null, storageLocation: 'مستودع الحبوب', description: 'محصول قمح الخريف', batchNumber: 'LOT-2024-0162', minimumStock: 5, reorderQuantity: 0, unitPrice: 10500, lastRestocked: new Date(2025, 1, 5) },
          { itemType: 'crop', itemName: 'شعير', unit: 'قنطار', qtyIn: 35, qtyOut: 30, unitCost: 7000, alertThreshold: 3, subCategory: 'حبوب', supplier: null, storageLocation: 'مستودع الحبوب', description: 'محصول شعير تكميلي', batchNumber: 'LOT-2024-0163', minimumStock: 3, reorderQuantity: 0, unitPrice: 8800, lastRestocked: new Date(2025, 1, 8) },
          { itemType: 'equipment', itemName: 'آلات', unit: 'وحدة', qtyIn: 3, qtyOut: 2, unitCost: 150000, alertThreshold: 1, subCategory: 'آلات', supplier: 'شركة الجرار الزراعية', storageLocation: 'ورشة المزرعة', description: 'جرار زراعي وملحقات حراثة', batchNumber: 'LOT-2024-0530', minimumStock: 1, reorderQuantity: 1, unitPrice: 0, lastRestocked: new Date(2024, 8, 1) },
          { itemType: 'input', itemName: 'مستلزمات ري', unit: 'قطعة', qtyIn: 150, qtyOut: 120, unitCost: 300, alertThreshold: 15, subCategory: 'مستلزمات ري', supplier: 'شركة الري الحديث', storageLocation: 'المخزن الرئيسي', description: 'رشاشات ومحابس لري الزيتون', batchNumber: 'LOT-2024-0072', minimumStock: 15, reorderQuantity: 150, unitPrice: 0, lastRestocked: new Date(2024, 9, 25) },
        ],
        springInventory: [
          { itemType: 'input', itemName: 'مبيدات زيتون', unit: 'لتر', qtyIn: 30, qtyOut: 25, unitCost: 3200, alertThreshold: 5, subCategory: 'مبيدات', supplier: 'مؤسسة الحماية النباتية', storageLocation: 'المخزن الرئيسي', description: 'مبيد خاص بذبابة الزيتون', expiryDate: new Date(2025, 9, 1), batchNumber: 'LOT-2025-0099', minimumStock: 5, reorderQuantity: 30, unitPrice: 0, lastRestocked: new Date(2025, 4, 1) },
          { itemType: 'input', itemName: 'أسمدة NPK', unit: 'كيس', qtyIn: 35, qtyOut: 30, unitCost: 4000, alertThreshold: 5, subCategory: 'أسمدة', supplier: 'شركة الأمل للأسمدة', storageLocation: 'سقيفة B', description: 'سماد مركب ربيعي للزيتون', expiryDate: new Date(2026, 3, 1), batchNumber: 'LOT-2025-0095', minimumStock: 5, reorderQuantity: 35, unitPrice: 0, lastRestocked: new Date(2025, 3, 10) },
          { itemType: 'input', itemName: 'بذور القمح', unit: 'كيلو', qtyIn: 700, qtyOut: 650, unitCost: 190, alertThreshold: 70, subCategory: 'بذور', supplier: 'مؤسسة وطنية للبذور', storageLocation: 'مستودع الحبوب', description: 'بذور قمح ربيعي', batchNumber: 'LOT-2025-0061', minimumStock: 70, reorderQuantity: 700, unitPrice: 0, lastRestocked: new Date(2025, 2, 25) },
          { itemType: 'input', itemName: 'مستلزمات ري', unit: 'قطعة', qtyIn: 100, qtyOut: 80, unitCost: 350, alertThreshold: 10, subCategory: 'مستلزمات ري', supplier: 'شركة الري الحديث', storageLocation: 'المخزن الرئيسي', description: 'قطع غيار شبكة ري الزيتون', batchNumber: 'LOT-2025-0073', minimumStock: 10, reorderQuantity: 100, unitPrice: 0, lastRestocked: new Date(2025, 3, 15) },
          { itemType: 'crop', itemName: 'زيت الزيتون', unit: 'لتر', qtyIn: 1000, qtyOut: 900, unitCost: 350, alertThreshold: 100, subCategory: 'زيوت', supplier: null, storageLocation: 'المعصرة', description: 'زيت زيتون بكر - عصر ربيعي', batchNumber: 'LOT-2025-0164', minimumStock: 100, reorderQuantity: 0, unitPrice: 530, lastRestocked: new Date(2025, 7, 10) },
          { itemType: 'crop', itemName: 'قمح ربيعي', unit: 'قنطار', qtyIn: 40, qtyOut: 30, unitCost: 8200, alertThreshold: 5, subCategory: 'حبوب', supplier: null, storageLocation: 'مستودع الحبوب', description: 'محصول قمح ربيعي', batchNumber: 'LOT-2025-0165', minimumStock: 5, reorderQuantity: 0, unitPrice: 10500, lastRestocked: new Date(2025, 6, 15) },
          { itemType: 'crop', itemName: 'زيتون مائدة', unit: 'كيلو', qtyIn: 800, qtyOut: 700, unitCost: 130, alertThreshold: 80, subCategory: 'زيوت', supplier: null, storageLocation: 'سقيفة A', description: 'زيتون مائدة ربيعي أسود', batchNumber: 'LOT-2025-0166', minimumStock: 80, reorderQuantity: 0, unitPrice: 210, lastRestocked: new Date(2025, 7, 5) },
          { itemType: 'input', itemName: 'مبيدات حشرية', unit: 'لتر', qtyIn: 15, qtyOut: 12, unitCost: 3500, alertThreshold: 3, subCategory: 'مبيدات', supplier: 'مؤسسة الحماية النباتية', storageLocation: 'المخزن الرئيسي', description: 'مبيد حشرات عام للحبوب', expiryDate: new Date(2025, 10, 1), batchNumber: 'LOT-2025-0100', minimumStock: 3, reorderQuantity: 15, unitPrice: 0, lastRestocked: new Date(2025, 4, 15) },
          { itemType: 'input', itemName: 'أسمدة عضوية', unit: 'كيس', qtyIn: 25, qtyOut: 20, unitCost: 2500, alertThreshold: 5, subCategory: 'أسمدة', supplier: 'مؤسسة الأسمدة العضوية', storageLocation: 'سقيفة B', description: 'سماد عضوي لتسميد أشجار الزيتون', batchNumber: 'LOT-2025-0096', minimumStock: 5, reorderQuantity: 25, unitPrice: 0, lastRestocked: new Date(2025, 3, 20) },
          { itemType: 'equipment', itemName: 'شبكات ري', unit: 'متر', qtyIn: 300, qtyOut: 250, unitCost: 90, alertThreshold: 30, subCategory: 'شبكات ري', supplier: 'شركة الري الحديث', storageLocation: 'المخزن الرئيسي', description: 'شبكة ري بالرش لأشجار الزيتون', batchNumber: 'LOT-2025-0521', minimumStock: 30, reorderQuantity: 300, unitPrice: 0, lastRestocked: new Date(2025, 3, 25) },
        ],
      },
      {
        name: 'خديجة بلقاسم',
        email: 'khadija@fact.dz',
        phone: '0665345678',
        wilaya: 'قالمة',
        areaHectares: 6,
        productionType: 'تربية ماشية + خضروات',
        farmName: 'مزرعة بلقاسم',
        farmWilaya: 'قالمة',
        farmArea: 6,
        contractRef: 'CN-2024-0456',
        autumnTransactions: [
          { type: 'expense', category: 'بذور الخضروات', amount: 55000, month: 8, day: 5, note: 'بذور أعلاف وخضروات' },
          { type: 'expense', category: 'أسمدة NPK', amount: 75000, month: 9, day: 1, note: 'أسمدة للمحاصيل' },
          { type: 'expense', category: 'ري بالتنقيط', amount: 30000, month: 9, day: 20, note: 'ري' },
          { type: 'expense', category: 'عمالة دائمة', amount: 220000, month: 10, day: 1, note: 'عمالة مزرعة ورعاية ماشية' },
          { type: 'expense', category: 'صيانة مباني', amount: 45000, month: 10, day: 20, note: 'صيانة الإسطبل' },
          { type: 'expense', category: 'أعلاف الماشية', amount: 85000, month: 11, day: 1, note: 'أعلاف الماشية' },
          { type: 'income', category: 'بيع الأجبان', amount: 520000, month: 0, day: 10, note: 'بيع أجبان وألبان' },
          { type: 'income', category: 'بيع الخضروات', amount: 180000, month: 1, day: 5, note: 'بيع خضروات' },
          { type: 'income', category: 'بيع اللحوم', amount: 250000, month: 1, day: 15, note: 'بيع لحوم' },
          { type: 'income', category: 'دعم حكومي', amount: 95000, month: 1, day: 25, note: 'دعم تربية الماشية' },
        ],
        springTransactions: [
          { type: 'expense', category: 'بذور الخضروات', amount: 48000, month: 2, day: 15, note: 'بذور خضروات' },
          { type: 'expense', category: 'أسمدة عضوية', amount: 62000, month: 3, day: 5, note: 'أسمدة' },
          { type: 'expense', category: 'ري بالتنقيط', amount: 25000, month: 4, day: 1, note: 'ري' },
          { type: 'expense', category: 'عمالة دائمة', amount: 190000, month: 4, day: 15, note: 'عمالة' },
          { type: 'expense', category: 'أعلاف الماشية', amount: 95000, month: 5, day: 1, note: 'أعلاف ومستلزمات' },
          { type: 'expense', category: 'صيانة مباني', amount: 35000, month: 5, day: 20, note: 'صيانة' },
          { type: 'income', category: 'بيع الحليب', amount: 480000, month: 6, day: 10, note: 'بيع ألبان وأجبان' },
          { type: 'income', category: 'بيع الخضروات', amount: 210000, month: 7, day: 5, note: 'بيع خضروات صيفية' },
          { type: 'income', category: 'بيع اللحوم', amount: 180000, month: 7, day: 15, note: 'بيع ماشية' },
        ],
        autumnInventory: [
          { itemType: 'input', itemName: 'بذور أعلاف', unit: 'كيلو', qtyIn: 600, qtyOut: 550, unitCost: 80, alertThreshold: 50, subCategory: 'بذور', supplier: 'مؤسسة وطنية للبذور', storageLocation: 'مستودع الحبوب', description: 'بذور أعلاف فيشة وبرسيم', expiryDate: new Date(2025, 5, 1), batchNumber: 'LOT-2024-0070', minimumStock: 50, reorderQuantity: 600, unitPrice: 0, lastRestocked: new Date(2024, 8, 5) },
          { itemType: 'input', itemName: 'أسمدة NPK', unit: 'كيس', qtyIn: 20, qtyOut: 17, unitCost: 4000, alertThreshold: 3, subCategory: 'أسمدة', supplier: 'شركة الأمل للأسمدة', storageLocation: 'سقيفة B', description: 'سماد مركب للخضروات والأعلاف', expiryDate: new Date(2025, 8, 1), batchNumber: 'LOT-2024-0105', minimumStock: 3, reorderQuantity: 20, unitPrice: 0, lastRestocked: new Date(2024, 9, 1) },
          { itemType: 'feed', itemName: 'أعلاف مركزة', unit: 'كيس', qtyIn: 50, qtyOut: 45, unitCost: 2800, alertThreshold: 5, subCategory: 'أعلاف مركزة', supplier: 'مؤسسة الأعلاف الوطنية', storageLocation: 'الإسطبل', description: 'أعلاف مركزة للماشية 18% بروتين', expiryDate: new Date(2025, 5, 1), batchNumber: 'LOT-2024-0301', minimumStock: 5, reorderQuantity: 50, unitPrice: 0, lastRestocked: new Date(2024, 10, 1) },
          { itemType: 'feed', itemName: 'أعلاف خضراء', unit: 'حزمة', qtyIn: 200, qtyOut: 180, unitCost: 150, alertThreshold: 20, subCategory: 'أعلاف خضراء', supplier: null, storageLocation: 'الحقل', description: 'برسيم وفيشة طازجة', batchNumber: 'LOT-2024-0302', minimumStock: 20, reorderQuantity: 0, unitPrice: 200, lastRestocked: new Date(2024, 11, 15) },
          { itemType: 'feed', itemName: 'مكملات غذائية', unit: 'كيس', qtyIn: 15, qtyOut: 12, unitCost: 4500, alertThreshold: 3, subCategory: 'مكملات غذائية', supplier: 'شركة التغذية الحيوانية', storageLocation: 'الإسطبل', description: 'مكملات فيتامينات ومعادن للماشية', expiryDate: new Date(2025, 8, 1), batchNumber: 'LOT-2024-0303', minimumStock: 3, reorderQuantity: 15, unitPrice: 0, lastRestocked: new Date(2024, 10, 15) },
          { itemType: 'animal_product', itemName: 'حليب بقر', unit: 'لتر', qtyIn: 3000, qtyOut: 2800, unitCost: 50, alertThreshold: 200, subCategory: 'ألبان', supplier: null, storageLocation: 'الإسطبل', description: 'حليب بقر طازج يومي', batchNumber: 'LOT-2024-0202', minimumStock: 200, reorderQuantity: 0, unitPrice: 250, lastRestocked: new Date(2025, 1, 10) },
          { itemType: 'animal_product', itemName: 'جبن', unit: 'كيلو', qtyIn: 200, qtyOut: 180, unitCost: 800, alertThreshold: 20, subCategory: 'ألبان', supplier: null, storageLocation: 'غرفة التجهيز', description: 'جبن بلدي طازج', batchNumber: 'LOT-2024-0203', minimumStock: 20, reorderQuantity: 0, unitPrice: 1200, lastRestocked: new Date(2025, 1, 12) },
          { itemType: 'animal_product', itemName: 'بيض دجاج', unit: 'وحدة', qtyIn: 2000, qtyOut: 1800, unitCost: 10, alertThreshold: 150, subCategory: 'بيض', supplier: null, storageLocation: 'قاعة الدواجن', description: 'بيض دجاج طازج', batchNumber: 'LOT-2024-0204', minimumStock: 150, reorderQuantity: 0, unitPrice: 15, lastRestocked: new Date(2025, 1, 8) },
          { itemType: 'crop', itemName: 'خضروات', unit: 'كيلو', qtyIn: 1200, qtyOut: 1000, unitCost: 100, alertThreshold: 100, subCategory: 'خضروات', supplier: null, storageLocation: 'سقيفة A', description: 'خضروات شتوية متنوعة', batchNumber: 'LOT-2024-0170', minimumStock: 100, reorderQuantity: 0, unitPrice: 160, lastRestocked: new Date(2024, 11, 20) },
          { itemType: 'medication', itemName: 'لقاحات ماشية', unit: 'جرعة', qtyIn: 25, qtyOut: 20, unitCost: 1500, alertThreshold: 5, subCategory: 'لقاحات', supplier: 'المعهد الوطني للطب البيطري', storageLocation: 'الإسطبل', description: 'لقاحات الجمرة الخبيثة والحمى القلاعية', expiryDate: new Date(2025, 5, 1), batchNumber: 'LOT-2024-0401', minimumStock: 5, reorderQuantity: 25, unitPrice: 0, lastRestocked: new Date(2024, 10, 10) },
          { itemType: 'medication', itemName: 'مضادات حيوية', unit: 'جرعة', qtyIn: 20, qtyOut: 15, unitCost: 800, alertThreshold: 5, subCategory: 'مضادات حيوية', supplier: 'المعهد الوطني للطب البيطري', storageLocation: 'الإسطبل', description: 'مضادات حيوية للماشية والدواجن', expiryDate: new Date(2025, 8, 1), batchNumber: 'LOT-2024-0402', minimumStock: 5, reorderQuantity: 20, unitPrice: 0, lastRestocked: new Date(2024, 10, 12) },
          { itemType: 'medication', itemName: 'مطهرات', unit: 'لتر', qtyIn: 10, qtyOut: 7, unitCost: 1200, alertThreshold: 2, subCategory: 'مطهرات', supplier: 'شركة المستلزمات البيطرية', storageLocation: 'الإسطبل', description: 'مطهرات للإسطبل والحظائر', expiryDate: new Date(2025, 10, 1), batchNumber: 'LOT-2024-0403', minimumStock: 2, reorderQuantity: 10, unitPrice: 0, lastRestocked: new Date(2024, 10, 15) },
        ],
        springInventory: [
          { itemType: 'animal_product', itemName: 'حليب بقر', unit: 'لتر', qtyIn: 2500, qtyOut: 2300, unitCost: 50, alertThreshold: 200, subCategory: 'ألبان', supplier: null, storageLocation: 'الإسطبل', description: 'حليب بقر ربيعي', batchNumber: 'LOT-2025-0205', minimumStock: 200, reorderQuantity: 0, unitPrice: 250, lastRestocked: new Date(2025, 5, 10) },
          { itemType: 'feed', itemName: 'أعلاف مركزة', unit: 'كيس', qtyIn: 60, qtyOut: 52, unitCost: 2800, alertThreshold: 8, subCategory: 'أعلاف مركزة', supplier: 'مؤسسة الأعلاف الوطنية', storageLocation: 'الإسطبل', description: 'أعلاف مركزة ربيعية 20% بروتين', expiryDate: new Date(2025, 10, 1), batchNumber: 'LOT-2025-0304', minimumStock: 8, reorderQuantity: 60, unitPrice: 0, lastRestocked: new Date(2025, 3, 5) },
          { itemType: 'crop', itemName: 'خضروات صيفية', unit: 'كيلو', qtyIn: 1000, qtyOut: 800, unitCost: 120, alertThreshold: 100, subCategory: 'خضروات', supplier: null, storageLocation: 'سقيفة A', description: 'خضروات صيفية: طماطم، خيار، كوسا', batchNumber: 'LOT-2025-0171', minimumStock: 100, reorderQuantity: 0, unitPrice: 180, lastRestocked: new Date(2025, 6, 5) },
          { itemType: 'medication', itemName: 'لقاحات ماشية', unit: 'جرعة', qtyIn: 30, qtyOut: 25, unitCost: 1500, alertThreshold: 5, subCategory: 'لقاحات', supplier: 'المعهد الوطني للطب البيطري', storageLocation: 'الإسطبل', description: 'لقاحات ربيعية: حمى الوادي المتصدع', expiryDate: new Date(2025, 9, 1), batchNumber: 'LOT-2025-0404', minimumStock: 5, reorderQuantity: 30, unitPrice: 0, lastRestocked: new Date(2025, 4, 1) },
          { itemType: 'medication', itemName: 'مضادات حيوية', unit: 'جرعة', qtyIn: 15, qtyOut: 10, unitCost: 850, alertThreshold: 3, subCategory: 'مضادات حيوية', supplier: 'المعهد الوطني للطب البيطري', storageLocation: 'الإسطبل', description: 'مضاد حيوي واسع الطيف', expiryDate: new Date(2025, 10, 1), batchNumber: 'LOT-2025-0405', minimumStock: 3, reorderQuantity: 15, unitPrice: 0, lastRestocked: new Date(2025, 5, 10) },
          { itemType: 'medication', itemName: 'مطهرات', unit: 'لتر', qtyIn: 8, qtyOut: 5, unitCost: 1200, alertThreshold: 2, subCategory: 'مطهرات', supplier: 'شركة المستلزمات البيطرية', storageLocation: 'الإسطبل', description: 'مطهرات ربيعية للحظائر', expiryDate: new Date(2026, 0, 1), batchNumber: 'LOT-2025-0406', minimumStock: 2, reorderQuantity: 8, unitPrice: 0, lastRestocked: new Date(2025, 4, 15) },
          { itemType: 'animal_product', itemName: 'بيض دجاج', unit: 'وحدة', qtyIn: 2500, qtyOut: 2200, unitCost: 10, alertThreshold: 200, subCategory: 'بيض', supplier: null, storageLocation: 'قاعة الدواجن', description: 'بيض دجاج ربيعي', batchNumber: 'LOT-2025-0206', minimumStock: 200, reorderQuantity: 0, unitPrice: 15, lastRestocked: new Date(2025, 6, 1) },
          { itemType: 'animal_product', itemName: 'لحم بقر', unit: 'كيلو', qtyIn: 300, qtyOut: 280, unitCost: 1800, alertThreshold: 20, subCategory: 'لحوم', supplier: null, storageLocation: 'المجمد', description: 'لحم بقر طازج ومجمد', batchNumber: 'LOT-2025-0207', minimumStock: 20, reorderQuantity: 0, unitPrice: 2500, lastRestocked: new Date(2025, 6, 10) },
          { itemType: 'feed', itemName: 'مكملات غذائية', unit: 'كيس', qtyIn: 12, qtyOut: 10, unitCost: 4500, alertThreshold: 2, subCategory: 'مكملات غذائية', supplier: 'شركة التغذية الحيوانية', storageLocation: 'الإسطبل', description: 'مكملات فيتامينات ربيعية', expiryDate: new Date(2025, 11, 1), batchNumber: 'LOT-2025-0305', minimumStock: 2, reorderQuantity: 12, unitPrice: 0, lastRestocked: new Date(2025, 3, 15) },
          { itemType: 'input', itemName: 'بذور خضروات', unit: 'كيلو', qtyIn: 150, qtyOut: 130, unitCost: 400, alertThreshold: 15, subCategory: 'بذور', supplier: 'شركة البذور الممتازة', storageLocation: 'المخزن الرئيسي', description: 'بذور خضروات صيفية للزراعة الربيعية', expiryDate: new Date(2025, 8, 1), batchNumber: 'LOT-2025-0075', minimumStock: 15, reorderQuantity: 150, unitPrice: 0, lastRestocked: new Date(2025, 2, 15) },
        ],
      },
    ]

    const results: string[] = []

    for (const farmerDef of farmersData) {
      // Check if farmer already exists
      const existingFarmer = await db.user.findUnique({ where: { email: farmerDef.email } })
      if (existingFarmer) {
        results.push(`${farmerDef.name}: موجود بالفعل`)
        continue
      }

      const farmerHash = await bcrypt.hash('fellah123', 12)
      const farmer = await db.user.create({
        data: {
          name: farmerDef.name,
          email: farmerDef.email,
          password: farmerHash,
          role: 'FARMER',
          phone: farmerDef.phone,
          wilaya: farmerDef.wilaya,
          areaHectares: farmerDef.areaHectares,
          productionType: farmerDef.productionType,
        },
      })

      const farm = await db.farm.create({
        data: {
          userId: farmer.id,
          name: farmerDef.farmName,
          areaHectares: farmerDef.farmArea,
          locationWilaya: farmerDef.farmWilaya,
          contractRef: farmerDef.contractRef,
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

      // Create autumn transactions
      const autumnTxns = farmerDef.autumnTransactions.map(t => ({
        seasonId: autumnSeason.id,
        type: t.type,
        categoryId: catMap[t.category] || null,
        amount: t.amount,
        txnDate: new Date(2024, t.month, t.day),
        note: t.note,
      }))
      await Promise.all(autumnTxns.map(t => db.transaction.create({ data: t })))

      // Create spring transactions
      const springTxns = farmerDef.springTransactions.map(t => ({
        seasonId: springSeason.id,
        type: t.type,
        categoryId: catMap[t.category] || null,
        amount: t.amount,
        txnDate: new Date(2025, t.month, t.day),
        note: t.note,
      }))
      await Promise.all(springTxns.map(t => db.transaction.create({ data: t })))

      // Create autumn inventory (with new detailed fields)
      const autumnInv = farmerDef.autumnInventory.map(i => ({
        farmId: farm.id,
        seasonId: autumnSeason.id,
        itemType: i.itemType,
        subCategory: i.subCategory || null,
        itemName: i.itemName,
        unit: i.unit,
        qtyIn: i.qtyIn,
        qtyOut: i.qtyOut,
        qtyBalance: i.qtyIn - i.qtyOut,
        unitCost: i.unitCost,
        alertThreshold: i.alertThreshold,
        supplier: i.supplier || null,
        expiryDate: i.expiryDate || null,
        storageLocation: i.storageLocation || null,
        description: i.description || null,
        batchNumber: i.batchNumber || null,
        minimumStock: i.minimumStock ?? 0,
        reorderQuantity: i.reorderQuantity ?? 0,
        unitPrice: i.unitPrice ?? 0,
        lastRestocked: i.lastRestocked || null,
      }))
      await Promise.all(autumnInv.map(i => db.inventory.create({ data: i })))

      // Create spring inventory (with new detailed fields)
      const springInv = farmerDef.springInventory.map(i => ({
        farmId: farm.id,
        seasonId: springSeason.id,
        itemType: i.itemType,
        subCategory: i.subCategory || null,
        itemName: i.itemName,
        unit: i.unit,
        qtyIn: i.qtyIn,
        qtyOut: i.qtyOut,
        qtyBalance: i.qtyIn - i.qtyOut,
        unitCost: i.unitCost,
        alertThreshold: i.alertThreshold,
        supplier: i.supplier || null,
        expiryDate: i.expiryDate || null,
        storageLocation: i.storageLocation || null,
        description: i.description || null,
        batchNumber: i.batchNumber || null,
        minimumStock: i.minimumStock ?? 0,
        reorderQuantity: i.reorderQuantity ?? 0,
        unitPrice: i.unitPrice ?? 0,
        lastRestocked: i.lastRestocked || null,
      }))
      await Promise.all(springInv.map(i => db.inventory.create({ data: i })))

      results.push(`${farmerDef.name}: تم إنشاؤه بنجاح`)
    }

    return NextResponse.json({
      success: true,
      message: 'تم تهيئة البيانات بنجاح',
      data: {
        admin: { email: 'admin@fact.dz', password: 'admin123' },
        farmers: farmersData.map(f => ({ name: f.name, email: f.email, password: 'fellah123' })),
        results,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء تهيئة البيانات' }, { status: 500 })
  }
}

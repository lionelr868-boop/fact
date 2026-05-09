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

    // Define all 5 farmers
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
          { type: 'expense', category: 'بذور', amount: 85000, month: 8, day: 15, note: 'بذور الحبوب والخضروات' },
          { type: 'expense', category: 'أسمدة ومبيدات', amount: 120000, month: 9, day: 1, note: 'أسمدة ومبيدات' },
          { type: 'expense', category: 'ري', amount: 45000, month: 9, day: 15, note: 'تكاليف الري' },
          { type: 'expense', category: 'عمالة', amount: 180000, month: 10, day: 1, note: 'أجرة العمالة الموسمية' },
          { type: 'expense', category: 'نقل وتسويق', amount: 60000, month: 11, day: 1, note: 'تكاليف النقل والتسويق' },
          { type: 'income', category: 'حبوب', amount: 350000, month: 0, day: 15, note: 'إيرادات بيع الحبوب' },
          { type: 'income', category: 'خضروات', amount: 280000, month: 1, day: 1, note: 'إيرادات بيع الخضروات' },
          { type: 'income', category: 'منتجات حيوانية', amount: 95000, month: 1, day: 15, note: 'إيرادات بيع المنتجات الحيوانية' },
        ],
        springTransactions: [
          { type: 'expense', category: 'بذور', amount: 92000, month: 2, day: 10, note: 'بذور الموسم الربيعي' },
          { type: 'expense', category: 'أسمدة ومبيدات', amount: 95000, month: 3, day: 1, note: 'أسمدة' },
          { type: 'expense', category: 'ري', amount: 38000, month: 3, day: 15, note: 'ري' },
          { type: 'expense', category: 'عمالة', amount: 150000, month: 4, day: 1, note: 'عمالة' },
          { type: 'income', category: 'خضروات', amount: 320000, month: 5, day: 15, note: 'بيع خضروات' },
          { type: 'income', category: 'حبوب', amount: 280000, month: 6, day: 1, note: 'بيع حبوب' },
        ],
        autumnInventory: [
          { itemType: 'input', itemName: 'بذور القمح', unit: 'كيلو', qtyIn: 500, qtyOut: 450, unitCost: 170, alertThreshold: 50 },
          { itemType: 'input', itemName: 'أسمدة NPK', unit: 'كيس', qtyIn: 30, qtyOut: 25, unitCost: 4000, alertThreshold: 5 },
          { itemType: 'crop', itemName: 'قمح صلب', unit: 'قنطار', qtyIn: 40, qtyOut: 35, unitCost: 8750, alertThreshold: 5 },
          { itemType: 'crop', itemName: 'خضروات متنوعة', unit: 'كيلو', qtyIn: 2000, qtyOut: 1800, unitCost: 140, alertThreshold: 200 },
          { itemType: 'animal_product', itemName: 'حليب', unit: 'لتر', qtyIn: 500, qtyOut: 500, unitCost: 190, alertThreshold: 50 },
        ],
        springInventory: [
          { itemType: 'input', itemName: 'بذور الخضروات', unit: 'كيلو', qtyIn: 200, qtyOut: 180, unitCost: 460, alertThreshold: 20 },
          { itemType: 'crop', itemName: 'بطاطا', unit: 'كيلو', qtyIn: 3000, qtyOut: 2500, unitCost: 50, alertThreshold: 300 },
          { itemType: 'input', itemName: 'أسمدة NPK', unit: 'كيس', qtyIn: 25, qtyOut: 20, unitCost: 4000, alertThreshold: 5 },
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
          { type: 'expense', category: 'بذور', amount: 240000, month: 8, day: 10, note: 'بذور القمح والعدس' },
          { type: 'expense', category: 'أسمدة ومبيدات', amount: 310000, month: 9, day: 5, note: 'أسمدة فوسفاتية ونيتروجينية' },
          { type: 'expense', category: 'ري', amount: 85000, month: 9, day: 20, note: 'ري بالرش' },
          { type: 'expense', category: 'عمالة', amount: 420000, month: 10, day: 1, note: 'أجور العمال الموسميين' },
          { type: 'expense', category: 'صيانة', amount: 65000, month: 11, day: 15, note: 'صيانة معدات الري' },
          { type: 'expense', category: 'نقل وتسويق', amount: 95000, month: 11, day: 25, note: 'نقل المحاصيل للسوق' },
          { type: 'income', category: 'حبوب', amount: 850000, month: 0, day: 20, note: 'بيع القمح الصلب' },
          { type: 'income', category: 'حبوب', amount: 420000, month: 1, day: 5, note: 'بيع الشعير' },
          { type: 'income', category: 'دعم حكومي', amount: 180000, month: 1, day: 10, note: 'دعم البذور الحكومي' },
          { type: 'income', category: 'أخرى', amount: 350000, month: 1, day: 20, note: 'بيع العدس والحمص' },
        ],
        springTransactions: [
          { type: 'expense', category: 'بذور', amount: 195000, month: 2, day: 15, note: 'بذور الربيع' },
          { type: 'expense', category: 'أسمدة ومبيدات', amount: 220000, month: 3, day: 1, note: 'أسمدة ومبيدات' },
          { type: 'expense', category: 'ري', amount: 72000, month: 3, day: 20, note: 'ري' },
          { type: 'expense', category: 'عمالة', amount: 380000, month: 4, day: 1, note: 'عمالة موسمية' },
          { type: 'expense', category: 'صيانة', amount: 45000, month: 5, day: 10, note: 'صيانة الجرار' },
          { type: 'income', category: 'حبوب', amount: 680000, month: 6, day: 15, note: 'بيع حبوب ربيعية' },
          { type: 'income', category: 'حبوب', amount: 290000, month: 7, day: 1, note: 'بيع بقوليات' },
          { type: 'income', category: 'دعم حكومي', amount: 96000, month: 7, day: 10, note: 'إعانة حكومية' },
        ],
        autumnInventory: [
          { itemType: 'input', itemName: 'بذور القمح الصلب', unit: 'كيلو', qtyIn: 1200, qtyOut: 1100, unitCost: 200, alertThreshold: 100 },
          { itemType: 'input', itemName: 'بذور العدس', unit: 'كيلو', qtyIn: 400, qtyOut: 380, unitCost: 350, alertThreshold: 30 },
          { itemType: 'input', itemName: 'أسمدة فوسفاتية', unit: 'كيس', qtyIn: 60, qtyOut: 50, unitCost: 3500, alertThreshold: 10 },
          { itemType: 'crop', itemName: 'قمح صلب', unit: 'قنطار', qtyIn: 120, qtyOut: 100, unitCost: 8500, alertThreshold: 10 },
          { itemType: 'crop', itemName: 'عدس', unit: 'كيلو', qtyIn: 800, qtyOut: 750, unitCost: 250, alertThreshold: 50 },
        ],
        springInventory: [
          { itemType: 'input', itemName: 'بذور الحمص', unit: 'كيلو', qtyIn: 500, qtyOut: 450, unitCost: 300, alertThreshold: 40 },
          { itemType: 'crop', itemName: 'حمص', unit: 'كيلو', qtyIn: 600, qtyOut: 500, unitCost: 280, alertThreshold: 50 },
          { itemType: 'input', itemName: 'مبيدات أعشاب', unit: 'لتر', qtyIn: 40, qtyOut: 35, unitCost: 2500, alertThreshold: 5 },
          { itemType: 'crop', itemName: 'فول', unit: 'كيلو', qtyIn: 1500, qtyOut: 1200, unitCost: 180, alertThreshold: 100 },
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
          { type: 'expense', category: 'بذور', amount: 45000, month: 8, day: 20, note: 'بذور خضروات شتوية' },
          { type: 'expense', category: 'أسمدة ومبيدات', amount: 65000, month: 9, day: 5, note: 'أسمدة عضوية' },
          { type: 'expense', category: 'ري', amount: 35000, month: 9, day: 25, note: 'ري بالتنقيط' },
          { type: 'expense', category: 'عمالة', amount: 120000, month: 10, day: 1, note: 'عمالة جمع المحاصيل' },
          { type: 'expense', category: 'نقل وتسويق', amount: 40000, month: 11, day: 10, note: 'نقل للسوق الجواري' },
          { type: 'income', category: 'خضروات', amount: 280000, month: 0, day: 10, note: 'بيع طماطم وخيار' },
          { type: 'income', category: 'خضروات', amount: 150000, month: 1, day: 5, note: 'بيع بطاطا وبصل' },
          { type: 'income', category: 'أخرى', amount: 95000, month: 1, day: 20, note: 'بيع برتقال (أشجار فاكهة)' },
        ],
        springTransactions: [
          { type: 'expense', category: 'بذور', amount: 52000, month: 2, day: 20, note: 'بذور خضروات صيفية' },
          { type: 'expense', category: 'أسمدة ومبيدات', amount: 58000, month: 3, day: 10, note: 'أسمدة ومبيدات' },
          { type: 'expense', category: 'ري', amount: 42000, month: 4, day: 1, note: 'ري' },
          { type: 'expense', category: 'عمالة', amount: 95000, month: 5, day: 1, note: 'عمالة' },
          { type: 'expense', category: 'صيانة', amount: 28000, month: 5, day: 20, note: 'صيانة شبكة الري' },
          { type: 'income', category: 'خضروات', amount: 320000, month: 6, day: 10, note: 'بيع خضروات صيفية' },
          { type: 'income', category: 'خضروات', amount: 180000, month: 7, day: 5, note: 'بيع فلفل وباذنجان' },
          { type: 'income', category: 'دعم حكومي', amount: 60000, month: 7, day: 15, note: 'دعم الري' },
        ],
        autumnInventory: [
          { itemType: 'input', itemName: 'بذور طماطم', unit: 'غرام', qtyIn: 500, qtyOut: 450, unitCost: 90, alertThreshold: 50 },
          { itemType: 'input', itemName: 'سماد عضوي', unit: 'كيس', qtyIn: 20, qtyOut: 18, unitCost: 2500, alertThreshold: 3 },
          { itemType: 'crop', itemName: 'طماطم', unit: 'كيلو', qtyIn: 1500, qtyOut: 1400, unitCost: 80, alertThreshold: 100 },
          { itemType: 'crop', itemName: 'برتقال', unit: 'كيلو', qtyIn: 2000, qtyOut: 1800, unitCost: 60, alertThreshold: 200 },
        ],
        springInventory: [
          { itemType: 'input', itemName: 'بذور فلفل', unit: 'غرام', qtyIn: 300, qtyOut: 280, unitCost: 120, alertThreshold: 30 },
          { itemType: 'crop', itemName: 'فلفل', unit: 'كيلو', qtyIn: 800, qtyOut: 700, unitCost: 150, alertThreshold: 80 },
          { itemType: 'crop', itemName: 'خوخ', unit: 'كيلو', qtyIn: 600, qtyOut: 500, unitCost: 200, alertThreshold: 50 },
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
          { type: 'expense', category: 'بذور', amount: 95000, month: 8, day: 25, note: 'بذور حبوب' },
          { type: 'expense', category: 'أسمدة ومبيدات', amount: 140000, month: 9, day: 10, note: 'أسمدة للزيتون والحبوب' },
          { type: 'expense', category: 'ري', amount: 55000, month: 10, day: 1, note: 'ري الزيتون' },
          { type: 'expense', category: 'عمالة', amount: 250000, month: 10, day: 15, note: 'قطف الزيتون' },
          { type: 'expense', category: 'نقل وتسويق', amount: 70000, month: 11, day: 1, note: 'نقل الزيتون للمعصرة' },
          { type: 'expense', category: 'صيانة', amount: 35000, month: 11, day: 20, note: 'صيانة المعصرة' },
          { type: 'income', category: 'أخرى', amount: 720000, month: 0, day: 10, note: 'بيع زيت الزيتون' },
          { type: 'income', category: 'حبوب', amount: 380000, month: 1, day: 5, note: 'بيع القمح' },
          { type: 'income', category: 'أخرى', amount: 180000, month: 1, day: 20, note: 'بيع زيتون مائدة' },
          { type: 'income', category: 'دعم حكومي', amount: 120000, month: 1, day: 25, note: 'دعم زراعة الزيتون' },
        ],
        springTransactions: [
          { type: 'expense', category: 'بذور', amount: 78000, month: 2, day: 25, note: 'بذور الربيع' },
          { type: 'expense', category: 'أسمدة ومبيدات', amount: 110000, month: 3, day: 10, note: 'أسمدة' },
          { type: 'expense', category: 'ري', amount: 48000, month: 4, day: 1, note: 'ري' },
          { type: 'expense', category: 'عمالة', amount: 200000, month: 5, day: 1, note: 'عمالة' },
          { type: 'expense', category: 'نقل وتسويق', amount: 55000, month: 6, day: 1, note: 'تسويق' },
          { type: 'income', category: 'حبوب', amount: 450000, month: 6, day: 15, note: 'بيع حبوب' },
          { type: 'income', category: 'أخرى', amount: 350000, month: 7, day: 10, note: 'بيع زيت زيتون جديد' },
          { type: 'income', category: 'دعم حكومي', amount: 85000, month: 7, day: 20, note: 'إعانة' },
        ],
        autumnInventory: [
          { itemType: 'input', itemName: 'بذور القمح', unit: 'كيلو', qtyIn: 800, qtyOut: 750, unitCost: 190, alertThreshold: 80 },
          { itemType: 'crop', itemName: 'زيت الزيتون', unit: 'لتر', qtyIn: 2000, qtyOut: 1800, unitCost: 350, alertThreshold: 200 },
          { itemType: 'crop', itemName: 'زيتون مائدة', unit: 'كيلو', qtyIn: 1500, qtyOut: 1200, unitCost: 120, alertThreshold: 150 },
          { itemType: 'crop', itemName: 'قمح', unit: 'قنطار', qtyIn: 60, qtyOut: 50, unitCost: 8000, alertThreshold: 5 },
          { itemType: 'input', itemName: 'أسمدة بوتاسية', unit: 'كيس', qtyIn: 40, qtyOut: 35, unitCost: 3800, alertThreshold: 5 },
        ],
        springInventory: [
          { itemType: 'input', itemName: 'مبيدات زيتون', unit: 'لتر', qtyIn: 30, qtyOut: 25, unitCost: 3200, alertThreshold: 5 },
          { itemType: 'crop', itemName: 'زيت الزيتون', unit: 'لتر', qtyIn: 1000, qtyOut: 900, unitCost: 350, alertThreshold: 100 },
          { itemType: 'input', itemName: 'أسمدة NPK', unit: 'كيس', qtyIn: 35, qtyOut: 30, unitCost: 4000, alertThreshold: 5 },
          { itemType: 'crop', itemName: 'قمح ربيعي', unit: 'قنطار', qtyIn: 40, qtyOut: 30, unitCost: 8200, alertThreshold: 5 },
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
          { type: 'expense', category: 'بذور', amount: 55000, month: 8, day: 5, note: 'بذور أعلاف وخضروات' },
          { type: 'expense', category: 'أسمدة ومبيدات', amount: 75000, month: 9, day: 1, note: 'أسمدة للمحاصيل' },
          { type: 'expense', category: 'ري', amount: 30000, month: 9, day: 20, note: 'ري' },
          { type: 'expense', category: 'عمالة', amount: 220000, month: 10, day: 1, note: 'عمالة مزرعة ورعاية ماشية' },
          { type: 'expense', category: 'صيانة', amount: 45000, month: 10, day: 20, note: 'صيانة الإسطبل' },
          { type: 'expense', category: 'أخرى', amount: 85000, month: 11, day: 1, note: 'أعلاف الماشية' },
          { type: 'income', category: 'منتجات حيوانية', amount: 520000, month: 0, day: 10, note: 'بيع أجبان وألبان' },
          { type: 'income', category: 'خضروات', amount: 180000, month: 1, day: 5, note: 'بيع خضروات' },
          { type: 'income', category: 'منتجات حيوانية', amount: 250000, month: 1, day: 15, note: 'بيع لحوم' },
          { type: 'income', category: 'دعم حكومي', amount: 95000, month: 1, day: 25, note: 'دعم تربية الماشية' },
        ],
        springTransactions: [
          { type: 'expense', category: 'بذور', amount: 48000, month: 2, day: 15, note: 'بذور خضروات' },
          { type: 'expense', category: 'أسمدة ومبيدات', amount: 62000, month: 3, day: 5, note: 'أسمدة' },
          { type: 'expense', category: 'ري', amount: 25000, month: 4, day: 1, note: 'ري' },
          { type: 'expense', category: 'عمالة', amount: 190000, month: 4, day: 15, note: 'عمالة' },
          { type: 'expense', category: 'أخرى', amount: 95000, month: 5, day: 1, note: 'أعلاف ومستلزمات' },
          { type: 'expense', category: 'صيانة', amount: 35000, month: 5, day: 20, note: 'صيانة' },
          { type: 'income', category: 'منتجات حيوانية', amount: 480000, month: 6, day: 10, note: 'بيع ألبان وأجبان' },
          { type: 'income', category: 'خضروات', amount: 210000, month: 7, day: 5, note: 'بيع خضروات صيفية' },
          { type: 'income', category: 'منتجات حيوانية', amount: 180000, month: 7, day: 15, note: 'بيع ماشية' },
        ],
        autumnInventory: [
          { itemType: 'input', itemName: 'بذور أعلاف', unit: 'كيلو', qtyIn: 600, qtyOut: 550, unitCost: 80, alertThreshold: 50 },
          { itemType: 'animal_product', itemName: 'حليب بقر', unit: 'لتر', qtyIn: 3000, qtyOut: 2800, unitCost: 50, alertThreshold: 200 },
          { itemType: 'animal_product', itemName: 'جبن', unit: 'كيلو', qtyIn: 200, qtyOut: 180, unitCost: 800, alertThreshold: 20 },
          { itemType: 'crop', itemName: 'خضروات', unit: 'كيلو', qtyIn: 1200, qtyOut: 1000, unitCost: 100, alertThreshold: 100 },
          { itemType: 'input', itemName: 'أعلاف مركزة', unit: 'كيس', qtyIn: 50, qtyOut: 45, unitCost: 2800, alertThreshold: 5 },
        ],
        springInventory: [
          { itemType: 'animal_product', itemName: 'حليب بقر', unit: 'لتر', qtyIn: 2500, qtyOut: 2300, unitCost: 50, alertThreshold: 200 },
          { itemType: 'input', itemName: 'أعلاف', unit: 'كيس', qtyIn: 40, qtyOut: 35, unitCost: 2800, alertThreshold: 5 },
          { itemType: 'crop', itemName: 'خضروات صيفية', unit: 'كيلو', qtyIn: 1000, qtyOut: 800, unitCost: 120, alertThreshold: 100 },
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

      // Create autumn inventory
      const autumnInv = farmerDef.autumnInventory.map(i => ({
        farmId: farm.id,
        seasonId: autumnSeason.id,
        itemType: i.itemType,
        itemName: i.itemName,
        unit: i.unit,
        qtyIn: i.qtyIn,
        qtyOut: i.qtyOut,
        qtyBalance: i.qtyIn - i.qtyOut,
        unitCost: i.unitCost,
        alertThreshold: i.alertThreshold,
      }))
      await Promise.all(autumnInv.map(i => db.inventory.create({ data: i })))

      // Create spring inventory
      const springInv = farmerDef.springInventory.map(i => ({
        farmId: farm.id,
        seasonId: springSeason.id,
        itemType: i.itemType,
        itemName: i.itemName,
        unit: i.unit,
        qtyIn: i.qtyIn,
        qtyOut: i.qtyOut,
        qtyBalance: i.qtyIn - i.qtyOut,
        unitCost: i.unitCost,
        alertThreshold: i.alertThreshold,
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

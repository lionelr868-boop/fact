---
Task ID: 1
Agent: Main Agent
Task: Add detailed transaction categories and link income transactions to inventory

Work Log:
- Updated Prisma schema to add `quantity`, `unitPrice`, and `linkedInventoryId` fields to Transaction model
- Ran `db:push` to sync schema changes
- Expanded categories from 12 broad categories to 34 detailed sub-categories:
  - 16 income categories: بيع القمح, بيع الشعير, بيع البطاطا, بيع الطماطم, بيع الخضروات, بيع الحليب, بيع الأجبان, بيع البيض, بيع اللحوم, بيع زيت الزيتون, بيع الحمضيات, بيع البقوليات, دعم حكومي, إعانة البذور, إعانة الري, أخرى
  - 18 expense categories: بذور القمح, بذور الخضروات, بذور البقوليات, أسمدة NPK, أسمدة عضوية, مبيدات أعشاب, مبيدات حشرية, ري بالرش, ري بالتنقيط, عمالة موسمية, عمالة دائمة, نقل المحاصيل, تسويق, صيانة معدات, صيانة مباني, أعلاف الماشية, وقود, أخرى
- Updated transaction POST API to automatically deduct inventory when income transaction is linked to inventory item
- Added auto-calculation of amount from quantity × unitPrice
- Updated farmer dashboard transaction form to include inventory selector, quantity, and unit price fields
- Updated CATEGORY_ICONS in both farmer-dashboard.tsx and report-viewer.tsx
- Re-seeded database with new categories and updated farmer transaction data
- Verified lint passes with no errors

Stage Summary:
- Transaction model now supports quantity, unitPrice, and linkedInventoryId
- Income transactions can automatically reduce inventory when linked
- Categories are now detailed and specific (34 vs 12)
- Farmer dashboard form shows inventory selector for income type
- All data refreshes after transaction creation (dashboard, transactions, inventory)

---
Task ID: 3-a
Agent: Sub Agent
Task: Update Prisma schema for detailed inventory

Work Log:
- Added 10 new fields to Inventory model in prisma/schema.prisma:
  - subCategory (String?) - detailed classification (e.g., "بذور"/"أسمدة"/"مبيدات" for inputs, "حبوب"/"خضروات"/"فواكه" for crops, "ألبان"/"بيض"/"لحوم" for animal products)
  - supplier (String?) - supplier/source name
  - expiryDate (DateTime?) - for inputs that expire
  - storageLocation (String?) - where it's stored (e.g., "المخزن الرئيسي", "السقيفة", "الإسطبل")
  - description (String?) - additional notes
  - batchNumber (String?) - batch/lot number for tracking
  - minimumStock (Float @default(0)) - minimum stock level before reorder
  - reorderQuantity (Float @default(0)) - suggested quantity to reorder
  - unitPrice (Float @default(0)) - selling price per unit (different from unitCost purchase price)
  - lastRestocked (DateTime?) - date of last restocking
- Updated itemType comment to include new types: equipment (معدات), feed (أعلاف), medication (أدوية بيطرية)
- Ran `db:push` - database synced successfully
- Ran `db:generate` - Prisma client regenerated successfully
- Updated /src/app/api/inventory/route.ts:
  - GET: enriched items now include `needsReorder` flag based on minimumStock
  - POST: accepts all new fields, auto-sets lastRestocked when qtyIn > 0
- Updated /src/app/api/inventory/[id]/route.ts:
  - PUT: supports updating all new fields
  - Auto-updates lastRestocked when qtyIn increases (restocking detected)
  - Returns `needsReorder` flag alongside existing `warning` flag
- Lint passes (pre-existing errors in server-launcher.js/layout.tsx are unrelated)

Stage Summary:
- Inventory model now has 10 additional fields for detailed tracking
- API routes fully support new fields in GET, POST, and PUT operations
- minimumStock provides reorder logic complementary to alertThreshold
- lastRestocked auto-populates on creation (when qtyIn > 0) and on restock updates
- itemType now documents 6 types: input, crop, animal_product, equipment, feed, medication

---
Task ID: 3-b
Agent: Sub Agent
Task: Expand seed data with detailed inventory

Work Log:
- Expanded inventory data in /src/app/api/seed/route.ts for all 5 farmers
- Each farmer now has 10-13 items per season (autumn and spring), up from 3-5 items previously
- All inventory items include the 10 new fields from Task 3-a:
  - subCategory: properly classified per itemType (بذور, أسمدة, مبيدات for inputs; حبوب, خضروات, فواكه, بقوليات, زيوت for crops; ألبان, بيض, لحوم for animal products; أعلاف مركزة, أعلاف خضراء, مكملات غذائية for feed; لقاحات, مضادات حيوية, مطهرات for medication; آلات, أدوات يدوية, شبكات ري for equipment; مستلزمات ري for inputs)
  - supplier: realistic Arabic supplier names (مؤسسة وطنية للبذور, شركة الأمل للأسمدة, مؤسسة الحماية النباتية, مؤسسة الأعلاف الوطنية, المعهد الوطني للطب البيطري, شركة الري الحديث, etc.)
  - expiryDate: set for inputs/feeds/medications that expire (6-18 months out), null for crops/equipment
  - storageLocation: realistic locations (المخزن الرئيسي, سقيفة B, الإسطبل, مستودع الحبوب, المعصرة, etc.)
  - description: Arabic notes describing each item
  - batchNumber: LOT-2024-XXXX format
  - minimumStock: set per item type
  - reorderQuantity: set for inputs/feed/medication (0 for crops/products since they're produced not ordered)
  - unitPrice: set for crops and animal products (> unitCost), 0 for inputs/equipment/feed/medication
  - lastRestocked: realistic dates within each season
- Updated inventory creation mapping code to pass all new fields to Prisma
- itemType variety now includes: input, crop, animal_product, feed, medication, equipment
- Verified TypeScript compilation and ESLint pass with no new errors

Farmer inventory summary:
- محمد بن أحمد (مسيلة): 13 autumn + 10 spring items (grains, vegetables, cattle, feed, medication)
- عبد الرحمن بوزيد (سطيف): 10 autumn + 10 spring items (grains, legumes, equipment, irrigation)
- فاطمة زهراء (بليدة): 10 autumn + 10 spring items (vegetables, fruits, irrigation equipment)
- يوسف مرابط (تيبازة): 10 autumn + 10 spring items (olives, oil, grains, machinery)
- خديجة بلقاسم (قالمة): 12 autumn + 10 spring items (cattle products, feed, medication, vegetables)

Stage Summary:
- Seed data expanded from ~21 total inventory items to ~115 items across all farmers
- All new fields are populated with realistic, contextual Arabic data
- New itemTypes (feed, medication, equipment) are now represented in seed data
- subCategory values align with the specification per itemType
- Database NOT re-seeded (existing farmers preserved); new data applies to future farmer creation only

---
Task ID: 4
Agent: Main Agent
Task: Make inventories dynamic with operations - selling decreases inventory, buying increases inventory, deletion reverses changes

Work Log:
- Updated Transaction POST API (`/api/transactions/route.ts`):
  - Changed from income-only inventory sync to bidirectional sync
  - Income (selling) → decreases inventory (increases qtyOut, recalculates qtyBalance)
  - Expense (buying supplies) → increases inventory (increases qtyIn, recalculates qtyBalance, updates lastRestocked)
  - Both types validate the linked inventory belongs to the same farm
  - Income still validates that quantity doesn't exceed available balance
- Updated Transaction DELETE API (`/api/transactions/[id]/route.ts`):
  - When deleting a linked income transaction → reverses deduction (decreases qtyOut)
  - When deleting a linked expense transaction → reverses addition (decreases qtyIn)
  - Uses Math.max(0, ...) to prevent negative values
- Updated Farmer Dashboard UI (`/components/fact/farmer-dashboard.tsx`):
  - Changed inventory linking from income-only to both income AND expense
  - For income (selling): shows items with balance > 0, auto-fills selling price (unitPrice)
  - For expense (buying): shows input/feed/medication/equipment items, auto-fills purchase price (unitCost)
  - Added visual indicator: green sync message explaining what will happen
  - Added inventory sync badge in transaction list showing "خصم مخزون" (deduction) or "إضافة مخزون" (addition)
  - Added quantity display in transaction list for linked transactions
  - Updated inventory display to show linked transactions under each item
  - Added "آخر توريد" (last restocked) display in inventory items
  - Enhanced number formatting with Intl.NumberFormat for all quantities
  - Color-coded qtyIn (blue) and qtyOut (red) in inventory display
  - Balance now shows green when healthy, red when below threshold
  - Updated toast messages to explain the sync action
- Updated handleDeleteTransaction to refresh inventory when a linked transaction is deleted

Stage Summary:
- Operations and inventory are now fully dynamic and bidirectional
- Selling (income) automatically reduces inventory
- Buying (expense for inputs/feed/medication/equipment) automatically increases inventory
- Deleting linked transactions reverses the inventory changes
- UI clearly shows which transactions are linked to inventory with visual badges
- Inventory items show their linked transactions for full traceability

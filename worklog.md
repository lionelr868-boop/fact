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

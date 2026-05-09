import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

const GOLD = [184, 134, 11] as const
const DARK_GREEN = [27, 94, 32] as const
const RED = [198, 40, 40] as const
const PURPLE = [123, 31, 162] as const
const BLACK = [26, 26, 46] as const
const GRAY = [100, 100, 100] as const
const LIGHT_BG = [253, 250, 245] as const

function formatNum(n: number) {
  return new Intl.NumberFormat('en-US').format(Math.round(n))
}

function addHeader(doc: jsPDF, title: string, subtitle: string) {
  // Gold top bar
  doc.setFillColor(...GOLD)
  doc.rect(0, 0, 210, 8, 'F')

  // Title background
  doc.setFillColor(...DARK_GREEN)
  doc.rect(0, 8, 210, 30, 'F')

  // Title text
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  doc.text('FACT', 105, 22, { align: 'center' })

  doc.setFontSize(12)
  doc.text(title, 105, 32, { align: 'center' })

  // Subtitle
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...BLACK)
  doc.text(subtitle, 105, 46, { align: 'center' })

  // Gold line under subtitle
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.5)
  doc.line(20, 50, 190, 50)
}

function addFooter(doc: jsPDF, pageNum: number) {
  const pageHeight = doc.internal.pageSize.height
  doc.setFillColor(...DARK_GREEN)
  doc.rect(0, pageHeight - 10, 210, 10, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.text(`FACT - منصة المحاسبة الفلاحية الرقمية  |  صفحة ${pageNum}`, 105, pageHeight - 4, { align: 'center' })
}

export function generateSeasonalAccountPDF(data: any) {
  const doc = new jsPDF('p', 'mm', 'a4') as jsPDF
  let y = 55
  const seasonLabel = `${data.season?.type || ''} ${data.season?.year || ''}`
  addHeader(doc, data.title, `${data.farm?.name || ''} - ${data.farm?.wilaya || ''} | ${seasonLabel}`)

  // Farm info box
  doc.setFillColor(...LIGHT_BG)
  doc.roundedRect(15, y, 180, 22, 3, 3, 'F')
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.3)
  doc.roundedRect(15, y, 180, 22, 3, 3, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...DARK_GREEN)
  doc.text('Farm Info / معلومات المزرعة', 20, y + 6)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...BLACK)
  doc.setFontSize(8)
  doc.text(`Owner: ${data.owner || '-'}  |  Area: ${data.farm?.area || 0} hectares  |  Wilaya: ${data.farm?.wilaya || '-'}  |  Season: ${seasonLabel}`, 20, y + 13)
  doc.text(`Generated: ${new Date(data.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 20, y + 18)
  y += 28

  // Financial Summary
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...DARK_GREEN)
  doc.text('Financial Summary / ملخص مالي', 15, y)
  y += 5

  doc.autoTable({
    startY: y,
    head: [['Indicator / المؤشر', 'Value / القيمة']],
    body: [
      ['Total Income / إجمالي المداخيل', `${formatNum(data.summary?.totalIncome || 0)} DZD`],
      ['Total Expenses / إجمالي المصاريف', `${formatNum(data.summary?.totalExpense || 0)} DZD`],
      ['Net Profit / صافي الربح', `${formatNum(data.summary?.netProfit || 0)} DZD`],
      ['Profitability Rate / نسبة الربحية', `${data.summary?.profitabilityRate?.toFixed(2) || 0}%`],
      ['Income per Hectare / المدخول لكل هكتار', `${formatNum(data.summary?.incomePerHectare || 0)} DZD/ha`],
      ['Profit per Hectare / الربح لكل هكتار', `${formatNum(data.summary?.profitPerHectare || 0)} DZD/ha`],
      ['Expense Coverage / تغطية المصاريف', `${data.summary?.expenseCoverageRate?.toFixed(2) || 0}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: DARK_GREEN, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [245, 240, 232] },
    margin: { left: 15, right: 15 },
  })
  y = (doc as any).lastAutoTable.finalY + 10

  // KPIs with formulas
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...DARK_GREEN)
  doc.text('KPIs & Calculation Methods / المؤشرات وطريقة الحساب', 15, y)
  y += 5

  const kpiBody = (data.kpis || []).map((kpi: any) => [
    kpi.name,
    typeof kpi.value === 'number' ? (kpi.id === 'kpi07' ? `${kpi.value} sources` : kpi.value.toFixed(2) + (kpi.id === 'kpi03' || kpi.id === 'kpi05' ? ' DZD' : '%')) : String(kpi.value),
    kpi.formula || '',
    kpi.calculation || '',
  ])

  doc.autoTable({
    startY: y,
    head: [['KPI / المؤشر', 'Value / القيمة', 'Formula / المعادلة', 'Calculation / الحساب']],
    body: kpiBody,
    theme: 'grid',
    headStyles: { fillColor: PURPLE, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 25 }, 2: { cellWidth: 55 }, 3: { cellWidth: 65 } },
    alternateRowStyles: { fillColor: [245, 240, 232] },
    margin: { left: 15, right: 15 },
  })
  y = (doc as any).lastAutoTable.finalY + 8

  // Income details
  if (data.incomeDetails && data.incomeDetails.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; addFooter(doc, doc.getNumberOfPages()) }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...DARK_GREEN)
    doc.text('Income Details / تفاصيل المداخيل', 15, y)
    y += 5

    doc.autoTable({
      startY: y,
      head: [['Category / البند', 'Amount / المبلغ (DZD)', 'Date / التاريخ', 'Note / ملاحظة']],
      body: data.incomeDetails.map((t: any) => [
        t.category,
        formatNum(t.amount),
        new Date(t.date).toLocaleDateString('en-US'),
        t.note || '-',
      ]),
      theme: 'grid',
      headStyles: { fillColor: DARK_GREEN, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [232, 245, 233] },
      margin: { left: 15, right: 15 },
    })
    y = (doc as any).lastAutoTable.finalY + 8
  }

  // Expense details
  if (data.expenseDetails && data.expenseDetails.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; addFooter(doc, doc.getNumberOfPages()) }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...RED)
    doc.text('Expense Details / تفاصيل المصاريف', 15, y)
    y += 5

    doc.autoTable({
      startY: y,
      head: [['Category / البند', 'Amount / المبلغ (DZD)', 'Date / التاريخ', 'Note / ملاحظة']],
      body: data.expenseDetails.map((t: any) => [
        t.category,
        formatNum(t.amount),
        new Date(t.date).toLocaleDateString('en-US'),
        t.note || '-',
      ]),
      theme: 'grid',
      headStyles: { fillColor: RED, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [255, 235, 238] },
      margin: { left: 15, right: 15 },
    })
    y = (doc as any).lastAutoTable.finalY + 8
  }

  // Income by category
  if (data.incomeByCategory && data.incomeByCategory.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; addFooter(doc, doc.getNumberOfPages()) }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...DARK_GREEN)
    doc.text('Income by Category / المداخيل حسب البند', 15, y)
    y += 5

    doc.autoTable({
      startY: y,
      head: [['Category / البند', 'Amount / المبلغ (DZD)', '% Percentage / النسبة']],
      body: data.incomeByCategory.map((c: any) => [c.name, formatNum(c.value), `${c.pct}%`]),
      theme: 'grid',
      headStyles: { fillColor: DARK_GREEN, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [232, 245, 233] },
      margin: { left: 15, right: 15 },
    })
    y = (doc as any).lastAutoTable.finalY + 8
  }

  // Expense by category
  if (data.expenseByCategory && data.expenseByCategory.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; addFooter(doc, doc.getNumberOfPages()) }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...RED)
    doc.text('Expenses by Category / المصاريف حسب البند', 15, y)
    y += 5

    doc.autoTable({
      startY: y,
      head: [['Category / البند', 'Amount / المبلغ (DZD)', '% Percentage / النسبة']],
      body: data.expenseByCategory.map((c: any) => [c.name, formatNum(c.value), `${c.pct}%`]),
      theme: 'grid',
      headStyles: { fillColor: RED, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [255, 235, 238] },
      margin: { left: 15, right: 15 },
    })
    y = (doc as any).lastAutoTable.finalY + 8
  }

  // Monthly breakdown
  if (data.monthlyData && data.monthlyData.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; addFooter(doc, doc.getNumberOfPages()) }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...DARK_GREEN)
    doc.text('Monthly Breakdown / التوزيع الشهري', 15, y)
    y += 5

    doc.autoTable({
      startY: y,
      head: [['Month / الشهر', 'Income / مداخيل (DZD)', 'Expenses / مصاريف (DZD)', 'Net / صافي (DZD)']],
      body: data.monthlyData.map((m: any) => [m.month, formatNum(m.income), formatNum(m.expense), formatNum(m.income - m.expense)]),
      theme: 'grid',
      headStyles: { fillColor: GOLD, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [255, 248, 225] },
      margin: { left: 15, right: 15 },
    })
    y = (doc as any).lastAutoTable.finalY + 8
  }

  // Inventory
  if (data.inventorySummary && data.inventorySummary.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; addFooter(doc, doc.getNumberOfPages()) }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...DARK_GREEN)
    doc.text('Inventory Summary / ملخص المخزون', 15, y)
    y += 5

    doc.autoTable({
      startY: y,
      head: [['Item / الصنف', 'Type / النوع', 'Unit', 'Qty In', 'Qty Out', 'Balance', 'Unit Cost', 'Total Value']],
      body: data.inventorySummary.map((i: any) => [
        i.name,
        i.type === 'input' ? 'Input' : i.type === 'crop' ? 'Crop' : 'Animal',
        i.unit,
        i.qtyIn,
        i.qtyOut,
        i.balance,
        formatNum(i.unitCost),
        formatNum(i.totalValue),
      ]),
      theme: 'grid',
      headStyles: { fillColor: PURPLE, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [243, 229, 245] },
      margin: { left: 15, right: 15 },
    })
  }

  // Add footers to all pages
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i)
  }

  return doc
}

export function generateProfitabilityPDF(data: any) {
  const doc = new jsPDF('p', 'mm', 'a4') as jsPDF
  let y = 55
  const seasonLabel = `${data.season?.type || ''} ${data.season?.year || ''}`
  addHeader(doc, data.title, `${data.farm?.name || ''} - ${data.farm?.wilaya || ''} | ${seasonLabel}`)

  // Summary
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...DARK_GREEN)
  doc.text('Profitability Summary / ملخص الربحية', 15, y)
  y += 5

  doc.autoTable({
    startY: y,
    head: [['Indicator', 'Value']],
    body: [
      ['Total Income', `${formatNum(data.summary?.totalIncome || 0)} DZD`],
      ['Total Expenses', `${formatNum(data.summary?.totalExpense || 0)} DZD`],
      ['Net Profit', `${formatNum(data.summary?.netProfit || 0)} DZD`],
      ['Profitability Rate', `${data.summary?.profitabilityRate?.toFixed(2) || 0}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: GOLD, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [255, 248, 225] },
    margin: { left: 15, right: 15 },
  })
  y = (doc as any).lastAutoTable.finalY + 8

  // KPIs with formulas
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...DARK_GREEN)
  doc.text('KPIs & Calculation Methods / المؤشرات وطريقة الحساب', 15, y)
  y += 5

  const kpiBody = (data.kpis || []).map((kpi: any) => [
    kpi.name,
    typeof kpi.value === 'number' ? kpi.value.toFixed(2) + (kpi.id === 'kpi03' || kpi.id === 'kpi05' ? ' DZD' : '%') : String(kpi.value),
    kpi.formula || '',
    kpi.calculation || '',
  ])

  doc.autoTable({
    startY: y,
    head: [['KPI', 'Value', 'Formula', 'Calculation']],
    body: kpiBody,
    theme: 'grid',
    headStyles: { fillColor: PURPLE, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 25 }, 2: { cellWidth: 55 }, 3: { cellWidth: 65 } },
    alternateRowStyles: { fillColor: [245, 240, 232] },
    margin: { left: 15, right: 15 },
  })
  y = (doc as any).lastAutoTable.finalY + 8

  // Profitability by category
  if (data.byCategory && data.byCategory.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; addFooter(doc, doc.getNumberOfPages()) }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...GOLD)
    doc.text('Profitability by Category / الربحية حسب البند', 15, y)
    y += 5

    doc.autoTable({
      startY: y,
      head: [['Category', 'Income (DZD)', 'Expense (DZD)', 'Profit (DZD)', 'Profitability %']],
      body: data.byCategory.map((c: any) => [c.name, formatNum(c.income), formatNum(c.expense), formatNum(c.profit), `${c.profitability}%`]),
      theme: 'grid',
      headStyles: { fillColor: GOLD, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [255, 248, 225] },
      margin: { left: 15, right: 15 },
    })
    y = (doc as any).lastAutoTable.finalY + 8
  }

  // Season comparison
  if (data.prevSeasonComparison) {
    if (y > 230) { doc.addPage(); y = 20; addFooter(doc, doc.getNumberOfPages()) }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...PURPLE)
    doc.text('Season Comparison / مقارنة مع الموسم السابق', 15, y)
    y += 5

    const prev = data.prevSeasonComparison
    doc.autoTable({
      startY: y,
      head: [['Metric', 'Previous Season', 'Current Season', 'Change']],
      body: [
        ['Income', `${formatNum(prev.income)} DZD`, `${formatNum(data.summary?.totalIncome || 0)} DZD`, `${prev.incomeChange >= 0 ? '+' : ''}${formatNum(prev.incomeChange)} DZD`],
        ['Expenses', `${formatNum(prev.expense)} DZD`, `${formatNum(data.summary?.totalExpense || 0)} DZD`, `${prev.expenseChange >= 0 ? '+' : ''}${formatNum(prev.expenseChange)} DZD`],
        ['Net Profit', `${formatNum(prev.profit)} DZD`, `${formatNum(data.summary?.netProfit || 0)} DZD`, `${prev.profitChange >= 0 ? '+' : ''}${formatNum(prev.profitChange)} DZD`],
        ['Profitability', `${prev.profitability}%`, `${data.summary?.profitabilityRate?.toFixed(2) || 0}%`, `${(data.summary?.profitabilityRate || 0) - prev.profitability >= 0 ? '+' : ''}${((data.summary?.profitabilityRate || 0) - prev.profitability).toFixed(2)}%`],
      ],
      theme: 'grid',
      headStyles: { fillColor: PURPLE, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [243, 229, 245] },
      margin: { left: 15, right: 15 },
    })
  }

  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i)
  }

  return doc
}

export function generateFinancialCertificatePDF(data: any) {
  const doc = new jsPDF('p', 'mm', 'a4') as jsPDF
  let y = 55
  const seasonLabel = `${data.season?.type || ''} ${data.season?.year || ''}`
  addHeader(doc, data.title, `${data.farm?.name || ''} - ${data.farm?.wilaya || ''} | ${seasonLabel}`)

  // Certificate decorative border
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(1.5)
  doc.roundedRect(12, y, 186, 100, 5, 5, 'S')
  doc.setLineWidth(0.5)
  doc.roundedRect(14, y + 2, 182, 96, 4, 4, 'S')

  y += 15
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...DARK_GREEN)
  doc.text('FINANCIAL PERFORMANCE CERTIFICATE', 105, y, { align: 'center' })
  doc.setFontSize(14)
  doc.text('شهادة أداء مالي', 105, y + 8, { align: 'center' })

  y += 20
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...BLACK)
  doc.text(`This certifies that the farm "${data.farm?.name || '-'}" owned by "${data.owner || '-'}"`, 105, y, { align: 'center' })
  doc.text(`located in ${data.farm?.wilaya || '-'} with an area of ${data.farm?.area || 0} hectares`, 105, y + 7, { align: 'center' })
  doc.text(`has achieved the following financial performance for the ${seasonLabel} season:`, 105, y + 14, { align: 'center' })

  y += 25
  doc.autoTable({
    startY: y,
    head: [['Indicator', 'Value']],
    body: [
      ['Total Income', `${formatNum(data.summary?.totalIncome || 0)} DZD`],
      ['Total Expenses', `${formatNum(data.summary?.totalExpense || 0)} DZD`],
      ['Net Profit', `${formatNum(data.summary?.netProfit || 0)} DZD`],
      ['Profitability Rate', `${data.summary?.profitabilityRate?.toFixed(2) || 0}%`],
      ['Financial Health', data.financialHealth],
      ['Governance Score', `${data.healthScore}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: DARK_GREEN, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 10 },
    margin: { left: 25, right: 25 },
  })

  y = (doc as any).lastAutoTable.finalY + 15

  // Stamp area
  doc.setFillColor(...LIGHT_BG)
  doc.roundedRect(60, y, 90, 30, 3, 3, 'F')
  doc.setDrawColor(...GOLD)
  doc.roundedRect(60, y, 90, 30, 3, 3, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...DARK_GREEN)
  doc.text('FACT Platform Seal', 105, y + 12, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...GRAY)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 105, y + 20, { align: 'center' })
  doc.text('Digital Certificate - FACT Platform', 105, y + 26, { align: 'center' })

  addFooter(doc, 1)
  return doc
}

export function generateCompliancePDF(data: any) {
  const doc = new jsPDF('p', 'mm', 'a4') as jsPDF
  let y = 55
  const seasonLabel = `${data.season?.type || ''} ${data.season?.year || ''}`
  addHeader(doc, data.title, `${data.farm?.name || ''} - ${data.farm?.wilaya || ''} | ${seasonLabel}`)

  // Summary
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...DARK_GREEN)
  doc.text('Compliance Summary / ملخص الامتثال', 15, y)
  y += 5

  doc.autoTable({
    startY: y,
    head: [['Indicator', 'Value']],
    body: [
      ['Total Financial Records', `${data.recordCount} records`],
      ['Income Records', `${data.incomeRecordCount}`],
      ['Expense Records', `${data.expenseRecordCount}`],
      ['Inventory Items', `${data.inventoryCount}`],
      ['Financial Health', data.financialHealth],
      ['Governance Score', `${data.healthScore}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: DARK_GREEN, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [232, 245, 233] },
    margin: { left: 15, right: 15 },
  })
  y = (doc as any).lastAutoTable.finalY + 10

  // KPIs
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...DARK_GREEN)
  doc.text('Governance KPIs / مؤشرات الحوكمة', 15, y)
  y += 5

  const kpiBody = (data.kpis || []).map((kpi: any) => [
    kpi.name,
    typeof kpi.value === 'number' ? kpi.value.toFixed(2) + '%' : String(kpi.value),
    kpi.formula || '',
    kpi.calculation || '',
  ])

  doc.autoTable({
    startY: y,
    head: [['KPI', 'Value', 'Formula', 'Calculation']],
    body: kpiBody,
    theme: 'grid',
    headStyles: { fillColor: PURPLE, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    columnStyles: { 0: { cellWidth: 35 }, 1: { cellWidth: 25 }, 2: { cellWidth: 55 }, 3: { cellWidth: 65 } },
    alternateRowStyles: { fillColor: [245, 240, 232] },
    margin: { left: 15, right: 15 },
  })
  y = (doc as any).lastAutoTable.finalY + 10

  // Compliance checks
  if (data.complianceChecks && data.complianceChecks.length > 0) {
    if (y > 230) { doc.addPage(); y = 20; addFooter(doc, doc.getNumberOfPages()) }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...DARK_GREEN)
    doc.text('Compliance Checks / فحوصات الامتثال', 15, y)
    y += 5

    doc.autoTable({
      startY: y,
      head: [['Check / الفحص', 'Status / الحالة', 'Details / التفاصيل']],
      body: data.complianceChecks.map((c: any) => [
        c.name,
        c.status ? 'PASS / ناجح' : 'FAIL / فاشل',
        c.details,
      ]),
      theme: 'grid',
      headStyles: { fillColor: DARK_GREEN, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      didParseCell: (hookData: any) => {
        if (hookData.column.index === 1 && hookData.cell.section === 'body') {
          const val = hookData.cell.raw as string
          if (val.includes('PASS')) {
            hookData.cell.styles.textColor = [27, 94, 32]
            hookData.cell.styles.fontStyle = 'bold'
          } else {
            hookData.cell.styles.textColor = [198, 40, 40]
            hookData.cell.styles.fontStyle = 'bold'
          }
        }
      },
      alternateRowStyles: { fillColor: [232, 245, 233] },
      margin: { left: 15, right: 15 },
    })
  }

  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i)
  }

  return doc
}

export function generateReportPDF(reportType: string, data: any) {
  switch (reportType) {
    case 'seasonal_account': return generateSeasonalAccountPDF(data)
    case 'profitability': return generateProfitabilityPDF(data)
    case 'financial_certificate': return generateFinancialCertificatePDF(data)
    case 'compliance': return generateCompliancePDF(data)
    default: return generateSeasonalAccountPDF(data)
  }
}

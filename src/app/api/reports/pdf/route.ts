import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { db } from '@/lib/db'

// PDF generation using jsPDF on the server
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالوصول' }, { status: 401 })
    }

    const body = await request.json()
    const { reportId } = body

    if (!reportId) {
      return NextResponse.json({ success: false, error: 'معرف التقرير مطلوب' }, { status: 400 })
    }

    // Get the report from database
    const report = await db.report.findUnique({ where: { id: reportId } })
    if (!report) {
      return NextResponse.json({ success: false, error: 'التقرير غير موجود' }, { status: 404 })
    }

    // Verify access
    const farm = await db.farm.findUnique({ where: { id: report.farmId } })
    if (!farm || (authUser.role === 'FARMER' && farm.userId !== authUser.id)) {
      return NextResponse.json({ success: false, error: 'غير مصرح بالوصول' }, { status: 403 })
    }

    // Parse report data
    const reportData = typeof report.data === 'string' ? JSON.parse(report.data) : report.data

    // Generate PDF using jsPDF
    const jsPDFModule = await import('jspdf')
    const jsPDF = jsPDFModule.jsPDF

    // Import autoTable as standalone function
    const autoTableModule = await import('jspdf-autotable')
    const autoTable = autoTableModule.autoTable

    const doc = new jsPDF('p', 'mm', 'a4') as any

    const GOLD = [184, 134, 11]
    const DARK_GREEN = [27, 94, 32]
    const RED = [198, 40, 40]
    const PURPLE = [123, 31, 162]
    const BLACK = [26, 26, 46]
    const LIGHT_BG = [253, 250, 245]

    function formatNum(n: number) {
      return new Intl.NumberFormat('en-US').format(Math.round(n))
    }

    function addHeader(title: string, subtitle: string) {
      doc.setFillColor(...GOLD)
      doc.rect(0, 0, 210, 8, 'F')
      doc.setFillColor(...DARK_GREEN)
      doc.rect(0, 8, 210, 30, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(22)
      doc.setTextColor(255, 255, 255)
      doc.text('FACT', 105, 22, { align: 'center' })
      doc.setFontSize(12)
      doc.text(title, 105, 32, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(...BLACK)
      doc.text(subtitle, 105, 46, { align: 'center' })
      doc.setDrawColor(...GOLD)
      doc.setLineWidth(0.5)
      doc.line(20, 50, 190, 50)
    }

    function addFooter(pageNum: number) {
      const pageHeight = doc.internal.pageSize.height
      doc.setFillColor(...DARK_GREEN)
      doc.rect(0, pageHeight - 10, 210, 10, 'F')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(255, 255, 255)
      doc.text(`FACT - Agricultural Digital Accounting Platform  |  Page ${pageNum}`, 105, pageHeight - 4, { align: 'center' })
    }

    const rData = reportData
    const seasonLabel = `${rData.season?.type || ''} ${rData.season?.year || ''}`

    switch (report.reportType) {
      case 'seasonal_account': {
        addHeader(rData.title || 'Seasonal Account', `${rData.farm?.name || ''} - ${rData.farm?.wilaya || ''} | ${seasonLabel}`)
        let y = 55

        // Farm info box
        doc.setFillColor(...LIGHT_BG)
        doc.roundedRect(15, y, 180, 22, 3, 3, 'F')
        doc.setDrawColor(...GOLD)
        doc.setLineWidth(0.3)
        doc.roundedRect(15, y, 180, 22, 3, 3, 'S')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(...DARK_GREEN)
        doc.text('Farm Info', 20, y + 6)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...BLACK)
        doc.setFontSize(8)
        doc.text(`Owner: ${rData.owner || '-'}  |  Area: ${rData.farm?.area || 0} ha  |  Wilaya: ${rData.farm?.wilaya || '-'}  |  Season: ${seasonLabel}`, 20, y + 13)
        doc.text(`Generated: ${new Date(rData.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 20, y + 18)
        y += 28

        // Financial Summary
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.setTextColor(...DARK_GREEN)
        doc.text('Financial Summary', 15, y)
        y += 5

        autoTable(doc, {
          startY: y,
          head: [['Indicator', 'Value']],
          body: [
            ['Total Income', `${formatNum(rData.summary?.totalIncome || 0)} DZD`],
            ['Total Expenses', `${formatNum(rData.summary?.totalExpense || 0)} DZD`],
            ['Net Profit', `${formatNum(rData.summary?.netProfit || 0)} DZD`],
            ['Profitability Rate', `${rData.summary?.profitabilityRate?.toFixed(2) || 0}%`],
            ['Income per Hectare', `${formatNum(rData.summary?.incomePerHectare || 0)} DZD/ha`],
            ['Profit per Hectare', `${formatNum(rData.summary?.profitPerHectare || 0)} DZD/ha`],
            ['Expense Coverage', `${rData.summary?.expenseCoverageRate?.toFixed(2) || 0}%`],
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
        doc.text('KPIs & Calculation Methods', 15, y)
        y += 5

        const kpiBody = (rData.kpis || []).map((kpi: any) => [
          kpi.name,
          typeof kpi.value === 'number' ? (kpi.id === 'kpi07' ? `${kpi.value} sources` : kpi.value.toFixed(2) + (kpi.id === 'kpi03' || kpi.id === 'kpi05' ? ' DZD' : '%')) : String(kpi.value),
          kpi.formula || '',
          kpi.calculation || '',
        ])

        autoTable(doc, {
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

        // Income details
        if (rData.incomeDetails && rData.incomeDetails.length > 0) {
          if (y > 230) { doc.addPage(); y = 20 }
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(12)
          doc.setTextColor(...DARK_GREEN)
          doc.text('Income Details', 15, y)
          y += 5

          autoTable(doc, {
            startY: y,
            head: [['Category', 'Amount (DZD)', 'Date', 'Note']],
            body: rData.incomeDetails.map((t: any) => [
              t.category, formatNum(t.amount), new Date(t.date).toLocaleDateString('en-US'), t.note || '-'
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
        if (rData.expenseDetails && rData.expenseDetails.length > 0) {
          if (y > 230) { doc.addPage(); y = 20 }
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(12)
          doc.setTextColor(...RED)
          doc.text('Expense Details', 15, y)
          y += 5

          autoTable(doc, {
            startY: y,
            head: [['Category', 'Amount (DZD)', 'Date', 'Note']],
            body: rData.expenseDetails.map((t: any) => [
              t.category, formatNum(t.amount), new Date(t.date).toLocaleDateString('en-US'), t.note || '-'
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
        if (rData.incomeByCategory && rData.incomeByCategory.length > 0) {
          if (y > 230) { doc.addPage(); y = 20 }
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(12)
          doc.setTextColor(...DARK_GREEN)
          doc.text('Income by Category', 15, y)
          y += 5

          autoTable(doc, {
            startY: y,
            head: [['Category', 'Amount (DZD)', '%']],
            body: rData.incomeByCategory.map((c: any) => [c.name, formatNum(c.value), `${c.pct}%`]),
            theme: 'grid',
            headStyles: { fillColor: DARK_GREEN, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            alternateRowStyles: { fillColor: [232, 245, 233] },
            margin: { left: 15, right: 15 },
          })
          y = (doc as any).lastAutoTable.finalY + 8
        }

        // Expense by category
        if (rData.expenseByCategory && rData.expenseByCategory.length > 0) {
          if (y > 230) { doc.addPage(); y = 20 }
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(12)
          doc.setTextColor(...RED)
          doc.text('Expenses by Category', 15, y)
          y += 5

          autoTable(doc, {
            startY: y,
            head: [['Category', 'Amount (DZD)', '%']],
            body: rData.expenseByCategory.map((c: any) => [c.name, formatNum(c.value), `${c.pct}%`]),
            theme: 'grid',
            headStyles: { fillColor: RED, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            alternateRowStyles: { fillColor: [255, 235, 238] },
            margin: { left: 15, right: 15 },
          })
          y = (doc as any).lastAutoTable.finalY + 8
        }

        // Monthly breakdown
        if (rData.monthlyData && rData.monthlyData.length > 0) {
          if (y > 230) { doc.addPage(); y = 20 }
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(12)
          doc.setTextColor(...DARK_GREEN)
          doc.text('Monthly Breakdown', 15, y)
          y += 5

          autoTable(doc, {
            startY: y,
            head: [['Month', 'Income (DZD)', 'Expenses (DZD)', 'Net (DZD)']],
            body: rData.monthlyData.map((m: any) => [m.month, formatNum(m.income), formatNum(m.expense), formatNum(m.income - m.expense)]),
            theme: 'grid',
            headStyles: { fillColor: GOLD, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            alternateRowStyles: { fillColor: [255, 248, 225] },
            margin: { left: 15, right: 15 },
          })
        }

        // Inventory
        if (rData.inventorySummary && rData.inventorySummary.length > 0) {
          if (y > 230) { doc.addPage(); y = 20 }
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(12)
          doc.setTextColor(...DARK_GREEN)
          doc.text('Inventory Summary', 15, y)
          y += 5

          autoTable(doc, {
            startY: y,
            head: [['Item', 'Type', 'Unit', 'Qty In', 'Qty Out', 'Balance', 'Unit Cost', 'Total Value']],
            body: rData.inventorySummary.map((i: any) => [
              i.name, i.type === 'input' ? 'Input' : i.type === 'crop' ? 'Crop' : 'Animal',
              i.unit, i.qtyIn, i.qtyOut, i.balance, formatNum(i.unitCost), formatNum(i.totalValue),
            ]),
            theme: 'grid',
            headStyles: { fillColor: PURPLE, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
            bodyStyles: { fontSize: 8 },
            alternateRowStyles: { fillColor: [243, 229, 245] },
            margin: { left: 15, right: 15 },
          })
        }
        break
      }

      case 'profitability': {
        addHeader(rData.title || 'Profitability Report', `${rData.farm?.name || ''} - ${rData.farm?.wilaya || ''} | ${seasonLabel}`)
        let y = 55

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.setTextColor(...DARK_GREEN)
        doc.text('Profitability Summary', 15, y)
        y += 5

        autoTable(doc, {
          startY: y,
          head: [['Indicator', 'Value']],
          body: [
            ['Total Income', `${formatNum(rData.summary?.totalIncome || 0)} DZD`],
            ['Total Expenses', `${formatNum(rData.summary?.totalExpense || 0)} DZD`],
            ['Net Profit', `${formatNum(rData.summary?.netProfit || 0)} DZD`],
            ['Profitability Rate', `${rData.summary?.profitabilityRate?.toFixed(2) || 0}%`],
          ],
          theme: 'grid',
          headStyles: { fillColor: GOLD, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          alternateRowStyles: { fillColor: [255, 248, 225] },
          margin: { left: 15, right: 15 },
        })
        y = (doc as any).lastAutoTable.finalY + 8

        // KPIs
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.setTextColor(...DARK_GREEN)
        doc.text('KPIs & Calculation Methods', 15, y)
        y += 5

        const kpiBody = (rData.kpis || []).map((kpi: any) => [
          kpi.name,
          typeof kpi.value === 'number' ? kpi.value.toFixed(2) + (kpi.id === 'kpi03' || kpi.id === 'kpi05' ? ' DZD' : '%') : String(kpi.value),
          kpi.formula || '',
          kpi.calculation || '',
        ])

        autoTable(doc, {
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

        // By category
        if (rData.byCategory && rData.byCategory.length > 0) {
          if (y > 230) { doc.addPage(); y = 20 }
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(12)
          doc.setTextColor(...GOLD)
          doc.text('Profitability by Category', 15, y)
          y += 5

          autoTable(doc, {
            startY: y,
            head: [['Category', 'Income (DZD)', 'Expense (DZD)', 'Profit (DZD)', 'Profitability %']],
            body: rData.byCategory.map((c: any) => [c.name, formatNum(c.income), formatNum(c.expense), formatNum(c.profit), `${c.profitability}%`]),
            theme: 'grid',
            headStyles: { fillColor: GOLD, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            alternateRowStyles: { fillColor: [255, 248, 225] },
            margin: { left: 15, right: 15 },
          })
          y = (doc as any).lastAutoTable.finalY + 8
        }

        // Season comparison
        if (rData.prevSeasonComparison) {
          if (y > 230) { doc.addPage(); y = 20 }
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(12)
          doc.setTextColor(...PURPLE)
          doc.text('Season Comparison', 15, y)
          y += 5

          const prev = rData.prevSeasonComparison
          autoTable(doc, {
            startY: y,
            head: [['Metric', 'Previous Season', 'Current Season', 'Change']],
            body: [
              ['Income', `${formatNum(prev.income)} DZD`, `${formatNum(rData.summary?.totalIncome || 0)} DZD`, `${prev.incomeChange >= 0 ? '+' : ''}${formatNum(prev.incomeChange)} DZD`],
              ['Expenses', `${formatNum(prev.expense)} DZD`, `${formatNum(rData.summary?.totalExpense || 0)} DZD`, `${prev.expenseChange >= 0 ? '+' : ''}${formatNum(prev.expenseChange)} DZD`],
              ['Net Profit', `${formatNum(prev.profit)} DZD`, `${formatNum(rData.summary?.netProfit || 0)} DZD`, `${prev.profitChange >= 0 ? '+' : ''}${formatNum(prev.profitChange)} DZD`],
            ],
            theme: 'grid',
            headStyles: { fillColor: PURPLE, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            alternateRowStyles: { fillColor: [243, 229, 245] },
            margin: { left: 15, right: 15 },
          })
        }
        break
      }

      case 'financial_certificate': {
        addHeader(rData.title || 'Financial Certificate', `${rData.farm?.name || ''} - ${rData.farm?.wilaya || ''} | ${seasonLabel}`)
        let y = 55

        // Certificate decorative border
        doc.setDrawColor(...GOLD)
        doc.setLineWidth(1.5)
        doc.roundedRect(12, y, 186, 120, 5, 5, 'S')
        doc.setLineWidth(0.5)
        doc.roundedRect(14, y + 2, 182, 116, 4, 4, 'S')

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
        doc.text(`This certifies that the farm "${rData.farm?.name || '-'}" owned by "${rData.owner || '-'}"`, 105, y, { align: 'center' })
        doc.text(`located in ${rData.farm?.wilaya || '-'} with an area of ${rData.farm?.area || 0} hectares`, 105, y + 7, { align: 'center' })
        doc.text(`has achieved the following financial performance for the ${seasonLabel} season:`, 105, y + 14, { align: 'center' })

        y += 25
        autoTable(doc, {
          startY: y,
          head: [['Indicator', 'Value']],
          body: [
            ['Total Income', `${formatNum(rData.summary?.totalIncome || 0)} DZD`],
            ['Total Expenses', `${formatNum(rData.summary?.totalExpense || 0)} DZD`],
            ['Net Profit', `${formatNum(rData.summary?.netProfit || 0)} DZD`],
            ['Profitability Rate', `${rData.summary?.profitabilityRate?.toFixed(2) || 0}%`],
            ['Financial Health', rData.financialHealth],
            ['Governance Score', `${rData.healthScore}%`],
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
        doc.setTextColor(100, 100, 100)
        doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 105, y + 20, { align: 'center' })
        doc.text('Digital Certificate - FACT Platform', 105, y + 26, { align: 'center' })
        break
      }

      case 'compliance': {
        addHeader(rData.title || 'Compliance Report', `${rData.farm?.name || ''} - ${rData.farm?.wilaya || ''} | ${seasonLabel}`)
        let y = 55

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.setTextColor(...DARK_GREEN)
        doc.text('Compliance Summary', 15, y)
        y += 5

        autoTable(doc, {
          startY: y,
          head: [['Indicator', 'Value']],
          body: [
            ['Total Financial Records', `${rData.recordCount} records`],
            ['Income Records', `${rData.incomeRecordCount}`],
            ['Expense Records', `${rData.expenseRecordCount}`],
            ['Inventory Items', `${rData.inventoryCount}`],
            ['Financial Health', rData.financialHealth],
            ['Governance Score', `${rData.healthScore}%`],
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
        doc.text('Governance KPIs', 15, y)
        y += 5

        const kpiBody = (rData.kpis || []).map((kpi: any) => [
          kpi.name,
          typeof kpi.value === 'number' ? kpi.value.toFixed(2) + '%' : String(kpi.value),
          kpi.formula || '',
          kpi.calculation || '',
        ])

        autoTable(doc, {
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
        if (rData.complianceChecks && rData.complianceChecks.length > 0) {
          if (y > 230) { doc.addPage(); y = 20 }
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(12)
          doc.setTextColor(...DARK_GREEN)
          doc.text('Compliance Checks', 15, y)
          y += 5

          autoTable(doc, {
            startY: y,
            head: [['Check', 'Status', 'Details']],
            body: rData.complianceChecks.map((c: any) => [
              c.name,
              c.status ? 'PASS' : 'FAIL',
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
        break
      }

      default:
        return NextResponse.json({ success: false, error: 'نوع التقرير غير معروف' }, { status: 400 })
    }

    // Add footers to all pages
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      addFooter(i)
    }

    // Get PDF as base64
    const pdfBase64 = doc.output('datauristring')

    return NextResponse.json({
      success: true,
      data: {
        pdf: pdfBase64,
        filename: `FACT_${report.reportType}_${seasonLabel.replace(/\s+/g, '_')}.pdf`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء إنشاء ملف PDF' },
      { status: 500 }
    )
  }
}

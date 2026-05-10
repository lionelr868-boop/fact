'use client'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp, TrendingDown, AlertTriangle, Wheat,
  BarChart3, Shield, Award, CheckCircle2, XCircle, Printer, MapPin,
  Calendar, DollarSign, Percent, BookOpen, Stamp, Download,
  Sprout, Carrot, Milk, Landmark, FlaskConical, Droplets, Users, Truck, Wrench, Plus, Leaf, Package,
  Info, Lightbulb, ArrowLeft, ClipboardCheck, Gauge, FileText, Clock, Target, Loader2
} from 'lucide-react'
import { useState } from 'react'
import { toJpeg } from 'html-to-image'
import { jsPDF } from 'jspdf'
import { toast } from 'sonner'

const CATEGORY_ICONS: Record<string, any> = {
  // Income categories
  'بيع القمح': Wheat, 'بيع الشعير': Wheat, 'بيع البطاطا': Carrot,
  'بيع الطماطم': Carrot, 'بيع الخضروات': Carrot, 'بيع الحليب': Milk,
  'بيع الأجبان': Milk, 'بيع البيض': Milk, 'بيع اللحوم': Milk,
  'بيع زيت الزيتون': Droplets, 'بيع الحمضيات': Carrot, 'بيع البقوليات': Wheat,
  'دعم حكومي': Landmark, 'إعانة البذور': Landmark, 'إعانة الري': Landmark,
  // Expense categories
  'بذور القمح': Sprout, 'بذور الخضروات': Sprout, 'بذور البقوليات': Sprout,
  'أسمدة NPK': FlaskConical, 'أسمدة عضوية': FlaskConical,
  'مبيدات أعشاب': FlaskConical, 'مبيدات حشرية': FlaskConical,
  'ري بالرش': Droplets, 'ري بالتنقيط': Droplets,
  'عمالة موسمية': Users, 'عمالة دائمة': Users,
  'نقل المحاصيل': Truck, 'تسويق': Truck,
  'صيانة معدات': Wrench, 'صيانة مباني': Wrench,
  'أعلاف الماشية': Wheat, 'وقود': Truck,
  // Legacy mappings for backward compatibility
  'حبوب': Wheat, 'خضروات': Carrot, 'منتجات حيوانية': Milk,
  'بذور': Sprout, 'أسمدة ومبيدات': FlaskConical,
  'ري': Droplets, 'عمالة': Users, 'نقل وتسويق': Truck,
  'صيانة': Wrench, 'أخرى': Plus,
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US').format(Math.round(n)) + ' دج'
}

function getReportTypeLabel(type: string) {
  switch (type) {
    case 'seasonal_account': return 'كشف حساب موسمي'
    case 'profitability': return 'تقرير الربحية'
    case 'financial_certificate': return 'شهادة أداء مالي'
    case 'compliance': return 'تقرير الامتثال'
    default: return 'تقرير'
  }
}

function getReportTypeColor(type: string) {
  switch (type) {
    case 'seasonal_account': return { gradient: 'from-nature-green-dark to-green-600', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800' }
    case 'profitability': return { gradient: 'from-nature-golden to-yellow-600', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' }
    case 'financial_certificate': return { gradient: 'from-nature-purple to-nature-blue-red', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' }
    case 'compliance': return { gradient: 'from-nature-rose to-red-700', bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' }
    default: return { gradient: 'from-gray-500 to-gray-600', bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-800' }
  }
}

interface ReportViewerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  report: any
  reportData: any
}

export function ReportViewer({ open, onOpenChange, report, reportData }: ReportViewerProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExportPDF = async () => {
    try {
      setIsExporting(true)
      const element = document.getElementById('report-export-content')
      if (!element) {
        toast.error('عذراً، لم يتم العثور على محتوى التقرير.')
        return
      }

      toast.loading('جاري تجهيز ملف PDF...', { id: 'pdf-toast' })

      // Create a clone to ensure full height is captured, bypassing ScrollArea restrictions
      const clone = element.cloneNode(true) as HTMLElement
      document.body.appendChild(clone)
      clone.style.position = 'absolute'
      clone.style.top = '-9999px'
      clone.style.left = '-9999px'
      clone.style.width = '1200px'
      clone.style.height = 'auto'
      clone.style.overflow = 'visible'
      clone.style.backgroundColor = 'white'
      clone.style.padding = '40px'

      // Use html-to-image which supports all modern CSS (including Tailwind v4 oklab colors)
      const dataUrl = await toJpeg(clone, {
        quality: 1.0,
        width: 1200,
        backgroundColor: '#ffffff',
        pixelRatio: 2
      })
      
      document.body.removeChild(clone)
      
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      
      // We need to calculate height based on the image aspect ratio
      // First create an image element to get its dimensions
      const img = new Image()
      img.src = dataUrl
      await new Promise((resolve) => { img.onload = resolve })
      
      const pdfHeight = (img.height * pdfWidth) / img.width
      
      let heightLeft = pdfHeight
      let position = 0

      // Add first page
      pdf.addImage(dataUrl, 'JPEG', 0, position, pdfWidth, pdfHeight)
      heightLeft -= pdf.internal.pageSize.getHeight()

      // Add subsequent pages if needed
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight
        pdf.addPage()
        pdf.addImage(dataUrl, 'JPEG', 0, position, pdfWidth, pdfHeight)
        heightLeft -= pdf.internal.pageSize.getHeight()
      }

      const filename = `FACT_${report.reportType}_${new Date(report.generatedAt).toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`
      pdf.save(filename)
      toast.success('تم تحميل التقرير بنجاح!', { id: 'pdf-toast' })
    } catch (error: any) {
      console.error('PDF generation error:', error)
      toast.error(`حدث خطأ أثناء توليد الـ PDF: ${error.message || 'حاول مرة أخرى'}`, { id: 'pdf-toast' })
    } finally {
      setIsExporting(false)
    }
  }
  if (!report || !reportData) return null

  const rData = reportData
  const rType = report.reportType
  const colors = getReportTypeColor(rType)

  // Profitability gauge color
  const profitRate = rData.summary?.profitabilityRate || 0
  const gaugeColor = profitRate >= 50 ? 'text-emerald-500' : profitRate >= 20 ? 'text-amber-500' : 'text-red-500'
  const gaugeBg = profitRate >= 50 ? 'bg-emerald-500' : profitRate >= 20 ? 'bg-amber-500' : 'bg-red-500'

  // Compliance grade
  const complianceItems = [
    rData.hasRecords,
    rData.hasInventory,
    (rData.recordCount || 0) >= 3,
    !!rData.farm?.contractRef,
    (rData.summary?.profitabilityRate || 0) > 0,
    (rData.summary?.totalIncome || 0) > 0 && (rData.summary?.totalExpense || 0) > 0,
    (rData.inventoryCount || 0) >= 2,
    (rData.recordCount || 0) >= 1,
  ]
  const complianceScore = Math.round(complianceItems.filter(Boolean).length / complianceItems.length * 100)
  const complianceGrade = complianceScore >= 80 ? 'ممتاز' : complianceScore >= 50 ? 'جيد' : 'ضعيف'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[98vw] sm:!max-w-[98vw] w-[98vw] !h-[96vh] max-h-[96vh] p-0 overflow-hidden gap-0" showCloseButton>
        <div className="flex flex-col h-[96vh]">
          {/* Header with gradient */}
          <div className={`bg-gradient-to-l ${colors.gradient} p-8 text-white shrink-0`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  {rType === 'seasonal_account' && <BookOpen className="size-10" />}
                  {rType === 'profitability' && <BarChart3 className="size-10" />}
                  {rType === 'financial_certificate' && <Stamp className="size-10" />}
                  {rType === 'compliance' && <Shield className="size-10" />}
                </div>
                <div>
                  <h2 className="text-3xl font-black">{rData.title || getReportTypeLabel(rType)}</h2>
                  <p className="text-white/80 text-xl mt-2">
                    {new Date(report.generatedAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-white hover:bg-white/20 text-xl px-6 py-4"
                  onClick={handleExportPDF}
                  disabled={isExporting}
                >
                  {isExporting ? <Loader2 className="size-6 ml-3 animate-spin" /> : <Download className="size-6 ml-3" />}
                  {isExporting ? 'جاري التحميل...' : 'تحميل PDF'}
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-white hover:bg-white/20 text-xl px-6 py-4"
                  onClick={() => window.print()}
                  disabled={isExporting}
                >
                  <Printer className="size-6 ml-3" />
                  طباعة
                </Button>
              </div>
            </div>
          </div>

          {/* Report content */}
          <ScrollArea className="flex-1 overflow-auto">
            <div id="report-export-content" className="p-10 space-y-12 bg-background">

              {/* ====== Seasonal Account Report ====== */}
              {rType === 'seasonal_account' && (
                <>
                  {/* Farm & Season Info */}
                  <div className="grid grid-cols-2 gap-8">
                    <div className={`${colors.bg} rounded-2xl p-8 border-2 ${colors.border}`}>
                      <div className="flex items-center gap-4 mb-4">
                        <MapPin className={`size-8 ${colors.text}`} />
                        <span className="text-2xl font-black">معلومات المزرعة</span>
                      </div>
                      <p className="text-xl font-bold">{rData.farm?.name}</p>
                      <p className="text-lg text-muted-foreground mt-2">{rData.farm?.wilaya} • {rData.farm?.area} هكتار</p>
                    </div>
                    <div className={`${colors.bg} rounded-2xl p-8 border-2 ${colors.border}`}>
                      <div className="flex items-center gap-4 mb-4">
                        <Calendar className={`size-8 ${colors.text}`} />
                        <span className="text-2xl font-black">الموسم</span>
                      </div>
                      <p className="text-xl font-bold">
                        {rData.season?.type === 'خريف' ? 'خريف' : 'ربيع'} {rData.season?.year}
                      </p>
                    </div>
                  </div>

                  {/* Summary Cards - BIG */}
                  <div className="grid grid-cols-3 gap-8">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-10 border-2 border-green-200 dark:border-green-800 text-center">
                      <TrendingUp className="size-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                      <p className="text-xl text-muted-foreground mb-3 font-medium">إجمالي المداخيل</p>
                      <p className="text-4xl font-black text-green-700 dark:text-green-300">{formatCurrency(rData.summary?.totalIncome || 0)}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-10 border-2 border-red-200 dark:border-red-800 text-center">
                      <TrendingDown className="size-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
                      <p className="text-xl text-muted-foreground mb-3 font-medium">إجمالي المصاريف</p>
                      <p className="text-4xl font-black text-red-700 dark:text-red-300">{formatCurrency(rData.summary?.totalExpense || 0)}</p>
                    </div>
                    <div className={`rounded-2xl p-10 border-2 text-center ${
                      (rData.summary?.netProfit || 0) >= 0
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}>
                      <DollarSign className={`size-12 mx-auto mb-4 ${
                        (rData.summary?.netProfit || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`} />
                      <p className="text-xl text-muted-foreground mb-3 font-medium">صافي الربح</p>
                      <p className={`text-4xl font-black ${
                        (rData.summary?.netProfit || 0) >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'
                      }`}>{formatCurrency(rData.summary?.netProfit || 0)}</p>
                    </div>
                  </div>

                  {/* Profitability Rate */}
                  <div className={`${colors.bg} rounded-2xl p-10 border-2 ${colors.border}`}>
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-2xl font-black flex items-center gap-4">
                        <Percent className={`size-8 ${colors.text}`} />
                        نسبة الربحية
                      </span>
                      <span className={`text-5xl font-black ${colors.text}`}>
                        {rData.summary?.profitabilityRate?.toFixed(1) || 0}%
                      </span>
                    </div>
                    <Progress value={Math.min(100, Math.max(0, rData.summary?.profitabilityRate || 0))} className="h-6" />
                  </div>

                  {/* KPI Calculation Methods */}
                  {rData.kpis && rData.kpis.length > 0 && (
                    <div>
                      <h3 className="text-2xl font-black mb-6 flex items-center gap-4">
                        <Shield className="size-8 text-nature-purple" />
                        المؤشرات وطريقة الحساب
                      </h3>
                      <div className="rounded-2xl border-2 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-purple-50 dark:bg-purple-900/20">
                              <TableHead className="text-right font-black text-lg py-5 px-6">المؤشر</TableHead>
                              <TableHead className="text-right font-black text-lg py-5 px-6">القيمة</TableHead>
                              <TableHead className="text-right font-black text-lg py-5 px-6">المعادلة</TableHead>
                              <TableHead className="text-right font-black text-lg py-5 px-6">الحساب</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rData.kpis.map((kpi: any, idx: number) => (
                              <TableRow key={idx} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                                <TableCell className="font-bold text-lg py-5 px-6">{kpi.name}</TableCell>
                                <TableCell className="text-lg font-black py-5 px-6">
                                  {kpi.id === 'kpi07' ? `${kpi.value} بنود` : 
                                   kpi.id === 'kpi03' || kpi.id === 'kpi05' ? `${new Intl.NumberFormat('en-US').format(Math.round(kpi.value))} دج` :
                                   `${kpi.value?.toFixed(1)}%`}
                                </TableCell>
                                <TableCell className="text-lg text-muted-foreground py-5 px-6">{kpi.formula}</TableCell>
                                <TableCell className="text-lg text-muted-foreground py-5 px-6">{kpi.calculation}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Income Details Table */}
                  <div>
                    <h3 className="text-2xl font-black mb-6 flex items-center gap-4">
                      <TrendingUp className="size-8 text-green-600" />
                      تفاصيل المداخيل
                    </h3>
                    <div className="rounded-2xl border-2 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-green-50 dark:bg-green-900/20">
                            <TableHead className="text-right font-black text-lg py-5 px-6">البند</TableHead>
                            <TableHead className="text-right font-black text-lg py-5 px-6">المبلغ</TableHead>
                            <TableHead className="text-right font-black text-lg py-5 px-6">التاريخ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rData.incomeDetails?.map((item: any, idx: number) => (
                            <TableRow key={idx} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                              <TableCell className="font-bold text-lg py-5 px-6">{item.category}</TableCell>
                              <TableCell className="text-green-700 dark:text-green-300 font-black text-lg py-5 px-6">{formatCurrency(item.amount)}</TableCell>
                              <TableCell className="text-muted-foreground text-lg py-5 px-6">{new Date(item.date).toLocaleDateString('fr-FR')}</TableCell>
                            </TableRow>
                          ))}
                          {!rData.incomeDetails?.length && (
                            <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-10 text-xl">لا توجد مداخيل</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Expense Details Table */}
                  <div>
                    <h3 className="text-2xl font-black mb-6 flex items-center gap-4">
                      <TrendingDown className="size-8 text-red-600" />
                      تفاصيل المصاريف
                    </h3>
                    <div className="rounded-2xl border-2 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-red-50 dark:bg-red-900/20">
                            <TableHead className="text-right font-black text-lg py-5 px-6">البند</TableHead>
                            <TableHead className="text-right font-black text-lg py-5 px-6">المبلغ</TableHead>
                            <TableHead className="text-right font-black text-lg py-5 px-6">التاريخ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rData.expenseDetails?.map((item: any, idx: number) => (
                            <TableRow key={idx} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                              <TableCell className="font-bold text-lg py-5 px-6">{item.category}</TableCell>
                              <TableCell className="text-red-700 dark:text-red-300 font-black text-lg py-5 px-6">{formatCurrency(item.amount)}</TableCell>
                              <TableCell className="text-muted-foreground text-lg py-5 px-6">{new Date(item.date).toLocaleDateString('fr-FR')}</TableCell>
                            </TableRow>
                          ))}
                          {!rData.expenseDetails?.length && (
                            <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-10 text-xl">لا توجد مصاريف</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </>
              )}

              {/* ====== Profitability Report ====== */}
              {rType === 'profitability' && (
                <>
                  {/* Executive Summary */}
                  <div className={`rounded-2xl p-10 border-2 ${colors.border} ${colors.bg}`}>
                    <div className="flex items-center gap-4 mb-5">
                      <div className={`w-14 h-14 rounded-xl ${colors.bg} flex items-center justify-center`}>
                        <FileText className={`size-8 ${colors.text}`} />
                      </div>
                      <h3 className="text-2xl font-black">الملخص التنفيذي</h3>
                    </div>
                    <p className="text-lg leading-relaxed text-foreground">
                      يقدم هذا التقرير تحليلاً شاملاً لربحية المزرعة &quot;{rData.farm?.name}&quot; خلال الموسم {rData.season?.type === 'خريف' ? 'الخريف' : 'الربيع'} {rData.season?.year}. 
                      بلغت المداخيل الإجمالية {formatCurrency(rData.summary?.totalIncome || 0)} مقابل مصاريف بقيمة {formatCurrency(rData.summary?.totalExpense || 0)}، 
                      مما أسفر عن صافي ربح {formatCurrency(rData.summary?.netProfit || 0)} بنسبة ربحية قدرها {(rData.summary?.profitabilityRate || 0).toFixed(1)}%. 
                      {(rData.summary?.netProfit || 0) >= 0 
                        ? 'تُظهر النتائج أداءً مالياً إيجابياً للموسم الحالي.' 
                        : 'تشير النتائج إلى خسارة تتطلب مراجعة المصاريف وتحسين الإيرادات.'}
                    </p>
                  </div>

                  {/* Methodology Explanation */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-10 border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                        <Info className="size-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-2xl font-black text-blue-700 dark:text-blue-300">منهجية التقرير</h3>
                    </div>
                    <div className="space-y-3 text-lg text-blue-800 dark:text-blue-200 leading-relaxed">
                      <p>• يتم حساب الربحية بناءً على الفرق بين إجمالي المداخيل والمصاريف المسجلة في النظام خلال الموسم.</p>
                      <p>• نسبة الربحية = (صافي الربح ÷ إجمالي المداخيل) × 100</p>
                      <p>• يتم تصنيف البنود حسب الفئات الزراعية لتحديد أكثر المجالات ربحية أو خسارة.</p>
                      <p>• نسبة الربحية أعلى من 50% تُعتار ممتازة، بين 20% و50% جيدة، وأقل من 20% تتطلب مراجعة.</p>
                    </div>
                  </div>

                  {/* Farm & Season Info */}
                  <div className={`${colors.bg} rounded-2xl p-8 border-2 ${colors.border}`}>
                    <div className="flex items-center gap-4">
                      <MapPin className={`size-8 ${colors.text}`} />
                      <div>
                        <p className="text-2xl font-black">{rData.farm?.name}</p>
                        <p className="text-lg text-muted-foreground mt-1">{rData.farm?.wilaya} • {rData.farm?.area} هكتار • موسم {rData.season?.type === 'خريف' ? 'الخريف' : 'الربيع'} {rData.season?.year}</p>
                      </div>
                    </div>
                  </div>

                  {/* Summary Cards - MUCH BIGGER */}
                  <div className="grid grid-cols-4 gap-8">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-10 border-2 border-green-200 dark:border-green-800 text-center">
                      <TrendingUp className="size-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                      <p className="text-xl text-muted-foreground mb-3 font-medium">إجمالي المداخيل</p>
                      <p className="text-4xl font-black text-green-700 dark:text-green-300">{formatCurrency(rData.summary?.totalIncome || 0)}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-10 border-2 border-red-200 dark:border-red-800 text-center">
                      <TrendingDown className="size-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
                      <p className="text-xl text-muted-foreground mb-3 font-medium">إجمالي المصاريف</p>
                      <p className="text-4xl font-black text-red-700 dark:text-red-300">{formatCurrency(rData.summary?.totalExpense || 0)}</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-10 border-2 border-amber-200 dark:border-amber-800 text-center">
                      <DollarSign className="size-12 text-amber-600 dark:text-amber-400 mx-auto mb-4" />
                      <p className="text-xl text-muted-foreground mb-3 font-medium">صافي الربح</p>
                      <p className="text-4xl font-black text-amber-700 dark:text-amber-300">{formatCurrency(rData.summary?.netProfit || 0)}</p>
                    </div>
                    <div className={`${colors.bg} rounded-2xl p-10 border-2 ${colors.border} text-center`}>
                      <Percent className={`size-12 ${colors.text} mx-auto mb-4`} />
                      <p className="text-xl text-muted-foreground mb-3 font-medium">نسبة الربحية</p>
                      <p className={`text-4xl font-black ${colors.text}`}>{(rData.summary?.profitabilityRate || 0).toFixed(1)}%</p>
                    </div>
                  </div>

                  {/* Profitability Gauge / Meter */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-10 border-2 border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4 mb-8">
                      <Gauge className="size-8 text-gray-600 dark:text-gray-400" />
                      <h3 className="text-2xl font-black">مقياس الربحية</h3>
                    </div>
                    <div className="flex flex-col items-center">
                      {/* Gauge visualization */}
                      <div className="relative w-80 h-40 mb-6">
                        <svg viewBox="0 0 200 110" className="w-full h-full">
                          {/* Background arc */}
                          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="currentColor" strokeWidth="16" className="text-gray-200 dark:text-gray-700" />
                          {/* Red zone */}
                          <path d="M 20 100 A 80 80 0 0 1 60 35" fill="none" stroke="currentColor" strokeWidth="16" className="text-red-400" />
                          {/* Amber zone */}
                          <path d="M 60 35 A 80 80 0 0 1 120 22" fill="none" stroke="currentColor" strokeWidth="16" className="text-amber-400" />
                          {/* Green zone */}
                          <path d="M 120 22 A 80 80 0 0 1 180 100" fill="none" stroke="currentColor" strokeWidth="16" className="text-emerald-400" />
                          {/* Needle */}
                          {(() => {
                            const angle = Math.min(180, Math.max(0, (profitRate / 100) * 180))
                            const rad = (180 - angle) * Math.PI / 180
                            const x = 100 + 70 * Math.cos(rad)
                            const y = 100 - 70 * Math.sin(rad)
                            return <line x1="100" y1="100" x2={x} y2={y} stroke="currentColor" strokeWidth="3" className={`${gaugeColor.replace('text-', 'text-')}`} strokeLinecap="round" />
                          })()}
                          {/* Center circle */}
                          <circle cx="100" cy="100" r="8" className="fill-gray-800 dark:fill-gray-200" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className={`text-6xl font-black ${gaugeColor}`}>
                          {(rData.summary?.profitabilityRate || 0).toFixed(1)}%
                        </p>
                        <p className="text-xl text-muted-foreground mt-3">
                          {profitRate >= 50 ? 'ربحية ممتازة - الأداء المالي قوي جداً' : profitRate >= 20 ? 'ربحية جيدة - الأداء مقبول مع إمكانية التحسين' : profitRate > 0 ? 'ربحية ضعيفة - يحتاج إلى تحسين العائد' : 'لا توجد ربحية - مراجعة عاجلة مطلوبة'}
                        </p>
                      </div>
                      <div className="flex items-center gap-10 mt-6">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-red-400" />
                          <span className="text-lg text-muted-foreground">ضعيف (0-20%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-amber-400" />
                          <span className="text-lg text-muted-foreground">جيد (20-50%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-emerald-400" />
                          <span className="text-lg text-muted-foreground">ممتاز (50%+)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* KPI Calculation Methods - DETAILED */}
                  {rData.kpis && rData.kpis.length > 0 && (
                    <div>
                      <h3 className="text-2xl font-black mb-6 flex items-center gap-4">
                        <Shield className="size-8 text-nature-purple" />
                        مؤشرات الربحية وطريقة حسابها
                      </h3>
                      <div className="rounded-2xl border-2 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-purple-50 dark:bg-purple-900/20">
                              <TableHead className="text-right font-black text-lg py-5 px-6">المؤشر</TableHead>
                              <TableHead className="text-right font-black text-lg py-5 px-6">القيمة</TableHead>
                              <TableHead className="text-right font-black text-lg py-5 px-6">المعادلة</TableHead>
                              <TableHead className="text-right font-black text-lg py-5 px-6">طريقة الحساب</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rData.kpis.map((kpi: any, idx: number) => (
                              <TableRow key={idx} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                                <TableCell className="font-bold text-lg py-5 px-6">{kpi.name}</TableCell>
                                <TableCell className="text-lg font-black py-5 px-6">
                                  {kpi.id === 'kpi07' ? `${kpi.value} بنود` : 
                                   kpi.id === 'kpi03' || kpi.id === 'kpi05' ? `${new Intl.NumberFormat('en-US').format(Math.round(kpi.value))} دج` :
                                   `${kpi.value?.toFixed(1)}%`}
                                </TableCell>
                                <TableCell className="text-lg text-muted-foreground py-5 px-6">{kpi.formula}</TableCell>
                                <TableCell className="text-lg text-muted-foreground py-5 px-6">{kpi.calculation}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Category Breakdown - ENHANCED with percentage contribution */}
                  <div>
                    <h3 className="text-2xl font-black mb-6 flex items-center gap-4">
                      <BarChart3 className="size-8 text-amber-600" />
                      تحليل الربحية حسب البند
                    </h3>
                    <div className="space-y-6">
                      {(Array.isArray(rData.byCategory) ? rData.byCategory : Object.entries(rData.byCategory || {}).map(([name, d]: [string, any]) => ({ name, ...d }))).map((item: any, idx: number) => {
                        const net = (item.profit !== undefined ? item.profit : (item.income || 0) - (item.expense || 0))
                        const maxVal = Math.max(rData.summary?.totalIncome || 1, rData.summary?.totalExpense || 1)
                        const totalIncome = rData.summary?.totalIncome || 1
                        const totalExpense = rData.summary?.totalExpense || 1
                        const incomeContribution = ((item.income || 0) / totalIncome) * 100
                        const expenseContribution = ((item.expense || 0) / totalExpense) * 100
                        const Icon = CATEGORY_ICONS[item.name]
                        return (
                          <div key={item.name || idx} className={`rounded-2xl border-2 p-8 ${idx % 2 === 0 ? 'bg-muted/20' : ''}`}>
                            <div className="flex items-center justify-between mb-5">
                              <span className="font-black text-2xl flex items-center gap-4">
                                {Icon && <Icon className="size-8" />}
                                {item.name}
                              </span>
                              <div className="text-left" dir="ltr">
                                <span className={`text-2xl font-black ${net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {net >= 0 ? '+' : ''}{formatCurrency(net)}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div className="flex items-center gap-4">
                                <span className="text-lg text-muted-foreground w-24 font-medium">مدخول</span>
                                <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, ((item.income || 0) / maxVal) * 100)}%` }} />
                                </div>
                                <span className="text-lg font-bold w-40 text-left" dir="ltr">{formatCurrency(item.income || 0)}</span>
                                <span className="text-lg text-muted-foreground w-28 text-left" dir="ltr">({incomeContribution.toFixed(1)}%)</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-lg text-muted-foreground w-24 font-medium">مصروف</span>
                                <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, ((item.expense || 0) / maxVal) * 100)}%` }} />
                                </div>
                                <span className="text-lg font-bold w-40 text-left" dir="ltr">{formatCurrency(item.expense || 0)}</span>
                                <span className="text-lg text-muted-foreground w-28 text-left" dir="ltr">({expenseContribution.toFixed(1)}%)</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-lg text-muted-foreground w-24 font-medium">الربح</span>
                                <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${net >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, (Math.abs(net) / maxVal) * 100)}%` }} />
                                </div>
                                <span className={`text-lg font-bold w-40 text-left ${net >= 0 ? 'text-green-600' : 'text-red-600'}`} dir="ltr">{formatCurrency(net)}</span>
                                <span className="text-lg text-muted-foreground w-28" />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      {(Array.isArray(rData.byCategory) ? rData.byCategory : Object.keys(rData.byCategory || {})).length === 0 && (
                        <p className="text-center text-muted-foreground py-10 text-xl">لا توجد بيانات</p>
                      )}
                    </div>
                  </div>

                  {/* Season Comparison */}
                  {rData.prevSeasonComparison && (
                    <div>
                      <h3 className="text-2xl font-black mb-6 flex items-center gap-4">
                        <Leaf className="size-8 text-nature-purple" />
                        مقارنة مع الموسم السابق ({rData.prevSeasonComparison.season})
                      </h3>
                      <div className="rounded-2xl border-2 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-purple-50 dark:bg-purple-900/20">
                              <TableHead className="text-right font-black text-lg py-5 px-6">المقياس</TableHead>
                              <TableHead className="text-right font-black text-lg py-5 px-6">الموسم السابق</TableHead>
                              <TableHead className="text-right font-black text-lg py-5 px-6">الموسم الحالي</TableHead>
                              <TableHead className="text-right font-black text-lg py-5 px-6">التغيير</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[
                              { label: 'المداخيل', prev: rData.prevSeasonComparison.income, curr: rData.summary?.totalIncome || 0, change: rData.prevSeasonComparison.incomeChange },
                              { label: 'المصاريف', prev: rData.prevSeasonComparison.expense, curr: rData.summary?.totalExpense || 0, change: rData.prevSeasonComparison.expenseChange },
                              { label: 'صافي الربح', prev: rData.prevSeasonComparison.profit, curr: rData.summary?.netProfit || 0, change: rData.prevSeasonComparison.profitChange },
                            ].map((row, idx) => (
                              <TableRow key={idx} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                                <TableCell className="font-bold text-lg py-5 px-6">{row.label}</TableCell>
                                <TableCell className="text-lg py-5 px-6">{formatCurrency(row.prev)}</TableCell>
                                <TableCell className="text-lg font-bold py-5 px-6">{formatCurrency(row.curr)}</TableCell>
                                <TableCell className={`text-lg font-black py-5 px-6 ${row.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {row.change >= 0 ? '+' : ''}{formatCurrency(row.change)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-10 border-2 border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                        <Lightbulb className="size-8 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-300">التوصيات</h3>
                    </div>
                    <div className="space-y-4">
                      {(rData.summary?.profitabilityRate || 0) >= 50 && (
                        <>
                          <div className="flex items-start gap-4">
                            <CheckCircle2 className="size-7 text-emerald-600 dark:text-emerald-400 mt-1 shrink-0" />
                            <p className="text-lg">الأداء المالي ممتاز. يُنصح بالحفاظ على نفس استراتيجية الإدارة وتوسيع الاستثمار في البنود الأكثر ربحية.</p>
                          </div>
                          <div className="flex items-start gap-4">
                            <Target className="size-7 text-emerald-600 dark:text-emerald-400 mt-1 shrink-0" />
                            <p className="text-lg">يمكن استغلال الهوامش الربحية العالية لتنويع مصادر الدخل وتقوية المخزون.</p>
                          </div>
                        </>
                      )}
                      {(rData.summary?.profitabilityRate || 0) >= 20 && (rData.summary?.profitabilityRate || 0) < 50 && (
                        <>
                          <div className="flex items-start gap-4">
                            <AlertTriangle className="size-7 text-amber-600 dark:text-amber-400 mt-1 shrink-0" />
                            <p className="text-lg">الأداء المالي جيد لكن يمكن تحسينه. راجع بنود المصاريف لتحديد المجالات التي يمكن تقليصها.</p>
                          </div>
                          <div className="flex items-start gap-4">
                            <Target className="size-7 text-amber-600 dark:text-amber-400 mt-1 shrink-0" />
                            <p className="text-lg">ركز على زيادة الإيرادات من البنود الأقل مساهمة وحسّن كفاءة الإنفاق.</p>
                          </div>
                        </>
                      )}
                      {(rData.summary?.profitabilityRate || 0) < 20 && (rData.summary?.profitabilityRate || 0) > 0 && (
                        <>
                          <div className="flex items-start gap-4">
                            <AlertTriangle className="size-7 text-red-600 dark:text-red-400 mt-1 shrink-0" />
                            <p className="text-lg">نسبة الربحية منخفضة. يُنصح بمراجعة شاملة للمصاريف وتحديد بنود الإنفاق غير الضرورية.</p>
                          </div>
                          <div className="flex items-start gap-4">
                            <Target className="size-7 text-red-600 dark:text-red-400 mt-1 shrink-0" />
                            <p className="text-lg">ابحث عن فرص لزيادة المداخيل من خلال تنويع المحاصيل أو تحسين قنوات التسويق.</p>
                          </div>
                        </>
                      )}
                      {(rData.summary?.netProfit || 0) < 0 && (
                        <div className="flex items-start gap-4">
                          <XCircle className="size-7 text-red-600 dark:text-red-400 mt-1 shrink-0" />
                          <p className="text-lg">المزرعة تسجل خسارة صافية. يجب اتخاذ إجراءات فورية لخفض المصاريف وزيادة الإيرادات.</p>
                        </div>
                      )}
                      <div className="flex items-start gap-4">
                        <Info className="size-7 text-emerald-600 dark:text-emerald-400 mt-1 shrink-0" />
                        <p className="text-lg">يُنصح بتسجيل جميع العمليات المالية بشكل منتظم لضمان دقة التقارير المستقبلية.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ====== Financial Certificate Report ====== */}
              {rType === 'financial_certificate' && (
                <div className="relative">
                  <div className="border-4 border-double border-purple-300 dark:border-purple-700 rounded-3xl p-10 relative">
                    <div className="absolute top-5 right-5 text-purple-300 dark:text-purple-700 opacity-50">
                      <Stamp className="size-14" />
                    </div>
                    <div className="absolute bottom-5 left-5 text-purple-300 dark:text-purple-700 opacity-50">
                      <Stamp className="size-14" />
                    </div>

                    <div className="text-center mb-12">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-nature-golden to-yellow-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/30">
                        <Award className="size-12 text-white" />
                      </div>
                      <h3 className="text-4xl font-black text-purple-700 dark:text-purple-300">شهادة أداء مالي</h3>
                      <p className="text-xl text-muted-foreground mt-3">Financial Performance Certificate</p>
                      <div className="w-40 h-1 bg-gradient-to-l from-nature-golden to-yellow-600 mx-auto mt-5" />
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-10 mb-10 text-center">
                      <p className="text-3xl font-black">{rData.farm?.name}</p>
                      <p className="text-xl text-muted-foreground mt-3">{rData.farm?.wilaya} • {rData.farm?.area} هكتار</p>
                      <p className="text-lg text-muted-foreground mt-2">
                        موسم {rData.season?.type === 'خريف' ? 'الخريف' : 'الربيع'} {rData.season?.year}
                      </p>
                    </div>

                    <div className="text-center mb-10">
                      <p className="text-xl text-muted-foreground mb-4">التقييم المالي</p>
                      <div className={`inline-flex items-center gap-4 px-10 py-5 rounded-full text-3xl font-black ${
                        rData.financialHealth === 'ممتاز'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : rData.financialHealth === 'جيد'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}>
                        {rData.financialHealth === 'ممتاز' && <CheckCircle2 className="size-10" />}
                        {rData.financialHealth === 'جيد' && <AlertTriangle className="size-10" />}
                        {rData.financialHealth === 'ضعيف' && <XCircle className="size-10" />}
                        {rData.financialHealth}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-8 mb-10">
                      <div className="text-center p-8 bg-muted/30 rounded-xl">
                        <TrendingUp className="size-10 text-green-600 mx-auto mb-3" />
                        <p className="text-lg text-muted-foreground mb-2">إجمالي المداخيل</p>
                        <p className="text-2xl font-black text-green-700 dark:text-green-300">{formatCurrency(rData.summary?.totalIncome || 0)}</p>
                      </div>
                      <div className="text-center p-8 bg-muted/30 rounded-xl">
                        <TrendingDown className="size-10 text-red-600 mx-auto mb-3" />
                        <p className="text-lg text-muted-foreground mb-2">إجمالي المصاريف</p>
                        <p className="text-2xl font-black text-red-700 dark:text-red-300">{formatCurrency(rData.summary?.totalExpense || 0)}</p>
                      </div>
                      <div className="text-center p-8 bg-muted/30 rounded-xl">
                        <DollarSign className="size-10 text-amber-600 mx-auto mb-3" />
                        <p className="text-lg text-muted-foreground mb-2">صافي الربح</p>
                        <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{formatCurrency(rData.summary?.netProfit || 0)}</p>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="inline-block border-2 border-purple-400 dark:border-purple-600 rounded-xl px-10 py-5 rotate-[-3deg]">
                        <p className="text-lg text-muted-foreground">منصة FACT</p>
                        <p className="text-xl font-black text-purple-700 dark:text-purple-300">معتمد رسمياً</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ====== Compliance Report ====== */}
              {rType === 'compliance' && (
                <>
                  {/* Methodology Explanation */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-10 border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                        <Info className="size-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-2xl font-black text-blue-700 dark:text-blue-300">منهجية تقرير الامتثال</h3>
                    </div>
                    <div className="space-y-3 text-lg text-blue-800 dark:text-blue-200 leading-relaxed">
                      <p>• يقيّم هذا التقرير مدى التزام المزرعة بالمعايير المالية والإدارية المطلوبة للحصول على الدعم الحكومي.</p>
                      <p>• يتم فحص 8 معايير أساسية تشمل تسجيل العمليات، إدارة المخزون، تعدد المداخيل، وجود عقد، والربحية.</p>
                      <p>• تتراوح درجة الامتثال من 0% إلى 100%، حيث تُصنّف: ممتاز (80%+)، جيد (50-80%)، ضعيف (أقل من 50%).</p>
                      <p>• كل معيار يُقيّم بشكل مستقل ويُساهم بالتساوي في الدرجة النهائية.</p>
                    </div>
                  </div>

                  {/* Farm Info */}
                  <div className={`${colors.bg} rounded-2xl p-8 border-2 ${colors.border}`}>
                    <div className="flex items-center gap-5">
                      <MapPin className={`size-9 ${colors.text}`} />
                      <div>
                        <p className="text-2xl font-black">{rData.farm?.name}</p>
                        <p className="text-lg text-muted-foreground mt-1">{rData.farm?.wilaya} • {rData.farm?.area} هكتار</p>
                        {rData.farm?.contractRef && (
                          <p className="text-lg text-muted-foreground mt-1">رقم العقد: {rData.farm.contractRef}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary - BIGGER */}
                  <div className="grid grid-cols-3 gap-8">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-10 border-2 border-green-200 dark:border-green-800 text-center">
                      <TrendingUp className="size-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
                      <p className="text-xl text-muted-foreground mb-3 font-medium">إجمالي المداخيل</p>
                      <p className="text-4xl font-black text-green-700 dark:text-green-300">{formatCurrency(rData.summary?.totalIncome || 0)}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-10 border-2 border-red-200 dark:border-red-800 text-center">
                      <TrendingDown className="size-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
                      <p className="text-xl text-muted-foreground mb-3 font-medium">إجمالي المصاريف</p>
                      <p className="text-4xl font-black text-red-700 dark:text-red-300">{formatCurrency(rData.summary?.totalExpense || 0)}</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-10 border-2 border-amber-200 dark:border-amber-800 text-center">
                      <DollarSign className="size-12 text-amber-600 dark:text-amber-400 mx-auto mb-4" />
                      <p className="text-xl text-muted-foreground mb-3 font-medium">صافي الربح</p>
                      <p className="text-4xl font-black text-amber-700 dark:text-amber-300">{formatCurrency(rData.summary?.netProfit || 0)}</p>
                    </div>
                  </div>

                  {/* Statistical Summary */}
                  <div className={`${colors.bg} rounded-2xl p-8 border-2 ${colors.border}`}>
                    <h3 className="text-2xl font-black mb-6 flex items-center gap-4">
                      <BarChart3 className={`size-8 ${colors.text}`} />
                      ملخص إحصائي
                    </h3>
                    <div className="grid grid-cols-4 gap-6">
                      <div className="bg-white/50 dark:bg-black/20 rounded-xl p-6 text-center">
                        <p className="text-4xl font-black">{rData.recordCount || 0}</p>
                        <p className="text-lg text-muted-foreground mt-2">إجمالي العمليات</p>
                      </div>
                      <div className="bg-white/50 dark:bg-black/20 rounded-xl p-6 text-center">
                        <p className="text-4xl font-black text-green-600">{rData.incomeRecordCount || 0}</p>
                        <p className="text-lg text-muted-foreground mt-2">عمليات المداخيل</p>
                      </div>
                      <div className="bg-white/50 dark:bg-black/20 rounded-xl p-6 text-center">
                        <p className="text-4xl font-black text-red-600">{rData.expenseRecordCount || 0}</p>
                        <p className="text-lg text-muted-foreground mt-2">عمليات المصاريف</p>
                      </div>
                      <div className="bg-white/50 dark:bg-black/20 rounded-xl p-6 text-center">
                        <p className="text-4xl font-black text-purple-600">{rData.inventoryCount || 0}</p>
                        <p className="text-lg text-muted-foreground mt-2">أصناف المخزون</p>
                      </div>
                    </div>
                  </div>

                  {/* KPIs - DETAILED */}
                  {rData.kpis && rData.kpis.length > 0 && (
                    <div>
                      <h3 className="text-2xl font-black mb-6 flex items-center gap-4">
                        <Shield className="size-8 text-nature-purple" />
                        مؤشرات الحوكمة وطريقة حسابها
                      </h3>
                      <div className="rounded-2xl border-2 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-purple-50 dark:bg-purple-900/20">
                              <TableHead className="text-right font-black text-lg py-5 px-6">المؤشر</TableHead>
                              <TableHead className="text-right font-black text-lg py-5 px-6">القيمة</TableHead>
                              <TableHead className="text-right font-black text-lg py-5 px-6">المعادلة</TableHead>
                              <TableHead className="text-right font-black text-lg py-5 px-6">طريقة الحساب</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rData.kpis.map((kpi: any, idx: number) => (
                              <TableRow key={idx} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                                <TableCell className="font-bold text-lg py-5 px-6">{kpi.name}</TableCell>
                                <TableCell className="text-lg font-black py-5 px-6">
                                  {kpi.id === 'kpi07' ? `${kpi.value} بنود` : 
                                   kpi.id === 'kpi03' || kpi.id === 'kpi05' ? `${new Intl.NumberFormat('en-US').format(Math.round(kpi.value))} دج` :
                                   `${kpi.value?.toFixed(1)}%`}
                                </TableCell>
                                <TableCell className="text-lg text-muted-foreground py-5 px-6">{kpi.formula}</TableCell>
                                <TableCell className="text-lg text-muted-foreground py-5 px-6">{kpi.calculation}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Compliance Checklist - ENHANCED with 8 criteria */}
                  <div>
                    <h3 className="text-2xl font-black mb-6 flex items-center gap-4">
                      <ClipboardCheck className="size-8 text-rose-600" />
                      قائمة فحص الامتثال
                    </h3>
                    <div className="space-y-5">
                      {[
                        { 
                          label: 'تسجيل العمليات المالية', 
                          passed: rData.hasRecords, 
                          detail: rData.recordCount > 0 ? `${rData.recordCount} عملية مسجلة في النظام` : 'لا توجد عمليات مسجلة', 
                          explanation: 'يتطلب تسجيل جميع العمليات المالية (مداخيل ومصاريف) لضمان الشفافية والمتابعة المالية الدقيقة.',
                          icon: BookOpen 
                        },
                        { 
                          label: 'إدارة المخزون', 
                          passed: rData.hasInventory, 
                          detail: rData.inventoryCount > 0 ? `${rData.inventoryCount} صنف في المخزون` : 'لا يوجد مخزون مسجل', 
                          explanation: 'إدارة المخزون ضرورية لتتبع المواد والمحاصيل المتاحة، مما يساعد في التخطيط واتخاذ القرارات.',
                          icon: Package 
                        },
                        { 
                          label: 'تعدد بنود المداخيل', 
                          passed: (rData.recordCount || 0) >= 3, 
                          detail: (rData.recordCount || 0) >= 3 ? `${rData.recordCount} عملية مسجلة (3 أو أكثر)` : `${rData.recordCount || 0} عملية فقط (يُطلب 3 على الأقل)`, 
                          explanation: 'تعدد بنود المداخيل يدل على تنوع مصادر الدخل ويقلل من المخاطر المالية المرتبطة بالاعتماد على مصدر واحد.',
                          icon: TrendingUp 
                        },
                        { 
                          label: 'وجود عقد مرجعي', 
                          passed: !!rData.farm?.contractRef, 
                          detail: rData.farm?.contractRef ? `العقد المرجعي: ${rData.farm.contractRef}` : 'لا يوجد عقد مرجعي مسجل', 
                          explanation: 'العقد المرجعي يُثبت العلاقة الرسمية بين المزارع والجهة الداعمة ويضمن حقوق الطرفين.',
                          icon: Stamp 
                        },
                        { 
                          label: 'نسبة الربحية إيجابية', 
                          passed: (rData.summary?.profitabilityRate || 0) > 0, 
                          detail: `نسبة الربحية الحالية: ${(rData.summary?.profitabilityRate || 0).toFixed(1)}%`, 
                          explanation: 'الربحية الإيجابية تُظهر قدرة المزرعة على تحقيق فائض مالي، وهو مؤشر أساسي للاستدامة المالية.',
                          icon: Percent 
                        },
                        { 
                          label: 'توازن المداخيل والمصاريف', 
                          passed: (rData.summary?.totalIncome || 0) > 0 && (rData.summary?.totalExpense || 0) > 0, 
                          detail: (rData.summary?.totalIncome || 0) > 0 && (rData.summary?.totalExpense || 0) > 0 
                            ? 'تم تسجيل كل من المداخيل والمصاريف' 
                            : 'يجب تسجيل المداخيل والمصاريف معاً', 
                          explanation: 'التوازن بين المداخيل والمصاريف يضمن رؤية مالية شاملة ويساعد في حساب صافي الربح بدقة.',
                          icon: BarChart3 
                        },
                        { 
                          label: 'وجود أصناف متعددة في المخزون', 
                          passed: (rData.inventoryCount || 0) >= 2, 
                          detail: rData.inventoryCount >= 2 ? `${rData.inventoryCount} أصناف في المخزون (2 أو أكثر)` : `${rData.inventoryCount || 0} صنف فقط (يُطلب 2 على الأقل)`, 
                          explanation: 'تنوع المخزون يُشير إلى استراتيجية زراعية متوازنة ويقلل من مخاطر الاعتماد على منتج واحد.',
                          icon: Wheat 
                        },
                        { 
                          label: 'تسجيل العمليات في الوقت المناسب', 
                          passed: (rData.recordCount || 0) >= 1, 
                          detail: rData.recordCount > 0 ? 'تم تسجيل العمليات بشكل منتظم' : 'لم يتم تسجيل أي عمليات بعد', 
                          explanation: 'التسجيل المنتظم للعمليات يضمن دقة البيانات المالية ويسهل إعداد التقارير والمتابعة.',
                          icon: Clock 
                        },
                      ].map((item, idx) => (
                        <div key={idx} className={`rounded-2xl border-2 p-8 ${
                          item.passed
                            ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                        }`}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-5">
                              {item.passed
                                ? <CheckCircle2 className="size-10 text-green-600 dark:text-green-400" />
                                : <XCircle className="size-10 text-red-600 dark:text-red-400" />
                              }
                              <div>
                                <p className="text-xl font-black">{item.label}</p>
                                <p className="text-lg text-muted-foreground mt-1">{item.detail}</p>
                              </div>
                            </div>
                            <Badge variant={item.passed ? 'default' : 'destructive'} className={`text-lg px-5 py-2 ${item.passed ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-100' : ''}`}>
                              {item.passed ? 'ممتثل' : 'غير ممتثل'}
                            </Badge>
                          </div>
                          <div className="flex items-start gap-4 mr-15 bg-white/50 dark:bg-black/10 rounded-xl p-5">
                            <item.icon className="size-6 text-muted-foreground mt-1 shrink-0" />
                            <p className="text-lg text-muted-foreground leading-relaxed">{item.explanation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Compliance Score with Grade */}
                  <div className={`${colors.bg} rounded-2xl p-10 border-2 ${colors.border}`}>
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-2xl font-black">درجة الامتثال الإجمالية</span>
                      <span className={`text-5xl font-black ${colors.text}`}>
                        {complianceScore}%
                      </span>
                    </div>
                    <Progress value={complianceScore} className="h-6 mb-6" />
                    <div className="flex items-center justify-center">
                      <div className={`inline-flex items-center gap-4 px-10 py-5 rounded-full text-3xl font-black ${
                        complianceGrade === 'ممتاز'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : complianceGrade === 'جيد'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}>
                        {complianceGrade === 'ممتاز' && <Award className="size-10" />}
                        {complianceGrade === 'جيد' && <CheckCircle2 className="size-10" />}
                        {complianceGrade === 'ضعيف' && <AlertTriangle className="size-10" />}
                        تصنيف الامتثال: {complianceGrade}
                      </div>
                    </div>
                    <p className="text-lg text-center text-muted-foreground mt-5">
                      {complianceGrade === 'ممتاز' 
                        ? 'المزرعة ممتثلة بشكل كامل مع معظم المعايير المطلوبة. يمكنها الاستفادة من كامل الدعم الحكومي.'
                        : complianceGrade === 'جيد'
                          ? 'المزرعة ممتثلة جزئياً. يُنصح بمعالجة النقاط غير المكتملة لتحسين الدرجة.'
                          : 'المزرعة تحتاج إلى تحسينات جوهرية للامتثال للمعايير المطلوبة.'}
                    </p>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-10 border-2 border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                        <Lightbulb className="size-8 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-300">التوصيات</h3>
                    </div>
                    <div className="space-y-4">
                      {!rData.hasRecords && (
                        <div className="flex items-start gap-4">
                          <XCircle className="size-7 text-red-600 dark:text-red-400 mt-1 shrink-0" />
                          <p className="text-lg">ابدأ بتسجيل العمليات المالية فوراً. هذا هو الشرط الأساسي لجميع التقارير.</p>
                        </div>
                      )}
                      {!rData.hasInventory && (
                        <div className="flex items-start gap-4">
                          <Package className="size-7 text-amber-600 dark:text-amber-400 mt-1 shrink-0" />
                          <p className="text-lg">سجّل أصناف المخزون المتاحة في المزرعة لإكمال معيار إدارة المخزون.</p>
                        </div>
                      )}
                      {(rData.recordCount || 0) < 3 && (
                        <div className="flex items-start gap-4">
                          <TrendingUp className="size-7 text-amber-600 dark:text-amber-400 mt-1 shrink-0" />
                          <p className="text-lg">سجّل المزيد من العمليات المالية (3 على الأقل) لتحقيق معيار تعدد بنود المداخيل.</p>
                        </div>
                      )}
                      {!rData.farm?.contractRef && (
                        <div className="flex items-start gap-4">
                          <Stamp className="size-7 text-amber-600 dark:text-amber-400 mt-1 shrink-0" />
                          <p className="text-lg">أضف رقم العقد المرجعي للمزرعة في الإعدادات لتحقيق معيار العقد.</p>
                        </div>
                      )}
                      {(rData.summary?.profitabilityRate || 0) <= 0 && (
                        <div className="flex items-start gap-4">
                          <Percent className="size-7 text-red-600 dark:text-red-400 mt-1 shrink-0" />
                          <p className="text-lg">اعمل على تحسين الربحية من خلال زيادة المداخيل أو تقليص المصاريف.</p>
                        </div>
                      )}
                      {(rData.inventoryCount || 0) < 2 && (
                        <div className="flex items-start gap-4">
                          <Wheat className="size-7 text-amber-600 dark:text-amber-400 mt-1 shrink-0" />
                          <p className="text-lg">أضف المزيد من أصناف المخزون (2 على الأقل) لتحقيق معيار تنوع المخزون.</p>
                        </div>
                      )}
                      <div className="flex items-start gap-4">
                        <Info className="size-7 text-emerald-600 dark:text-emerald-400 mt-1 shrink-0" />
                        <p className="text-lg">تأكد من تحديث البيانات المالية بانتظام لضمان دقة تقارير الامتثال المستقبلية.</p>
                      </div>
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-10 border-2 border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                        <ArrowLeft className="size-8 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-2xl font-black text-purple-700 dark:text-purple-300">الخطوات التالية</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <span className="text-2xl font-black text-purple-600 dark:text-purple-400 shrink-0">1</span>
                        <p className="text-lg">راجع معايير الامتثال غير المحققة وابدأ بمعالجة الأكثر أهمية أولاً.</p>
                      </div>
                      <div className="flex items-start gap-4">
                        <span className="text-2xl font-black text-purple-600 dark:text-purple-400 shrink-0">2</span>
                        <p className="text-lg">سجّل جميع العمليات المالية المعلقة في أقرب وقت ممكن.</p>
                      </div>
                      <div className="flex items-start gap-4">
                        <span className="text-2xl font-black text-purple-600 dark:text-purple-400 shrink-0">3</span>
                        <p className="text-lg">حدّث بيانات المخزون والعقد المرجعي في ملف المزرعة.</p>
                      </div>
                      <div className="flex items-start gap-4">
                        <span className="text-2xl font-black text-purple-600 dark:text-purple-400 shrink-0">4</span>
                        <p className="text-lg">أعِد إنشاء تقرير الامتثال بعد إتمام التحسينات للتحقق من التقدم.</p>
                      </div>
                      <div className="flex items-start gap-4">
                        <span className="text-2xl font-black text-purple-600 dark:text-purple-400 shrink-0">5</span>
                        <p className="text-lg">تواصل مع الجهة الداعمة للاستفسار عن المتطلبات الإضافية إن وجدت.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}

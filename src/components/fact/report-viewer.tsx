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
  Sprout, Carrot, Milk, Landmark, FlaskConical, Droplets, Users, Truck, Wrench, Plus, Leaf, Package
} from 'lucide-react'

const CATEGORY_ICONS: Record<string, any> = {
  'حبوب': Wheat, 'خضروات': Carrot, 'منتجات حيوانية': Milk,
  'دعم حكومي': Landmark, 'بذور': Sprout, 'أسمدة ومبيدات': FlaskConical,
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
  onExportPDF: () => void
}

export function ReportViewer({ open, onOpenChange, report, reportData, onExportPDF }: ReportViewerProps) {
  if (!report || !reportData) return null

  const rData = reportData
  const rType = report.reportType
  const colors = getReportTypeColor(rType)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] p-0 overflow-hidden" showCloseButton>
        <div className="flex flex-col h-[95vh]">
          {/* Header with gradient */}
          <div className={`bg-gradient-to-l ${colors.gradient} p-8 text-white`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  {rType === 'seasonal_account' && <BookOpen className="size-8" />}
                  {rType === 'profitability' && <BarChart3 className="size-8" />}
                  {rType === 'financial_certificate' && <Stamp className="size-8" />}
                  {rType === 'compliance' && <Shield className="size-8" />}
                </div>
                <div>
                  <h2 className="text-2xl font-black">{rData.title || getReportTypeLabel(rType)}</h2>
                  <p className="text-white/80 text-lg mt-1">
                    {new Date(report.generatedAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-white hover:bg-white/20 text-lg px-5 py-3"
                  onClick={onExportPDF}
                >
                  <Download className="size-5 ml-2" />
                  تحميل PDF
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-white hover:bg-white/20 text-lg px-5 py-3"
                  onClick={() => window.print()}
                >
                  <Printer className="size-5 ml-2" />
                  طباعة
                </Button>
              </div>
            </div>
          </div>

          {/* Report content */}
          <ScrollArea className="flex-1 overflow-auto">
            <div className="p-10 space-y-10">

              {/* ====== Seasonal Account Report ====== */}
              {rType === 'seasonal_account' && (
                <>
                  {/* Farm & Season Info */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className={`${colors.bg} rounded-2xl p-6 border-2 ${colors.border}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <MapPin className={`size-6 ${colors.text}`} />
                        <span className="text-xl font-black">معلومات المزرعة</span>
                      </div>
                      <p className="text-lg font-bold">{rData.farm?.name}</p>
                      <p className="text-base text-muted-foreground mt-1">{rData.farm?.wilaya} • {rData.farm?.area} هكتار</p>
                    </div>
                    <div className={`${colors.bg} rounded-2xl p-6 border-2 ${colors.border}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <Calendar className={`size-6 ${colors.text}`} />
                        <span className="text-xl font-black">الموسم</span>
                      </div>
                      <p className="text-lg font-bold">
                        {rData.season?.type === 'خريف' ? 'خريف' : 'ربيع'} {rData.season?.year}
                      </p>
                    </div>
                  </div>

                  {/* Summary Cards - BIG */}
                  <div className="grid grid-cols-3 gap-6">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-8 border-2 border-green-200 dark:border-green-800 text-center">
                      <TrendingUp className="size-10 text-green-600 dark:text-green-400 mx-auto mb-3" />
                      <p className="text-lg text-muted-foreground mb-2 font-medium">إجمالي المداخيل</p>
                      <p className="text-3xl font-black text-green-700 dark:text-green-300">{formatCurrency(rData.summary?.totalIncome || 0)}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-8 border-2 border-red-200 dark:border-red-800 text-center">
                      <TrendingDown className="size-10 text-red-600 dark:text-red-400 mx-auto mb-3" />
                      <p className="text-lg text-muted-foreground mb-2 font-medium">إجمالي المصاريف</p>
                      <p className="text-3xl font-black text-red-700 dark:text-red-300">{formatCurrency(rData.summary?.totalExpense || 0)}</p>
                    </div>
                    <div className={`rounded-2xl p-8 border-2 text-center ${
                      (rData.summary?.netProfit || 0) >= 0
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    }`}>
                      <DollarSign className={`size-10 mx-auto mb-3 ${
                        (rData.summary?.netProfit || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`} />
                      <p className="text-lg text-muted-foreground mb-2 font-medium">صافي الربح</p>
                      <p className={`text-3xl font-black ${
                        (rData.summary?.netProfit || 0) >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'
                      }`}>{formatCurrency(rData.summary?.netProfit || 0)}</p>
                    </div>
                  </div>

                  {/* Profitability Rate */}
                  <div className={`${colors.bg} rounded-2xl p-8 border-2 ${colors.border}`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xl font-black flex items-center gap-3">
                        <Percent className={`size-6 ${colors.text}`} />
                        نسبة الربحية
                      </span>
                      <span className={`text-4xl font-black ${colors.text}`}>
                        {rData.summary?.profitabilityRate?.toFixed(1) || 0}%
                      </span>
                    </div>
                    <Progress value={Math.min(100, Math.max(0, rData.summary?.profitabilityRate || 0))} className="h-5" />
                  </div>

                  {/* KPI Calculation Methods */}
                  {rData.kpis && rData.kpis.length > 0 && (
                    <div>
                      <h3 className="text-xl font-black mb-5 flex items-center gap-3">
                        <Shield className="size-6 text-nature-purple" />
                        المؤشرات وطريقة الحساب
                      </h3>
                      <div className="rounded-2xl border-2 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-purple-50 dark:bg-purple-900/20">
                              <TableHead className="text-right font-black text-base py-4 px-5">المؤشر</TableHead>
                              <TableHead className="text-right font-black text-base py-4 px-5">القيمة</TableHead>
                              <TableHead className="text-right font-black text-base py-4 px-5">المعادلة</TableHead>
                              <TableHead className="text-right font-black text-base py-4 px-5">الحساب</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rData.kpis.map((kpi: any, idx: number) => (
                              <TableRow key={idx} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                                <TableCell className="font-bold text-base py-4 px-5">{kpi.name}</TableCell>
                                <TableCell className="text-base font-black py-4 px-5">
                                  {kpi.id === 'kpi07' ? `${kpi.value} بنود` : 
                                   kpi.id === 'kpi03' || kpi.id === 'kpi05' ? `${new Intl.NumberFormat('en-US').format(Math.round(kpi.value))} دج` :
                                   `${kpi.value?.toFixed(1)}%`}
                                </TableCell>
                                <TableCell className="text-base text-muted-foreground py-4 px-5">{kpi.formula}</TableCell>
                                <TableCell className="text-base text-muted-foreground py-4 px-5">{kpi.calculation}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Income Details Table */}
                  <div>
                    <h3 className="text-xl font-black mb-5 flex items-center gap-3">
                      <TrendingUp className="size-6 text-green-600" />
                      تفاصيل المداخيل
                    </h3>
                    <div className="rounded-2xl border-2 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-green-50 dark:bg-green-900/20">
                            <TableHead className="text-right font-black text-base py-4 px-5">البند</TableHead>
                            <TableHead className="text-right font-black text-base py-4 px-5">المبلغ</TableHead>
                            <TableHead className="text-right font-black text-base py-4 px-5">التاريخ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rData.incomeDetails?.map((item: any, idx: number) => (
                            <TableRow key={idx} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                              <TableCell className="font-bold text-base py-4 px-5">{item.category}</TableCell>
                              <TableCell className="text-green-700 dark:text-green-300 font-black text-base py-4 px-5">{formatCurrency(item.amount)}</TableCell>
                              <TableCell className="text-muted-foreground text-base py-4 px-5">{new Date(item.date).toLocaleDateString('fr-FR')}</TableCell>
                            </TableRow>
                          ))}
                          {!rData.incomeDetails?.length && (
                            <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8 text-lg">لا توجد مداخيل</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Expense Details Table */}
                  <div>
                    <h3 className="text-xl font-black mb-5 flex items-center gap-3">
                      <TrendingDown className="size-6 text-red-600" />
                      تفاصيل المصاريف
                    </h3>
                    <div className="rounded-2xl border-2 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-red-50 dark:bg-red-900/20">
                            <TableHead className="text-right font-black text-base py-4 px-5">البند</TableHead>
                            <TableHead className="text-right font-black text-base py-4 px-5">المبلغ</TableHead>
                            <TableHead className="text-right font-black text-base py-4 px-5">التاريخ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rData.expenseDetails?.map((item: any, idx: number) => (
                            <TableRow key={idx} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                              <TableCell className="font-bold text-base py-4 px-5">{item.category}</TableCell>
                              <TableCell className="text-red-700 dark:text-red-300 font-black text-base py-4 px-5">{formatCurrency(item.amount)}</TableCell>
                              <TableCell className="text-muted-foreground text-base py-4 px-5">{new Date(item.date).toLocaleDateString('fr-FR')}</TableCell>
                            </TableRow>
                          ))}
                          {!rData.expenseDetails?.length && (
                            <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8 text-lg">لا توجد مصاريف</TableCell></TableRow>
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
                  {/* Farm & Season Info */}
                  <div className={`${colors.bg} rounded-2xl p-6 border-2 ${colors.border}`}>
                    <div className="flex items-center gap-3">
                      <MapPin className={`size-6 ${colors.text}`} />
                      <div>
                        <p className="text-xl font-black">{rData.farm?.name}</p>
                        <p className="text-base text-muted-foreground">{rData.farm?.wilaya} • {rData.farm?.area} هكتار • موسم {rData.season?.type === 'خريف' ? 'الخريف' : 'الربيع'} {rData.season?.year}</p>
                      </div>
                    </div>
                  </div>

                  {/* Summary Cards - BIG */}
                  <div className="grid grid-cols-4 gap-6">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 border-2 border-green-200 dark:border-green-800 text-center">
                      <TrendingUp className="size-8 text-green-600 mx-auto mb-2" />
                      <p className="text-base text-muted-foreground mb-1">المداخيل</p>
                      <p className="text-2xl font-black text-green-700 dark:text-green-300">{formatCurrency(rData.summary?.totalIncome || 0)}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border-2 border-red-200 dark:border-red-800 text-center">
                      <TrendingDown className="size-8 text-red-600 mx-auto mb-2" />
                      <p className="text-base text-muted-foreground mb-1">المصاريف</p>
                      <p className="text-2xl font-black text-red-700 dark:text-red-300">{formatCurrency(rData.summary?.totalExpense || 0)}</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-6 border-2 border-amber-200 dark:border-amber-800 text-center">
                      <DollarSign className="size-8 text-amber-600 mx-auto mb-2" />
                      <p className="text-base text-muted-foreground mb-1">صافي الربح</p>
                      <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{formatCurrency(rData.summary?.netProfit || 0)}</p>
                    </div>
                    <div className={`${colors.bg} rounded-2xl p-6 border-2 ${colors.border} text-center`}>
                      <Percent className={`size-8 ${colors.text} mx-auto mb-2`} />
                      <p className="text-base text-muted-foreground mb-1">نسبة الربحية</p>
                      <p className={`text-2xl font-black ${colors.text}`}>{rData.summary?.profitabilityRate?.toFixed(1) || 0}%</p>
                    </div>
                  </div>

                  {/* KPI Calculation Methods - DETAILED */}
                  {rData.kpis && rData.kpis.length > 0 && (
                    <div>
                      <h3 className="text-xl font-black mb-5 flex items-center gap-3">
                        <Shield className="size-6 text-nature-purple" />
                        مؤشرات الربحية وطريقة حسابها
                      </h3>
                      <div className="rounded-2xl border-2 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-purple-50 dark:bg-purple-900/20">
                              <TableHead className="text-right font-black text-base py-4 px-5">المؤشر</TableHead>
                              <TableHead className="text-right font-black text-base py-4 px-5">القيمة</TableHead>
                              <TableHead className="text-right font-black text-base py-4 px-5">المعادلة</TableHead>
                              <TableHead className="text-right font-black text-base py-4 px-5">طريقة الحساب</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rData.kpis.map((kpi: any, idx: number) => (
                              <TableRow key={idx} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                                <TableCell className="font-bold text-base py-4 px-5">{kpi.name}</TableCell>
                                <TableCell className="text-base font-black py-4 px-5">
                                  {kpi.id === 'kpi07' ? `${kpi.value} بنود` : 
                                   kpi.id === 'kpi03' || kpi.id === 'kpi05' ? `${new Intl.NumberFormat('en-US').format(Math.round(kpi.value))} دج` :
                                   `${kpi.value?.toFixed(1)}%`}
                                </TableCell>
                                <TableCell className="text-base text-muted-foreground py-4 px-5">{kpi.formula}</TableCell>
                                <TableCell className="text-base text-muted-foreground py-4 px-5">{kpi.calculation}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Category Breakdown - DETAILED */}
                  <div>
                    <h3 className="text-xl font-black mb-5 flex items-center gap-3">
                      <BarChart3 className="size-6 text-amber-600" />
                      تحليل الربحية حسب البند
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(rData.byCategory || {}).map(([cat, data]: [string, any], idx: number) => {
                        const net = (data.income || 0) - (data.expense || 0)
                        const maxVal = Math.max(rData.summary?.totalIncome || 1, rData.summary?.totalExpense || 1)
                        const Icon = CATEGORY_ICONS[cat]
                        return (
                          <div key={cat} className={`rounded-2xl border-2 p-6 ${idx % 2 === 0 ? 'bg-muted/20' : ''}`}>
                            <div className="flex items-center justify-between mb-4">
                              <span className="font-black text-xl flex items-center gap-3">
                                {Icon && <Icon className="size-6" />}
                                {cat}
                              </span>
                              <span className={`text-xl font-black ${net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {net >= 0 ? '+' : ''}{formatCurrency(net)}
                              </span>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <span className="text-base text-muted-foreground w-20 font-medium">مدخول</span>
                                <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(100, ((data.income || 0) / maxVal) * 100)}%` }} />
                                </div>
                                <span className="text-base font-bold w-32 text-left" dir="ltr">{formatCurrency(data.income || 0)}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-base text-muted-foreground w-20 font-medium">مصروف</span>
                                <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, ((data.expense || 0) / maxVal) * 100)}%` }} />
                                </div>
                                <span className="text-base font-bold w-32 text-left" dir="ltr">{formatCurrency(data.expense || 0)}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-base text-muted-foreground w-20 font-medium">الربح</span>
                                <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${net >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, (Math.abs(net) / maxVal) * 100)}%` }} />
                                </div>
                                <span className={`text-base font-bold w-32 text-left ${net >= 0 ? 'text-green-600' : 'text-red-600'}`} dir="ltr">{formatCurrency(net)}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      {Object.keys(rData.byCategory || {}).length === 0 && (
                        <p className="text-center text-muted-foreground py-8 text-lg">لا توجد بيانات</p>
                      )}
                    </div>
                  </div>

                  {/* Season Comparison */}
                  {rData.prevSeasonComparison && (
                    <div>
                      <h3 className="text-xl font-black mb-5 flex items-center gap-3">
                        <Leaf className="size-6 text-nature-purple" />
                        مقارنة مع الموسم السابق ({rData.prevSeasonComparison.season})
                      </h3>
                      <div className="rounded-2xl border-2 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-purple-50 dark:bg-purple-900/20">
                              <TableHead className="text-right font-black text-base py-4 px-5">المقياس</TableHead>
                              <TableHead className="text-right font-black text-base py-4 px-5">الموسم السابق</TableHead>
                              <TableHead className="text-right font-black text-base py-4 px-5">الموسم الحالي</TableHead>
                              <TableHead className="text-right font-black text-base py-4 px-5">التغيير</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[
                              { label: 'المداخيل', prev: rData.prevSeasonComparison.income, curr: rData.summary?.totalIncome || 0, change: rData.prevSeasonComparison.incomeChange },
                              { label: 'المصاريف', prev: rData.prevSeasonComparison.expense, curr: rData.summary?.totalExpense || 0, change: rData.prevSeasonComparison.expenseChange },
                              { label: 'صافي الربح', prev: rData.prevSeasonComparison.profit, curr: rData.summary?.netProfit || 0, change: rData.prevSeasonComparison.profitChange },
                            ].map((row, idx) => (
                              <TableRow key={idx} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                                <TableCell className="font-bold text-base py-4 px-5">{row.label}</TableCell>
                                <TableCell className="text-base py-4 px-5">{formatCurrency(row.prev)}</TableCell>
                                <TableCell className="text-base font-bold py-4 px-5">{formatCurrency(row.curr)}</TableCell>
                                <TableCell className={`text-base font-black py-4 px-5 ${row.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {row.change >= 0 ? '+' : ''}{formatCurrency(row.change)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ====== Financial Certificate Report ====== */}
              {rType === 'financial_certificate' && (
                <div className="relative">
                  <div className="border-4 border-double border-purple-300 dark:border-purple-700 rounded-3xl p-10 relative">
                    <div className="absolute top-5 right-5 text-purple-300 dark:text-purple-700 opacity-50">
                      <Stamp className="size-12" />
                    </div>
                    <div className="absolute bottom-5 left-5 text-purple-300 dark:text-purple-700 opacity-50">
                      <Stamp className="size-12" />
                    </div>

                    <div className="text-center mb-10">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-nature-golden to-yellow-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-amber-500/30">
                        <Award className="size-10 text-white" />
                      </div>
                      <h3 className="text-3xl font-black text-purple-700 dark:text-purple-300">شهادة أداء مالي</h3>
                      <p className="text-lg text-muted-foreground mt-2">Financial Performance Certificate</p>
                      <div className="w-32 h-1 bg-gradient-to-l from-nature-golden to-yellow-600 mx-auto mt-4" />
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-8 mb-8 text-center">
                      <p className="text-2xl font-black">{rData.farm?.name}</p>
                      <p className="text-lg text-muted-foreground mt-2">{rData.farm?.wilaya} • {rData.farm?.area} هكتار</p>
                      <p className="text-base text-muted-foreground mt-1">
                        موسم {rData.season?.type === 'خريف' ? 'الخريف' : 'الربيع'} {rData.season?.year}
                      </p>
                    </div>

                    <div className="text-center mb-8">
                      <p className="text-lg text-muted-foreground mb-3">التقييم المالي</p>
                      <div className={`inline-flex items-center gap-3 px-8 py-4 rounded-full text-2xl font-black ${
                        rData.financialHealth === 'ممتاز'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : rData.financialHealth === 'جيد'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}>
                        {rData.financialHealth === 'ممتاز' && <CheckCircle2 className="size-8" />}
                        {rData.financialHealth === 'جيد' && <AlertTriangle className="size-8" />}
                        {rData.financialHealth === 'ضعيف' && <XCircle className="size-8" />}
                        {rData.financialHealth}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 mb-8">
                      <div className="text-center p-6 bg-muted/30 rounded-xl">
                        <TrendingUp className="size-8 text-green-600 mx-auto mb-2" />
                        <p className="text-base text-muted-foreground mb-1">إجمالي المداخيل</p>
                        <p className="text-xl font-black text-green-700 dark:text-green-300">{formatCurrency(rData.summary?.totalIncome || 0)}</p>
                      </div>
                      <div className="text-center p-6 bg-muted/30 rounded-xl">
                        <TrendingDown className="size-8 text-red-600 mx-auto mb-2" />
                        <p className="text-base text-muted-foreground mb-1">إجمالي المصاريف</p>
                        <p className="text-xl font-black text-red-700 dark:text-red-300">{formatCurrency(rData.summary?.totalExpense || 0)}</p>
                      </div>
                      <div className="text-center p-6 bg-muted/30 rounded-xl">
                        <DollarSign className="size-8 text-amber-600 mx-auto mb-2" />
                        <p className="text-base text-muted-foreground mb-1">صافي الربح</p>
                        <p className="text-xl font-black text-amber-700 dark:text-amber-300">{formatCurrency(rData.summary?.netProfit || 0)}</p>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="inline-block border-2 border-purple-400 dark:border-purple-600 rounded-xl px-8 py-4 rotate-[-3deg]">
                        <p className="text-base text-muted-foreground">منصة FACT</p>
                        <p className="text-lg font-black text-purple-700 dark:text-purple-300">معتمد رسمياً</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ====== Compliance Report ====== */}
              {rType === 'compliance' && (
                <>
                  {/* Farm Info */}
                  <div className={`${colors.bg} rounded-2xl p-6 border-2 ${colors.border}`}>
                    <div className="flex items-center gap-4">
                      <MapPin className={`size-7 ${colors.text}`} />
                      <div>
                        <p className="text-xl font-black">{rData.farm?.name}</p>
                        <p className="text-base text-muted-foreground">{rData.farm?.wilaya} • {rData.farm?.area} هكتار</p>
                        {rData.farm?.contractRef && (
                          <p className="text-base text-muted-foreground">رقم العقد: {rData.farm.contractRef}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary - DETAILED */}
                  <div className="grid grid-cols-3 gap-6">
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 border-2 border-green-200 dark:border-green-800 text-center">
                      <TrendingUp className="size-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                      <p className="text-base text-muted-foreground mb-1">إجمالي المداخيل</p>
                      <p className="text-2xl font-black text-green-700 dark:text-green-300">{formatCurrency(rData.summary?.totalIncome || 0)}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border-2 border-red-200 dark:border-red-800 text-center">
                      <TrendingDown className="size-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
                      <p className="text-base text-muted-foreground mb-1">إجمالي المصاريف</p>
                      <p className="text-2xl font-black text-red-700 dark:text-red-300">{formatCurrency(rData.summary?.totalExpense || 0)}</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-6 border-2 border-amber-200 dark:border-amber-800 text-center">
                      <DollarSign className="size-8 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                      <p className="text-base text-muted-foreground mb-1">صافي الربح</p>
                      <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{formatCurrency(rData.summary?.netProfit || 0)}</p>
                    </div>
                  </div>

                  {/* Statistical Summary */}
                  <div className={`${colors.bg} rounded-2xl p-6 border-2 ${colors.border}`}>
                    <h3 className="text-xl font-black mb-4 flex items-center gap-3">
                      <BarChart3 className={`size-6 ${colors.text}`} />
                      ملخص إحصائي
                    </h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4 text-center">
                        <p className="text-3xl font-black">{rData.recordCount || 0}</p>
                        <p className="text-base text-muted-foreground">إجمالي العمليات</p>
                      </div>
                      <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4 text-center">
                        <p className="text-3xl font-black text-green-600">{rData.incomeRecordCount || 0}</p>
                        <p className="text-base text-muted-foreground">عمليات المداخيل</p>
                      </div>
                      <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4 text-center">
                        <p className="text-3xl font-black text-red-600">{rData.expenseRecordCount || 0}</p>
                        <p className="text-base text-muted-foreground">عمليات المصاريف</p>
                      </div>
                      <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4 text-center">
                        <p className="text-3xl font-black text-purple-600">{rData.inventoryCount || 0}</p>
                        <p className="text-base text-muted-foreground">أصناف المخزون</p>
                      </div>
                    </div>
                  </div>

                  {/* KPIs - DETAILED */}
                  {rData.kpis && rData.kpis.length > 0 && (
                    <div>
                      <h3 className="text-xl font-black mb-5 flex items-center gap-3">
                        <Shield className="size-6 text-nature-purple" />
                        مؤشرات الحوكمة وطريقة حسابها
                      </h3>
                      <div className="rounded-2xl border-2 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-purple-50 dark:bg-purple-900/20">
                              <TableHead className="text-right font-black text-base py-4 px-5">المؤشر</TableHead>
                              <TableHead className="text-right font-black text-base py-4 px-5">القيمة</TableHead>
                              <TableHead className="text-right font-black text-base py-4 px-5">المعادلة</TableHead>
                              <TableHead className="text-right font-black text-base py-4 px-5">طريقة الحساب</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rData.kpis.map((kpi: any, idx: number) => (
                              <TableRow key={idx} className={idx % 2 === 0 ? 'bg-muted/30' : ''}>
                                <TableCell className="font-bold text-base py-4 px-5">{kpi.name}</TableCell>
                                <TableCell className="text-base font-black py-4 px-5">
                                  {kpi.id === 'kpi07' ? `${kpi.value} بنود` : 
                                   kpi.id === 'kpi03' || kpi.id === 'kpi05' ? `${new Intl.NumberFormat('en-US').format(Math.round(kpi.value))} دج` :
                                   `${kpi.value?.toFixed(1)}%`}
                                </TableCell>
                                <TableCell className="text-base text-muted-foreground py-4 px-5">{kpi.formula}</TableCell>
                                <TableCell className="text-base text-muted-foreground py-4 px-5">{kpi.calculation}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Compliance Checklist - DETAILED */}
                  <div>
                    <h3 className="text-xl font-black mb-5 flex items-center gap-3">
                      <Shield className="size-6 text-rose-600" />
                      قائمة فحص الامتثال
                    </h3>
                    <div className="space-y-4">
                      {[
                        { label: 'تسجيل العمليات المالية', passed: rData.hasRecords, detail: rData.recordCount > 0 ? `${rData.recordCount} عملية مسجلة` : 'لا توجد عمليات', icon: BookOpen },
                        { label: 'إدارة المخزون', passed: rData.hasInventory, detail: rData.inventoryCount > 0 ? `${rData.inventoryCount} صنف في المخزون` : 'لا يوجد مخزون', icon: Package },
                        { label: 'تعدد بنود المداخيل', passed: rData.recordCount >= 3, detail: 'يجب تسجيل 3 عمليات على الأقل', icon: TrendingUp },
                        { label: 'وجود عقد مرجعي', passed: !!rData.farm?.contractRef, detail: rData.farm?.contractRef ? `العقد: ${rData.farm.contractRef}` : 'لا يوجد عقد', icon: Stamp },
                      ].map((item, idx) => (
                        <div key={idx} className={`flex items-center justify-between p-6 rounded-2xl border-2 ${
                          item.passed
                            ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                        }`}>
                          <div className="flex items-center gap-5">
                            {item.passed
                              ? <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />
                              : <XCircle className="size-8 text-red-600 dark:text-red-400" />
                            }
                            <div>
                              <p className="text-lg font-black">{item.label}</p>
                              <p className="text-base text-muted-foreground mt-1">{item.detail}</p>
                            </div>
                          </div>
                          <Badge variant={item.passed ? 'default' : 'destructive'} className={`text-base px-4 py-1 ${item.passed ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 hover:bg-green-100' : ''}`}>
                            {item.passed ? 'ممتثل' : 'غير ممتثل'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Compliance Score */}
                  <div className={`${colors.bg} rounded-2xl p-8 border-2 ${colors.border}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-black">درجة الامتثال الإجمالية</span>
                      <span className={`text-4xl font-black ${colors.text}`}>
                        {Math.round(
                          [rData.hasRecords, rData.hasInventory, rData.recordCount >= 3, !!rData.farm?.contractRef].filter(Boolean).length / 4 * 100
                        )}%
                      </span>
                    </div>
                    <Progress value={Math.round(
                      [rData.hasRecords, rData.hasInventory, rData.recordCount >= 3, !!rData.farm?.contractRef].filter(Boolean).length / 4 * 100
                    )} className="h-5 mt-4" />
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

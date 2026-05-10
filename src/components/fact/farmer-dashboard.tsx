'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Sprout, Home, ArrowUpDown, Package, FileText, LogOut, Moon, Sun,
  Plus, TrendingUp, TrendingDown, AlertTriangle, Wheat,
  Trash2, Eye, Droplets, Wrench, Truck, Users, FlaskConical, Landmark, Milk,
  Carrot, BarChart3, Shield, Award, CheckCircle2, XCircle, Printer, MapPin,
  Calendar, DollarSign, Percent, Leaf, BookOpen, Stamp, Download
} from 'lucide-react'
import { SeasonalBarChart, ProfitabilityGauge, CategoryPieChart, InventoryBarChart, MonthlyAreaChart } from './charts'
import { ReportViewer } from './report-viewer'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'

interface DashboardData {
  farm: { id: string; name: string; areaHectares: number; locationWilaya: string }
  currentSeason: { id: string; seasonType: string; year: number } | null
  seasons: { id: string; seasonType: string; year: number }[]
  kpis: { id: string; name: string; value: number; unit: string; type: string; weight: number }[]
  summaries: { totalIncome: number; totalExpense: number; netProfit: number; profitabilityRate: number }
  recentTransactions: any[]
  inventorySummary: any[]
  monthlyData: { month: string; income: number; expense: number }[]
  incomeByCategory: { name: string; value: number }[]
  expenseByCategory: { name: string; value: number }[]
  seasonComparison: { season: string; income: number; expense: number; profitability: number }[]
}

const CATEGORY_ICONS: Record<string, any> = {
  'حبوب': Wheat, 'خضروات': Carrot, 'منتجات حيوانية': Milk,
  'دعم حكومي': Landmark, 'بذور': Sprout, 'أسمدة ومبيدات': FlaskConical,
  'ري': Droplets, 'عمالة': Users, 'نقل وتسويق': Truck,
  'صيانة': Wrench, 'أخرى': Plus,
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US').format(Math.round(n)) + ' دج'
}

function getKpiColor(value: number, thresholds: [number, number] = [15, 30]) {
  if (value > thresholds[1]) return 'text-green-600 dark:text-green-400'
  if (value > thresholds[0]) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function getKpiBg(value: number, thresholds: [number, number] = [15, 30]) {
  if (value > thresholds[1]) return 'bg-green-500'
  if (value > thresholds[0]) return 'bg-amber-500'
  return 'bg-red-500'
}

export function FarmerDashboard() {
  const { user, token, logout, setCurrentView, selectedSeason, setSelectedSeason } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('home')
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [inventory, setInventory] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [farm, setFarm] = useState<any>(null)
  const [reportViewerOpen, setReportViewerOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [selectedReportData, setSelectedReportData] = useState<any>(null)

  const headers = { Authorization: `Bearer ${token}` }

  // Get farm + categories on mount
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', { headers })
        .then(r => r.json())
        .then(data => {
          if (data.success && data.data.farm) {
            setFarm(data.data.farm)
          }
        })
        .catch(console.error)
    }

    fetch('/api/categories')
      .then(r => r.json())
      .then(data => data.success && setCategories(data.data))
      .catch(console.error)
  }, [token])

  // Load dashboard data when farm or season changes
  useEffect(() => {
    if (!farm) return
    const controller = new AbortController()
    const params = selectedSeason ? `?farmId=${farm.id}&seasonId=${selectedSeason}` : `?farmId=${farm.id}`
    fetch(`/api/dashboard${params}`, { headers, signal: controller.signal })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setDashboardData(data.data)
          setLoading(false)
          if (!selectedSeason && data.data.currentSeason) {
            setSelectedSeason(data.data.currentSeason.id)
          }
        }
      })
      .catch(err => { if (err.name !== 'AbortError') console.error(err) })

    return () => controller.abort()
  }, [farm, selectedSeason, token])

  // Load transactions when season changes
  useEffect(() => {
    if (!selectedSeason) return
    const controller = new AbortController()
    fetch(`/api/transactions?seasonId=${selectedSeason}`, { headers, signal: controller.signal })
      .then(r => r.json())
      .then(data => data.success && setTransactions(data.data.transactions))
      .catch(err => { if (err.name !== 'AbortError') console.error(err) })
    return () => controller.abort()
  }, [selectedSeason, token])

  // Load inventory when farm or season changes
  useEffect(() => {
    if (!farm) return
    const controller = new AbortController()
    const params = selectedSeason ? `?farmId=${farm.id}&seasonId=${selectedSeason}` : `?farmId=${farm.id}`
    fetch(`/api/inventory${params}`, { headers, signal: controller.signal })
      .then(r => r.json())
      .then(data => data.success && setInventory(data.data))
      .catch(err => { if (err.name !== 'AbortError') console.error(err) })
    return () => controller.abort()
  }, [farm, selectedSeason, token])

  // Load reports when farm changes
  useEffect(() => {
    if (!farm) return
    const controller = new AbortController()
    fetch(`/api/reports?farmId=${farm.id}`, { headers, signal: controller.signal })
      .then(r => r.json())
      .then(data => data.success && setReports(data.data))
      .catch(err => { if (err.name !== 'AbortError') console.error(err) })
    return () => controller.abort()
  }, [farm, token])

  const refreshData = () => {
    // Force refresh by resetting fetchedRef
    if (farm) setFarm({ ...farm })
  }

  // Transaction dialog
  const [txDialog, setTxDialog] = useState(false)
  const [txForm, setTxForm] = useState({ type: 'income', categoryId: '', amount: '', note: '', txnDate: new Date().toISOString().split('T')[0] })

  const handleAddTransaction = async () => {
    if (!txForm.amount || parseFloat(txForm.amount) <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح')
      return
    }
    if (!txForm.categoryId) {
      toast.error('يرجى اختيار البند')
      return
    }
    try {
      const payload = {
        type: txForm.type,
        categoryId: txForm.categoryId || null,
        amount: parseFloat(txForm.amount),
        txnDate: txForm.txnDate,
        note: txForm.note || null,
        seasonId: selectedSeason,
      }
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('تم إضافة العملية بنجاح')
        setTxDialog(false)
        setTxForm({ type: 'income', categoryId: '', amount: '', note: '', txnDate: new Date().toISOString().split('T')[0] })
        // Refresh transactions list directly
        const txRes = await fetch(`/api/transactions?seasonId=${selectedSeason}`, { headers })
        const txData = await txRes.json()
        if (txData.success) setTransactions(txData.data.transactions)
        refreshData()
      } else {
        toast.error(data.error || 'حدث خطأ أثناء الإضافة')
      }
    } catch {
      toast.error('حدث خطأ في الاتصال')
    }
  }

  // Inventory dialog
  const [invDialog, setInvDialog] = useState(false)
  const [invForm, setInvForm] = useState({ itemType: 'input', itemName: '', unit: 'كيلو', qtyIn: '', qtyOut: '0', unitCost: '', alertThreshold: '' })

  const handleAddInventory = async () => {
    if (!invForm.itemName) {
      toast.error('يرجى إدخال اسم الصنف')
      return
    }
    if (!invForm.qtyIn || parseFloat(invForm.qtyIn) <= 0) {
      toast.error('يرجى إدخال كمية صحيحة')
      return
    }
    try {
      const payload = {
        farmId: farm.id,
        seasonId: selectedSeason,
        itemType: invForm.itemType,
        itemName: invForm.itemName,
        unit: invForm.unit || 'كيلو',
        qtyIn: parseFloat(invForm.qtyIn) || 0,
        qtyOut: parseFloat(invForm.qtyOut) || 0,
        unitCost: parseFloat(invForm.unitCost) || 0,
        alertThreshold: parseFloat(invForm.alertThreshold) || 0,
      }
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('تم إضافة المخزون بنجاح')
        setInvDialog(false)
        setInvForm({ itemType: 'input', itemName: '', unit: 'كيلو', qtyIn: '', qtyOut: '0', unitCost: '', alertThreshold: '' })
        // Refresh inventory directly
        const invRes = await fetch(`/api/inventory?farmId=${farm.id}&seasonId=${selectedSeason}`, { headers })
        const invData = await invRes.json()
        if (invData.success) setInventory(invData.data)
        refreshData()
      } else {
        toast.error(data.error || 'حدث خطأ أثناء الإضافة')
      }
    } catch {
      toast.error('حدث خطأ في الاتصال')
    }
  }

  // Report generation
  const handleGenerateReport = async (reportType: string) => {
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ farmId: farm.id, seasonId: selectedSeason, reportType }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('تم إنشاء التقرير بنجاح')
        // Auto-open the generated report
        setSelectedReport(data.data.report)
        setSelectedReportData(data.data.reportData)
        setReportViewerOpen(true)
        refreshData()
      } else {
        toast.error(data.error)
      }
    } catch {
      toast.error('حدث خطأ')
    }
  }

  const handleViewReport = (report: any) => {
    try {
      const parsed = typeof report.data === 'string' ? JSON.parse(report.data) : report.data
      setSelectedReport(report)
      setSelectedReportData(parsed)
      setReportViewerOpen(true)
    } catch {
      toast.error('خطأ في قراءة بيانات التقرير')
    }
  }

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'seasonal_account': return 'كشف حساب موسمي'
      case 'profitability': return 'تقرير الربحية'
      case 'financial_certificate': return 'شهادة أداء مالي'
      case 'compliance': return 'تقرير الامتثال'
      default: return 'تقرير'
    }
  }

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'seasonal_account': return { gradient: 'from-nature-green-dark to-green-600', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800' }
      case 'profitability': return { gradient: 'from-nature-golden to-yellow-600', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' }
      case 'financial_certificate': return { gradient: 'from-nature-purple to-nature-blue-red', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' }
      case 'compliance': return { gradient: 'from-nature-rose to-red-700', bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' }
      default: return { gradient: 'from-gray-500 to-gray-600', bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-800' }
    }
  }

  const handleExportPDF = async (reportId?: string) => {
    const targetReportId = reportId || selectedReport?.id
    if (!targetReportId) return
    try {
      toast.loading('جاري إنشاء ملف PDF...')
      const res = await fetch('/api/reports/pdf', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: targetReportId }),
      })
      // Get filename from header
      const filename = res.headers.get('X-Filename') || `FACT_report.pdf`
      // Get PDF as binary blob
      const blob = await res.blob()
      if (blob.type === 'application/pdf') {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.dismiss()
        toast.success('تم تحميل التقرير بنجاح')
      } else {
        // Fallback: try JSON error
        const text = await blob.text()
        try {
          const data = JSON.parse(text)
          toast.dismiss()
          toast.error(data.error || 'حدث خطأ أثناء إنشاء ملف PDF')
        } catch {
          toast.dismiss()
          toast.error('حدث خطأ أثناء إنشاء ملف PDF')
        }
      }
    } catch (err) {
      toast.dismiss()
      console.error('PDF export error:', err)
      toast.error('حدث خطأ في الاتصال')
    }
  }

  const handleDeleteTransaction = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE', headers })
      const data = await res.json()
      if (data.success) {
        toast.success('تم حذف العملية')
        // Remove from local state immediately
        setTransactions(prev => prev.filter(t => t.id !== id))
        refreshData()
      } else {
        toast.error(data.error || 'فشل حذف العملية')
      }
    } catch {
      toast.error('حدث خطأ في الاتصال')
    }
  }

  const d = dashboardData
  const s = d?.summaries

  if (loading && !d) {
    return (
      <div className="min-h-screen flex bg-background">
        <div className="w-64 bg-card border-l border-border" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl green-gradient flex items-center justify-center animate-pulse-glow">
              <Sprout className="size-6 text-white" />
            </div>
            <p className="text-muted-foreground animate-pulse">جاري تحميل البيانات...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-64 bg-card border-l border-border flex flex-col shadow-xl"
      >
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl luxury-gradient flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sprout className="size-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-nature-green-dark dark:text-nature-green">FACT</h2>
              <p className="text-[10px] text-muted-foreground">لوحة تحكم الفلاح</p>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <p className="text-sm font-bold text-nature-green-dark dark:text-nature-green">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{d?.farm?.name} • {d?.farm?.locationWilaya}</p>
            <p className="text-xs text-muted-foreground">{d?.farm?.areaHectares} هكتار</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {[
            { id: 'home', icon: Home, label: 'الرئيسية' },
            { id: 'transactions', icon: ArrowUpDown, label: 'العمليات' },
            { id: 'inventory', icon: Package, label: 'المخزون' },
            { id: 'reports', icon: FileText, label: 'التقارير' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-nature-green/10 text-nature-green-dark dark:text-nature-green shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <item.icon className="size-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 space-y-2 border-t border-border">
          {/* Season selector */}
          {d?.seasons && d.seasons.length > 0 && (
            <Select value={selectedSeason || ''} onValueChange={setSelectedSeason}>
              <SelectTrigger className="h-9 text-xs bg-white/50 dark:bg-black/20">
                <SelectValue placeholder="اختر الموسم" />
              </SelectTrigger>
              <SelectContent>
                {d.seasons.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.seasonType === 'autumn' ? 'خريف' : 'ربيع'} {s.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
          </button>

          <button
            onClick={() => { logout(); setCurrentView('landing') }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="size-4" />
            تسجيل الخروج
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'home' && (
              <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'إجمالي المداخيل', value: s?.totalIncome || 0, icon: TrendingUp, color: 'from-nature-green-dark to-green-600', shadow: 'shadow-green-500/20' },
                    { label: 'إجمالي المصاريف', value: s?.totalExpense || 0, icon: TrendingDown, color: 'from-nature-rose to-red-700', shadow: 'shadow-rose-500/20' },
                    { label: 'صافي الربح', value: s?.netProfit || 0, icon: Award, color: 'from-nature-golden to-yellow-600', shadow: 'shadow-amber-500/20' },
                    { label: 'نسبة الربحية', value: s?.profitabilityRate || 0, icon: BarChart3, color: 'from-nature-purple to-nature-blue-red', shadow: 'shadow-purple-500/20', isPercent: true },
                  ].map((card, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                      <Card className={`border-0 shadow-xl ${card.shadow} overflow-hidden`}>
                        <div className={`h-1 bg-gradient-to-l ${card.color}`} />
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground font-medium">{card.label}</span>
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                              <card.icon className="size-4 text-white" />
                            </div>
                          </div>
                          <p className="text-2xl font-black">
                            {card.isPercent ? `${card.value.toFixed(1)}%` : formatCurrency(card.value)}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* KPIs */}
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Shield className="size-5 text-nature-purple" />
                  مؤشرات الحوكمة
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  {d?.kpis?.filter(k => k.id !== 'kpi08').map((kpi, i) => (
                    <motion.div key={kpi.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                      <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground mb-2 font-medium">{kpi.name}</p>
                          {kpi.type === 'gauge' && (
                            <div className="flex justify-center">
                              <ProfitabilityGauge value={kpi.value} label="" size={120} />
                            </div>
                          )}
                          {kpi.type === 'progress' && (
                            <div>
                              <p className={`text-2xl font-black ${getKpiColor(kpi.value)}`}>
                                {Math.round(kpi.value)}%
                              </p>
                              <Progress value={Math.min(100, kpi.value)} className={`h-2 mt-2 ${getKpiBg(kpi.value)}`} />
                            </div>
                          )}
                          {kpi.type === 'number' && (
                            <p className="text-2xl font-black">
                              {new Intl.NumberFormat('en-US').format(Math.round(kpi.value))}{' '}
                              <span className="text-xs text-muted-foreground font-normal">{kpi.unit}</span>
                            </p>
                          )}
                          {kpi.type === 'trend' && (
                            <div className="flex items-center gap-2">
                              <p className={`text-2xl font-black ${kpi.value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {kpi.value >= 0 ? '+' : ''}{kpi.value.toFixed(1)}
                              </p>
                              {kpi.value >= 0 ? <TrendingUp className="size-5 text-green-500" /> : <TrendingDown className="size-5 text-red-500" />}
                            </div>
                          )}
                          {kpi.type === 'icons' && (
                            <div className="flex gap-1">
                              {[1, 2, 3].map(n => (
                                <div key={n} className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  n <= kpi.value ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'
                                }`}>
                                  <Wheat className={`size-4 ${n <= kpi.value ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Governance Index */}
                {d?.kpis?.find(k => k.id === 'kpi08') && (
                  <Card className="border-0 shadow-xl mb-6 overflow-hidden">
                    <div className="h-2 purple-gradient" />
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold mb-1">مؤشر الحوكمة الشامل</h3>
                          <p className="text-sm text-muted-foreground">متوسط مرجح لجميع المؤشرات</p>
                        </div>
                        <ProfitabilityGauge value={d.kpis.find(k => k.id === 'kpi08')!.value} label="" size={160} />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {d?.monthlyData && d.monthlyData.length > 0 && (
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold">المداخيل والمصاريف الشهرية</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <MonthlyAreaChart data={d.monthlyData} />
                      </CardContent>
                    </Card>
                  )}
                  {d?.seasonComparison && d.seasonComparison.length > 0 && (
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold">مقارنة المواسم</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <SeasonalBarChart data={d.seasonComparison} />
                      </CardContent>
                    </Card>
                  )}
                  {d?.incomeByCategory && d.incomeByCategory.length > 0 && (
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold">توزيع المداخيل</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CategoryPieChart data={d.incomeByCategory} />
                      </CardContent>
                    </Card>
                  )}
                  {d?.expenseByCategory && d.expenseByCategory.length > 0 && (
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold">توزيع المصاريف</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CategoryPieChart data={d.expenseByCategory} />
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Recent transactions */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <ArrowUpDown className="size-4 text-nature-green" />
                      آخر العمليات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {d?.recentTransactions && d.recentTransactions.length > 0 ? (
                      <div className="space-y-2">
                        {d.recentTransactions.map((t: any) => (
                          <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                t.type === 'income' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                              }`}>
                                {t.type === 'income' ? <TrendingUp className="size-4 text-green-600 dark:text-green-400" /> : <TrendingDown className="size-4 text-red-600 dark:text-red-400" />}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{t.category?.nameAr || 'أخرى'}</p>
                                <p className="text-xs text-muted-foreground">{t.note || new Date(t.txnDate).toLocaleDateString('fr-FR')}</p>
                              </div>
                            </div>
                            <p className={`text-sm font-bold ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">لا توجد عمليات بعد</p>
                    )}
                  </CardContent>
                </Card>

                {/* Inventory alerts */}
                {d?.inventorySummary && d.inventorySummary.filter((i: any) => i.status === 'red').length > 0 && (
                  <Card className="border-0 shadow-lg mt-6 border-r-4 border-r-red-500">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-red-600">
                        <AlertTriangle className="size-4" />
                        تنبيهات المخزون
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {d.inventorySummary.filter((i: any) => i.status === 'red').map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                            <span className="text-sm font-medium">{item.itemName}</span>
                            <span className="text-xs text-red-600 dark:text-red-400">الرصيد: {item.qtyBalance} {item.unit}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}

            {activeTab === 'transactions' && (
              <motion.div key="transactions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">العمليات المالية</h2>
                  <Dialog open={txDialog} onOpenChange={setTxDialog}>
                    <DialogTrigger asChild>
                      <Button className="golden-gradient text-white shadow-lg shadow-amber-500/20">
                        <Plus className="size-4 ml-1" />
                        إضافة عملية
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>إضافة عملية مالية</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Type selector */}
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setTxForm({ ...txForm, type: 'income' })}
                            className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                              txForm.type === 'income' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-muted'
                            }`}
                          >
                            <TrendingUp className={`size-6 ${txForm.type === 'income' ? 'text-green-600' : 'text-muted-foreground'}`} />
                            <span className={`text-xs font-bold ${txForm.type === 'income' ? 'text-green-600' : 'text-muted-foreground'}`}>مدخول</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTxForm({ ...txForm, type: 'expense' })}
                            className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                              txForm.type === 'expense' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-muted'
                            }`}
                          >
                            <TrendingDown className={`size-6 ${txForm.type === 'expense' ? 'text-red-600' : 'text-muted-foreground'}`} />
                            <span className={`text-xs font-bold ${txForm.type === 'expense' ? 'text-red-600' : 'text-muted-foreground'}`}>مصروف</span>
                          </button>
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                          <Label>البند</Label>
                          <Select value={txForm.categoryId} onValueChange={v => setTxForm({ ...txForm, categoryId: v })}>
                            <SelectTrigger>
                              <SelectValue placeholder="اختر البند" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.filter(c => c.type === txForm.type).map(c => (
                                <SelectItem key={c.id} value={c.id}>
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                                    {c.nameAr}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                          <Label>المبلغ (دج)</Label>
                          <Input
                            type="number"
                            value={txForm.amount}
                            onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                            placeholder="0"
                            dir="ltr"
                            className="text-lg font-bold h-12"
                          />
                        </div>

                        {/* Date */}
                        <div className="space-y-2">
                          <Label>التاريخ</Label>
                          <Input
                            type="date"
                            value={txForm.txnDate}
                            onChange={e => setTxForm({ ...txForm, txnDate: e.target.value })}
                            dir="ltr"
                          />
                        </div>

                        {/* Note */}
                        <div className="space-y-2">
                          <Label>ملاحظة (اختياري)</Label>
                          <Input
                            value={txForm.note}
                            onChange={e => setTxForm({ ...txForm, note: e.target.value })}
                            placeholder="أضف ملاحظة..."
                          />
                        </div>

                        <Button onClick={handleAddTransaction} className={`w-full h-12 text-base font-bold ${
                          txForm.type === 'income' ? 'green-gradient text-white' : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}>
                          تأكيد الإضافة
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Transactions list */}
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-0">
                    <ScrollArea className="max-h-[600px]">
                      {transactions.length > 0 ? (
                        <div className="divide-y divide-border">
                          {transactions.map((t: any) => (
                            <div key={t.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                  t.type === 'income' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                                }`}>
                                  {t.type === 'income'
                                    ? <TrendingUp className="size-5 text-green-600 dark:text-green-400" />
                                    : <TrendingDown className="size-5 text-red-600 dark:text-red-400" />
                                  }
                                </div>
                                <div>
                                  <p className="text-sm font-bold">{t.category?.nameAr || 'أخرى'}</p>
                                  <p className="text-xs text-muted-foreground">{t.note || '—'} • {new Date(t.txnDate).toLocaleDateString('fr-FR')}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <p className={`text-sm font-black ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                </p>
                                <button
                                  onClick={() => handleDeleteTransaction(t.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-16">
                          <ArrowUpDown className="size-12 text-muted-foreground/30 mx-auto mb-3" />
                          <p className="text-muted-foreground">لا توجد عمليات بعد</p>
                          <p className="text-xs text-muted-foreground mt-1">اضغط &quot;إضافة عملية&quot; للبدء</p>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'inventory' && (
              <motion.div key="inventory" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">المخزون الفلاحي</h2>
                  <Dialog open={invDialog} onOpenChange={setInvDialog}>
                    <DialogTrigger asChild>
                      <Button className="golden-gradient text-white shadow-lg shadow-amber-500/20">
                        <Plus className="size-4 ml-1" />
                        إضافة مخزون
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>إضافة مخزون</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>نوع المخزون</Label>
                          <Select value={invForm.itemType} onValueChange={v => setInvForm({ ...invForm, itemType: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="input">مدخلات الإنتاج</SelectItem>
                              <SelectItem value="crop">محاصيل</SelectItem>
                              <SelectItem value="animal_product">منتجات حيوانية</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>اسم الصنف</Label>
                          <Input value={invForm.itemName} onChange={e => setInvForm({ ...invForm, itemName: e.target.value })} placeholder="بذور القمح" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>الوحدة</Label>
                            <Input value={invForm.unit} onChange={e => setInvForm({ ...invForm, unit: e.target.value })} placeholder="كيلو" />
                          </div>
                          <div className="space-y-2">
                            <Label>الكمية الداخلة</Label>
                            <Input type="number" value={invForm.qtyIn} onChange={e => setInvForm({ ...invForm, qtyIn: e.target.value })} placeholder="0" dir="ltr" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>تكلفة الوحدة (دج)</Label>
                            <Input type="number" value={invForm.unitCost} onChange={e => setInvForm({ ...invForm, unitCost: e.target.value })} placeholder="0" dir="ltr" />
                          </div>
                          <div className="space-y-2">
                            <Label>حد التنبيه</Label>
                            <Input type="number" value={invForm.alertThreshold} onChange={e => setInvForm({ ...invForm, alertThreshold: e.target.value })} placeholder="0" dir="ltr" />
                          </div>
                        </div>
                        <Button onClick={handleAddInventory} className="w-full h-12 green-gradient text-white font-bold">
                          إضافة المخزون
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Inventory chart */}
                {inventory.length > 0 && (
                  <Card className="border-0 shadow-lg mb-6">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold">حالة المخزون</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <InventoryBarChart data={inventory.map(i => ({
                        name: i.itemName,
                        qtyIn: i.qtyIn,
                        qtyOut: i.qtyOut,
                        balance: i.qtyIn - i.qtyOut,
                      }))} />
                    </CardContent>
                  </Card>
                )}

                {/* Inventory list */}
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-0">
                    {inventory.length > 0 ? (
                      <div className="divide-y divide-border">
                        {inventory.map((item: any) => {
                          const balance = item.qtyIn - item.qtyOut
                          const statusColor = item.status === 'red' ? 'bg-red-500' : item.status === 'yellow' ? 'bg-amber-500' : 'bg-green-500'
                          return (
                            <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-10 rounded-full ${statusColor}`} />
                                <div>
                                  <p className="text-sm font-bold">{item.itemName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.itemType === 'input' ? 'مدخل إنتاج' : item.itemType === 'crop' ? 'محصول' : 'منتج حيواني'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-bold">
                                  الرصيد: <span className={balance <= item.alertThreshold ? 'text-red-600 dark:text-red-400' : ''}>{balance}</span> {item.unit}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  داخل: {item.qtyIn} | خارج: {item.qtyOut}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <Package className="size-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">لا يوجد مخزون بعد</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div key="reports" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                <h2 className="text-xl font-bold mb-6">التقارير المالية</h2>

                {/* Generate report buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {[
                    { type: 'seasonal_account', label: 'كشف حساب موسمي', icon: FileText, color: 'from-nature-green-dark to-green-600' },
                    { type: 'profitability', label: 'تقرير الربحية', icon: BarChart3, color: 'from-nature-golden to-yellow-600' },
                    { type: 'financial_certificate', label: 'شهادة أداء مالي', icon: Award, color: 'from-nature-purple to-nature-blue-red' },
                    { type: 'compliance', label: 'تقرير الامتثال', icon: Shield, color: 'from-nature-rose to-red-700' },
                  ].map(r => (
                    <Card key={r.type} className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group" onClick={() => handleGenerateReport(r.type)}>
                      <CardContent className="p-5 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                          <r.icon className="size-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{r.label}</p>
                          <p className="text-xs text-muted-foreground">اضغط لإنشاء التقرير</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Existing reports */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold">التقارير المُولدة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reports.length > 0 ? (
                      <div className="space-y-2">
                        {reports.map((r: any) => (
                          <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <FileText className="size-5 text-nature-purple" />
                              <div>
                                <p className="text-sm font-medium">
                                  {r.reportType === 'seasonal_account' ? 'كشف حساب موسمي' :
                                   r.reportType === 'profitability' ? 'تقرير الربحية' :
                                   r.reportType === 'financial_certificate' ? 'شهادة أداء مالي' : 'تقرير الامتثال'}
                                </p>
                                <p className="text-xs text-muted-foreground">{new Date(r.generatedAt).toLocaleDateString('fr-FR')}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleViewReport(r)} className="hover:bg-nature-green/10 hover:text-nature-green">
                                <Eye className="size-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleExportPDF(r.id)} className="hover:bg-nature-golden/10 hover:text-nature-golden">
                                <Download className="size-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">لا توجد تقارير بعد</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Report Viewer Dialog */}
      <ReportViewer
        open={reportViewerOpen}
        onOpenChange={setReportViewerOpen}
        report={selectedReport}
        reportData={selectedReportData}
        onExportPDF={handleExportPDF}
      />
    </div>
  )
}

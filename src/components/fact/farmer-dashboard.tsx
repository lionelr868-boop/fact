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
  Calendar, DollarSign, Percent, Leaf, BookOpen, Stamp, Download,
  Activity, ArrowLeftRight, Database, Zap, Target, RefreshCw, Edit2
} from 'lucide-react'
import { SeasonalBarChart, ProfitabilityGauge, CategoryPieChart, InventoryBarChart, MonthlyAreaChart, CashFlowChart, InventoryMovementChart, GovernanceRadarChart, InventoryTypeChart } from './charts'
import { ReportViewer } from './report-viewer'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'

interface DashboardData {
  farm: { id: string; name: string; areaHectares: number; locationWilaya: string }
  currentSeason: { id: string; seasonType: string; year: number } | null
  seasons: { id: string; seasonType: string; year: number }[]
  kpis: { id: string; name: string; value: number; unit: string; type: string; weight: number; desc?: string }[]
  summaries: { totalIncome: number; totalExpense: number; netProfit: number; profitabilityRate: number; incomeTrend?: number; expenseTrend?: number }
  recentTransactions: any[]
  inventorySummary: any[]
  monthlyData: { month: string; income: number; expense: number; net: number }[]
  incomeByCategory: { name: string; value: number }[]
  expenseByCategory: { name: string; value: number }[]
  seasonComparison: { season: string; income: number; expense: number; profitability: number }[]
  cashFlowData: { month: string; income: number; expense: number; net: number }[]
  inventoryMovement: { category: string; qtyIn: number; qtyOut: number }[]
  inventoryByType: { type: string; qtyIn: number; qtyOut: number; balance: number; value: number; count: number }[]
  inventoryValue: number
  inventoryAlerts: any[]
  linkedTransactionsCount: number
}

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
  const [reportToDelete, setReportToDelete] = useState<string | null>(null)

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
  const defaultTxForm = { type: 'income' as const, categoryId: '', amount: '', note: '', txnDate: new Date().toISOString().split('T')[0], quantity: '', unitPrice: '', linkedInventoryId: '' }
  const [txForm, setTxForm] = useState(defaultTxForm)

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
        quantity: parseFloat(txForm.quantity) || 0,
        unitPrice: parseFloat(txForm.unitPrice) || 0,
        linkedInventoryId: txForm.linkedInventoryId || null,
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
        const isLinked = !!txForm.linkedInventoryId
        const syncMsg = isLinked
          ? (txForm.type === 'income'
            ? 'تم إضافة عملية البيع وخصم الكمية من المخزون تلقائياً'
            : 'تم إضافة عملية الشراء وإضافة الكمية للمخزون تلقائياً')
          : 'تم إضافة العملية بنجاح'
        toast.success(syncMsg)
        setTxDialog(false)
        setTxForm(defaultTxForm)
        // Refresh transactions list directly
        const txRes = await fetch(`/api/transactions?seasonId=${selectedSeason}`, { headers })
        const txData = await txRes.json()
        if (txData.success) setTransactions(txData.data.transactions)
        // Refresh inventory list directly
        if (farm) {
          const invRes = await fetch(`/api/inventory?farmId=${farm.id}&seasonId=${selectedSeason}`, { headers })
          const invData = await invRes.json()
          if (invData.success) setInventory(invData.data)
        }
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
  const [invEditMode, setInvEditMode] = useState(false)
  const [invEditId, setInvEditId] = useState<string | null>(null)
  const [invFilter, setInvFilter] = useState('all')
  const [invSearch, setInvSearch] = useState('')
  const defaultInvForm = { itemType: 'input', subCategory: '', itemName: '', unit: 'كيلو', qtyIn: '', qtyOut: '0', unitCost: '', unitPrice: '', alertThreshold: '', minimumStock: '', reorderQuantity: '', supplier: '', storageLocation: '', description: '', batchNumber: '', expiryDate: '' }
  const [invForm, setInvForm] = useState(defaultInvForm)

  const SUB_CATEGORIES: Record<string, string[]> = {
    input: ['بذور', 'أسمدة', 'مبيدات', 'مستلزمات ري', 'أدوات زراعية'],
    crop: ['حبوب', 'خضروات', 'فواكه', 'بقوليات', 'زيوت', 'أعلاف'],
    animal_product: ['ألبان', 'بيض', 'لحوم', 'صوف', 'عسل'],
    equipment: ['آلات', 'أدوات يدوية', 'شبكات ري'],
    feed: ['أعلاف مركزة', 'أعلاف خضراء', 'مكملات غذائية'],
    medication: ['مضادات حيوية', 'لقاحات', 'مطهرات'],
  }

  const ITEM_TYPE_LABELS: Record<string, string> = {
    input: 'مدخلات الإنتاج',
    crop: 'محاصيل',
    animal_product: 'منتجات حيوانية',
    equipment: 'معدات',
    feed: 'أعلاف',
    medication: 'أدوية بيطرية',
  }

  const ITEM_TYPE_COLORS: Record<string, string> = {
    input: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    crop: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    animal_product: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    equipment: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    feed: 'bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-300',
    medication: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
  }

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
        subCategory: invForm.subCategory || null,
        itemName: invForm.itemName,
        unit: invForm.unit || 'كيلو',
        qtyIn: parseFloat(invForm.qtyIn) || 0,
        qtyOut: parseFloat(invForm.qtyOut) || 0,
        unitCost: parseFloat(invForm.unitCost) || 0,
        unitPrice: parseFloat(invForm.unitPrice) || 0,
        alertThreshold: parseFloat(invForm.alertThreshold) || 0,
        minimumStock: parseFloat(invForm.minimumStock) || 0,
        reorderQuantity: parseFloat(invForm.reorderQuantity) || 0,
        supplier: invForm.supplier || null,
        storageLocation: invForm.storageLocation || null,
        description: invForm.description || null,
        batchNumber: invForm.batchNumber || null,
        expiryDate: invForm.expiryDate || null,
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
        setInvForm(defaultInvForm)
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

  const handleEditInventory = (item: any) => {
    setInvEditMode(true)
    setInvEditId(item.id)
    setInvForm({
      itemType: item.itemType,
      subCategory: item.subCategory || '',
      itemName: item.itemName,
      unit: item.unit,
      qtyIn: String(item.qtyIn),
      qtyOut: String(item.qtyOut),
      unitCost: String(item.unitCost),
      unitPrice: String(item.unitPrice),
      alertThreshold: String(item.alertThreshold),
      minimumStock: String(item.minimumStock),
      reorderQuantity: String(item.reorderQuantity),
      supplier: item.supplier || '',
      storageLocation: item.storageLocation || '',
      description: item.description || '',
      batchNumber: item.batchNumber || '',
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : '',
    })
    setInvDialog(true)
  }

  const handleUpdateInventory = async () => {
    if (!invEditId) return
    if (!invForm.itemName) {
      toast.error('يرجى إدخال اسم الصنف')
      return
    }
    try {
      const payload = {
        itemType: invForm.itemType,
        subCategory: invForm.subCategory || null,
        itemName: invForm.itemName,
        unit: invForm.unit || 'كيلو',
        qtyIn: parseFloat(invForm.qtyIn) || 0,
        qtyOut: parseFloat(invForm.qtyOut) || 0,
        unitCost: parseFloat(invForm.unitCost) || 0,
        unitPrice: parseFloat(invForm.unitPrice) || 0,
        alertThreshold: parseFloat(invForm.alertThreshold) || 0,
        minimumStock: parseFloat(invForm.minimumStock) || 0,
        reorderQuantity: parseFloat(invForm.reorderQuantity) || 0,
        supplier: invForm.supplier || null,
        storageLocation: invForm.storageLocation || null,
        description: invForm.description || null,
        batchNumber: invForm.batchNumber || null,
        expiryDate: invForm.expiryDate || null,
      }
      const res = await fetch(`/api/inventory/${invEditId}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('تم تعديل المخزون بنجاح')
        setInvDialog(false)
        setInvEditMode(false)
        setInvEditId(null)
        setInvForm(defaultInvForm)
        // Refresh inventory directly
        const invRes = await fetch(`/api/inventory?farmId=${farm.id}&seasonId=${selectedSeason}`, { headers })
        const invData = await invRes.json()
        if (invData.success) setInventory(invData.data)
        refreshData()
      } else {
        toast.error(data.error || 'حدث خطأ أثناء التعديل')
      }
    } catch {
      toast.error('حدث خطأ في الاتصال')
    }
  }

  const handleDeleteInventory = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الصنف من المخزون؟')) return
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE', headers })
      const data = await res.json()
      if (data.success) {
        toast.success('تم حذف الصنف من المخزون')
        // Remove from local state immediately
        setInventory(prev => prev.filter((i: any) => i.id !== id))
        refreshData()
      } else {
        toast.error(data.error || 'فشل حذف المخزون')
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

  const handleDeleteReportConfirm = async () => {
    if (!reportToDelete) return
    try {
      toast.loading('جاري الحذف...')
      const res = await fetch(`/api/reports/${reportToDelete}`, {
        method: 'DELETE',
        headers
      })
      const data = await res.json()
      toast.dismiss()
      if (data.success) {
        toast.success('تم حذف التقرير بنجاح')
        setReports(reports.filter((r: any) => r.id !== reportToDelete))
        setReportToDelete(null)
      } else {
        toast.error(data.error || 'حدث خطأ أثناء الحذف')
      }
    } catch (err) {
      toast.dismiss()
      console.error(err)
      toast.error('حدث خطأ في الاتصال')
    }
  }

  const handleDeleteTransaction = async (id: string) => {
    try {
      // Find the transaction to check if it's linked to inventory
      const txToDelete = transactions.find((t: any) => t.id === id)
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE', headers })
      const data = await res.json()
      if (data.success) {
        const wasLinked = !!txToDelete?.linkedInventoryId
        toast.success(wasLinked ? 'تم حذف العملية وتحديث المخزون' : 'تم حذف العملية')
        // Remove from local state immediately
        setTransactions(prev => prev.filter(t => t.id !== id))
        // Refresh inventory if transaction was linked
        if (wasLinked && farm) {
          const invRes = await fetch(`/api/inventory?farmId=${farm.id}&seasonId=${selectedSeason}`, { headers })
          const invData = await invRes.json()
          if (invData.success) setInventory(invData.data)
        }
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
                {/* Dynamic Summary Cards with Trend Indicators */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'إجمالي المداخيل', value: s?.totalIncome || 0, icon: TrendingUp, color: 'from-nature-green-dark to-green-600', shadow: 'shadow-green-500/20', trend: s?.incomeTrend, trendLabel: 'عن الموسم السابق' },
                    { label: 'إجمالي المصاريف', value: s?.totalExpense || 0, icon: TrendingDown, color: 'from-nature-rose to-red-700', shadow: 'shadow-rose-500/20', trend: s?.expenseTrend, trendLabel: 'عن الموسم السابق' },
                    { label: 'صافي الربح', value: s?.netProfit || 0, icon: Award, color: 'from-nature-golden to-yellow-600', shadow: 'shadow-amber-500/20', trend: null, trendLabel: '' },
                    { label: 'نسبة الربحية', value: s?.profitabilityRate || 0, icon: BarChart3, color: 'from-nature-purple to-nature-blue-red', shadow: 'shadow-purple-500/20', isPercent: true, trend: null, trendLabel: '' },
                  ].map((card, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                      <Card className={`border-0 shadow-xl ${card.shadow} overflow-hidden group hover:shadow-2xl transition-all duration-300`}>
                        <div className={`h-1.5 bg-gradient-to-l ${card.color}`} />
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground font-medium">{card.label}</span>
                            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                              <card.icon className="size-4 text-white" />
                            </div>
                          </div>
                          <p className="text-2xl font-black">
                            {card.isPercent ? `${card.value.toFixed(1)}%` : formatCurrency(card.value)}
                          </p>
                          {card.trend !== null && card.trend !== undefined && (
                            <div className={`flex items-center gap-1 mt-1 text-xs ${card.trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {card.trend >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                              <span>{card.trend >= 0 ? '+' : ''}{card.trend.toFixed(1)}% {card.trendLabel}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Dynamic Status Bar - Inventory Value + Linked Ops + Alerts */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
                    <Card className="border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-all">
                      <div className="h-1 bg-gradient-to-l from-amber-500 to-amber-600" />
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">قيمة المخزون الحالي</p>
                            <p className="text-xl font-black text-amber-700 dark:text-amber-400">{formatCurrency(d?.inventoryValue || 0)}</p>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Database className="size-5 text-amber-600 dark:text-amber-400" />
                          </div>
                        </div>
                        {d?.inventoryByType && d.inventoryByType.length > 0 && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {d.inventoryByType.slice(0, 4).map(it => (
                              <Badge key={it.type} variant="outline" className="text-[9px]">
                                {ITEM_TYPE_LABELS[it.type] || it.type}: {it.count}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}>
                    <Card className="border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-all">
                      <div className="h-1 bg-gradient-to-l from-nature-green-dark to-green-600" />
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">عمليات متزامنة مع المخزون</p>
                            <p className="text-xl font-black text-nature-green">{d?.linkedTransactionsCount || 0}</p>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <ArrowLeftRight className="size-5 text-green-600 dark:text-green-400" />
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                          <Zap className="size-3 text-nature-green" />
                          البيع يخصم والشراء يضيف تلقائياً
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
                    <Card className={`border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-all ${(d?.inventoryAlerts?.length || 0) > 0 ? 'ring-1 ring-red-200 dark:ring-red-800' : ''}`}>
                      <div className={`h-1 bg-gradient-to-l ${(d?.inventoryAlerts?.length || 0) > 0 ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600'}`} />
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">تنبيهات المخزون</p>
                            <p className={`text-xl font-black ${(d?.inventoryAlerts?.length || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                              {d?.inventoryAlerts?.length || 0}
                            </p>
                          </div>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${(d?.inventoryAlerts?.length || 0) > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                            {(d?.inventoryAlerts?.length || 0) > 0
                              ? <AlertTriangle className="size-5 text-red-600 dark:text-red-400" />
                              : <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
                            }
                          </div>
                        </div>
                        {(d?.inventoryAlerts?.length || 0) > 0 && (
                          <p className="text-[10px] text-red-600 dark:text-red-400 mt-2">
                            أصناف تحتاج انتباه أو إعادة توريد
                          </p>
                        )}
                        {(d?.inventoryAlerts?.length || 0) === 0 && (
                          <p className="text-[10px] text-green-600 dark:text-green-400 mt-2">
                            جميع الأصناف في مستوى جيد
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Governance KPIs */}
                <Card className="border-0 shadow-xl mb-6 overflow-hidden">
                  <div className="h-2 purple-gradient" />
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          <Shield className="size-5 text-nature-purple" />
                          مؤشرات الحوكمة
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">مؤشرات أداء شاملة تعكس صحة الإنتاج الفلاحي</p>
                      </div>
                      {d?.kpis?.find(k => k.id === 'kpi08') && (
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">مؤشر الحوكمة الشامل</p>
                            <ProfitabilityGauge value={d.kpis.find(k => k.id === 'kpi08')!.value} label="" size={120} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {d?.kpis?.filter(k => k.id !== 'kpi08').map((kpi, i) => (
                        <motion.div key={kpi.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                          className="p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <Target className="size-3 text-nature-purple" />
                            <p className="text-[10px] text-muted-foreground font-medium">{kpi.name}</p>
                          </div>
                          {kpi.type === 'gauge' && (
                            <div className="flex justify-center">
                              <ProfitabilityGauge value={kpi.value} label="" size={80} />
                            </div>
                          )}
                          {kpi.type === 'progress' && (
                            <div>
                              <p className={`text-lg font-black ${getKpiColor(kpi.value)}`}>
                                {Math.round(kpi.value)}%
                              </p>
                              <Progress value={Math.min(100, kpi.value)} className={`h-1.5 mt-1 ${getKpiBg(kpi.value)}`} />
                            </div>
                          )}
                          {kpi.type === 'number' && (
                            <p className="text-lg font-black">
                              {new Intl.NumberFormat('en-US').format(Math.round(kpi.value))}{' '}
                              <span className="text-[10px] text-muted-foreground font-normal">{kpi.unit}</span>
                            </p>
                          )}
                          {kpi.type === 'trend' && (
                            <div className="flex items-center gap-1">
                              <p className={`text-lg font-black ${kpi.value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {kpi.value >= 0 ? '+' : ''}{kpi.value.toFixed(1)}
                              </p>
                              {kpi.value >= 0 ? <TrendingUp className="size-4 text-green-500" /> : <TrendingDown className="size-4 text-red-500" />}
                            </div>
                          )}
                          {kpi.type === 'icons' && (
                            <div className="flex gap-0.5">
                              {Array.from({ length: Math.min(5, parseInt(kpi.unit.replace('/', '')) || 16) }, (_, n) => (
                                <div key={n} className={`w-5 h-5 rounded flex items-center justify-center ${
                                  n < kpi.value ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'
                                }`}>
                                  <Wheat className={`size-3 ${n < kpi.value ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                                </div>
                              ))}
                            </div>
                          )}
                          {kpi.desc && <p className="text-[9px] text-muted-foreground mt-1">{kpi.desc}</p>}
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Charts Section - Dynamic and Governance-Aligned */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Cash Flow Chart - Dynamic */}
                  {d?.cashFlowData && d.cashFlowData.length > 0 && (
                    <Card className="border-0 shadow-lg overflow-hidden">
                      <div className="h-1 bg-gradient-to-l from-nature-purple to-nature-blue-red" />
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <Activity className="size-4 text-nature-purple" />
                          التدفق النقدي الشهري
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CashFlowChart data={d.cashFlowData} />
                      </CardContent>
                    </Card>
                  )}

                  {/* Governance Radar */}
                  {d?.kpis && d.kpis.length > 0 && (
                    <Card className="border-0 shadow-lg overflow-hidden">
                      <div className="h-1 purple-gradient" />
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <Shield className="size-4 text-nature-purple" />
                          رادار الحوكمة
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <GovernanceRadarChart kpis={d.kpis} />
                      </CardContent>
                    </Card>
                  )}

                  {/* Season Comparison */}
                  {d?.seasonComparison && d.seasonComparison.length > 0 && (
                    <Card className="border-0 shadow-lg overflow-hidden">
                      <div className="h-1 bg-gradient-to-l from-nature-green-dark to-green-600" />
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <BarChart3 className="size-4 text-nature-green" />
                          مقارنة المواسم
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <SeasonalBarChart data={d.seasonComparison} />
                      </CardContent>
                    </Card>
                  )}

                  {/* Inventory Movement Chart */}
                  {d?.inventoryMovement && d.inventoryMovement.length > 0 && (
                    <Card className="border-0 shadow-lg overflow-hidden">
                      <div className="h-1 bg-gradient-to-l from-amber-500 to-amber-600" />
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <ArrowLeftRight className="size-4 text-amber-600" />
                          حركة المخزون
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <InventoryMovementChart data={d.inventoryMovement} />
                      </CardContent>
                    </Card>
                  )}

                  {/* Income Distribution */}
                  {d?.incomeByCategory && d.incomeByCategory.length > 0 && (
                    <Card className="border-0 shadow-lg overflow-hidden">
                      <div className="h-1 bg-gradient-to-l from-nature-green-dark to-green-600" />
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <TrendingUp className="size-4 text-nature-green" />
                          توزيع المداخيل
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CategoryPieChart data={d.incomeByCategory} />
                      </CardContent>
                    </Card>
                  )}

                  {/* Expense Distribution */}
                  {d?.expenseByCategory && d.expenseByCategory.length > 0 && (
                    <Card className="border-0 shadow-lg overflow-hidden">
                      <div className="h-1 bg-gradient-to-l from-nature-rose to-red-700" />
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <TrendingDown className="size-4 text-nature-rose" />
                          توزيع المصاريف
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CategoryPieChart data={d.expenseByCategory} />
                      </CardContent>
                    </Card>
                  )}

                  {/* Inventory by Type Chart */}
                  {d?.inventoryByType && d.inventoryByType.length > 0 && (
                    <Card className="border-0 shadow-lg overflow-hidden">
                      <div className="h-1 bg-gradient-to-l from-amber-600 to-amber-700" />
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <Database className="size-4 text-amber-600" />
                          قيمة المخزون حسب النوع
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <InventoryTypeChart data={d.inventoryByType} />
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Recent Transactions with Inventory Sync Indicators */}
                <Card className="border-0 shadow-lg overflow-hidden mb-6">
                  <div className="h-1 bg-gradient-to-l from-nature-green-dark to-nature-purple" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <ArrowUpDown className="size-4 text-nature-green" />
                        آخر العمليات
                      </span>
                      <button onClick={() => setActiveTab('transactions')} className="text-xs text-nature-green hover:underline">
                        عرض الكل ←
                      </button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {d?.recentTransactions && d.recentTransactions.length > 0 ? (
                      <div className="space-y-2">
                        {d.recentTransactions.map((t: any) => (
                          <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                t.type === 'income' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                              }`}>
                                {t.type === 'income' ? <TrendingUp className="size-4 text-green-600 dark:text-green-400" /> : <TrendingDown className="size-4 text-red-600 dark:text-red-400" />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium">{t.category?.nameAr || 'أخرى'}</p>
                                  {t.linkedInventoryId && (
                                    <Badge className="text-[8px] px-1 py-0 bg-nature-green/10 text-nature-green border-nature-green/20 flex items-center gap-0.5">
                                      <Package className="size-2" />
                                      {t.type === 'income' ? 'خصم' : 'إضافة'}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {t.note || new Date(t.txnDate).toLocaleDateString('fr-FR')}
                                  {t.quantity > 0 && <span className="ml-2">×{new Intl.NumberFormat('en-US').format(t.quantity)}</span>}
                                </p>
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

                {/* Inventory Alerts */}
                {d?.inventoryAlerts && d.inventoryAlerts.length > 0 && (
                  <Card className="border-0 shadow-lg border-r-4 border-r-red-500 overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-red-600">
                        <AlertTriangle className="size-4" />
                        تنبيهات المخزون ({d.inventoryAlerts.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {d.inventoryAlerts.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${item.status === 'red' ? 'bg-red-500' : 'bg-amber-500'}`} />
                              <div>
                                <span className="text-sm font-medium">{item.itemName}</span>
                                <span className="text-xs text-muted-foreground mr-2">({ITEM_TYPE_LABELS[item.itemType] || item.itemType})</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {item.needsReorder && (
                                <Badge className="text-[9px] bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                                  يحتاج إعادة طلب
                                </Badge>
                              )}
                              <span className="text-xs text-red-600 dark:text-red-400 font-bold">
                                الرصيد: {new Intl.NumberFormat('en-US').format(item.qtyBalance)} {item.unit}
                              </span>
                            </div>
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
                    <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col p-0">
                      <DialogHeader className="p-6 pb-2 shrink-0">
                        <DialogTitle>إضافة عملية مالية</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 overflow-y-auto flex-1 px-6 pb-6">
                        {/* Type selector */}
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setTxForm({ ...txForm, type: 'income', linkedInventoryId: '', quantity: '', unitPrice: '' })}
                            className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                              txForm.type === 'income' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-muted'
                            }`}
                          >
                            <TrendingUp className={`size-6 ${txForm.type === 'income' ? 'text-green-600' : 'text-muted-foreground'}`} />
                            <span className={`text-xs font-bold ${txForm.type === 'income' ? 'text-green-600' : 'text-muted-foreground'}`}>مدخول</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTxForm({ ...txForm, type: 'expense', linkedInventoryId: '', quantity: '', unitPrice: '', amount: '' })}
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

                        {/* Linked Inventory Item - for both income (selling) and expense (buying) */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Package className="size-3.5" />
                            {txForm.type === 'income' ? 'صنف المخزون للبيع (اختياري)' : 'صنف المخزون للشراء (اختياري)'}
                          </Label>
                          <Select
                            value={txForm.linkedInventoryId}
                            onValueChange={v => {
                              if (v === '__none__') {
                                setTxForm({ ...txForm, linkedInventoryId: '', quantity: '', unitPrice: '', amount: '' })
                              } else {
                                const selectedItem = inventory.find((item: any) => item.id === v)
                                if (selectedItem) {
                                  // For income (selling): use selling price (unitPrice), for expense (buying): use purchase price (unitCost)
                                  const priceToUse = txForm.type === 'income'
                                    ? String(selectedItem.unitPrice || selectedItem.unitCost || '')
                                    : String(selectedItem.unitCost || '')
                                  const newAmount = txForm.quantity && priceToUse ? String(parseFloat(txForm.quantity) * parseFloat(priceToUse)) : ''
                                  setTxForm({ ...txForm, linkedInventoryId: v, unitPrice: priceToUse, amount: newAmount })
                                } else {
                                  setTxForm({ ...txForm, linkedInventoryId: v })
                                }
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={txForm.type === 'income' ? 'اختر الصنف المباع' : 'اختر الصنف المشترى'} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">بدون ربط بالمخزون</SelectItem>
                              {inventory
                                .filter((item: any) => {
                                  if (txForm.type === 'income') {
                                    // For selling: show items that have stock (crops, animal products, etc.)
                                    return item.qtyBalance > 0
                                  } else {
                                    // For buying: show items that are inputs/supplies (seeds, feed, medication, etc.)
                                    return ['input', 'feed', 'medication', 'equipment'].includes(item.itemType)
                                  }
                                })
                                .map((item: any) => (
                                  <SelectItem key={item.id} value={item.id}>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${
                                        item.itemType === 'input' ? 'bg-blue-500' :
                                        item.itemType === 'feed' ? 'bg-lime-500' :
                                        item.itemType === 'medication' ? 'bg-rose-500' :
                                        item.itemType === 'crop' ? 'bg-green-500' :
                                        item.itemType === 'animal_product' ? 'bg-purple-500' :
                                        'bg-amber-500'
                                      }`} />
                                      {item.itemName} ({txForm.type === 'income' ? `رصيد: ${item.qtyBalance}` : `شراء: ${item.unitCost} دج`}) {item.unit}
                                    </div>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          {txForm.linkedInventoryId && (
                            <p className="text-xs text-nature-green flex items-center gap-1">
                              <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" /></svg>
                              {txForm.type === 'income'
                                ? 'سيتم خصم الكمية من المخزون تلقائياً'
                                : 'سيتم إضافة الكمية إلى المخزون تلقائياً'}
                            </p>
                          )}
                        </div>

                        {/* Quantity - when inventory item is selected */}
                        {txForm.linkedInventoryId && (
                          <div className="space-y-2">
                            <Label>
                              الكمية{txForm.linkedInventoryId && inventory.find((i: any) => i.id === txForm.linkedInventoryId) ? ` (${inventory.find((i: any) => i.id === txForm.linkedInventoryId).unit})` : ''}
                            </Label>
                            <Input
                              type="number"
                              value={txForm.quantity}
                              onChange={e => {
                                const qty = e.target.value
                                const newAmount = qty && txForm.unitPrice ? String(parseFloat(qty) * parseFloat(txForm.unitPrice)) : ''
                                setTxForm({ ...txForm, quantity: qty, amount: newAmount })
                              }}
                              placeholder="0"
                              dir="ltr"
                              className="h-12"
                            />
                          </div>
                        )}

                        {/* Unit Price - when inventory item is selected */}
                        {txForm.linkedInventoryId && (
                          <div className="space-y-2">
                            <Label>سعر الوحدة (دج)</Label>
                            <Input
                              type="number"
                              value={txForm.unitPrice}
                              onChange={e => {
                                const price = e.target.value
                                const newAmount = txForm.quantity && price ? String(parseFloat(txForm.quantity) * parseFloat(price)) : ''
                                setTxForm({ ...txForm, unitPrice: price, amount: newAmount })
                              }}
                              placeholder="0"
                              dir="ltr"
                              className="h-12"
                            />
                          </div>
                        )}

                        {/* Amount */}
                        <div className="space-y-2">
                          <Label>المبلغ (دج)</Label>
                          <Input
                            type="number"
                            value={txForm.amount}
                            onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                            placeholder="0"
                            dir="ltr"
                            className={`text-lg font-bold h-12 ${txForm.linkedInventoryId && txForm.quantity && txForm.unitPrice ? 'bg-muted cursor-not-allowed' : ''}`}
                            readOnly={!!(txForm.linkedInventoryId && txForm.quantity && txForm.unitPrice)}
                          />
                          {txForm.linkedInventoryId && txForm.quantity && txForm.unitPrice && (
                            <p className="text-xs text-muted-foreground">محسوب تلقائياً: {txForm.quantity} × {txForm.unitPrice} = {parseFloat(txForm.quantity) * parseFloat(txForm.unitPrice)} دج</p>
                          )}
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
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold">{t.category?.nameAr || 'أخرى'}</p>
                                    {t.linkedInventoryId && (
                                      <Badge className="text-[9px] px-1.5 py-0 bg-nature-green/10 text-nature-green dark:text-nature-green border-nature-green/20 flex items-center gap-1">
                                        <Package className="size-2.5" />
                                        {t.type === 'income' ? 'خصم مخزون' : 'إضافة مخزون'}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {t.note || '—'} • {new Date(t.txnDate).toLocaleDateString('fr-FR')}
                                    {t.quantity > 0 && ` • الكمية: ${new Intl.NumberFormat('en-US').format(t.quantity)}`}
                                  </p>
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
                  <Dialog open={invDialog} onOpenChange={(open) => {
                    setInvDialog(open)
                    if (!open) {
                      setInvEditMode(false)
                      setInvEditId(null)
                      setInvForm(defaultInvForm)
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button className="golden-gradient text-white shadow-lg shadow-amber-500/20" onClick={() => {
                        setInvEditMode(false)
                        setInvEditId(null)
                        setInvForm(defaultInvForm)
                      }}>
                        <Plus className="size-4 ml-1" />
                        إضافة مخزون
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{invEditMode ? 'تعديل المخزون' : 'إضافة مخزون جديد'}</DialogTitle>
                        <DialogDescription>{invEditMode ? 'قم بتعديل بيانات الصنف المخزوني' : 'أضف صنفاً جديداً إلى المخزون'}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Type + SubCategory */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>نوع المخزون</Label>
                            <Select value={invForm.itemType} onValueChange={v => setInvForm({ ...invForm, itemType: v, subCategory: '' })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Object.entries(ITEM_TYPE_LABELS).map(([k, v]) => (
                                  <SelectItem key={k} value={k}>{v}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>التصنيف الفرعي</Label>
                            <Select value={invForm.subCategory} onValueChange={v => setInvForm({ ...invForm, subCategory: v })}>
                              <SelectTrigger><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
                              <SelectContent>
                                {(SUB_CATEGORIES[invForm.itemType] || []).map(sc => (
                                  <SelectItem key={sc} value={sc}>{sc}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Item Name + Unit */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>اسم الصنف</Label>
                            <Input value={invForm.itemName} onChange={e => setInvForm({ ...invForm, itemName: e.target.value })} placeholder="بذور القمح" />
                          </div>
                          <div className="space-y-2">
                            <Label>الوحدة</Label>
                            <Select value={invForm.unit} onValueChange={v => setInvForm({ ...invForm, unit: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {['كيلو', 'قنطار', 'طن', 'لتر', 'كيس', 'وحدة', 'غرام', 'علبة', 'زجاجة'].map(u => (
                                  <SelectItem key={u} value={u}>{u}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* QtyIn + QtyOut */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>الكمية الداخلة</Label>
                            <Input type="number" value={invForm.qtyIn} onChange={e => setInvForm({ ...invForm, qtyIn: e.target.value })} placeholder="0" dir="ltr" />
                          </div>
                          <div className="space-y-2">
                            <Label>الكمية الخارجة</Label>
                            <Input type="number" value={invForm.qtyOut} onChange={e => setInvForm({ ...invForm, qtyOut: e.target.value })} placeholder="0" dir="ltr" />
                          </div>
                        </div>

                        {/* UnitCost + UnitPrice */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>تكلفة الوحدة (دج)</Label>
                            <Input type="number" value={invForm.unitCost} onChange={e => setInvForm({ ...invForm, unitCost: e.target.value })} placeholder="سعر الشراء" dir="ltr" />
                          </div>
                          <div className="space-y-2">
                            <Label>سعر البيع (دج)</Label>
                            <Input type="number" value={invForm.unitPrice} onChange={e => setInvForm({ ...invForm, unitPrice: e.target.value })} placeholder="سعر البيع" dir="ltr" />
                          </div>
                        </div>

                        {/* AlertThreshold + MinimumStock */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>حد التنبيه</Label>
                            <Input type="number" value={invForm.alertThreshold} onChange={e => setInvForm({ ...invForm, alertThreshold: e.target.value })} placeholder="0" dir="ltr" />
                          </div>
                          <div className="space-y-2">
                            <Label>الحد الأدنى لإعادة الطلب</Label>
                            <Input type="number" value={invForm.minimumStock} onChange={e => setInvForm({ ...invForm, minimumStock: e.target.value })} placeholder="0" dir="ltr" />
                          </div>
                        </div>

                        {/* ReorderQuantity + BatchNumber */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>كمية إعادة الطلب</Label>
                            <Input type="number" value={invForm.reorderQuantity} onChange={e => setInvForm({ ...invForm, reorderQuantity: e.target.value })} placeholder="0" dir="ltr" />
                          </div>
                          <div className="space-y-2">
                            <Label>رقم الدفعة</Label>
                            <Input value={invForm.batchNumber} onChange={e => setInvForm({ ...invForm, batchNumber: e.target.value })} placeholder="LOT-2025-0001" dir="ltr" />
                          </div>
                        </div>

                        {/* Supplier + StorageLocation */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>المورّد</Label>
                            <Input value={invForm.supplier} onChange={e => setInvForm({ ...invForm, supplier: e.target.value })} placeholder="اسم المورّد" />
                          </div>
                          <div className="space-y-2">
                            <Label>مكان التخزين</Label>
                            <Select value={invForm.storageLocation} onValueChange={v => setInvForm({ ...invForm, storageLocation: v })}>
                              <SelectTrigger><SelectValue placeholder="اختر المكان" /></SelectTrigger>
                              <SelectContent>
                                {['المخزن الرئيسي', 'سقيفة A', 'سقيفة B', 'الإسطبل', 'مستودع الحبوب', 'المعصرة', 'المبرد', 'الساحة'].map(loc => (
                                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* ExpiryDate + Description */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>تاريخ الانتهاء</Label>
                            <Input type="date" value={invForm.expiryDate} onChange={e => setInvForm({ ...invForm, expiryDate: e.target.value })} dir="ltr" />
                          </div>
                          <div className="space-y-2">
                            <Label>ملاحظات</Label>
                            <Input value={invForm.description} onChange={e => setInvForm({ ...invForm, description: e.target.value })} placeholder="وصف إضافي" />
                          </div>
                        </div>

                        <Button onClick={invEditMode ? handleUpdateInventory : handleAddInventory} className={`w-full h-12 font-bold text-white ${invEditMode ? 'bg-gradient-to-l from-nature-purple to-nature-blue-red' : 'green-gradient'}`}>
                          {invEditMode ? 'حفظ التعديلات' : 'إضافة المخزون'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Inventory Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                  {Object.entries(ITEM_TYPE_LABELS).map(([type, label]) => {
                    const count = inventory.filter((i: any) => i.itemType === type).length
                    const totalValue = inventory.filter((i: any) => i.itemType === type).reduce((sum: number, i: any) => sum + ((i.qtyIn - i.qtyOut) * (i.unitCost || 0)), 0)
                    return (
                      <motion.div key={type} whileHover={{ y: -2 }} className="cursor-pointer" onClick={() => setInvFilter(invFilter === type ? 'all' : type)}>
                        <Card className={`border-0 shadow-md transition-all ${invFilter === type ? 'ring-2 ring-nature-green' : ''} ${count > 0 ? 'hover:shadow-lg' : 'opacity-50'}`}>
                          <CardContent className="p-3 text-center">
                            <Badge className={`mb-2 text-[10px] ${ITEM_TYPE_COLORS[type]}`}>{label}</Badge>
                            <p className="text-lg font-black">{count}</p>
                            <p className="text-[10px] text-muted-foreground">{formatCurrency(totalValue)}</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Search + Filter */}
                <div className="flex gap-3 mb-4">
                  <div className="flex-1">
                    <Input placeholder="بحث في المخزون..." value={invSearch} onChange={e => setInvSearch(e.target.value)} className="h-9" />
                  </div>
                  <Button variant={invFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setInvFilter('all')} className="text-xs h-9">
                    الكل ({inventory.length})
                  </Button>
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
                    {(() => {
                      const filtered = inventory
                        .filter((i: any) => invFilter === 'all' || i.itemType === invFilter)
                        .filter((i: any) => !invSearch || i.itemName.includes(invSearch) || (i.subCategory || '').includes(invSearch) || (i.supplier || '').includes(invSearch))
                      return filtered.length > 0 ? (
                        <div className="divide-y divide-border">
                          {filtered.map((item: any) => {
                            const balance = item.qtyIn - item.qtyOut
                            const totalVal = balance * (item.unitCost || 0)
                            const statusColor = item.status === 'red' ? 'bg-red-500' : item.status === 'yellow' ? 'bg-amber-500' : 'bg-green-500'
                            const needsReorder = item.minimumStock > 0 && balance <= item.minimumStock
                            return (
                              <div key={item.id} className="p-4 hover:bg-muted/30 transition-colors">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3">
                                    <div className={`w-2 h-12 rounded-full mt-1 ${statusColor} shrink-0`} />
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-bold">{item.itemName}</p>
                                        <Badge className={`text-[9px] px-1.5 py-0 ${ITEM_TYPE_COLORS[item.itemType] || 'bg-muted text-muted-foreground'}`}>
                                          {ITEM_TYPE_LABELS[item.itemType] || item.itemType}
                                        </Badge>
                                        {item.subCategory && (
                                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">{item.subCategory}</Badge>
                                        )}
                                        {needsReorder && (
                                          <Badge className="text-[9px] px-1.5 py-0 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                                            يحتاج إعادة طلب
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        داخل: <span className="text-blue-600 dark:text-blue-400 font-medium">{new Intl.NumberFormat('en-US').format(item.qtyIn)}</span> | خارج: <span className="text-red-600 dark:text-red-400 font-medium">{new Intl.NumberFormat('en-US').format(item.qtyOut)}</span> | الرصيد: <span className={balance <= (item.alertThreshold || 0) ? 'text-red-600 dark:text-red-400 font-bold' : 'font-bold text-nature-green'}>{new Intl.NumberFormat('en-US').format(balance)}</span> {item.unit}
                                      </p>
                                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                                        {item.supplier && <span>المورّد: {item.supplier}</span>}
                                        {item.storageLocation && <span>المكان: {item.storageLocation}</span>}
                                        {item.batchNumber && <span>الدفعة: {item.batchNumber}</span>}
                                        {item.expiryDate && <span className={new Date(item.expiryDate) < new Date() ? 'text-red-600 dark:text-red-400 font-bold' : ''}>الانتهاء: {new Date(item.expiryDate).toLocaleDateString('fr-FR')}</span>}
                                        {item.lastRestocked && <span>آخر توريد: {new Date(item.lastRestocked).toLocaleDateString('fr-FR')}</span>}
                                      </div>
                                      {/* Show linked transactions for this inventory item */}
                                      {transactions.filter((t: any) => t.linkedInventoryId === item.id).length > 0 && (
                                        <div className="mt-1 pt-1 border-t border-border/50">
                                          <p className="text-[10px] text-nature-green font-medium mb-1">العمليات المرتبطة:</p>
                                          <div className="space-y-0.5">
                                            {transactions
                                              .filter((t: any) => t.linkedInventoryId === item.id)
                                              .slice(0, 3)
                                              .map((t: any) => (
                                                <div key={t.id} className="flex items-center gap-1 text-[10px]">
                                                  {t.type === 'income'
                                                    ? <TrendingUp className="size-2.5 text-green-500" />
                                                    : <TrendingDown className="size-2.5 text-red-500" />
                                                  }
                                                  <span>{t.category?.nameAr || 'أخرى'}</span>
                                                  <span className="text-muted-foreground">• {t.quantity > 0 ? `${new Intl.NumberFormat('en-US').format(t.quantity)} ${item.unit}` : formatCurrency(t.amount)}</span>
                                                  <span className="text-muted-foreground">• {new Date(t.txnDate).toLocaleDateString('fr-FR')}</span>
                                                </div>
                                              ))
                                            }
                                            {transactions.filter((t: any) => t.linkedInventoryId === item.id).length > 3 && (
                                              <p className="text-[9px] text-muted-foreground">+{transactions.filter((t: any) => t.linkedInventoryId === item.id).length - 3} عمليات أخرى</p>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-left shrink-0 space-y-1">
                                    <p className="text-sm font-bold">{formatCurrency(totalVal)}</p>
                                    {item.unitCost > 0 && <p className="text-[10px] text-muted-foreground">شراء: {new Intl.NumberFormat('en-US').format(item.unitCost)} دج/{item.unit}</p>}
                                    {item.unitPrice > 0 && <p className="text-[10px] text-nature-green">بيع: {new Intl.NumberFormat('en-US').format(item.unitPrice)} دج/{item.unit}</p>}
                                    <div className="flex gap-1 mt-2">
                                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-nature-purple/10 hover:text-nature-purple" onClick={() => handleEditInventory(item)}>
                                        <Edit2 className="size-3.5" />
                                      </Button>
                                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600" onClick={() => handleDeleteInventory(item.id)}>
                                        <Trash2 className="size-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-16">
                          <Package className="size-12 text-muted-foreground/30 mx-auto mb-3" />
                          <p className="text-muted-foreground">{invSearch || invFilter !== 'all' ? 'لا توجد نتائج' : 'لا يوجد مخزون بعد'}</p>
                        </div>
                      )
                    })()}
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
                              <Button variant="ghost" size="sm" onClick={() => setReportToDelete(r.id)} className="hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600">
                                <Trash2 className="size-4" />
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
      />

      {/* Delete Report Confirmation Dialog */}
      <Dialog open={!!reportToDelete} onOpenChange={(open) => !open && setReportToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="size-5" />
              حذف التقرير
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              هل أنت متأكد من رغبتك في حذف هذا التقرير نهائياً؟
              <br/>
              لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setReportToDelete(null)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleDeleteReportConfirm}>
              تأكيد الحذف
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Sprout, LayoutDashboard, Users, FileText, LogOut, Moon, Sun,
  TrendingUp, TrendingDown, MapPin, Ruler, Mail, Calendar,
  Award, Shield, Activity, Globe, UserCheck, Search,
  Snowflake, Unlock, Trash2, Eye, Package, Tags,
  ChevronLeft, ChevronRight, AlertTriangle, Warehouse,
  Phone, Leaf, Droplets, Wrench, Pill, Plus, Edit2,
  DollarSign, BoxIcon, RefreshCw, Loader2,
} from 'lucide-react'
import { SeasonalBarChart, CategoryPieChart, CashFlowChart, InventoryTypeChart, WilayaDistributionChart } from './charts'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

// ============ TYPES ============

interface DashboardData {
  totalFarms: number; totalUsers: number; totalFarmers: number; totalAdmins: number
  totalTransactions: number; totalInventory: number; frozenUsers: number
  totalIncome: number; totalExpense: number; netProfit: number; avgProfitability: number
  totalInventoryValue: number; lowStockCount: number
  inventoryByType: { type: string; typeKey: string; count: number; value: number; balance: number }[]
  farmsByWilaya: { name: string; count: number }[]
  topFarms: {
    id: string; name: string; owner: string; ownerFrozen: boolean
    area: number; wilaya: string; income: number; expense: number; profit: number; profitability: number
  }[]
  monthlyData: { month: string; year: number; income: number; expense: number; net: number }[]
  incomeTransactions: number; expenseTransactions: number
  recentUsers: { id: string; name: string; email: string; role: string; wilaya: string | null; frozen: boolean; createdAt: string }[]
}

interface UserItem {
  id: string; name: string; email: string; role: string; phone: string | null
  wilaya: string | null; areaHectares: number | null; productionType: string | null
  frozen: boolean; frozenReason: string | null; frozenAt: string | null; lastLoginAt: string | null
  createdAt: string; transactionCount: number; inventoryCount: number
  farm: { id: string; name: string; areaHectares: number; locationWilaya: string; contractRef: string | null } | null
}

interface FarmItem {
  id: string; name: string; areaHectares: number; locationWilaya: string; contractRef: string | null; createdAt: string
  owner: { id: string; name: string; email: string; phone: string | null; frozen: boolean }
  seasons: { id: string; seasonType: string; year: number; transactionCount: number; inventoryCount: number }[]
  stats: { totalIncome: number; totalExpense: number; profit: number; profitability: number; inventoryCount: number; seasonCount: number; transactionCount: number }
}

interface TransactionItem {
  id: string; type: string; amount: number; quantity: number; unitPrice: number
  note: string | null; txnDate: string; createdAt: string; linkedInventoryId: string | null
  season: { id: string; seasonType: string; year: number; farm: { id: string; name: string; user: { name: string } } }
  category: { id: string; nameAr: string; icon: string; color: string } | null
  farm: { id: string; name: string; user: { name: string } }
}

interface InventoryItem {
  id: string; itemType: string; subCategory: string | null; itemName: string; unit: string
  qtyIn: number; qtyOut: number; qtyBalance: number; unitCost: number; alertThreshold: number
  supplier: string | null; storageLocation: string | null; batchNumber: string | null
  minimumStock: number; unitPrice: number; totalValue: number; isLowStock: boolean; createdAt: string
  farm: { id: string; name: string; user: { name: string } }
  season: { id: string; seasonType: string; year: number }
}

interface CategoryItem {
  id: string; type: string; nameAr: string; icon: string; color: string; sortOrder: number
  _count: { transactions: number }
}

// ============ HELPERS ============

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US').format(Math.round(n)) + ' دج'
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR')
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const itemTypeLabels: Record<string, string> = {
  input: 'مدخلات الإنتاج', crop: 'محاصيل', animal_product: 'منتجات حيوانية',
  equipment: 'معدات', feed: 'أعلاف', medication: 'أدوية بيطرية',
}

const itemTypeIcons: Record<string, any> = {
  input: Leaf, crop: Sprout, animal_product: Droplets,
  equipment: Wrench, feed: Package, medication: Pill,
}

// ============ MAIN COMPONENT ============

export function AdminDashboard() {
  const { user, token, logout, setCurrentView, adminTab, setAdminTab } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [dashData, setDashData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // User management states
  const [users, setUsers] = useState<UserItem[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersSearch, setUsersSearch] = useState('')
  const [usersRoleFilter, setUsersRoleFilter] = useState('all')
  const [usersFrozenFilter, setUsersFrozenFilter] = useState('all')
  const [freezeDialog, setFreezeDialog] = useState<{ open: boolean; user: UserItem | null }>({ open: false, user: null })
  const [freezeReason, setFreezeReason] = useState('')
  const [userDetailDialog, setUserDetailDialog] = useState<{ open: boolean; user: UserItem | null }>({ open: false, user: null })

  // Farm management states
  const [farms, setFarms] = useState<FarmItem[]>([])
  const [farmsLoading, setFarmsLoading] = useState(false)
  const [farmsSearch, setFarmsSearch] = useState('')

  // Transaction management states
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [txLoading, setTxLoading] = useState(false)
  const [txTypeFilter, setTxTypeFilter] = useState('all')

  // Inventory management states
  const [inventories, setInventories] = useState<InventoryItem[]>([])
  const [invLoading, setInvLoading] = useState(false)
  const [invTypeFilter, setInvTypeFilter] = useState('all')
  const [invSearch, setInvSearch] = useState('')

  // Category management states
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [catLoading, setCatLoading] = useState(false)
  const [catDialog, setCatDialog] = useState<{ open: boolean; mode: 'add' | 'edit'; cat: CategoryItem | null }>({ open: false, mode: 'add', cat: null })
  const [catForm, setCatForm] = useState({ type: 'income', nameAr: '', icon: 'Tag', color: '#6366f1', sortOrder: 0 })

  // ============ DATA FETCHING ============

  const fetchDashboard = async () => {
    if (!token) return
    setIsRefreshing(true)
    try {
      const res = await fetch('/api/admin/dashboard', { headers: { Authorization: `Bearer ${token}` } })
      const d = await res.json()
      if (d.success) {
        setDashData(d.data)
        setLoading(false)
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err)
      setLoading(false)
    } finally {
      setIsRefreshing(false)
    }
  }

  const fetchUsers = async () => {
    if (!token) return
    setUsersLoading(true)
    try {
      const params = new URLSearchParams()
      if (usersSearch) params.set('search', usersSearch)
      if (usersRoleFilter !== 'all') params.set('role', usersRoleFilter)
      if (usersFrozenFilter !== 'all') params.set('frozen', usersFrozenFilter)
      const res = await fetch(`/api/admin/users?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      const d = await res.json()
      if (d.success) setUsers(d.data)
    } catch (err) { console.error(err) }
    finally { setUsersLoading(false) }
  }

  const fetchFarms = async () => {
    if (!token) return
    setFarmsLoading(true)
    try {
      const params = new URLSearchParams()
      if (farmsSearch) params.set('search', farmsSearch)
      const res = await fetch(`/api/admin/farms?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      const d = await res.json()
      if (d.success) setFarms(d.data)
    } catch (err) { console.error(err) }
    finally { setFarmsLoading(false) }
  }

  const fetchTransactions = async () => {
    if (!token) return
    setTxLoading(true)
    try {
      const params = new URLSearchParams()
      if (txTypeFilter !== 'all') params.set('type', txTypeFilter)
      const res = await fetch(`/api/admin/transactions?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      const d = await res.json()
      if (d.success) setTransactions(d.data)
    } catch (err) { console.error(err) }
    finally { setTxLoading(false) }
  }

  const fetchInventory = async () => {
    if (!token) return
    setInvLoading(true)
    try {
      const params = new URLSearchParams()
      if (invTypeFilter !== 'all') params.set('itemType', invTypeFilter)
      if (invSearch) params.set('search', invSearch)
      const res = await fetch(`/api/admin/inventory?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      const d = await res.json()
      if (d.success) setInventories(d.data)
    } catch (err) { console.error(err) }
    finally { setInvLoading(false) }
  }

  const fetchCategories = async () => {
    if (!token) return
    setCatLoading(true)
    try {
      const res = await fetch('/api/admin/categories', { headers: { Authorization: `Bearer ${token}` } })
      const d = await res.json()
      if (d.success) setCategories(d.data)
    } catch (err) { console.error(err) }
    finally { setCatLoading(false) }
  }

  // ============ EFFECTS ============

  // Initial dashboard fetch
  useEffect(() => {
    if (token) fetchDashboard()
  }, [token])

  // Fetch data when tab changes
  useEffect(() => {
    if (!token) return
    if (adminTab === 'overview') fetchDashboard()
    else if (adminTab === 'users') fetchUsers()
    else if (adminTab === 'farms') fetchFarms()
    else if (adminTab === 'transactions') fetchTransactions()
    else if (adminTab === 'inventory') fetchInventory()
    else if (adminTab === 'categories') fetchCategories()
  }, [adminTab, token])

  // Refetch users when filters change
  useEffect(() => {
    if (adminTab === 'users' && token) fetchUsers()
  }, [usersSearch, usersRoleFilter, usersFrozenFilter])

  // Refetch farms when search changes
  useEffect(() => {
    if (adminTab === 'farms' && token) fetchFarms()
  }, [farmsSearch])

  // Refetch transactions when filter changes
  useEffect(() => {
    if (adminTab === 'transactions' && token) fetchTransactions()
  }, [txTypeFilter])

  // Refetch inventory when filters change
  useEffect(() => {
    if (adminTab === 'inventory' && token) fetchInventory()
  }, [invTypeFilter, invSearch])

  // Auto-refresh dashboard data every 30 seconds
  useEffect(() => {
    if (adminTab !== 'overview' || !token) return
    const interval = setInterval(fetchDashboard, 30000)
    return () => clearInterval(interval)
  }, [adminTab, token])

  // ============ ACTIONS ============

  const handleFreezeUser = async () => {
    if (!freezeDialog.user || !token) return
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          userId: freezeDialog.user.id,
          frozen: !freezeDialog.user.frozen,
          frozenReason: !freezeDialog.user.frozen ? freezeReason : undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setFreezeDialog({ open: false, user: null })
        setFreezeReason('')
        fetchUsers()
        fetchDashboard()
      } else {
        toast.error(data.error)
      }
    } catch { toast.error('حدث خطأ في الاتصال') }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم وجميع بياناته؟ هذا الإجراء لا يمكن التراجع عنه.')) return
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        fetchUsers()
        fetchDashboard()
      } else {
        toast.error(data.error)
      }
    } catch { toast.error('حدث خطأ في الاتصال') }
  }

  const handleSaveCategory = async () => {
    if (!token) return
    try {
      const method = catDialog.mode === 'add' ? 'POST' : 'PUT'
      const body = catDialog.mode === 'add' ? catForm : { ...catForm, id: catDialog.cat?.id }
      const res = await fetch('/api/admin/categories', {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setCatDialog({ open: false, mode: 'add', cat: null })
        setCatForm({ type: 'income', nameAr: '', icon: 'Tag', color: '#6366f1', sortOrder: 0 })
        fetchCategories()
      } else {
        toast.error(data.error)
      }
    } catch { toast.error('حدث خطأ في الاتصال') }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا البند؟')) return
    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        fetchCategories()
      } else {
        toast.error(data.error)
      }
    } catch { toast.error('حدث خطأ في الاتصال') }
  }

  // ============ SIDEBAR NAV ITEMS ============

  const navItems = [
    { id: 'overview' as const, icon: LayoutDashboard, label: 'نظرة عامة' },
    { id: 'users' as const, icon: Users, label: 'المستخدمون', badge: dashData?.frozenUsers || 0 },
    { id: 'farms' as const, icon: Sprout, label: 'المستغلات' },
    { id: 'transactions' as const, icon: Activity, label: 'العمليات' },
    { id: 'inventory' as const, icon: Warehouse, label: 'المخزونات' },
    { id: 'categories' as const, icon: Tags, label: 'البنود' },
    { id: 'reports' as const, icon: FileText, label: 'التقارير' },
  ]

  // ============ LOADING STATE ============

  if (loading && !dashData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <Loader2 className="size-12 text-nature-purple mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-bold mb-2">جاري تحميل لوحة التحكم...</h2>
          <p className="text-sm text-muted-foreground">يرجى الانتظار</p>
        </motion.div>
      </div>
    )
  }

  // ============ RENDER ============

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-card border-l border-border flex flex-col shadow-xl transition-all duration-300`}
      >
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl purple-gradient flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
              <Shield className="size-6 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h2 className="font-bold text-nature-purple">FACT</h2>
                <p className="text-[10px] text-muted-foreground">لوحة تحكم المدير</p>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
              <p className="text-sm font-bold text-nature-purple">{user?.name}</p>
              <p className="text-xs text-muted-foreground">مدير المنصة</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setAdminTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                adminTab === item.id
                  ? 'bg-nature-purple/10 text-nature-purple shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <item.icon className="size-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-right">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{item.badge}</Badge>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 space-y-2 border-t border-border">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            {sidebarCollapsed ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
            {!sidebarCollapsed && 'طي القائمة'}
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {!sidebarCollapsed && (theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي')}
          </button>
          <button
            onClick={() => { logout(); setCurrentView('landing') }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="size-4" />
            {!sidebarCollapsed && 'تسجيل الخروج'}
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {/* ===== OVERVIEW TAB ===== */}
            {adminTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">نظرة عامة على المنصة</h2>
                  <Button variant="outline" size="sm" onClick={fetchDashboard} disabled={isRefreshing}>
                    <RefreshCw className={`size-4 ml-2 ${isRefreshing ? 'animate-spin' : ''}`} />تحديث
                  </Button>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                  {[
                    { label: 'المستغلات', value: dashData?.totalFarms ?? 0, icon: Sprout, color: 'from-nature-green-dark to-green-600', shadow: 'shadow-green-500/20' },
                    { label: 'المستخدمون', value: dashData?.totalUsers ?? 0, icon: Users, color: 'from-nature-purple to-nature-blue-red', shadow: 'shadow-purple-500/20' },
                    { label: 'الفلاحون', value: dashData?.totalFarmers ?? 0, icon: UserCheck, color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
                    { label: 'العمليات', value: dashData?.totalTransactions ?? 0, icon: Activity, color: 'from-nature-golden to-yellow-600', shadow: 'shadow-amber-500/20' },
                    { label: 'المخزونات', value: dashData?.totalInventory ?? 0, icon: Warehouse, color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/20' },
                    { label: 'حسابات مجمّدة', value: dashData?.frozenUsers ?? 0, icon: Snowflake, color: 'from-red-500 to-red-700', shadow: 'shadow-red-500/20' },
                  ].map((card, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <Card className={`border-0 shadow-xl ${card.shadow} overflow-hidden`}>
                        <div className={`h-1 bg-gradient-to-l ${card.color}`} />
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-muted-foreground font-medium">{card.label}</span>
                            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                              <card.icon className="size-3.5 text-white" />
                            </div>
                          </div>
                          <p className="text-lg font-black">{new Intl.NumberFormat('en-US').format(card.value as number)}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Financial summary */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                  <Card className="border-0 shadow-lg overflow-hidden">
                    <div className="h-1 bg-gradient-to-l from-nature-green-dark to-green-600" />
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">إجمالي المداخيل</p>
                      <p className="text-xl font-black text-green-600 dark:text-green-400">{formatCurrency(dashData?.totalIncome ?? 0)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg overflow-hidden">
                    <div className="h-1 bg-gradient-to-l from-nature-rose to-red-700" />
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">إجمالي المصاريف</p>
                      <p className="text-xl font-black text-red-600 dark:text-red-400">{formatCurrency(dashData?.totalExpense ?? 0)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg overflow-hidden">
                    <div className="h-1 golden-gradient" />
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">صافي الأرباح</p>
                      <p className="text-xl font-black text-amber-600 dark:text-amber-400">{formatCurrency(dashData?.netProfit ?? 0)}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg overflow-hidden">
                    <div className="h-1 bg-gradient-to-l from-nature-purple to-nature-blue-red" />
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">قيمة المخزون</p>
                      <p className="text-xl font-black text-purple-600 dark:text-purple-400">{formatCurrency(dashData?.totalInventoryValue ?? 0)}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Alert banner */}
                {dashData && (dashData.frozenUsers > 0 || dashData.lowStockCount > 0) && (
                  <div className="flex gap-3 mb-6">
                    {dashData.frozenUsers > 0 && (
                      <Card className="border-0 shadow-md bg-red-50 dark:bg-red-900/20 flex-1">
                        <CardContent className="p-3 flex items-center gap-3">
                          <Snowflake className="size-5 text-red-500" />
                          <span className="text-sm font-medium text-red-700 dark:text-red-300">
                            {dashData.frozenUsers} حساب مجمّد
                          </span>
                          <Button variant="link" size="sm" className="mr-auto text-red-600" onClick={() => setAdminTab('users')}>
                            إدارة ←
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                    {dashData.lowStockCount > 0 && (
                      <Card className="border-0 shadow-md bg-amber-50 dark:bg-amber-900/20 flex-1">
                        <CardContent className="p-3 flex items-center gap-3">
                          <AlertTriangle className="size-5 text-amber-500" />
                          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                            {dashData.lowStockCount} صنف مخزوني بأقل من الحد
                          </span>
                          <Button variant="link" size="sm" className="mr-auto text-amber-600" onClick={() => setAdminTab('inventory')}>
                            عرض ←
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Globe className="size-4 text-nature-green" />
                        توزيع المستغلات حسب الولاية
                        <Badge variant="outline" className="text-[10px] mr-1">{dashData?.farmsByWilaya?.length ?? 0} ولاية</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {dashData?.farmsByWilaya && dashData.farmsByWilaya.length > 0 ? (
                        <WilayaDistributionChart data={dashData.farmsByWilaya.map(w => ({ name: w.name, value: w.count }))} />
                      ) : (
                        <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات بعد</div>
                      )}
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Award className="size-4 text-nature-golden" />
                        أداء المستغلات
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {dashData?.topFarms && dashData.topFarms.length > 0 ? (
                        <SeasonalBarChart data={dashData.topFarms.slice(0, 5).map(f => ({
                          season: f.name.replace('مزرعة ', ''),
                          income: f.income,
                          expense: f.expense,
                          profitability: f.profitability,
                        }))} />
                      ) : (
                        <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات بعد</div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly cash flow & Inventory by type */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <DollarSign className="size-4 text-nature-purple" />
                        التدفق النقدي الشهري
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {dashData?.monthlyData && dashData.monthlyData.some(m => m.income > 0 || m.expense > 0) ? (
                        <CashFlowChart data={dashData.monthlyData} />
                      ) : (
                        <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات بعد</div>
                      )}
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Package className="size-4 text-nature-golden" />
                        المخزونات حسب النوع
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {dashData?.inventoryByType && dashData.inventoryByType.length > 0 ? (
                        <InventoryTypeChart data={dashData.inventoryByType} />
                      ) : (
                        <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات بعد</div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Top farms table */}
                <Card className="border-0 shadow-lg mb-6">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold">أفضل المستغلات أداءً</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {dashData?.topFarms && dashData.topFarms.length > 0 ? dashData.topFarms.slice(0, 10).map((farm, i) => (
                        <div key={farm.id} className={`flex items-center justify-between p-3 rounded-xl transition-colors ${farm.ownerFrozen ? 'bg-red-50/50 dark:bg-red-900/10' : 'bg-muted/30 hover:bg-muted/50'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                              i === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                              i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                              i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {i + 1}
                            </div>
                            <div>
                              <p className="text-sm font-bold flex items-center gap-2">
                                {farm.name}
                                {farm.ownerFrozen && <Snowflake className="size-3 text-red-500" />}
                              </p>
                              <p className="text-xs text-muted-foreground">{farm.owner} • {farm.wilaya} • {farm.area} هـ</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-left">
                              <p className="text-sm font-bold">{formatCurrency(farm.profit)}</p>
                            </div>
                            <Badge variant={farm.profitability > 30 ? 'default' : farm.profitability > 15 ? 'secondary' : 'destructive'}>
                              {farm.profitability.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                      )) : (
                        <div className="p-8 text-center text-muted-foreground">لا توجد مستغلات بعد</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent users */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <UserCheck className="size-4 text-nature-purple" />
                      آخر التسجيلات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {dashData?.recentUsers && dashData.recentUsers.length > 0 ? dashData.recentUsers.map(u => (
                        <div key={u.id} className={`flex items-center justify-between p-3 rounded-xl ${u.frozen ? 'bg-red-50/50 dark:bg-red-900/10' : 'bg-muted/30'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              u.role === 'ADMIN' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-green-100 dark:bg-green-900/30'
                            }`}>
                              {u.role === 'ADMIN' ? <Shield className="size-4 text-purple-600 dark:text-purple-400" /> : <Sprout className="size-4 text-green-600 dark:text-green-400" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium flex items-center gap-2">
                                {u.name}
                                {u.frozen && <Badge variant="destructive" className="text-[9px] px-1 py-0">مجمّد</Badge>}
                              </p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                          <div className="text-left">
                            <Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'}>
                              {u.role === 'ADMIN' ? 'مدير' : 'فلاح'}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">{u.wilaya || '—'}</p>
                          </div>
                        </div>
                      )) : (
                        <div className="p-8 text-center text-muted-foreground">لا يوجد مستخدمون بعد</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ===== USERS TAB ===== */}
            {adminTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <h2 className="text-2xl font-bold mb-6">إدارة المستخدمين</h2>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="بحث بالاسم أو البريد أو الولاية..." value={usersSearch} onChange={e => setUsersSearch(e.target.value)} className="pr-9" />
                  </div>
                  <Select value={usersRoleFilter} onValueChange={setUsersRoleFilter}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="الدور" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="FARMER">فلاح</SelectItem>
                      <SelectItem value="ADMIN">مدير</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={usersFrozenFilter} onValueChange={setUsersFrozenFilter}>
                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="حالة التجميد" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="true">مجمّد</SelectItem>
                      <SelectItem value="false">نشط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Stats bar */}
                <div className="flex gap-3 mb-4 flex-wrap">
                  <Badge variant="outline" className="text-xs py-1.5 px-3">
                    <Users className="size-3 ml-1" />{dashData?.totalUsers ?? 0} مستخدم
                  </Badge>
                  <Badge variant="outline" className="text-xs py-1.5 px-3">
                    <Sprout className="size-3 ml-1" />{dashData?.totalFarmers ?? 0} فلاح
                  </Badge>
                  <Badge variant="destructive" className="text-xs py-1.5 px-3">
                    <Snowflake className="size-3 ml-1" />{dashData?.frozenUsers ?? 0} مجمّد
                  </Badge>
                </div>

                {/* Users list */}
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-0">
                    <div className="divide-y divide-border max-h-[calc(100vh-300px)] overflow-y-auto">
                      {usersLoading ? (
                        <div className="p-8 text-center"><Loader2 className="size-6 mx-auto animate-spin text-muted-foreground" /></div>
                      ) : users.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">لا يوجد مستخدمون</div>
                      ) : (
                        users.map(u => (
                          <div key={u.id} className={`flex items-center justify-between p-4 transition-colors ${u.frozen ? 'bg-red-50/50 dark:bg-red-900/10' : 'hover:bg-muted/30'}`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                u.frozen ? 'bg-red-100 dark:bg-red-900/30' :
                                u.role === 'ADMIN' ? 'purple-gradient' : 'green-gradient'
                              }`}>
                                {u.frozen ? <Snowflake className="size-5 text-red-500" /> :
                                 u.role === 'ADMIN' ? <Shield className="size-5 text-white" /> :
                                 <Sprout className="size-5 text-white" />}
                              </div>
                              <div>
                                <p className="text-sm font-bold flex items-center gap-2">
                                  {u.name}
                                  {u.frozen && <Badge variant="destructive" className="text-[9px] px-1 py-0">مجمّد</Badge>}
                                </p>
                                <p className="text-xs text-muted-foreground flex items-center gap-2">
                                  <Mail className="size-3" />{u.email}
                                  {u.phone && <><Phone className="size-3 mr-1" />{u.phone}</>}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-left text-xs">
                                <Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'}>
                                  {u.role === 'ADMIN' ? 'مدير' : 'فلاح'}
                                </Badge>
                                <div className="mt-1 text-muted-foreground flex items-center gap-1">
                                  <Calendar className="size-3" />{formatDate(u.createdAt)}
                                </div>
                                {u.farm && (
                                  <div className="mt-1 text-muted-foreground flex items-center gap-1">
                                    <Sprout className="size-3" />{u.farm.name}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-1 mr-2">
                                <Button variant="ghost" size="icon" className="size-8" onClick={() => setUserDetailDialog({ open: true, user: u })}>
                                  <Eye className="size-4 text-muted-foreground" />
                                </Button>
                                {u.role !== 'ADMIN' && (
                                  <>
                                    <Button variant="ghost" size="icon" className="size-8" onClick={() => setFreezeDialog({ open: true, user: u })}>
                                      {u.frozen ? <Unlock className="size-4 text-green-500" /> : <Snowflake className="size-4 text-blue-500" />}
                                    </Button>
                                    <Button variant="ghost" size="icon" className="size-8" onClick={() => handleDeleteUser(u.id)}>
                                      <Trash2 className="size-4 text-red-500" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ===== FARMS TAB ===== */}
            {adminTab === 'farms' && (
              <motion.div key="farms" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <h2 className="text-2xl font-bold mb-6">إدارة المستغلات الفلاحية</h2>
                <div className="flex gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="بحث بالاسم أو الولاية..." value={farmsSearch} onChange={e => setFarmsSearch(e.target.value)} className="pr-9" />
                  </div>
                </div>
                <div className="grid gap-4 max-h-[calc(100vh-250px)] overflow-y-auto">
                  {farmsLoading ? (
                    <div className="p-8 text-center"><Loader2 className="size-6 mx-auto animate-spin text-muted-foreground" /></div>
                  ) : farms.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">لا توجد مستغلات</div>
                  ) : (
                    farms.map(farm => (
                      <Card key={farm.id} className={`border-0 shadow-lg ${farm.owner.frozen ? 'border-r-4 border-r-red-500' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                                <Sprout className="size-6 text-white" />
                              </div>
                              <div>
                                <p className="font-bold text-base flex items-center gap-2">
                                  {farm.name}
                                  {farm.owner.frozen && <Badge variant="destructive" className="text-[9px] px-1 py-0">صاحب الحساب مجمّد</Badge>}
                                </p>
                                <p className="text-xs text-muted-foreground flex items-center gap-2">
                                  <MapPin className="size-3" />{farm.locationWilaya} • <Ruler className="size-3" />{farm.areaHectares} هكتار
                                  {farm.contractRef && <><span className="mx-1">•</span>عقد: {farm.contractRef}</>}
                                </p>
                                <p className="text-xs text-muted-foreground">المالك: {farm.owner.name} • {farm.owner.email}</p>
                              </div>
                            </div>
                            <Badge variant={farm.stats.profitability > 30 ? 'default' : farm.stats.profitability > 15 ? 'secondary' : 'destructive'}>
                              ربحية {farm.stats.profitability.toFixed(1)}%
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
                              <p className="text-xs text-muted-foreground">المداخيل</p>
                              <p className="text-sm font-bold text-green-600 dark:text-green-400">{formatCurrency(farm.stats.totalIncome)}</p>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 text-center">
                              <p className="text-xs text-muted-foreground">المصاريف</p>
                              <p className="text-sm font-bold text-red-600 dark:text-red-400">{formatCurrency(farm.stats.totalExpense)}</p>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 text-center">
                              <p className="text-xs text-muted-foreground">صافي الربح</p>
                              <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{formatCurrency(farm.stats.profit)}</p>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 text-center">
                              <p className="text-xs text-muted-foreground">العمليات / المخزون</p>
                              <p className="text-sm font-bold text-purple-600 dark:text-purple-400">{farm.stats.transactionCount} / {farm.stats.inventoryCount}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {farm.seasons.map(s => (
                              <Badge key={s.id} variant="outline" className="text-xs">
                                {s.seasonType === 'autumn' ? 'خريفي' : 'ربيعي'} {s.year}
                                <span className="mr-1 text-muted-foreground">({s.transactionCount} عملية, {s.inventoryCount} مخزون)</span>
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* ===== TRANSACTIONS TAB ===== */}
            {adminTab === 'transactions' && (
              <motion.div key="transactions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <h2 className="text-2xl font-bold mb-6">جميع العمليات المالية</h2>
                <div className="flex gap-3 mb-4">
                  <Select value={txTypeFilter} onValueChange={setTxTypeFilter}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="النوع" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="income">مداخيل</SelectItem>
                      <SelectItem value="expense">مصاريف</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2 mr-auto">
                    <Badge variant="outline" className="py-1.5 px-3">
                      <TrendingUp className="size-3 ml-1 text-green-500" />{dashData?.incomeTransactions ?? 0} مدخول
                    </Badge>
                    <Badge variant="outline" className="py-1.5 px-3">
                      <TrendingDown className="size-3 ml-1 text-red-500" />{dashData?.expenseTransactions ?? 0} مصروف
                    </Badge>
                  </div>
                </div>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-0">
                    <div className="divide-y divide-border max-h-[calc(100vh-280px)] overflow-y-auto">
                      {txLoading ? (
                        <div className="p-8 text-center"><Loader2 className="size-6 mx-auto animate-spin text-muted-foreground" /></div>
                      ) : transactions.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">لا توجد عمليات</div>
                      ) : (
                        transactions.map(tx => (
                          <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                tx.type === 'income' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                              }`}>
                                {tx.type === 'income' ? <TrendingUp className="size-5 text-green-600 dark:text-green-400" /> : <TrendingDown className="size-5 text-red-600 dark:text-red-400" />}
                              </div>
                              <div>
                                <p className="text-sm font-bold">
                                  {tx.category?.nameAr || 'بدون بند'}
                                  {tx.linkedInventoryId && <BoxIcon className="size-3 inline mr-1 text-blue-500" />}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {tx.farm.name} ({tx.farm.user.name}) • {tx.season.seasonType === 'autumn' ? 'خريفي' : 'ربيعي'} {tx.season.year}
                                </p>
                                {tx.note && <p className="text-xs text-muted-foreground mt-0.5">{tx.note}</p>}
                              </div>
                            </div>
                            <div className="text-left">
                              <p className={`text-sm font-bold ${tx.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                              </p>
                              {tx.quantity > 0 && <p className="text-xs text-muted-foreground">{tx.quantity} × {formatCurrency(tx.unitPrice)}</p>}
                              <p className="text-xs text-muted-foreground">{formatDate(tx.txnDate)}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ===== INVENTORY TAB ===== */}
            {adminTab === 'inventory' && (
              <motion.div key="inventory" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <h2 className="text-2xl font-bold mb-6">جميع المخزونات</h2>
                <div className="flex flex-wrap gap-3 mb-4">
                  <Select value={invTypeFilter} onValueChange={setInvTypeFilter}>
                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="النوع" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="input">مدخلات</SelectItem>
                      <SelectItem value="crop">محاصيل</SelectItem>
                      <SelectItem value="animal_product">منتجات حيوانية</SelectItem>
                      <SelectItem value="equipment">معدات</SelectItem>
                      <SelectItem value="feed">أعلاف</SelectItem>
                      <SelectItem value="medication">أدوية بيطرية</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="بحث في المخزونات..." value={invSearch} onChange={e => setInvSearch(e.target.value)} className="pr-9" />
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="py-1.5 px-3">
                      <Warehouse className="size-3 ml-1" />{dashData?.totalInventory ?? 0} صنف
                    </Badge>
                    {dashData && dashData.lowStockCount > 0 && (
                      <Badge variant="destructive" className="py-1.5 px-3">
                        <AlertTriangle className="size-3 ml-1" />{dashData.lowStockCount} بأقل من الحد
                      </Badge>
                    )}
                  </div>
                </div>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-0">
                    <div className="divide-y divide-border max-h-[calc(100vh-300px)] overflow-y-auto">
                      {invLoading ? (
                        <div className="p-8 text-center"><Loader2 className="size-6 mx-auto animate-spin text-muted-foreground" /></div>
                      ) : inventories.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">لا توجد مخزونات</div>
                      ) : (
                        inventories.map(inv => {
                          const TypeIcon = itemTypeIcons[inv.itemType] || Package
                          return (
                            <div key={inv.id} className={`flex items-center justify-between p-4 transition-colors ${inv.isLowStock ? 'bg-amber-50/50 dark:bg-amber-900/10' : 'hover:bg-muted/30'}`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${inv.isLowStock ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-muted'}`}>
                                  <TypeIcon className={`size-5 ${inv.isLowStock ? 'text-amber-600' : 'text-muted-foreground'}`} />
                                </div>
                                <div>
                                  <p className="text-sm font-bold flex items-center gap-2">
                                    {inv.itemName}
                                    {inv.isLowStock && <AlertTriangle className="size-3 text-amber-500" />}
                                    <Badge variant="outline" className="text-[9px] px-1 py-0">{itemTypeLabels[inv.itemType] || inv.itemType}</Badge>
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {inv.farm.name} ({inv.farm.user.name}) • {inv.season.seasonType === 'autumn' ? 'خريفي' : 'ربيعي'} {inv.season.year}
                                  </p>
                                  {inv.storageLocation && <p className="text-xs text-muted-foreground">الموقع: {inv.storageLocation}</p>}
                                </div>
                              </div>
                              <div className="text-left text-xs">
                                <div className="flex items-center gap-3">
                                  <span className="text-green-600">وارد: {inv.qtyIn}</span>
                                  <span className="text-red-600">صادر: {inv.qtyOut}</span>
                                  <span className="font-bold">الرصيد: {inv.qtyBalance} {inv.unit}</span>
                                </div>
                                <div className="text-muted-foreground mt-1">
                                  تكلفة: {formatCurrency(inv.unitCost)} • القيمة: {formatCurrency(inv.totalValue)}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ===== CATEGORIES TAB ===== */}
            {adminTab === 'categories' && (
              <motion.div key="categories" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">إدارة البنود</h2>
                  <Button onClick={() => {
                    setCatForm({ type: 'income', nameAr: '', icon: 'Tag', color: '#6366f1', sortOrder: 0 })
                    setCatDialog({ open: true, mode: 'add', cat: null })
                  }}>
                    <Plus className="size-4 ml-2" />إضافة بند
                  </Button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-green-600">
                        <TrendingUp className="size-4" />بنود المداخيل ({categories.filter(c => c.type === 'income').length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {catLoading ? <div className="p-4 text-center"><Loader2 className="size-5 mx-auto animate-spin" /></div> :
                        categories.filter(c => c.type === 'income').map(cat => (
                          <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color + '20' }}>
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{cat.nameAr}</p>
                                <p className="text-xs text-muted-foreground">{cat._count.transactions} عملية</p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="size-7" onClick={() => {
                                setCatForm({ type: cat.type, nameAr: cat.nameAr, icon: cat.icon, color: cat.color, sortOrder: cat.sortOrder })
                                setCatDialog({ open: true, mode: 'edit', cat })
                              }}><Edit2 className="size-3" /></Button>
                              <Button variant="ghost" size="icon" className="size-7" onClick={() => handleDeleteCategory(cat.id)}><Trash2 className="size-3 text-red-500" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-red-600">
                        <TrendingDown className="size-4" />بنود المصاريف ({categories.filter(c => c.type === 'expense').length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                        {catLoading ? <div className="p-4 text-center"><Loader2 className="size-5 mx-auto animate-spin" /></div> :
                        categories.filter(c => c.type === 'expense').map(cat => (
                          <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color + '20' }}>
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{cat.nameAr}</p>
                                <p className="text-xs text-muted-foreground">{cat._count.transactions} عملية</p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="size-7" onClick={() => {
                                setCatForm({ type: cat.type, nameAr: cat.nameAr, icon: cat.icon, color: cat.color, sortOrder: cat.sortOrder })
                                setCatDialog({ open: true, mode: 'edit', cat })
                              }}><Edit2 className="size-3" /></Button>
                              <Button variant="ghost" size="icon" className="size-7" onClick={() => handleDeleteCategory(cat.id)}><Trash2 className="size-3 text-red-500" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* ===== REPORTS TAB ===== */}
            {adminTab === 'reports' && (
              <motion.div key="reports" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <h2 className="text-2xl font-bold mb-6">التقارير والإحصائيات</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <Card className="border-0 shadow-lg text-center">
                    <CardContent className="p-6">
                      <Activity className="size-10 text-nature-green mx-auto mb-2" />
                      <p className="text-3xl font-black">{dashData?.totalTransactions ?? 0}</p>
                      <p className="text-sm text-muted-foreground">عملية مالية مسجلة</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg text-center">
                    <CardContent className="p-6">
                      <TrendingUp className="size-10 text-green-500 mx-auto mb-2" />
                      <p className="text-3xl font-black">{formatCurrency(dashData?.totalIncome ?? 0)}</p>
                      <p className="text-sm text-muted-foreground">إجمالي المداخيل</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg text-center">
                    <CardContent className="p-6">
                      <TrendingDown className="size-10 text-red-500 mx-auto mb-2" />
                      <p className="text-3xl font-black">{formatCurrency(dashData?.totalExpense ?? 0)}</p>
                      <p className="text-sm text-muted-foreground">إجمالي المصاريف</p>
                    </CardContent>
                  </Card>
                </div>
                <Card className="border-0 shadow-lg mb-6">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold">ملخص الأداء المالي</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>متوسط الربحية</span>
                          <span className="font-bold">{(dashData?.avgProfitability ?? 0).toFixed(1)}%</span>
                        </div>
                        <Progress value={Math.max(0, dashData?.avgProfitability ?? 0)} className="h-3" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>صافي الأرباح</span>
                          <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(dashData?.netProfit ?? 0)}</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>نسبة المداخيل إلى المصاريف</span>
                          <span className="font-bold">{dashData?.totalExpense ? ((dashData.totalIncome / dashData.totalExpense) * 100).toFixed(1) : '0'}%</span>
                        </div>
                        <Progress value={Math.min(100, dashData?.totalExpense ? (dashData.totalIncome / dashData.totalExpense) * 100 : 0)} className="h-3" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>قيمة المخزون الإجمالية</span>
                          <span className="font-bold text-purple-600 dark:text-purple-400">{formatCurrency(dashData?.totalInventoryValue ?? 0)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Globe className="size-4 text-nature-green" />
                        توزيع المستغلات حسب الولاية
                        <Badge variant="outline" className="text-[10px] mr-1">{dashData?.farmsByWilaya?.length ?? 0} ولاية</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {dashData?.farmsByWilaya && dashData.farmsByWilaya.length > 0 ? (
                        <WilayaDistributionChart data={dashData.farmsByWilaya.map(w => ({ name: w.name, value: w.count }))} />
                      ) : (
                        <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات بعد</div>
                      )}
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Package className="size-4 text-nature-golden" />
                        توزيع المخزونات حسب النوع
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {dashData?.inventoryByType && dashData.inventoryByType.length > 0 ? (
                        <InventoryTypeChart data={dashData.inventoryByType} />
                      ) : (
                        <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">لا توجد بيانات بعد</div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ===== FREEZE/UNFREEZE DIALOG ===== */}
      <Dialog open={freezeDialog.open} onOpenChange={o => setFreezeDialog({ open: o, user: o ? freezeDialog.user : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{freezeDialog.user?.frozen ? 'فك تجميد الحساب' : 'تجميد الحساب'}</DialogTitle>
            <DialogDescription>
              {freezeDialog.user?.frozen
                ? `سيتم فك تجميد حساب "${freezeDialog.user?.name}" وسيتمكن من الدخول للمنصة مجدداً`
                : `سيتم تجميد حساب "${freezeDialog.user?.name}" ولن يتمكن من الدخول للمنصة`}
            </DialogDescription>
          </DialogHeader>
          {!freezeDialog.user?.frozen && (
            <div>
              <label className="text-sm font-medium mb-2 block">سبب التجميد</label>
              <Textarea placeholder="أدخل سبب تجميد الحساب..." value={freezeReason} onChange={e => setFreezeReason(e.target.value)} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFreezeDialog({ open: false, user: null })}>إلغاء</Button>
            <Button variant={freezeDialog.user?.frozen ? 'default' : 'destructive'} onClick={handleFreezeUser}>
              {freezeDialog.user?.frozen ? <><Unlock className="size-4 ml-2" />فك التجميد</> : <><Snowflake className="size-4 ml-2" />تجميد الحساب</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== USER DETAIL DIALOG ===== */}
      <Dialog open={userDetailDialog.open} onOpenChange={o => setUserDetailDialog({ open: o, user: o ? userDetailDialog.user : null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تفاصيل المستخدم</DialogTitle>
          </DialogHeader>
          {userDetailDialog.user && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  userDetailDialog.user.frozen ? 'bg-red-100 dark:bg-red-900/30' :
                  userDetailDialog.user.role === 'ADMIN' ? 'purple-gradient' : 'green-gradient'
                }`}>
                  {userDetailDialog.user.frozen ? <Snowflake className="size-7 text-red-500" /> :
                   userDetailDialog.user.role === 'ADMIN' ? <Shield className="size-7 text-white" /> :
                   <Sprout className="size-7 text-white" />}
                </div>
                <div>
                  <p className="font-bold text-lg flex items-center gap-2">
                    {userDetailDialog.user.name}
                    {userDetailDialog.user.frozen && <Badge variant="destructive" className="text-[10px]">مجمّد</Badge>}
                  </p>
                  <p className="text-sm text-muted-foreground">{userDetailDialog.user.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">الدور</p>
                  <Badge variant={userDetailDialog.user.role === 'ADMIN' ? 'default' : 'secondary'}>
                    {userDetailDialog.user.role === 'ADMIN' ? 'مدير' : 'فلاح'}
                  </Badge>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">الولاية</p>
                  <p className="text-sm font-medium">{userDetailDialog.user.wilaya || '—'}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">الهاتف</p>
                  <p className="text-sm font-medium">{userDetailDialog.user.phone || '—'}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">المساحة</p>
                  <p className="text-sm font-medium">{userDetailDialog.user.areaHectares ? `${userDetailDialog.user.areaHectares} هكتار` : '—'}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">نوع الإنتاج</p>
                  <p className="text-sm font-medium">{userDetailDialog.user.productionType || '—'}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">تاريخ التسجيل</p>
                  <p className="text-sm font-medium">{formatDateTime(userDetailDialog.user.createdAt)}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">آخر دخول</p>
                  <p className="text-sm font-medium">{userDetailDialog.user.lastLoginAt ? formatDateTime(userDetailDialog.user.lastLoginAt) : '—'}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">العمليات</p>
                  <p className="text-sm font-medium">{userDetailDialog.user.transactionCount} عملية</p>
                </div>
              </div>
              {userDetailDialog.user.frozen && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">سبب التجميد</p>
                  <p className="text-sm text-red-700 dark:text-red-300">{userDetailDialog.user.frozenReason || 'لم يحدد'}</p>
                  {userDetailDialog.user.frozenAt && <p className="text-xs text-red-500 mt-1">منذ: {formatDateTime(userDetailDialog.user.frozenAt)}</p>}
                </div>
              )}
              {userDetailDialog.user.farm && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">المستغلة</p>
                  <p className="text-sm font-medium">{userDetailDialog.user.farm.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {userDetailDialog.user.farm.locationWilaya} • {userDetailDialog.user.farm.areaHectares} هكتار
                    {userDetailDialog.user.farm.contractRef && ` • عقد: ${userDetailDialog.user.farm.contractRef}`}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== CATEGORY ADD/EDIT DIALOG ===== */}
      <Dialog open={catDialog.open} onOpenChange={o => setCatDialog({ open: o, mode: catDialog.mode, cat: catDialog.cat })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{catDialog.mode === 'add' ? 'إضافة بند جديد' : 'تعديل البند'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">النوع</label>
              <Select value={catForm.type} onValueChange={v => setCatForm({ ...catForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">مدخول</SelectItem>
                  <SelectItem value="expense">مصروف</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">الاسم بالعربية</label>
              <Input value={catForm.nameAr} onChange={e => setCatForm({ ...catForm, nameAr: e.target.value })} placeholder="مثال: بيع القمح" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">اللون</label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={catForm.color} onChange={e => setCatForm({ ...catForm, color: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
                  <Input value={catForm.color} onChange={e => setCatForm({ ...catForm, color: e.target.value })} className="flex-1" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">ترتيب الفرز</label>
                <Input type="number" value={catForm.sortOrder} onChange={e => setCatForm({ ...catForm, sortOrder: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialog({ open: false, mode: 'add', cat: null })}>إلغاء</Button>
            <Button onClick={handleSaveCategory}>{catDialog.mode === 'add' ? 'إضافة' : 'حفظ'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

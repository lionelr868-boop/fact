'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Sprout, LayoutDashboard, Users, FileText, LogOut, Moon, Sun,
  TrendingUp, TrendingDown, MapPin, Ruler, Mail, Calendar,
  BarChart3, Award, Shield, Activity, Globe, UserCheck
} from 'lucide-react'
import { SeasonalBarChart, CategoryPieChart } from './charts'
import { useTheme } from 'next-themes'

interface AdminData {
  totalFarms: number
  totalUsers: number
  totalFarmers: number
  totalTransactions: number
  totalIncome: number
  totalExpense: number
  avgProfitability: number
  farmsByWilaya: { name: string; count: number }[]
  topFarms: {
    id: string; name: string; owner: string; wilaya: string; area: number
    income: number; expense: number; profit: number; profitability: number
  }[]
  recentUsers: { id: string; name: string; email: string; role: string; wilaya: string | null; createdAt: string }[]
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US').format(Math.round(n)) + ' دج'
}

export function AdminDashboard() {
  const { user, token, logout, setCurrentView } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('overview')
  const [data, setData] = useState<AdminData | null>(null)
  const [loading, setLoading] = useState(true)

  const headers = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/admin', { headers, signal: controller.signal })
      .then(r => r.json())
      .then(d => { if (d.success) { setData(d.data); setLoading(false) } })
      .catch(err => { if (err.name !== 'AbortError') console.error(err) })

    return () => controller.abort()
  }, [token])

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
            <div className="w-10 h-10 rounded-xl purple-gradient flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Shield className="size-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-nature-purple">FACT</h2>
              <p className="text-[10px] text-muted-foreground">لوحة تحكم المدير</p>
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
            <p className="text-sm font-bold text-nature-purple">{user?.name}</p>
            <p className="text-xs text-muted-foreground">مدير المنصة</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {[
            { id: 'overview', icon: LayoutDashboard, label: 'نظرة عامة' },
            { id: 'farms', icon: Sprout, label: 'المستغلات' },
            { id: 'users', icon: Users, label: 'المستخدمون' },
            { id: 'reports', icon: FileText, label: 'التقارير' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-nature-purple/10 text-nature-purple shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <item.icon className="size-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 space-y-2 border-t border-border">
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
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-2xl font-bold mb-6">نظرة عامة على المنصة</h2>

              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'إجمالي المستغلات', value: data?.totalFarms || 0, icon: Sprout, color: 'from-nature-green-dark to-green-600', shadow: 'shadow-green-500/20' },
                  { label: 'إجمالي المستخدمين', value: data?.totalUsers || 0, icon: Users, color: 'from-nature-purple to-nature-blue-red', shadow: 'shadow-purple-500/20' },
                  { label: 'إجمالي العمليات', value: data?.totalTransactions || 0, icon: Activity, color: 'from-nature-golden to-yellow-600', shadow: 'shadow-amber-500/20' },
                  { label: 'متوسط الربحية', value: data?.avgProfitability || 0, icon: BarChart3, color: 'from-nature-rose to-red-700', shadow: 'shadow-red-500/20', isPercent: true },
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
                          {card.isPercent ? `${(card.value as number).toFixed(1)}%` : new Intl.NumberFormat('en-US').format(card.value as number)}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Financial summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card className="border-0 shadow-lg overflow-hidden">
                  <div className="h-1 bg-gradient-to-l from-nature-green-dark to-green-600" />
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">إجمالي المداخيل</p>
                    <p className="text-xl font-black text-green-600 dark:text-green-400">{formatCurrency(data?.totalIncome || 0)}</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg overflow-hidden">
                  <div className="h-1 bg-gradient-to-l from-nature-rose to-red-700" />
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">إجمالي المصاريف</p>
                    <p className="text-xl font-black text-red-600 dark:text-red-400">{formatCurrency(data?.totalExpense || 0)}</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg overflow-hidden">
                  <div className="h-1 golden-gradient" />
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">صافي الأرباح</p>
                    <p className="text-xl font-black text-amber-600 dark:text-amber-400">{formatCurrency((data?.totalIncome || 0) - (data?.totalExpense || 0))}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {data?.farmsByWilaya && data.farmsByWilaya.length > 0 && (
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Globe className="size-4 text-nature-green" />
                        توزيع المستغلات حسب الولاية
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CategoryPieChart data={data.farmsByWilaya} />
                    </CardContent>
                  </Card>
                )}
                {data?.topFarms && data.topFarms.length > 0 && (
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Award className="size-4 text-nature-golden" />
                        أداء المستغلات
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SeasonalBarChart data={data.topFarms.slice(0, 5).map(f => ({
                        season: f.name.replace('مزرعة ', ''),
                        income: f.income,
                        expense: f.expense,
                      }))} />
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Top farms table */}
              <Card className="border-0 shadow-lg mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold">أفضل المستغلات أداءً</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data?.topFarms?.slice(0, 5).map((farm, i) => (
                      <div key={farm.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
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
                            <p className="text-sm font-bold">{farm.name}</p>
                            <p className="text-xs text-muted-foreground">{farm.owner} • {farm.wilaya}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-left">
                            <p className="text-sm font-bold">{formatCurrency(farm.profit)}</p>
                            <p className="text-xs text-muted-foreground">{farm.area} هكتار</p>
                          </div>
                          <Badge variant={farm.profitability > 30 ? 'default' : farm.profitability > 15 ? 'secondary' : 'destructive'}>
                            {farm.profitability.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
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
                    {data?.recentUsers?.map(u => (
                      <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            u.role === 'ADMIN' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-green-100 dark:bg-green-900/30'
                          }`}>
                            {u.role === 'ADMIN' ? <Shield className="size-4 text-purple-600 dark:text-purple-400" /> : <Sprout className="size-4 text-green-600 dark:text-green-400" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{u.name}</p>
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
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'farms' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-xl font-bold mb-6">المستغلات الفلاحية</h2>
              <Card className="border-0 shadow-lg">
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {data?.topFarms?.map(farm => (
                      <div key={farm.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                            <Sprout className="size-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{farm.name}</p>
                            <p className="text-xs text-muted-foreground">
                              <MapPin className="size-3 inline ml-1" />{farm.wilaya} • <Ruler className="size-3 inline ml-1" />{farm.area} هكتار
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-left text-sm">
                            <p>مداخيل: <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(farm.income)}</span></p>
                            <p>مصاريف: <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(farm.expense)}</span></p>
                          </div>
                          <Badge variant={farm.profitability > 30 ? 'default' : farm.profitability > 15 ? 'secondary' : 'destructive'}>
                            {farm.profitability.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-xl font-bold mb-6">المستخدمون</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6 text-center">
                    <Users className="size-10 text-nature-purple mx-auto mb-2" />
                    <p className="text-3xl font-black">{data?.totalUsers || 0}</p>
                    <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-6 text-center">
                    <Sprout className="size-10 text-nature-green mx-auto mb-2" />
                    <p className="text-3xl font-black">{data?.totalFarmers || 0}</p>
                    <p className="text-sm text-muted-foreground">فلاحون مسجلون</p>
                  </CardContent>
                </Card>
              </div>
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold">قائمة المستخدمين</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data?.recentUsers?.map(u => (
                      <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            u.role === 'ADMIN' ? 'purple-gradient' : 'green-gradient'
                          }`}>
                            {u.role === 'ADMIN' ? <Shield className="size-5 text-white" /> : <Sprout className="size-5 text-white" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{u.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="size-3" />{u.email}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <Badge>{u.role === 'ADMIN' ? 'مدير' : 'فلاح'}</Badge>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Calendar className="size-3" />{new Date(u.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-xl font-bold mb-6">التقارير</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card className="border-0 shadow-lg text-center">
                  <CardContent className="p-6">
                    <Activity className="size-10 text-nature-green mx-auto mb-2" />
                    <p className="text-3xl font-black">{data?.totalTransactions || 0}</p>
                    <p className="text-sm text-muted-foreground">عملية مالية مسجلة</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg text-center">
                  <CardContent className="p-6">
                    <TrendingUp className="size-10 text-green-500 mx-auto mb-2" />
                    <p className="text-3xl font-black">{formatCurrency(data?.totalIncome || 0)}</p>
                    <p className="text-sm text-muted-foreground">إجمالي المداخيل</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg text-center">
                  <CardContent className="p-6">
                    <TrendingDown className="size-10 text-red-500 mx-auto mb-2" />
                    <p className="text-3xl font-black">{formatCurrency(data?.totalExpense || 0)}</p>
                    <p className="text-sm text-muted-foreground">إجمالي المصاريف</p>
                  </CardContent>
                </Card>
              </div>
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold">ملخص الأداء المالي</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>متوسط الربحية</span>
                        <span className="font-bold">{data?.avgProfitability.toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.max(0, data?.avgProfitability || 0)} className="h-3" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>صافي الأرباح</span>
                        <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency((data?.totalIncome || 0) - (data?.totalExpense || 0))}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>نسبة المداخيل إلى المصاريف</span>
                        <span className="font-bold">{data?.totalExpense ? ((data.totalIncome / data.totalExpense) * 100).toFixed(1) : '0'}%</span>
                      </div>
                      <Progress value={Math.min(100, data?.totalExpense ? (data.totalIncome / data.totalExpense) * 100 : 0)} className="h-3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}

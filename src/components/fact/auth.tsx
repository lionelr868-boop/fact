'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sprout, ArrowRight, Mail, Lock, User, Phone, MapPin, Ruler, Wheat, Shield, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

const WILAYAS = [
  'أدرار', 'الشلف', 'الأغواط', 'أم البواقي', 'باتنة', 'بجاية', 'بسكرة', 'بشار',
  'البليدة', 'البويرة', 'تمنراست', 'تبسة', 'تلمسان', 'تيارت', 'تيزي وزو', 'الجزائر',
  'الجلفة', 'جيجل', 'سطيف', 'سعيدة', 'سكيكدة', 'سيدي بلعباس', 'عنابة', 'قالمة',
  'قسنطينة', 'المدية', 'مستغانم', 'المسيلة', 'معسكر', 'ورقلة', 'وهران', 'البيض',
  'إليزي', 'برج بوعريريج', 'بومرداس', 'الطارف', 'تندوف', 'تيسمسيلت', 'الوادي', 'خنشلة',
  'سوق أهراس', 'تيبازة', 'ميلة', 'عين الدفلى', 'النعامة', 'عين تموشنت', 'غرداية', 'غليزان'
]

export function AuthPage() {
  const { setCurrentView, setUser, setToken } = useAppStore()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'FARMER',
    phone: '', wilaya: '', areaHectares: '', productionType: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const body = isLogin
        ? { email: form.email, password: form.password }
        : form

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!data.success) {
        toast.error(data.error || 'حدث خطأ')
        return
      }

      setUser(data.data.user)
      setToken(data.data.token)
      toast.success(isLogin ? 'تم تسجيل الدخول بنجاح' : 'تم إنشاء الحساب بنجاح')

      if (data.data.user.role === 'ADMIN') {
        setCurrentView('admin-dashboard')
      } else {
        setCurrentView('farmer-dashboard')
      }
    } catch {
      toast.error('حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center nature-gradient p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-20 w-80 h-80 bg-green-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-amber-400/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-400/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl green-gradient flex items-center justify-center shadow-lg shadow-green-500/30 animate-float">
            <Sprout className="size-9 text-white" />
          </div>
          <h1 className="text-3xl font-black bg-gradient-to-l from-nature-green-dark via-green-500 to-nature-golden bg-clip-text text-transparent">
            FACT
          </h1>
          <p className="text-muted-foreground text-sm mt-1">منصة المحاسبة الفلاحية الرقمية</p>
        </motion.div>

        <Card className="border-0 shadow-2xl glass">
          <CardContent className="p-6">
            {/* Tab switcher */}
            <div className="flex gap-2 mb-6 p-1 bg-muted/50 rounded-xl">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                  isLogin ? 'green-gradient text-white shadow-lg shadow-green-500/20' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                تسجيل الدخول
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                  !isLogin ? 'golden-gradient text-white shadow-lg shadow-amber-500/20' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                إنشاء حساب
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    key="register-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4 overflow-hidden"
                  >
                    {/* Name */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">الاسم الكامل</Label>
                      <div className="relative">
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          value={form.name}
                          onChange={e => setForm({ ...form, name: e.target.value })}
                          placeholder="أدخل اسمك"
                          className="pr-10 h-11 bg-white/50 dark:bg-black/20 border-nature-green/20 focus:border-nature-green"
                          required
                        />
                      </div>
                    </div>

                    {/* Role */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">نوع الحساب</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, role: 'FARMER' })}
                          className={`p-3 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
                            form.role === 'FARMER'
                              ? 'border-nature-green bg-green-50 dark:bg-green-900/20 shadow-lg shadow-green-500/10'
                              : 'border-muted hover:border-nature-green/30'
                          }`}
                        >
                          <Wheat className={`size-6 ${form.role === 'FARMER' ? 'text-nature-green' : 'text-muted-foreground'}`} />
                          <span className={`text-xs font-bold ${form.role === 'FARMER' ? 'text-nature-green-dark dark:text-nature-green' : 'text-muted-foreground'}`}>
                            فلاح
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, role: 'ADMIN' })}
                          className={`p-3 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
                            form.role === 'ADMIN'
                              ? 'border-nature-purple bg-purple-50 dark:bg-purple-900/20 shadow-lg shadow-purple-500/10'
                              : 'border-muted hover:border-nature-purple/30'
                          }`}
                        >
                          <Shield className={`size-6 ${form.role === 'ADMIN' ? 'text-nature-purple' : 'text-muted-foreground'}`} />
                          <span className={`text-xs font-bold ${form.role === 'ADMIN' ? 'text-nature-purple' : 'text-muted-foreground'}`}>
                            مدير
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Farmer-specific fields */}
                    {form.role === 'FARMER' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">رقم الهاتف</Label>
                          <div className="relative">
                            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                              value={form.phone}
                              onChange={e => setForm({ ...form, phone: e.target.value })}
                              placeholder="05xxxxxxxx"
                              className="pr-10 h-11 bg-white/50 dark:bg-black/20 border-nature-green/20"
                              dir="ltr"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">الولاية</Label>
                          <div className="relative">
                            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground z-10" />
                            <Select value={form.wilaya} onValueChange={v => setForm({ ...form, wilaya: v })}>
                              <SelectTrigger className="pr-10 h-11 bg-white/50 dark:bg-black/20 border-nature-green/20">
                                <SelectValue placeholder="اختر الولاية" />
                              </SelectTrigger>
                              <SelectContent>
                                {WILAYAS.map(w => (
                                  <SelectItem key={w} value={w}>{w}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">المساحة (هكتار)</Label>
                            <div className="relative">
                              <Ruler className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                              <Input
                                type="number"
                                value={form.areaHectares}
                                onChange={e => setForm({ ...form, areaHectares: e.target.value })}
                                placeholder="5"
                                className="pr-10 h-11 bg-white/50 dark:bg-black/20 border-nature-green/20"
                                dir="ltr"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">نوع الإنتاج</Label>
                            <Input
                              value={form.productionType}
                              onChange={e => setForm({ ...form, productionType: e.target.value })}
                              placeholder="حبوب + خضروات"
                              className="h-11 bg-white/50 dark:bg-black/20 border-nature-green/20"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="example@fact.dz"
                    className="pr-10 h-11 bg-white/50 dark:bg-black/20 border-nature-green/20 focus:border-nature-green"
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="pr-10 pl-10 h-11 bg-white/50 dark:bg-black/20 border-nature-green/20 focus:border-nature-green"
                    dir="ltr"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className={`w-full h-12 text-base font-bold shadow-xl transition-all hover:scale-[1.02] ${
                  isLogin
                    ? 'green-gradient text-white shadow-green-500/25'
                    : 'golden-gradient text-white shadow-amber-500/25'
                }`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'تسجيل الدخول' : 'إنشاء الحساب'}
                    <ArrowRight className="size-5 mr-2" />
                  </>
                )}
              </Button>
            </form>

            {/* Back button */}
            <button
              onClick={() => setCurrentView('landing')}
              className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              العودة إلى الصفحة الرئيسية
            </button>
          </CardContent>
        </Card>

        {/* Demo credentials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-center"
        >
          <Card className="border-0 shadow-lg glass">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-2">🧪 حسابات تجريبية</p>
              <div className="flex gap-4 justify-center text-xs">
                <span className="text-nature-green-dark dark:text-nature-green">فلاح: fellah@fact.dz / fellah123</span>
                <span className="text-nature-purple">مدير: admin@fact.dz / admin123</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}

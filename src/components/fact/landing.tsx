'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTheme } from 'next-themes'
import {
  Sprout, BarChart3, FileText, Shield, ArrowLeft,
  Tractor, Sun, ChartNoAxesCombined, Moon,
  TrendingUp, Package, Award, Gauge, LayoutDashboard,
  Users, MapPin, DollarSign, Activity, Star,
  CheckCircle, Zap, Menu, X,
  ArrowUpRight, Leaf, ArrowUpDown, Eye,
  Download, ChevronLeft, CalendarDays, Warehouse,
  Wheat, Milk, Wrench, FlaskConical, Bug,
  CircleDollarSign, Receipt, Wallet, PiggyBank,
  LineChart, PieChart, Target, BarChart2,
  RefreshCw, Bell, Calendar, AlertTriangle,
  BookOpen, Lightbulb, Info, Play
} from 'lucide-react'

/* ============================================================
   ANIMATION VARIANTS
   ============================================================ */
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const fadeInDown = {
  hidden: { opacity: 0, y: -30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const fadeInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const fadeInLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
}

const staggerSlow = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.1 },
  },
}

/* ============================================================
   COUNTER HOOK
   ============================================================ */
function useCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0)
  const startedRef = useRef(false)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  useEffect(() => {
    if (inView && !startedRef.current) {
      startedRef.current = true
      const startTime = Date.now()
      const step = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setCount(Math.floor(eased * target))
        if (progress < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }
  }, [inView, target, duration])

  return { count, ref }
}

/* ============================================================
   NAVBAR
   ============================================================ */
function Navbar() {
  const { setCurrentView } = useAppStore()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isDark = resolvedTheme === 'dark'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { label: 'دليل الاستخدام', href: '#guide' },
    { label: 'المعاملة', href: '#transactions-guide' },
    { label: 'المخزون', href: '#inventory-guide' },
    { label: 'التقارير', href: '#reports-guide' },
    { label: 'الحوكمة', href: '#governance-guide' },
  ]

  const scrollTo = (href: string) => {
    setMobileOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass shadow-lg shadow-green-500/5' : 'bg-transparent'
      }`}
    >
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all duration-500 ${
        scrolled ? 'h-14' : 'h-18'
      }`}>
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="w-10 h-10 rounded-xl green-gradient flex items-center justify-center shadow-lg shadow-green-600/30"
          >
            <Sprout className="size-6 text-white" />
          </motion.div>
          <div>
            <h1 className="text-xl font-black bg-gradient-to-l from-nature-green-dark via-green-500 to-nature-golden bg-clip-text text-transparent">
              FACT
            </h1>
            <p className="text-[10px] text-muted-foreground -mt-1 hidden sm:block">المحاسبة الفلاحية الرقمية</p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="text-sm font-medium text-muted-foreground hover:text-nature-green-dark dark:hover:text-nature-green transition-colors relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 right-0 w-0 h-0.5 green-gradient rounded-full transition-all duration-300 group-hover:w-full" />
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <motion.button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors bg-muted/50 hover:bg-muted text-foreground border border-border/50"
            aria-label="تبديل الوضع"
          >
            {isDark ? <Sun className="size-4 text-amber-500" /> : <Moon className="size-4 text-nature-purple" />}
          </motion.button>
          <Button
            variant="ghost"
            onClick={() => setCurrentView('login')}
            className="text-muted-foreground hover:text-nature-green-dark dark:hover:text-nature-green"
          >
            تسجيل الدخول
          </Button>
          <Button
            onClick={() => setCurrentView('register')}
            className="golden-gradient text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all hover:scale-105"
          >
            إنشاء حساب
            <ArrowLeft className="size-4 mr-1" />
          </Button>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-foreground">
          {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/10 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  className="block w-full text-right text-sm font-medium py-2 text-muted-foreground hover:text-nature-green-dark"
                >
                  {link.label}
                </button>
              ))}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => { setMobileOpen(false); setCurrentView('login') }} className="flex-1 border-nature-green-dark/30">
                  تسجيل الدخول
                </Button>
                <Button onClick={() => { setMobileOpen(false); setCurrentView('register') }} className="flex-1 golden-gradient text-white">
                  إنشاء حساب
                </Button>
              </div>
              <div className="flex justify-center pt-2">
                <motion.button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors bg-muted/50 hover:bg-muted text-foreground border border-border/50"
                >
                  {isDark ? <><Sun className="size-4 text-amber-500" /> الوضع النهاري</> : <><Moon className="size-4 text-nature-purple" /> الوضع الليلي</>}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

/* ============================================================
   SECTION 1: HERO
   ============================================================ */
function HeroSection() {
  const { setCurrentView } = useAppStore()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  const [subtitle, setSubtitle] = useState('')
  const fullSubtitle = 'رقمنة المحاسبة الفلاحية كآلية لتحسين حوكمة المستغلات الصغيرة في الجزائر'

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      if (i <= fullSubtitle.length) {
        setSubtitle(fullSubtitle.slice(0, i))
        i++
      } else clearInterval(interval)
    }, 30)
    return () => clearInterval(interval)
  }, [])

  const floatingCards = [
    { icon: TrendingUp, label: 'الإيرادات', value: '+23%', color: 'from-nature-green-dark to-green-600', delay: 0 },
    { icon: Package, label: 'المخزون', value: '48 عنصر', color: 'from-nature-golden to-yellow-600', delay: 0.2 },
    { icon: Award, label: 'الأداء', value: '92%', color: 'from-nature-purple to-nature-blue-red', delay: 0.4 },
  ]

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden hero-gradient">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[15%] w-[500px] h-[500px] bg-green-800/10 rounded-full blur-[100px] animate-orb-1" />
        <div className="absolute bottom-[10%] left-[10%] w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] animate-orb-2" />
        <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-purple-700/10 rounded-full blur-[80px] animate-orb-3" />
        <div className="absolute bottom-[30%] right-[30%] w-[300px] h-[300px] bg-yellow-600/8 rounded-full blur-[60px] animate-orb-2" />
      </div>
      <div className="absolute inset-0 hero-pattern pointer-events-none" />

      {/* Falling leaves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute animate-leaf" style={{ left: `${10 + i * 15}%`, animationDelay: `${i * 2.5}s`, animationDuration: `${10 + i * 2}s` }}>
            <Leaf className="size-4 text-green-400/20 dark:text-green-400/10" />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div variants={fadeInUp} className="mb-8">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-100/80 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium border border-green-200/50 dark:border-green-800/50 shadow-lg shadow-green-500/5">
              <BookOpen className="size-4 animate-bounce-gentle" />
              دليلك الشامل لاستخدام المنصة
              <Zap className="size-4 text-nature-golden" />
            </span>
          </motion.div>

          {/* Main Title */}
          <motion.div variants={fadeInUp} className="mb-2">
            <h1 className="text-7xl sm:text-8xl lg:text-9xl font-black leading-none">
              <span className="bg-gradient-to-l from-nature-green-dark via-green-400 to-nature-golden bg-clip-text text-transparent animate-gradient-shift inline-block" style={{ backgroundSize: '200% 200%' }}>
                FACT
              </span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.div variants={fadeInUp} className="mb-3">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
              منصة المحاسبة الفلاحية الرقمية
            </h2>
          </motion.div>

          {/* Typewriter */}
          <motion.div variants={fadeInUp} className="mb-10 h-16 sm:h-12 flex items-center justify-center">
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              {subtitle}
              <span className="inline-block w-0.5 h-5 bg-nature-green mr-1 animate-pulse" />
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" onClick={() => setCurrentView('register')} className="golden-gradient text-white text-lg px-10 py-7 shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all hover:scale-105 group">
              ابدأ الآن مجاناً
              <ArrowLeft className="size-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => setCurrentView('login')} className="border-2 border-nature-green-dark/30 dark:border-nature-green/30 text-nature-green-dark dark:text-nature-green text-lg px-10 py-7 hover:bg-nature-green/10 group">
              <span>لديك حساب؟ سجّل الدخول</span>
              <ArrowUpRight className="size-5 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </motion.div>

          {/* Floating Feature Cards */}
          <div className="relative max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {floatingCards.map((card, idx) => (
                <motion.div key={idx} variants={fadeInUp} transition={{ delay: card.delay + 0.5 }} whileHover={{ y: -8, scale: 1.05 }} className="group">
                  <Card className="border-0 shadow-xl glass cursor-pointer overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg shrink-0`}>
                        <card.icon className="size-6 text-white" />
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{card.label}</p>
                        <p className="text-lg font-bold text-foreground">{card.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-8 h-12 rounded-full border-2 border-nature-green/30 flex items-start justify-center pt-2">
            <div className="w-1.5 h-3 rounded-full bg-nature-green/50" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}

/* ============================================================
   SECTION 2: WELCOME GUIDE INTRO
   ============================================================ */
function WelcomeGuideIntro() {
  const sections = [
    {
      icon: ArrowUpDown,
      title: 'العمليات المالية',
      desc: 'سجّل مداخيلك من بيع المحاصيل ومصاريفك على البذور والأسمدة والري',
      color: 'from-nature-green-dark to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800/50',
    },
    {
      icon: Package,
      title: 'المخزون الفلاحي',
      desc: 'تتبع مخزونك من البذور والمحاصيل والمنتجات الحيوانية والمعدات',
      color: 'from-nature-golden to-yellow-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800/50',
    },
    {
      icon: FileText,
      title: 'التقارير',
      desc: 'أنشئ تقارير مالية مفصلة وصدّرها بصيغة PDF بضغطة زر',
      color: 'from-nature-purple to-nature-blue-red',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800/50',
    },
    {
      icon: Shield,
      title: 'مؤشرات الحوكمة',
      desc: 'راقب أداء مستغلك بـ 8 مؤشرات حوكمة محسوبة تلقائياً',
      color: 'from-nature-rose to-red-700',
      bgColor: 'bg-rose-50 dark:bg-rose-900/20',
      borderColor: 'border-rose-200 dark:border-rose-800/50',
    },
  ]

  return (
    <section id="guide" className="py-20 sm:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-50/30 to-transparent dark:via-green-950/10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={staggerContainer} className="text-center mb-16">
          <motion.div variants={fadeInUp}>
            <Badge variant="secondary" className="mb-4 text-nature-green-dark dark:text-nature-green border-nature-green/20">
              <BookOpen className="size-3 ml-1" />
              دليل الاستخدام
            </Badge>
          </motion.div>
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
            مرحباً بك في{' '}
            <span className="bg-gradient-to-l from-nature-green-dark via-green-500 to-nature-golden bg-clip-text text-transparent">
              FACT
            </span>
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
            منصة شاملة لرقمنة المحاسبة الفلاحية وتحسين حوكمة المستغلات الصغيرة في الجزائر. تعرّف على الأقسام الرئيسية للمنصة وكيفية استخدام كل جزء منها.
          </motion.p>
        </motion.div>

        {/* 4 Section Cards */}
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {sections.map((section, idx) => (
            <motion.div key={idx} variants={fadeInUp} whileHover={{ y: -8, scale: 1.03 }} transition={{ type: 'spring', stiffness: 300 }} className="group">
              <Card className={`border ${section.borderColor} shadow-lg ${section.bgColor} overflow-hidden h-full`}>
                <CardContent className="p-5 sm:p-6 text-center">
                  <motion.div
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <section.icon className="size-8 text-white" />
                  </motion.div>
                  <h3 className="text-lg font-bold mb-2">{section.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{section.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ============================================================
   SECTION 3: STEP-BY-STEP GUIDE — TRANSACTIONS
   ============================================================ */
function TransactionGuideStep() {
  const incomeCategories = [
    { label: 'بيع القمح', icon: Wheat, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'بيع الخضروات', icon: Sprout, color: 'text-green-600 dark:text-green-400' },
    { label: 'بيع الحليب', icon: Milk, color: 'text-blue-600 dark:text-blue-400' },
  ]

  const expenseCategories = [
    { label: 'بذور', icon: Wheat, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'أسمدة', icon: Bug, color: 'text-green-600 dark:text-green-400' },
    { label: 'ري', icon: Sun, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'عمالة', icon: Users, color: 'text-purple-600 dark:text-purple-400' },
    { label: 'صيانة', icon: Wrench, color: 'text-nature-olive dark:text-olive-400' },
    { label: 'نقل وتسويق', icon: Tractor, color: 'text-nature-rose dark:text-rose-400' },
  ]

  return (
    <section id="transactions-guide" className="py-20 sm:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-50/20 to-transparent dark:via-green-950/5" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={staggerContainer} className="text-center mb-16">
          <motion.div variants={fadeInUp}>
            <Badge variant="secondary" className="mb-4 text-nature-green-dark dark:text-nature-green border-nature-green/20">
              <span className="flex items-center justify-center w-6 h-6 rounded-full green-gradient text-white text-xs font-bold ml-1">1</span>
              الخطوة الأولى
            </Badge>
          </motion.div>
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
            تسجيل{' '}
            <span className="bg-gradient-to-l from-nature-green-dark to-green-500 bg-clip-text text-transparent">
              العمليات المالية
            </span>
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-muted-foreground text-lg max-w-2xl mx-auto">
            سجّل مداخيلك من بيع المحاصيل ومصاريفك على البذور والأسمدة والري — كل عملية تُضاف تُحدّث المخزون تلقائياً
          </motion.p>
        </motion.div>

        {/* Content: Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left: Explanation */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerSlow} className="space-y-6">
            {/* Income explanation */}
            <motion.div variants={fadeInRight}>
              <Card className="border-0 shadow-lg glass overflow-hidden">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nature-green-dark to-green-600 flex items-center justify-center shadow-lg">
                      <TrendingUp className="size-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-green-700 dark:text-green-400">المداخيل</h3>
                      <p className="text-xs text-muted-foreground">سجّل كل عملية بيع</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {incomeCategories.map((cat, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex items-center gap-3 p-2 rounded-lg bg-green-50/50 dark:bg-green-900/10">
                        <cat.icon className={`size-4 ${cat.color}`} />
                        <span className="text-sm">{cat.label}</span>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-green-100/50 dark:bg-green-900/20 border border-green-200/50 dark:border-green-800/30">
                    <div className="flex items-start gap-2">
                      <Info className="size-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed">
                        البيع يخصم من المخزون تلقائياً — عند تسجيل بيع القمح، كمية القمح تنقص في المخزون
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Expense explanation */}
            <motion.div variants={fadeInRight}>
              <Card className="border-0 shadow-lg glass overflow-hidden">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nature-rose to-red-700 flex items-center justify-center shadow-lg">
                      <Receipt className="size-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-rose-700 dark:text-rose-400">المصاريف</h3>
                      <p className="text-xs text-muted-foreground">سجّل كل عملية شراء</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {expenseCategories.map((cat, i) => (
                      <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex items-center gap-2 p-2 rounded-lg bg-rose-50/50 dark:bg-rose-900/10">
                        <cat.icon className={`size-3.5 ${cat.color}`} />
                        <span className="text-xs">{cat.label}</span>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-amber-100/50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/30">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                        الشراء يضيف إلى المخزون تلقائياً — عند تسجيل شراء بذور، كمية البذور تزداد في المخزون
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Right: Mockup of transaction form */}
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}>
            <Card className="border-0 shadow-2xl overflow-hidden mockup-shadow">
              {/* Browser bar */}
              <div className="h-10 bg-gradient-to-l from-nature-green-dark to-green-600 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-black/20 rounded-md px-4 py-1 text-xs text-white/70 font-mono">
                    العمليات المالية ← إضافة عملية
                  </div>
                </div>
              </div>

              {/* Form mockup */}
              <div className="p-5 sm:p-6 bg-background space-y-4">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <ArrowUpDown className="size-5 text-nature-green" />
                  إضافة عملية مالية
                </h3>

                {/* Type selector */}
                <div className="flex gap-2">
                  <div className="flex-1 py-2.5 rounded-lg green-gradient text-white text-sm font-bold text-center shadow-lg">
                    مدخول
                  </div>
                  <div className="flex-1 py-2.5 rounded-lg bg-muted text-muted-foreground text-sm font-medium text-center">
                    مصروف
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">الفئة</label>
                  <div className="p-2.5 rounded-lg bg-muted/50 border border-border/50 text-sm">
                    بيع القمح ▼
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">المبلغ</label>
                  <div className="p-2.5 rounded-lg bg-muted/50 border border-border/50 text-sm flex items-center justify-between">
                    <span>150,000</span>
                    <span className="text-xs text-muted-foreground">د.ج</span>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">التاريخ</label>
                  <div className="p-2.5 rounded-lg bg-muted/50 border border-border/50 text-sm flex items-center gap-2">
                    <CalendarDays className="size-4 text-muted-foreground" />
                    <span>2024-10-15</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">الوصف</label>
                  <div className="p-2.5 rounded-lg bg-muted/50 border border-border/50 text-sm text-muted-foreground">
                    بيع محصول القمح من الموسم الخريفي
                  </div>
                </div>

                {/* Auto-sync notice */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/30"
                >
                  <div className="flex items-center gap-2">
                    <RefreshCw className="size-4 text-amber-600 dark:text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
                    <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                      مزامنة تلقائية: سيتم خصم الكمية من مخزون القمح
                    </p>
                  </div>
                </motion.div>

                {/* Submit button */}
                <Button className="w-full golden-gradient text-white shadow-lg" size="lg">
                  حفظ العملية
                  <ArrowLeft className="size-4 mr-2" />
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   SECTION 3: STEP-BY-STEP GUIDE — INVENTORY
   ============================================================ */
function InventoryGuideStep() {
  const inventoryTypes = [
    { label: 'مدخلات الإنتاج', icon: Wheat, color: 'from-nature-green-dark to-green-600', subs: ['بذور', 'أسمدة', 'مبيدات'] },
    { label: 'محاصيل', icon: Sprout, color: 'from-nature-golden to-yellow-600', subs: ['حبوب', 'خضروات', 'فواكه'] },
    { label: 'منتجات حيوانية', icon: Milk, color: 'from-nature-purple to-nature-blue-red', subs: ['حليب', 'بيض', 'لحوم'] },
    { label: 'معدات', icon: Wrench, color: 'from-nature-rose to-red-700', subs: ['آلات', 'أدوات', 'قطع غيار'] },
    { label: 'أعلاف', icon: Leaf, color: 'from-nature-olive to-olive-600', subs: ['علف جاف', 'علف أخضر', 'مكملات'] },
    { label: 'أدوية بيطرية', icon: FlaskConical, color: 'from-pink-600 to-pink-800', subs: ['مضادات حيوية', 'مطعيمات', 'مضادات طفيليات'] },
  ]

  return (
    <section id="inventory-guide" className="py-20 sm:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-50/20 to-transparent dark:via-amber-950/5" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={staggerContainer} className="text-center mb-16">
          <motion.div variants={fadeInUp}>
            <Badge variant="secondary" className="mb-4 text-nature-golden border-nature-golden/20">
              <span className="flex items-center justify-center w-6 h-6 rounded-full golden-gradient text-white text-xs font-bold ml-1">2</span>
              الخطوة الثانية
            </Badge>
          </motion.div>
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
            إدارة{' '}
            <span className="bg-gradient-to-l from-nature-golden to-yellow-500 bg-clip-text text-transparent">
              المخزون الفلاحي
            </span>
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-muted-foreground text-lg max-w-2xl mx-auto">
            أضف أصناف مخزونك وتتبع حركتها — المخزون يتزامن تلقائياً مع العمليات المالية
          </motion.p>
        </motion.div>

        {/* Inventory Type Cards */}
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-12">
          {inventoryTypes.map((type, idx) => (
            <motion.div key={idx} variants={scaleIn} whileHover={{ y: -6, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
              <Card className="border-0 shadow-xl glass overflow-hidden h-full group cursor-default">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <type.icon className="size-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold group-hover:text-nature-green-dark dark:group-hover:text-nature-green transition-colors">
                      {type.label}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {type.subs.map((sub, si) => (
                      <span key={si} className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground border border-border/30">
                        {sub}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Sync explanation banner */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-nature-green-dark to-nature-golden shadow-lg shrink-0">
                  <RefreshCw className="size-10 text-white" />
                </div>
                <div className="text-center sm:text-right">
                  <h3 className="text-xl font-bold mb-2">مزامنة تلقائية مع العمليات</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    المخزون يتزامن تلقائياً مع العمليات المالية — عند تسجيل عملية بيع، الكمية تنقص من المخزون. وعند تسجيل عملية شراء، الكمية تزداد. يمكنك أيضاً تحديد حد التنبيه لكل صنف.
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                    <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle className="size-3.5" />
                      بيع = خصم من المخزون
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                      <CheckCircle className="size-3.5" />
                      شراء = إضافة للمخزون
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400">
                      <CheckCircle className="size-3.5" />
                      تنبيهات عند انخفاض المخزون
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}

/* ============================================================
   SECTION 3: STEP-BY-STEP GUIDE — REPORTS
   ============================================================ */
function ReportsGuideStep() {
  const reportTypes = [
    {
      icon: FileText,
      title: 'كشف حساب موسمي',
      desc: 'تقرير شامل لكل موسم فلاحي يلخص جميع العمليات المالية',
      color: 'from-nature-green-dark to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800/50',
      badge: 'موسمي',
    },
    {
      icon: PieChart,
      title: 'تقرير الربحية',
      desc: 'تحليل مفصل للربحية والهوامش لاتخاذ قرارات أفضل',
      color: 'from-nature-golden to-yellow-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800/50',
      badge: 'ربحية',
    },
    {
      icon: Award,
      title: 'شهادة أداء مالي',
      desc: 'شهادة معتمدة للأداء المالي يمكن استخدامها للقروض والاعتمادات',
      color: 'from-nature-purple to-nature-blue-red',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-800/50',
      badge: 'شهادة',
    },
    {
      icon: Shield,
      title: 'تقرير الامتثال',
      desc: 'تقرير حوكمة وامتثال يوضح مدى التزام المستغل بالمعايير',
      color: 'from-nature-rose to-red-700',
      bgColor: 'bg-rose-50 dark:bg-rose-900/20',
      borderColor: 'border-rose-200 dark:border-rose-800/50',
      badge: 'امتثال',
    },
  ]

  return (
    <section id="reports-guide" className="py-20 sm:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-50/20 to-transparent dark:via-purple-950/10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={staggerContainer} className="text-center mb-16">
          <motion.div variants={fadeInUp}>
            <Badge variant="secondary" className="mb-4 text-nature-purple border-nature-purple/20">
              <span className="flex items-center justify-center w-6 h-6 rounded-full purple-gradient text-white text-xs font-bold ml-1">3</span>
              الخطوة الثالثة
            </Badge>
          </motion.div>
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
            إنشاء{' '}
            <span className="bg-gradient-to-l from-nature-purple via-purple-500 to-nature-blue-red bg-clip-text text-transparent">
              التقارير
            </span>
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-muted-foreground text-lg max-w-2xl mx-auto">
            أنشئ تقارير مالية احترافية بنقرة واحدة وصدّرها بصيغة PDF
          </motion.p>
        </motion.div>

        {/* Report type cards */}
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 mb-12">
          {reportTypes.map((report, idx) => (
            <motion.div key={idx} variants={fadeInUp} whileHover={{ y: -6, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
              <Card className={`border ${report.borderColor} shadow-lg ${report.bgColor} overflow-hidden h-full`}>
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${report.color} flex items-center justify-center shadow-lg shrink-0`}>
                      <report.icon className="size-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold">{report.title}</h3>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{report.badge}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{report.desc}</p>
                    </div>
                  </div>

                  {/* Mini visual */}
                  <div className="mt-4 p-3 rounded-lg bg-white/50 dark:bg-black/20 border border-border/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-muted-foreground">معاينة التقرير</span>
                      <Download className="size-3 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      {[1, 2, 3].map((line) => (
                        <motion.div
                          key={line}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${60 + line * 12}%` }}
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.15 + line * 0.1, duration: 0.6 }}
                          className="h-1.5 rounded-full bg-gradient-to-l from-muted-foreground/10 to-muted-foreground/25"
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* PDF Export highlight */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <Card className="border-0 shadow-xl glass overflow-hidden">
            <CardContent className="p-6 sm:p-8 text-center">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg"
              >
                <Download className="size-8 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold mb-2">تصدير PDF بنقرة واحدة</h3>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                جميع التقارير قابلة للتصدير بصيغة PDF احترافية — يمكنك حفظها أو مشاركتها مع الجهات المعنية كالبنوك والوكالات الحكومية
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}

/* ============================================================
   SECTION 3: STEP-BY-STEP GUIDE — GOVERNANCE
   ============================================================ */
function GovernanceGuideStep() {
  const kpis = [
    { name: 'معدل الربحية', icon: TrendingUp, color: 'text-green-600 dark:text-green-400' },
    { name: 'نسبة المصاريف', icon: Receipt, color: 'text-rose-600 dark:text-rose-400' },
    { name: 'معدل دوران المخزون', icon: RefreshCw, color: 'text-amber-600 dark:text-amber-400' },
    { name: 'نسبة الاكتفاء الذاتي', icon: Target, color: 'text-purple-600 dark:text-purple-400' },
    { name: 'مؤشر السيولة', icon: Wallet, color: 'text-blue-600 dark:text-blue-400' },
    { name: 'معدل نمو الإيرادات', icon: LineChart, color: 'text-teal-600 dark:text-teal-400' },
    { name: 'نسبة الامتثال', icon: Shield, color: 'text-nature-olive dark:text-olive-400' },
    { name: 'مؤشر الحوكمة العام', icon: Gauge, color: 'text-nature-golden dark:text-amber-400' },
  ]

  return (
    <section id="governance-guide" className="py-20 sm:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-rose-50/20 to-transparent dark:via-rose-950/5" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={staggerContainer} className="text-center mb-16">
          <motion.div variants={fadeInUp}>
            <Badge variant="secondary" className="mb-4 text-nature-rose border-nature-rose/20">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-nature-rose to-red-700 text-white text-xs font-bold ml-1">4</span>
              الخطوة الرابعة
            </Badge>
          </motion.div>
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
            متابعة{' '}
            <span className="bg-gradient-to-l from-nature-rose to-red-500 bg-clip-text text-transparent">
              الحوكمة
            </span>
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-muted-foreground text-lg max-w-2xl mx-auto">
            8 مؤشرات أداء رئيسية محسوبة تلقائياً — راقب رادار الحوكمة والرسوم البيانية الديناميكية
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left: KPI Grid */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <div className="grid grid-cols-2 gap-3">
              {kpis.map((kpi, idx) => (
                <motion.div key={idx} variants={scaleIn} whileHover={{ scale: 1.05, y: -2 }}>
                  <Card className="border-0 shadow-lg glass overflow-hidden">
                    <CardContent className="p-4 flex items-center gap-3">
                      <kpi.icon className={`size-5 ${kpi.color}`} />
                      <span className="text-xs font-medium">{kpi.name}</span>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Governance Radar mockup */}
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.3 }}>
            <Card className="border-0 shadow-2xl overflow-hidden mockup-shadow">
              <div className="h-10 bg-gradient-to-l from-nature-rose to-red-700 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-black/20 rounded-md px-4 py-1 text-xs text-white/70 font-mono">
                    رادار الحوكمة
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6 bg-background">
                <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                  <Gauge className="size-5 text-nature-rose" />
                  رادار الحوكمة
                </h3>

                {/* Radar SVG */}
                <div className="flex justify-center mb-6">
                  <svg width="220" height="220" viewBox="0 0 220 220" className="overflow-visible">
                    {/* Radar circles */}
                    {[0.25, 0.5, 0.75, 1].map((r, i) => (
                      <circle key={i} cx="110" cy="110" r={90 * r} fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted/30" />
                    ))}
                    {/* Radar axes */}
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                      <line key={i} x1="110" y1="110" x2={110 + 90 * Math.cos((angle * Math.PI) / 180)} y2={110 + 90 * Math.sin((angle * Math.PI) / 180)} stroke="currentColor" strokeWidth="0.5" className="text-muted/20" />
                    ))}
                    {/* Data polygon */}
                    <motion.polygon
                      points={(() => {
                        const values = [0.85, 0.72, 0.65, 0.9, 0.78, 0.82, 0.7, 0.88]
                        return values.map((v, i) => {
                          const angle = (i * 45 - 90) * Math.PI / 180
                          return `${110 + 90 * v * Math.cos(angle)},${110 + 90 * v * Math.sin(angle)}`
                        }).join(' ')
                      })()}
                      fill="rgba(198, 40, 40, 0.15)"
                      stroke="#c62828"
                      strokeWidth="2"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                    {/* Data points */}
                    {(() => {
                      const values = [0.85, 0.72, 0.65, 0.9, 0.78, 0.82, 0.7, 0.88]
                      return values.map((v, i) => {
                        const angle = (i * 45 - 90) * Math.PI / 180
                        return (
                          <motion.circle
                            key={i}
                            cx={110 + 90 * v * Math.cos(angle)}
                            cy={110 + 90 * v * Math.sin(angle)}
                            r="3"
                            fill="#c62828"
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.8 + i * 0.1, type: 'spring', stiffness: 300 }}
                          />
                        )
                      })
                    })()}
                    {/* Labels */}
                    {(() => {
                      const labels = ['الربحية', 'المصاريف', 'المخزون', 'الاكتفاء', 'السيولة', 'النمو', 'الامتثال', 'الحوكمة']
                      return labels.map((label, i) => {
                        const angle = (i * 45 - 90) * Math.PI / 180
                        const r = 105
                        return (
                          <text key={i} x={110 + r * Math.cos(angle)} y={110 + r * Math.sin(angle)} textAnchor="middle" dominantBaseline="middle" className="text-[8px] fill-muted-foreground">
                            {label}
                          </text>
                        )
                      })
                    })()}
                  </svg>
                </div>

                {/* Governance score */}
                <div className="text-center p-4 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200/50 dark:border-rose-800/30">
                  <p className="text-xs text-muted-foreground mb-1">مؤشر الحوكمة العام</p>
                  <motion.p
                    className="text-3xl font-black text-nature-rose"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1 }}
                  >
                    78%
                  </motion.p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">↑ +5% عن الموسم السابق</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   SECTION 4: INTERACTIVE DEMO PREVIEW (DASHBOARD)
   ============================================================ */
function DashboardPreviewSection() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const parallaxY = useTransform(scrollYProgress, [0, 1], [60, -60])

  return (
    <section id="preview" className="py-20 sm:py-28 relative overflow-hidden" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={staggerContainer} className="text-center mb-14">
          <motion.div variants={fadeInUp}>
            <Badge variant="secondary" className="mb-4 text-nature-purple border-nature-purple/20">
              <LayoutDashboard className="size-3 ml-1" />
              لوحة القيادة
            </Badge>
          </motion.div>
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
            معاينة{' '}
            <span className="bg-gradient-to-l from-nature-purple via-purple-500 to-nature-blue-red bg-clip-text text-transparent">
              لوحة القيادة
            </span>
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-muted-foreground text-lg max-w-2xl mx-auto">
            واجهة شاملة تجمع كل المؤشرات والرسوم البيانية في مكان واحد
          </motion.p>
        </motion.div>

        {/* Dashboard Mockup */}
        <motion.div initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.8 }} className="relative">
          <motion.div style={{ y: parallaxY }} className="mockup-shadow rounded-2xl overflow-hidden bg-card border border-border/50">
            {/* Top bar */}
            <div className="h-10 bg-gradient-to-l from-nature-green-dark to-green-600 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-black/20 rounded-md px-4 py-1 text-xs text-white/70 font-mono">
                  fact.dz/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="p-4 sm:p-6 bg-background">
              <div className="flex gap-4">
                {/* Mini sidebar */}
                <div className="hidden sm:flex flex-col w-12 bg-muted/50 rounded-xl p-2 gap-2">
                  {[Sprout, BarChart3, Package, FileText, Gauge].map((Icon, i) => (
                    <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center ${i === 0 ? 'green-gradient text-white shadow' : 'text-muted-foreground hover:bg-muted'}`}>
                      <Icon className="size-4" />
                    </div>
                  ))}
                </div>

                {/* Main area */}
                <div className="flex-1 space-y-4">
                  {/* Welcome bar */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">مرحباً، أحمد 👋</p>
                      <p className="text-sm font-bold">لوحة القيادة</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-[10px] text-green-700 dark:text-green-300 font-medium">
                        موسم الخريف 2024
                      </div>
                    </div>
                  </div>

                  {/* KPI cards row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {[
                      { label: 'إجمالي الإيرادات', value: '2,400,000 د.ج', change: '+12%', c: 'text-green-600 dark:text-green-400' },
                      { label: 'إجمالي المصاريف', value: '1,800,000 د.ج', change: '-5%', c: 'text-red-500' },
                      { label: 'صافي الربح', value: '600,000 د.ج', change: '+23%', c: 'text-green-600 dark:text-green-400' },
                      { label: 'معدل الربحية', value: '25%', change: '+3%', c: 'text-amber-600 dark:text-amber-400' },
                    ].map((kpi, i) => (
                      <div key={i} className="bg-card rounded-xl p-3 border border-border/50 shadow-sm">
                        <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                        <p className="text-sm font-bold mt-0.5">{kpi.value}</p>
                        <span className={`text-[10px] font-medium ${kpi.c}`}>{kpi.change}</span>
                      </div>
                    ))}
                  </div>

                  {/* Charts row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 bg-card rounded-xl p-3 border border-border/50 shadow-sm">
                      <p className="text-xs font-bold mb-2">الإيرادات والمصاريف الشهرية</p>
                      <div className="flex items-end gap-1 h-20">
                        {[60, 45, 70, 50, 85, 65, 75, 90, 55, 80, 70, 95].map((h, i) => (
                          <div key={i} className="flex-1 flex flex-col gap-0.5 items-center">
                            <div className="w-full rounded-t bg-gradient-to-t from-green-500/70 to-green-400/40" style={{ height: `${h}%` }} />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-card rounded-xl p-3 border border-border/50 shadow-sm">
                      <p className="text-xs font-bold mb-2">توزيع المصاريف</p>
                      <div className="space-y-2 mt-3">
                        {[
                          { label: 'بذور', pct: 35, c: 'bg-green-500' },
                          { label: 'أسمدة', pct: 25, c: 'bg-amber-500' },
                          { label: 'عمالة', pct: 30, c: 'bg-purple-500' },
                          { label: 'أخرى', pct: 10, c: 'bg-rose-500' },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${item.c}`} />
                            <span className="text-[10px] text-muted-foreground flex-1">{item.label}</span>
                            <span className="text-[10px] font-bold">{item.pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Governance index */}
                  <div className="bg-card rounded-xl p-3 border border-border/50 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold">مؤشر الحوكمة</p>
                      <span className="text-xs text-green-600 dark:text-green-400 font-bold">78%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} whileInView={{ width: '78%' }} viewport={{ once: true }} transition={{ duration: 1.5, ease: 'easeOut' }} className="h-full rounded-full bg-gradient-to-l from-nature-green-dark to-green-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Floating cards */}
          <motion.div initial={{ opacity: 0, x: 60 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.5, duration: 0.6 }} className="absolute -left-4 top-1/3 hidden lg:block">
            <Card className="border-0 shadow-xl glass w-44 animate-float">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="size-4 text-green-500" />
                  <span className="text-xs font-bold">صافي الربح</span>
                </div>
                <p className="text-lg font-black text-green-600 dark:text-green-400">+23%</p>
                <p className="text-[10px] text-muted-foreground">مقارنة بالموسم السابق</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -60 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.7, duration: 0.6 }} className="absolute -right-4 top-1/2 hidden lg:block">
            <Card className="border-0 shadow-xl glass w-44" style={{ animation: 'float 3s ease-in-out 0.5s infinite' }}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="size-4 text-purple-500" />
                  <span className="text-xs font-bold">الحوكمة</span>
                </div>
                <p className="text-lg font-black text-purple-600 dark:text-purple-400">78%</p>
                <p className="text-[10px] text-muted-foreground">مؤشر أداء الحوكمة</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

/* ============================================================
   SECTION 5: SEASON SELECTOR EXPLANATION
   ============================================================ */
function SeasonExplanation() {
  return (
    <section className="py-20 sm:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-50/15 to-transparent dark:via-amber-950/5" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={staggerContainer} className="text-center mb-14">
          <motion.div variants={fadeInUp}>
            <Badge variant="secondary" className="mb-4 text-nature-olive border-nature-olive/20">
              <CalendarDays className="size-3 ml-1" />
              المواسم الفلاحية
            </Badge>
          </motion.div>
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
            تصنيف حسب{' '}
            <span className="bg-gradient-to-l from-nature-olive to-olive-500 bg-clip-text text-transparent">
              المواسم الفلاحية
            </span>
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-muted-foreground text-lg max-w-2xl mx-auto">
            جميع البيانات مصنفة حسب المواسم — يمكنك التنقل بين المواسم ومقارنة الأداء
          </motion.p>
        </motion.div>

        {/* Season selector mockup */}
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
          <Card className="border-0 shadow-2xl overflow-hidden mockup-shadow max-w-2xl mx-auto">
            <CardContent className="p-6 sm:p-8">
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold mb-2">اختر الموسم الفلاحي</h3>
                <p className="text-sm text-muted-foreground">كل موسم يحتوي على بياناته المستقلة</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Autumn */}
                <motion.div whileHover={{ scale: 1.03, y: -2 }} className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 shadow-lg cursor-pointer relative">
                  <div className="absolute top-2 left-2">
                    <CheckCircle className="size-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sun className="size-5 text-amber-600 dark:text-amber-400" />
                    <span className="font-bold text-amber-700 dark:text-amber-300">الخريف</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">الإيرادات</span>
                      <span className="font-bold text-green-600 dark:text-green-400">2.4م د.ج</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">المصاريف</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">1.8م د.ج</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">الربح</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">0.6م د.ج</span>
                    </div>
                  </div>
                </motion.div>

                {/* Spring */}
                <motion.div whileHover={{ scale: 1.03, y: -2 }} className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 shadow cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <Sprout className="size-5 text-green-600 dark:text-green-400" />
                    <span className="font-bold text-green-700 dark:text-green-300">الربيع</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">الإيرادات</span>
                      <span className="font-bold text-green-600 dark:text-green-400">1.8م د.ج</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">المصاريف</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">1.2م د.ج</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">الربح</span>
                      <span className="font-bold text-green-600 dark:text-green-400">0.6م د.ج</span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Year selector */}
              <div className="flex items-center justify-center gap-3 p-3 rounded-lg bg-muted/50">
                <ChevronLeft className="size-4 text-muted-foreground" />
                <span className="font-bold text-lg">2024</span>
                <ChevronLeft className="size-4 text-muted-foreground rotate-180" />
              </div>

              <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/30">
                <div className="flex items-start gap-2">
                  <Lightbulb className="size-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                    عند تغيير الموسم، تتغير جميع البيانات تلقائياً — العمليات، المخزون، التقارير، ومؤشرات الحوكمة
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}

/* ============================================================
   SECTION 6: STATS COUNTER
   ============================================================ */
interface PlatformStats {
  totalFarms: number
  totalTransactions: number
  totalFarmers: number
  totalWilayas: number
  totalIncome: number
  totalExpense: number
  netProfit: number
  avgProfitability: number
}

const defaultStats: PlatformStats = {
  totalFarms: 0, totalTransactions: 0, totalFarmers: 0,
  totalWilayas: 0, totalIncome: 0, totalExpense: 0,
  netProfit: 0, avgProfitability: 0,
}

function StatCard({ stat, idx }: { stat: { icon: any; value: number; suffix: string; label: string; color: string }; idx: number }) {
  const { count, ref } = useCounter(stat.value, 2000 + idx * 300)
  return (
    <motion.div ref={ref} variants={fadeInUp} whileHover={{ y: -6, scale: 1.03 }} transition={{ type: 'spring', stiffness: 300 }}>
      <Card className="border-0 shadow-xl glass overflow-hidden group cursor-default">
        <CardContent className="p-5 sm:p-6 text-center">
          <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <stat.icon className="size-7 text-white" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-foreground mb-1 animate-counter-glow">
            {stat.suffix === '%' ? `${count}${stat.suffix}` : `${count.toLocaleString('en-US')}${stat.suffix}`}
          </div>
          <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function StatsSection() {
  const [platformStats, setPlatformStats] = useState<PlatformStats>(defaultStats)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(data => { if (data.success) setPlatformStats(data.data) })
      .catch(() => {})
  }, [])

  const stats = [
    { icon: Users, value: platformStats.totalFarmers || 5, suffix: '+', label: 'مستغل فلاحي', color: 'from-nature-green-dark to-green-600' },
    { icon: DollarSign, value: platformStats.totalTransactions || 0, suffix: '+', label: 'عملية مالية', color: 'from-nature-golden to-yellow-600' },
    { icon: MapPin, value: platformStats.totalWilayas || 48, suffix: '', label: 'ولاية جزائرية', color: 'from-nature-purple to-nature-blue-red' },
    { icon: Activity, value: Math.round(platformStats.avgProfitability || 95), suffix: '%', label: 'نسبة الربحية', color: 'from-nature-rose to-red-700' },
  ]

  return (
    <section className="relative py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-50/20 to-transparent dark:via-amber-950/5" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={staggerContainer} className="text-center mb-12">
          <motion.div variants={fadeInUp}>
            <Badge variant="secondary" className="mb-4 text-nature-golden border-nature-golden/20">
              <BarChart2 className="size-3 ml-1" />
              أرقام المنصة
            </Badge>
          </motion.div>
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-black mb-4">
            FACT في{' '}
            <span className="text-nature-golden">أرقام</span>
          </motion.h2>
        </motion.div>

        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, idx) => (
            <StatCard key={idx} stat={stat} idx={idx} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ============================================================
   SECTION 7: CTA FOOTER
   ============================================================ */
function CTASection() {
  const { setCurrentView } = useAppStore()

  return (
    <section className="py-20 sm:py-28 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.7 }}>
          <Card className="border-0 shadow-2xl overflow-hidden">
            <div className="cta-bg p-8 sm:p-14 text-center text-white relative overflow-hidden">
              {/* Animated background */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-8 right-[10%] w-40 h-40 border border-white/10 rounded-full animate-orb-1" />
                <div className="absolute bottom-8 left-[10%] w-32 h-32 border border-white/8 rounded-full animate-orb-2" />
                <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-white/5 rounded-full animate-orb-3" />
                <div className="absolute top-[20%] right-[30%] w-2 h-2 bg-green-400/40 rounded-full animate-bounce-gentle" />
                <div className="absolute bottom-[30%] left-[20%] w-3 h-3 bg-amber-400/30 rounded-full animate-bounce-gentle" style={{ animationDelay: '1s' }} />
              </div>

              <div className="relative z-10">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="mb-6">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm border border-white/10">
                    <Sprout className="size-4" />
                    ابدأ رحلتك نحو حوكمة أفضل
                  </span>
                </motion.div>

                <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 leading-tight">
                  ابدأ رحلتك نحو
                  <br />
                  <span className="text-nature-golden-light">حوكمة أفضل</span>
                </motion.h2>

                <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="text-green-100/80 text-lg mb-8 max-w-2xl mx-auto">
                  انضم إلى المستغلين الفلاحيين الذين يحسنون حوكمة مستغلاتهم باستخدام FACT — مجاناً تماماً
                </motion.p>

                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }} className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                  <Button size="lg" onClick={() => setCurrentView('register')} className="golden-gradient text-white text-lg px-10 py-7 shadow-xl shadow-black/20 hover:scale-105 transition-transform group">
                    ابدأ الآن مجاناً
                    <ArrowLeft className="size-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => setCurrentView('login')} className="border-2 border-white/20 text-white hover:bg-white/10 text-lg px-10 py-7">
                    لديك حساب؟ سجّل الدخول
                  </Button>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.7 }} className="flex flex-wrap items-center justify-center gap-4 text-sm text-white/50">
                  <div className="flex items-center gap-1.5"><CheckCircle className="size-4" /><span>مجاني بالكامل</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle className="size-4" /><span>بدون بطاقة ائتمان</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle className="size-4" /><span>إعداد في دقائق</span></div>
                </motion.div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}

/* ============================================================
   FOOTER
   ============================================================ */
function Footer() {
  const { setCurrentView } = useAppStore()

  const footerLinks = [
    {
      title: 'المنصة',
      links: [
        { label: 'العمليات المالية', href: '#transactions-guide' },
        { label: 'المخزون', href: '#inventory-guide' },
        { label: 'التقارير', href: '#reports-guide' },
        { label: 'الحوكمة', href: '#governance-guide' },
      ],
    },
    {
      title: 'الدعم',
      links: [
        { label: 'مركز المساعدة', href: '#' },
        { label: 'الأسئلة الشائعة', href: '#' },
        { label: 'تواصل معنا', href: '#' },
        { label: 'الدليل', href: '#guide' },
      ],
    },
    {
      title: 'الشركة',
      links: [
        { label: 'من نحن', href: '#' },
        { label: 'المدونة', href: '#' },
        { label: 'الشروط', href: '#' },
        { label: 'الخصوصية', href: '#' },
      ],
    },
  ]

  return (
    <footer className="mt-auto border-t border-border/50 bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl green-gradient flex items-center justify-center shadow-lg shadow-green-600/20">
                <Sprout className="size-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black bg-gradient-to-l from-nature-green-dark via-green-500 to-nature-golden bg-clip-text text-transparent">FACT</h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              النموذج الرقمي المقترح لرقمنة المحاسبة الفلاحية كآلية لتحسين حوكمة المستغلات الصغيرة في الجزائر
            </p>
            <Button size="sm" onClick={() => setCurrentView('register')} className="golden-gradient text-white text-xs">
              ابدأ الآن
            </Button>
          </div>

          {footerLinks.map((group, idx) => (
            <div key={idx}>
              <h4 className="font-bold text-sm mb-3">{group.title}</h4>
              <ul className="space-y-2">
                {group.links.map((link, li) => (
                  <li key={li}>
                    <a href={link.href} className="text-sm text-muted-foreground hover:text-nature-green-dark dark:hover:text-nature-green transition-colors">{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2024 FACT — منصة المحاسبة الفلاحية الرقمية. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">صُنع بـ</span>
            <Heart className="size-3 text-nature-rose" />
            <span className="text-xs text-muted-foreground">في الجزائر</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

function Heart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

/* ============================================================
   MAIN LANDING COMPONENT
   ============================================================ */
export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <WelcomeGuideIntro />
        <TransactionGuideStep />
        <InventoryGuideStep />
        <ReportsGuideStep />
        <GovernanceGuideStep />
        <DashboardPreviewSection />
        <SeasonExplanation />
        <StatsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}

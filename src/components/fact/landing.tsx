'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Sprout, BarChart3, FileText, Shield, ArrowLeft,
  Tractor, Sun, ChartNoAxesCombined,
  TrendingUp, Package, Award, Gauge, LayoutDashboard,
  Users, MapPin, DollarSign, Activity, Star, Quote,
  CheckCircle, Zap, Globe, Phone, Mail, Menu, X,
  ArrowUpRight, CircleDot, Leaf
} from 'lucide-react'

/* ============================================================
   ANIMATION VARIANTS
   ============================================================ */
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
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
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { label: 'المميزات', href: '#features' },
    { label: 'كيف تعمل', href: '#how-it-works' },
    { label: 'المنصة', href: '#preview' },
    { label: 'الآراء', href: '#testimonials' },
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
        scrolled
          ? 'glass shadow-lg shadow-green-500/5'
          : 'bg-transparent'
      }`}
    >
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all duration-500 ${
        scrolled ? 'h-14' : 'h-18'
      }`}>
        {/* Logo */}
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

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
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

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-3">
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

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-foreground"
        >
          {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
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
                <Button
                  variant="outline"
                  onClick={() => { setMobileOpen(false); setCurrentView('login') }}
                  className="flex-1 border-nature-green-dark/30"
                >
                  تسجيل الدخول
                </Button>
                <Button
                  onClick={() => { setMobileOpen(false); setCurrentView('register') }}
                  className="flex-1 golden-gradient text-white"
                >
                  إنشاء حساب
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

/* ============================================================
   HERO SECTION
   ============================================================ */
function HeroSection() {
  const { setCurrentView } = useAppStore()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  // Typewriter effect
  const [subtitle, setSubtitle] = useState('')
  const fullSubtitle = 'رقمنة المحاسبة الفلاحية كآلية لتحسين حوكمة المستغلات الصغيرة في الجزائر'

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      if (i <= fullSubtitle.length) {
        setSubtitle(fullSubtitle.slice(0, i))
        i++
      } else {
        clearInterval(interval)
      }
    }, 30)
    return () => clearInterval(interval)
  }, [])

  // Floating cards data
  const floatingCards = [
    { icon: TrendingUp, label: 'الإيرادات', value: '+٢٣٪', color: 'from-green-500 to-emerald-600', delay: 0 },
    { icon: Package, label: 'المخزون', value: '٤٨ عنصر', color: 'from-amber-500 to-orange-600', delay: 0.2 },
    { icon: Award, label: 'الأداء', value: '٩٢٪', color: 'from-purple-500 to-indigo-600', delay: 0.4 },
  ]

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden hero-gradient">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[15%] w-[500px] h-[500px] bg-green-400/15 rounded-full blur-[100px] animate-orb-1" />
        <div className="absolute bottom-[10%] left-[10%] w-[600px] h-[600px] bg-amber-400/10 rounded-full blur-[120px] animate-orb-2" />
        <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-purple-400/10 rounded-full blur-[80px] animate-orb-3" />
        <div className="absolute bottom-[30%] right-[30%] w-[300px] h-[300px] bg-green-300/8 rounded-full blur-[60px] animate-orb-2" />
      </div>

      {/* Dot pattern overlay */}
      <div className="absolute inset-0 hero-pattern pointer-events-none" />

      {/* Falling leaves decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-leaf"
            style={{
              left: `${10 + i * 15}%`,
              animationDelay: `${i * 2.5}s`,
              animationDuration: `${10 + i * 2}s`,
            }}
          >
            <Leaf className="size-4 text-green-400/20 dark:text-green-400/10" />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <motion.div
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16"
      >
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div variants={fadeInUp} className="mb-8">
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-100/80 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium border border-green-200/50 dark:border-green-800/50 shadow-lg shadow-green-500/5">
              <Sprout className="size-4 animate-bounce-gentle" />
              النموذج الرقمي لحوكمة المستغلات الفلاحية في الجزائر
              <Zap className="size-4 text-nature-golden" />
            </span>
          </motion.div>

          {/* Main Title */}
          <motion.div variants={fadeInUp} className="mb-2">
            <h1 className="text-7xl sm:text-8xl lg:text-9xl font-black leading-none">
              <span className="bg-gradient-to-l from-nature-green-dark via-green-400 to-nature-golden bg-clip-text text-transparent animate-gradient-shift inline-block"
                style={{ backgroundSize: '200% 200%' }}>
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

          {/* Typewriter description */}
          <motion.div variants={fadeInUp} className="mb-10 h-16 sm:h-12 flex items-center justify-center">
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              {subtitle}
              <span className="inline-block w-0.5 h-5 bg-nature-green mr-1 animate-pulse" />
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              onClick={() => setCurrentView('register')}
              className="golden-gradient text-white text-lg px-10 py-7 shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all hover:scale-105 group"
            >
              ابدأ الآن مجاناً
              <ArrowLeft className="size-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setCurrentView('login')}
              className="border-2 border-nature-green-dark/30 dark:border-nature-green/30 text-nature-green-dark dark:text-nature-green text-lg px-10 py-7 hover:bg-nature-green/10 group"
            >
              <span>لديك حساب؟ سجّل الدخول</span>
              <ArrowUpRight className="size-5 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          </motion.div>

          {/* Floating Feature Cards */}
          <div className="relative max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {floatingCards.map((card, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeInUp}
                  transition={{ delay: card.delay + 0.5 }}
                  whileHover={{ y: -8, scale: 1.05 }}
                  className="group"
                >
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-8 h-12 rounded-full border-2 border-nature-green/30 flex items-start justify-center pt-2"
          >
            <div className="w-1.5 h-3 rounded-full bg-nature-green/50" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}

/* ============================================================
   STATS SECTION
   ============================================================ */
const stats = [
  { icon: Users, value: 500, suffix: '+', label: 'مستغل فلاحي', color: 'from-green-500 to-emerald-600' },
  { icon: DollarSign, value: 10000, suffix: '+', label: 'عملية مالية', color: 'from-amber-500 to-orange-600' },
  { icon: MapPin, value: 48, suffix: '', label: 'ولاية جزائرية', color: 'from-purple-500 to-indigo-600' },
  { icon: Activity, value: 95, suffix: '٪', label: 'نسبة الرضا', color: 'from-rose-500 to-red-600' },
]

/* ============================================================
   STAT CARD COMPONENT
   ============================================================ */
function StatCard({ stat, idx }: { stat: typeof stats[0]; idx: number }) {
  const { count, ref } = useCounter(stat.value, 2000 + idx * 300)
  return (
    <motion.div
      ref={ref}
      variants={fadeInUp}
      whileHover={{ y: -6, scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card className="border-0 shadow-xl glass overflow-hidden group cursor-default">
        <CardContent className="p-5 sm:p-6 text-center">
          <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <stat.icon className="size-7 text-white" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-foreground mb-1 animate-counter-glow">
            {stat.suffix === '٪' ? `${count}${stat.suffix}` : `${count.toLocaleString('ar-SA')}${stat.suffix}`}
          </div>
          <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function StatsSection() {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-50/30 to-transparent dark:via-green-950/10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {stats.map((stat, idx) => (
            <StatCard key={idx} stat={stat} idx={idx} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ============================================================
   FEATURES BENTO GRID
   ============================================================ */
const features = [
  {
    icon: BarChart3,
    title: 'تسجيل المداخيل والمصاريف',
    desc: 'تتبع جميع عملياتك المالية بدقة وسهولة مع تصنيف ذكي وتقسيم حسب المواسم الفلاحية',
    color: 'from-green-500 to-emerald-600',
    span: 'sm:col-span-2',
    visual: 'chart',
  },
  {
    icon: Package,
    title: 'تتبع المخزون الفلاحي',
    desc: 'إدارة مخزونك من البذور والأسمدة والمنتجات بكفاءة عالية',
    color: 'from-amber-500 to-orange-600',
    span: '',
    visual: 'inventory',
  },
  {
    icon: FileText,
    title: 'التقارير المالية',
    desc: 'تقارير مفصلة لأنواع مختلفة مع إمكانية التصدير',
    color: 'from-purple-500 to-indigo-600',
    span: '',
    visual: 'report',
  },
  {
    icon: LayoutDashboard,
    title: 'لوحة قيادة الحوكمة',
    desc: 'مؤشرات أداء رئيسية ولوحات تحكم شاملة لاتخاذ قرارات أفضل',
    color: 'from-rose-500 to-red-600',
    span: 'sm:col-span-2',
    visual: 'dashboard',
  },
  {
    icon: Gauge,
    title: 'مؤشرات الأداء',
    desc: '٨ مؤشرات أداء رئيسية محسوبة تلقائياً',
    color: 'from-cyan-500 to-teal-600',
    span: '',
    visual: 'gauge',
  },
  {
    icon: Award,
    title: 'شهادات الأداء المالي',
    desc: 'شهادات أداء مالي معتمدة لتحسين الحوكمة',
    color: 'from-nature-golden to-yellow-600',
    span: '',
    visual: 'certificate',
  },
]

function MiniChart() {
  const bars = [40, 65, 45, 80, 55, 90, 70, 85, 60, 95]
  return (
    <div className="flex items-end gap-1 h-20 mt-3">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          whileInView={{ height: `${h}%` }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.06, duration: 0.5, ease: 'easeOut' }}
          className="flex-1 rounded-t bg-gradient-to-t from-green-500/60 to-green-400/30 dark:from-green-400/40 dark:to-green-300/20 min-w-[6px]"
        />
      ))}
    </div>
  )
}

function MiniInventory() {
  const items = [
    { name: 'بذور', pct: 75, color: 'bg-green-500' },
    { name: 'أسمدة', pct: 50, color: 'bg-amber-500' },
    { name: 'منتجات', pct: 90, color: 'bg-purple-500' },
  ]
  return (
    <div className="space-y-2 mt-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-10">{item.name}</span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${item.pct}%` }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className={`h-full rounded-full ${item.color}`}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{item.pct}%</span>
        </div>
      ))}
    </div>
  )
}

function MiniGauge() {
  return (
    <div className="flex justify-center mt-3">
      <svg width="80" height="50" viewBox="0 0 80 50" className="overflow-visible">
        <path d="M 10 45 A 35 35 0 0 1 70 45" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/30" strokeLinecap="round" />
        <motion.path
          d="M 10 45 A 35 35 0 0 1 70 45"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 0.78 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#d4a017" />
          </linearGradient>
        </defs>
        <text x="40" y="42" textAnchor="middle" className="text-xs font-bold fill-foreground">٧٨٪</text>
      </svg>
    </div>
  )
}

function FeatureVisual({ type }: { type: string }) {
  switch (type) {
    case 'chart': return <MiniChart />
    case 'inventory': return <MiniInventory />
    case 'gauge': return <MiniGauge />
    case 'dashboard': return <MiniDashboard />
    case 'report': return <MiniReport />
    case 'certificate': return <MiniCertificate />
    default: return null
  }
}

function MiniDashboard() {
  return (
    <div className="grid grid-cols-3 gap-2 mt-3">
      {[
        { label: 'الإيرادات', val: '٢.٤م', c: 'bg-green-500/20 text-green-600 dark:text-green-400' },
        { label: 'المصاريف', val: '١.٨م', c: 'bg-red-500/20 text-red-600 dark:text-red-400' },
        { label: 'الربح', val: '٠.٦م', c: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' },
      ].map((k, i) => (
        <div key={i} className={`rounded-lg p-2 text-center ${k.c}`}>
          <p className="text-[10px] opacity-70">{k.label}</p>
          <p className="text-sm font-bold">{k.val}</p>
        </div>
      ))}
    </div>
  )
}

function MiniReport() {
  return (
    <div className="mt-3 space-y-1.5">
      {['تقرير المواسم', 'تقرير مالي', 'تقرير الأداء'].map((r, i) => (
        <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="size-3 text-purple-500" />
          <span>{r}</span>
          <span className="mr-auto text-[10px] opacity-50">PDF</span>
        </div>
      ))}
    </div>
  )
}

function MiniCertificate() {
  return (
    <div className="mt-3 flex justify-center">
      <div className="relative w-24 h-16 border-2 border-dashed border-nature-golden/40 rounded-lg flex items-center justify-center">
        <Award className="size-8 text-nature-golden/60" />
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-nature-golden/40" />
        <div className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-nature-golden/40" />
      </div>
    </div>
  )
}

function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
          className="text-center mb-14"
        >
          <motion.div variants={fadeInUp}>
            <Badge variant="secondary" className="mb-4 text-nature-green-dark dark:text-nature-green border-nature-green/20">
              <Zap className="size-3 ml-1" />
              المميزات
            </Badge>
          </motion.div>
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
            كل ما تحتاجه في{' '}
            <span className="bg-gradient-to-l from-nature-green-dark via-green-500 to-nature-golden bg-clip-text text-transparent">
              مكان واحد
            </span>
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-muted-foreground text-lg max-w-2xl mx-auto">
            أدوات متكاملة لرقمنة محاسبة مستغلك الفلاحي وتحسين حوكمته
          </motion.p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-30px' }}
              variants={scaleIn}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className={feature.span}
            >
              <Card className="bento-card border-0 shadow-xl glass overflow-hidden h-full group cursor-default">
                <CardContent className="p-5 sm:p-6">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <feature.icon className="size-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 group-hover:text-nature-green-dark dark:group-hover:text-nature-green transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  <FeatureVisual type={feature.visual} />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   HOW IT WORKS TIMELINE
   ============================================================ */
const steps = [
  {
    num: '١',
    title: 'سجّل حسابك',
    desc: 'أنشئ حسابك في دقائق وحدد نوع مستغلك الفلاحي وموقعه الجغرافي',
    icon: Tractor,
    color: 'from-green-500 to-emerald-600',
    details: ['تسجيل سريع بالمعلومات الأساسية', 'اختيار الولاية ونوع الإنتاج', 'تحديد مساحة المستغل'],
  },
  {
    num: '٢',
    title: 'سجّل عملياتك',
    desc: 'أضف مداخيلك ومصاريفك يومياً مع تصنيف ذكي حسب المواسم',
    icon: Sun,
    color: 'from-amber-500 to-orange-600',
    details: ['تسجيل المداخيل والمصاريف', 'تصنيف تلقائي حسب الفئات', 'ربط العمليات بالمواسم الفلاحية'],
  },
  {
    num: '٣',
    title: 'حسّن حوكمتك',
    desc: 'استفد من التقارير والمؤشرات لتحسين أداء مستغلك الفلاحي',
    icon: ChartNoAxesCombined,
    color: 'from-purple-500 to-indigo-600',
    details: ['تقارير مالية مفصلة', '٨ مؤشرات أداء رئيسية', 'شهادات أداء مالي معتمدة'],
  },
]

function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="how-it-works" className="py-20 sm:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-50/30 to-transparent dark:via-green-950/10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.div variants={fadeInUp}>
            <Badge variant="secondary" className="mb-4 text-nature-golden border-nature-golden/20">
              <CircleDot className="size-3 ml-1" />
              كيف تعمل
            </Badge>
          </motion.div>
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
            ثلاث خطوات نحو{' '}
            <span className="text-nature-golden">حوكمة أفضل</span>
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-muted-foreground text-lg max-w-2xl mx-auto">
            من التسجيل إلى تحسين الأداء، رحلة بسيطة نحو رقمنة محاسبتك الفلاحية
          </motion.p>
        </motion.div>

        {/* Timeline */}
        <div ref={ref} className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-24 right-[16.67%] left-[16.67%] h-0.5">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="h-full timeline-line origin-right"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                transition={{ delay: idx * 0.2 }}
                className="relative"
              >
                <motion.div
                  whileHover={{ y: -4 }}
                  onClick={() => setActiveStep(activeStep === idx ? -1 : idx)}
                  className="cursor-pointer"
                >
                  <Card className={`border-0 shadow-xl glass overflow-hidden transition-all duration-300 ${
                    activeStep === idx ? 'ring-2 ring-nature-green/30' : ''
                  }`}>
                    <CardContent className="p-6 text-center">
                      {/* Step number with animated circle */}
                      <div className="relative inline-flex items-center justify-center mb-4">
                        <svg className="absolute size-20" viewBox="0 0 80 80">
                          <circle cx="40" cy="40" r="35" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/20" />
                          <motion.circle
                            cx="40" cy="40" r="35" fill="none" strokeWidth="3"
                            stroke="url(#stepGrad)"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            whileInView={{ pathLength: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5, delay: idx * 0.3, ease: 'easeOut' }}
                            transform="rotate(-90 40 40)"
                          />
                          <defs>
                            <linearGradient id="stepGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#4ade80" />
                              <stop offset="100%" stopColor="#d4a017" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                          <step.icon className="size-7 text-white" />
                        </div>
                      </div>

                      <div className="text-3xl font-black text-nature-green/20 dark:text-nature-green/10 mb-1">{step.num}</div>
                      <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>

                      {/* Expanded details */}
                      <AnimatePresence>
                        {activeStep === idx && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-4 mt-4 border-t border-border/50 space-y-2">
                              {step.details.map((detail, di) => (
                                <div key={di} className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <CheckCircle className="size-4 text-green-500 shrink-0" />
                                  <span>{detail}</span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   DASHBOARD PREVIEW
   ============================================================ */
function DashboardPreviewSection() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const parallaxY = useTransform(scrollYProgress, [0, 1], [60, -60])

  return (
    <section id="preview" className="py-20 sm:py-28 relative overflow-hidden" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
          className="text-center mb-14"
        >
          <motion.div variants={fadeInUp}>
            <Badge variant="secondary" className="mb-4 text-nature-purple border-nature-purple/20">
              <LayoutDashboard className="size-3 ml-1" />
              معاينة المنصة
            </Badge>
          </motion.div>
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
            لوحة قيادة{' '}
            <span className="bg-gradient-to-l from-nature-purple via-purple-500 to-nature-blue-red bg-clip-text text-transparent">
              احترافية
            </span>
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-muted-foreground text-lg max-w-2xl mx-auto">
            واجهة سهلة الاستخدام مع جميع المؤشرات والرسوم البيانية التي تحتاجها
          </motion.p>
        </motion.div>

        {/* Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          {/* Main mockup container */}
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
              {/* Sidebar + Main */}
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
                        موسم الخريف ٢٠٢٤
                      </div>
                    </div>
                  </div>

                  {/* KPI cards row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {[
                      { label: 'إجمالي الإيرادات', value: '٢,٤٠٠,٠٠٠ د.ج', change: '+١٢٪', c: 'text-green-600 dark:text-green-400' },
                      { label: 'إجمالي المصاريف', value: '١,٨٠٠,٠٠٠ د.ج', change: '-٥٪', c: 'text-red-500' },
                      { label: 'صافي الربح', value: '٦٠٠,٠٠٠ د.ج', change: '+٢٣٪', c: 'text-green-600 dark:text-green-400' },
                      { label: 'معدل الربحية', value: '٢٥٪', change: '+٣٪', c: 'text-amber-600 dark:text-amber-400' },
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
                    {/* Bar chart */}
                    <div className="sm:col-span-2 bg-card rounded-xl p-3 border border-border/50 shadow-sm">
                      <p className="text-xs font-bold mb-2">الإيرادات والمصاريف الشهرية</p>
                      <div className="flex items-end gap-1 h-20">
                        {[60, 45, 70, 50, 85, 65, 75, 90, 55, 80, 70, 95].map((h, i) => (
                          <div key={i} className="flex-1 flex flex-col gap-0.5 items-center">
                            <div
                              className="w-full rounded-t bg-gradient-to-t from-green-500/70 to-green-400/40"
                              style={{ height: `${h}%` }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pie-like */}
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
                      <span className="text-xs text-green-600 dark:text-green-400 font-bold">٧٨٪</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: '78%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-to-l from-nature-green-dark to-green-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Floating KPI cards around the mockup */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="absolute -left-4 top-1/3 hidden lg:block"
          >
            <Card className="border-0 shadow-xl glass w-44 animate-float">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="size-4 text-green-500" />
                  <span className="text-xs font-bold">صافي الربح</span>
                </div>
                <p className="text-lg font-black text-green-600 dark:text-green-400">+٢٣٪</p>
                <p className="text-[10px] text-muted-foreground">مقارنة بالموسم السابق</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="absolute -right-4 top-1/2 hidden lg:block"
          >
            <Card className="border-0 shadow-xl glass w-44" style={{ animation: 'float 3s ease-in-out 0.5s infinite' }}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="size-4 text-purple-500" />
                  <span className="text-xs font-bold">الحوكمة</span>
                </div>
                <p className="text-lg font-black text-purple-600 dark:text-purple-400">٧٨٪</p>
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
   TESTIMONIALS SECTION
   ============================================================ */
const testimonials = [
  {
    name: 'محمد بن علي',
    role: 'مستغل فلاحي',
    wilaya: 'البليدة',
    text: 'منصة FACT غيّرت طريقة إدارة مستغلي تماماً. الآن أستطيع تتبع كل عملية مالية بسهولة ومعرفة أداء مستغلي بدقة.',
    rating: 5,
    color: 'from-green-500 to-emerald-600',
  },
  {
    name: 'عبد الرحمن بوخالفة',
    role: 'مزارع خضروات',
    wilaya: 'تيزي وزو',
    text: 'التقارير وشهادات الأداء المالي ساعدتني كثيراً في الحصول على قروض زراعية. أنصح كل مستغل فلاحي باستخدام FACT.',
    rating: 5,
    color: 'from-amber-500 to-orange-600',
  },
  {
    name: 'ياسين مرابط',
    role: 'مربي مواشي',
    wilaya: 'سطيف',
    text: 'مؤشرات الأداء تساعدني على فهم نقاط القوة والضعف في مستغلي. المحاسبة كانت صعبة لكن FACT سهّلت كل شيء.',
    rating: 5,
    color: 'from-purple-500 to-indigo-600',
  },
  {
    name: 'كريم حداد',
    role: 'فلاح حبوب',
    wilaya: 'الجزائر',
    text: 'التصنيف التلقائي للعمليات حسب المواسم الفلاحية ميزة رائعة. وفرت الكثير من الوقت والجهد في إدارة المحاسبة.',
    rating: 4,
    color: 'from-rose-500 to-red-600',
  },
  {
    name: 'سعيد بوزيد',
    role: 'مستغل فلاحي',
    wilaya: 'وهران',
    text: 'لوحة القيادة تعطيني صورة واضحة عن وضع مستغلي المالي. لم أكن أتخيل أن رقمنة المحاسبة ستكون بهذه السهولة.',
    rating: 5,
    color: 'from-cyan-500 to-teal-600',
  },
  {
    name: 'نبيل حمداني',
    role: 'مزارع زيتون',
    wilaya: 'بجاية',
    text: 'FACT ساعدتني على تحسين حوكمة مستغلي بشكل ملحوظ. التقارير المالية مفصلة ومفيدة جداً لاتخاذ القرارات.',
    rating: 5,
    color: 'from-nature-golden to-yellow-600',
  },
]

function TestimonialsSection() {
  const [current, setCurrent] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startAutoScroll = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length)
    }, 4000)
  }, [])

  useEffect(() => {
    startAutoScroll()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [startAutoScroll])

  const goTo = (idx: number) => {
    setCurrent(idx)
    startAutoScroll()
  }

  // Show 3 testimonials at a time on desktop, 1 on mobile
  const getVisibleTestimonials = () => {
    const items = []
    for (let i = 0; i < 3; i++) {
      items.push(testimonials[(current + i) % testimonials.length])
    }
    return items
  }

  return (
    <section id="testimonials" className="py-20 sm:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-50/20 to-transparent dark:via-purple-950/10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
          className="text-center mb-14"
        >
          <motion.div variants={fadeInUp}>
            <Badge variant="secondary" className="mb-4 text-nature-golden border-nature-golden/20">
              <Star className="size-3 ml-1" />
              آراء المستخدمين
            </Badge>
          </motion.div>
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4">
            ماذا يقول{' '}
            <span className="text-nature-golden">المستغلون الفلاحيون</span>
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-muted-foreground text-lg max-w-2xl mx-auto">
            تجارب حقيقية من مستغلين فلاحيين حسّنوا حوكمة مستغلاتهم
          </motion.p>
        </motion.div>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AnimatePresence mode="wait">
            {getVisibleTestimonials().map((testimonial, idx) => (
              <motion.div
                key={`${current}-${idx}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="testimonial-card"
              >
                <Card className="border-0 shadow-xl glass overflow-hidden h-full">
                  <CardContent className="p-6">
                    {/* Quote mark */}
                    <Quote className="size-8 text-nature-green/20 dark:text-nature-green/10 mb-3" />

                    {/* Stars */}
                    <div className="flex gap-0.5 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`size-4 ${i < testimonial.rating ? 'text-amber-400 fill-amber-400' : 'text-muted/30'}`}
                        />
                      ))}
                    </div>

                    {/* Text */}
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{testimonial.text}</p>

                    {/* Author */}
                    <div className="flex items-center gap-3 pt-3 border-t border-border/30">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-bold text-sm`}>
                        {testimonial.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.role} • {testimonial.wilaya}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                idx === current
                  ? 'w-8 green-gradient shadow-lg shadow-green-500/30'
                  : 'bg-muted-foreground/20 hover:bg-muted-foreground/40'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   CTA SECTION
   ============================================================ */
function CTASection() {
  const { setCurrentView } = useAppStore()

  return (
    <section className="py-20 sm:py-28 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7 }}
        >
          <Card className="border-0 shadow-2xl overflow-hidden">
            <div className="cta-bg p-8 sm:p-14 text-center text-white relative overflow-hidden">
              {/* Animated background elements */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-8 right-[10%] w-40 h-40 border border-white/10 rounded-full animate-orb-1" />
                <div className="absolute bottom-8 left-[10%] w-32 h-32 border border-white/8 rounded-full animate-orb-2" />
                <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-white/5 rounded-full animate-orb-3" />
                <div className="absolute top-[20%] right-[30%] w-2 h-2 bg-green-400/40 rounded-full animate-bounce-gentle" />
                <div className="absolute bottom-[30%] left-[20%] w-3 h-3 bg-amber-400/30 rounded-full animate-bounce-gentle" style={{ animationDelay: '1s' }} />
                <div className="absolute top-[40%] right-[15%] w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce-gentle" style={{ animationDelay: '0.5s' }} />
              </div>

              <div className="relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="mb-6"
                >
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white/90 text-sm border border-white/10">
                    <Sprout className="size-4" />
                    انضم إلى مجتمع المستغلين الفلاحيين
                  </span>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 leading-tight"
                >
                  ابدأ رقمنة محاسبتك
                  <br />
                  <span className="text-nature-golden-light">الفلاحية اليوم</span>
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="text-green-100/80 text-lg mb-8 max-w-2xl mx-auto"
                >
                  انضم إلى المستغلين الفلاحيين الذين يحسنون حوكمة مستغلاتهم باستخدام FACT — مجاناً تماماً
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
                >
                  <Button
                    size="lg"
                    onClick={() => setCurrentView('register')}
                    className="golden-gradient text-white text-lg px-10 py-7 shadow-xl shadow-black/20 hover:scale-105 transition-transform group"
                  >
                    سجّل الآن مجاناً
                    <ArrowLeft className="size-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setCurrentView('login')}
                    className="border-2 border-white/20 text-white hover:bg-white/10 text-lg px-10 py-7"
                  >
                    تسجيل الدخول
                  </Button>
                </motion.div>

                {/* Trust badges */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7 }}
                  className="flex flex-wrap items-center justify-center gap-4 text-sm text-white/50"
                >
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="size-4" />
                    <span>مجاني بالكامل</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="size-4" />
                    <span>بدون بطاقة ائتمان</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="size-4" />
                    <span>إعداد في دقائق</span>
                  </div>
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
        { label: 'المميزات', href: '#features' },
        { label: 'كيف تعمل', href: '#how-it-works' },
        { label: 'الأسعار', href: '#' },
        { label: 'التحديثات', href: '#' },
      ],
    },
    {
      title: 'الدعم',
      links: [
        { label: 'مركز المساعدة', href: '#' },
        { label: 'الأسئلة الشائعة', href: '#' },
        { label: 'تواصل معنا', href: '#' },
        { label: 'الدليل', href: '#' },
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
          {/* Logo & Description */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl green-gradient flex items-center justify-center shadow-lg shadow-green-600/20">
                <Sprout className="size-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black bg-gradient-to-l from-nature-green-dark via-green-500 to-nature-golden bg-clip-text text-transparent">
                  FACT
                </h3>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              النموذج الرقمي المقترح لرقمنة المحاسبة الفلاحية كآلية لتحسين حوكمة المستغلات الصغيرة في الجزائر
            </p>
            <div className="flex gap-3">
              <Button
                size="sm"
                onClick={() => setCurrentView('register')}
                className="golden-gradient text-white text-xs"
              >
                ابدأ الآن
              </Button>
            </div>
          </div>

          {/* Link Columns */}
          {footerLinks.map((group, idx) => (
            <div key={idx}>
              <h4 className="font-bold text-sm mb-3">{group.title}</h4>
              <ul className="space-y-2">
                {group.links.map((link, li) => (
                  <li key={li}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-nature-green-dark dark:hover:text-nature-green transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1.5 text-xs">
              <Mail className="size-3" />
              <span>contact@fact.dz</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Phone className="size-3" />
              <span>+213 XX XXX XXXX</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Globe className="size-3" />
              <span>fact.dz</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} FACT — النموذج الرقمي لتحسين حوكمة المستغلات الفلاحية في الجزائر
          </p>
        </div>
      </div>
    </footer>
  )
}

/* ============================================================
   MAIN LANDING PAGE
   ============================================================ */
export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col nature-gradient">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <DashboardPreviewSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  )
}

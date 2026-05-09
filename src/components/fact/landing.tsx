'use client'

import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Sprout, BarChart3, FileText, Shield,
  ArrowLeft, ChevronLeft, Tractor, Sun, ChartNoAxesCombined
} from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' }
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.15 } }
}

const features = [
  {
    icon: BarChart3,
    title: 'تسجيل المداخيل والمصاريف',
    desc: 'تتبع جميع عملياتك المالية بدقة وسهولة مع تصنيف ذكي',
    color: 'from-green-500 to-emerald-600',
    shadow: 'shadow-green-500/20'
  },
  {
    icon: Sprout,
    title: 'تتبع المخزون الفلاحي',
    desc: 'إدارة مخزونك من البذور والأسمدة والمنتجات بكفاءة عالية',
    color: 'from-amber-500 to-orange-600',
    shadow: 'shadow-amber-500/20'
  },
  {
    icon: FileText,
    title: 'التقارير المالية',
    desc: 'تقارير مفصلة وشهادات أداء مالي لتحسين حوكمة مستغلك',
    color: 'from-purple-500 to-indigo-600',
    shadow: 'shadow-purple-500/20'
  },
  {
    icon: Shield,
    title: 'لوحة قيادة الحوكمة',
    desc: 'مؤشرات أداء رئيسية ولوحات تحكم لتحسين اتخاذ القرار',
    color: 'from-rose-500 to-red-600',
    shadow: 'shadow-rose-500/20'
  }
]

const steps = [
  {
    num: '١',
    title: 'سجّل حسابك',
    desc: 'أنشئ حسابك في دقائق وحدد نوع مستغلك الفلاحي',
    icon: Tractor
  },
  {
    num: '٢',
    title: 'سجّل عملياتك',
    desc: 'أضف مداخيلك ومصاريفك يومياً مع تصنيف ذكي',
    icon: Sun
  },
  {
    num: '٣',
    title: 'حسّن حوكمتك',
    desc: 'استفد من التقارير والمؤشرات لتحسين أداء مستغلك',
    icon: ChartNoAxesCombined
  }
]

export function LandingPage() {
  const { setCurrentView } = useAppStore()

  return (
    <div className="min-h-screen flex flex-col nature-gradient">
      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 glass border-b border-white/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl green-gradient flex items-center justify-center shadow-lg shadow-green-600/30">
              <Sprout className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-nature-green-dark dark:text-nature-green">FACT</h1>
              <p className="text-[10px] text-muted-foreground -mt-1">المحاسبة الفلاحية الرقمية</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setCurrentView('login')}
              className="border-nature-green-dark/30 text-nature-green-dark dark:border-nature-green/30 dark:text-nature-green hover:bg-nature-green/10"
            >
              تسجيل الدخول
            </Button>
            <Button
              onClick={() => setCurrentView('register')}
              className="golden-gradient text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-shadow"
            >
              إنشاء حساب
              <ArrowLeft className="size-4 mr-1" />
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-28 lg:py-36">
        {/* Background decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-green-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-purple-400/8 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.div variants={fadeInUp} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium border border-green-200 dark:border-green-800">
                <Sprout className="size-4" />
                النموذج الرقمي لحوكمة المستغلات الفلاحية في الجزائر
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-6xl sm:text-7xl lg:text-8xl font-black mb-4"
            >
              <span className="bg-gradient-to-l from-nature-green-dark via-green-500 to-nature-golden bg-clip-text text-transparent">
                FACT
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4"
            >
              منصة المحاسبة الفلاحية الرقمية
            </motion.p>

            <motion.p
              variants={fadeInUp}
              className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              النموذج الرقمي المقترح لرقمنة المحاسبة الفلاحية كآلية لتحسين حوكمة المستغلات الصغيرة في الجزائر
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setCurrentView('register')}
                className="golden-gradient text-white text-lg px-8 py-6 shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all hover:scale-105"
              >
                ابدأ الآن مجاناً
                <ArrowLeft className="size-5 mr-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setCurrentView('login')}
                className="border-2 border-nature-green-dark/30 text-nature-green-dark dark:border-nature-green/30 dark:text-nature-green text-lg px-8 py-6 hover:bg-nature-green/10"
              >
                لديك حساب؟ سجّل الدخول
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              مميزات <span className="text-nature-green-dark dark:text-nature-green">المنصة</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              كل ما تحتاجه لرقمنة محاسبة مستغلك الفلاحي وتحسين حوكمته
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card className={`group relative overflow-hidden border-0 shadow-xl ${feature.shadow} hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 h-full`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg ${feature.shadow}`}>
                      <feature.icon className="size-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gradient-to-b from-transparent via-green-50/50 to-transparent dark:via-green-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              كيف <span className="text-nature-golden">تعمل المنصة؟</span>
            </h2>
            <p className="text-muted-foreground text-lg">ثلاث خطوات بسيطة نحو حوكمة أفضل</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                className="relative"
              >
                <Card className="border-0 shadow-lg glass hover:shadow-xl transition-all duration-300 h-full">
                  <CardContent className="p-6 text-center">
                    <div className="text-5xl font-black text-nature-green/20 dark:text-nature-green/10 mb-2">
                      {step.num}
                    </div>
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full green-gradient flex items-center justify-center shadow-lg shadow-green-500/20">
                      <step.icon className="size-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.desc}</p>
                  </CardContent>
                </Card>
                {idx < steps.length - 1 && (
                  <div className="hidden md:flex absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <ChevronLeft className="size-8 text-nature-green/40" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="border-0 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-l from-nature-green-dark via-green-600 to-emerald-500 p-8 sm:p-12 text-center text-white relative">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 right-8 w-32 h-32 border-2 border-white/30 rounded-full" />
                  <div className="absolute bottom-4 left-8 w-24 h-24 border-2 border-white/20 rounded-full" />
                  <div className="absolute top-1/2 left-1/4 w-16 h-16 border border-white/10 rounded-full" />
                </div>
                <div className="relative z-10">
                  <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                    ابدأ رقمنة محاسبتك الفلاحية اليوم
                  </h2>
                  <p className="text-green-100 text-lg mb-8 max-w-2xl mx-auto">
                    انضم إلى المستغلين الفلاحيين الذين يحسنون حوكمة مستغلاتهم باستخدام FACT
                  </p>
                  <Button
                    size="lg"
                    onClick={() => setCurrentView('register')}
                    className="golden-gradient text-white text-lg px-10 py-6 shadow-xl shadow-black/20 hover:scale-105 transition-transform"
                  >
                    سجّل الآن مجاناً
                    <ArrowLeft className="size-5 mr-2" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t bg-card/80 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg green-gradient flex items-center justify-center">
                <Sprout className="size-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-nature-green-dark dark:text-nature-green">FACT</span>
                <span className="text-muted-foreground text-sm mr-2">- منصة المحاسبة الفلاحية الرقمية</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} FACT - النموذج الرقمي لتحسين حوكمة المستغلات الفلاحية في الجزائر
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

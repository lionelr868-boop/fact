'use client'

import { useEffect, useState, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { LandingPage } from '@/components/fact/landing'
import { AuthPage } from '@/components/fact/auth'
import { FarmerDashboard } from '@/components/fact/farmer-dashboard'
import { AdminDashboard } from '@/components/fact/admin-dashboard'
import { AnimatePresence, motion } from 'framer-motion'

export default function Home() {
  const { currentView, token, setUser, setToken, setCurrentView } = useAppStore()
  const [initialized, setInitialized] = useState(false)
  const seedingDone = useRef(false)

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('fact_token')
      if (storedToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` },
          })
          const data = await res.json()
          if (data.success) {
            setToken(storedToken)
            setUser(data.data.user)
            if (data.data.user.role === 'ADMIN') {
              setCurrentView('admin-dashboard')
            } else {
              setCurrentView('farmer-dashboard')
            }
          } else {
            localStorage.removeItem('fact_token')
          }
        } catch {
          localStorage.removeItem('fact_token')
        }
      }
      setInitialized(true)
    }
    checkAuth()
  }, [setToken, setUser, setCurrentView])

  // Save token to localStorage when it changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('fact_token', token)
    } else {
      localStorage.removeItem('fact_token')
    }
  }, [token])

  // Auto-seed on first visit
  useEffect(() => {
    if (!initialized || seedingDone.current) return
    seedingDone.current = true
    fetch('/api/seed', { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          console.log('✅ Database ready')
        }
      })
      .catch(() => {})
  }, [initialized])

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center nature-gradient">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl green-gradient flex items-center justify-center shadow-xl shadow-green-500/30 animate-pulse-glow">
            <svg className="size-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
              <path d="M12 6v6l4 2" />
              <path d="M7 17c.5-1.5 2-2.5 3.5-2.5s2.5.5 3.5 1.5" />
              <path d="M8 8c0-1 .5-2 1.5-2.5" />
              <path d="M14.5 5.5c1 .5 1.5 1.5 1.5 2.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-l from-nature-green-dark via-green-500 to-nature-golden bg-clip-text text-transparent mb-2">
            FACT
          </h1>
          <p className="text-sm text-muted-foreground">جاري تحميل المنصة...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentView}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen"
      >
        {currentView === 'landing' && <LandingPage />}
        {currentView === 'login' && <AuthPage />}
        {currentView === 'register' && <AuthPage />}
        {currentView === 'farmer-dashboard' && <FarmerDashboard />}
        {currentView === 'admin-dashboard' && <AdminDashboard />}
      </motion.div>
    </AnimatePresence>
  )
}

import { create } from 'zustand'

export type AppView = 'landing' | 'login' | 'register' | 'farmer-dashboard' | 'admin-dashboard'
export type FarmerTab = 'home' | 'transactions' | 'inventory' | 'reports'
export type AdminTab = 'overview' | 'users' | 'farms' | 'transactions' | 'inventory' | 'categories' | 'reports'

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'FARMER'
  phone?: string
  wilaya?: string
  areaHectares?: number
  productionType?: string
  frozen?: boolean
  frozenReason?: string | null
}

interface AppState {
  // Auth
  currentView: AppView
  user: User | null
  token: string | null
  
  // Farmer
  farmerTab: FarmerTab
  selectedSeason: string | null
  
  // Admin
  adminTab: AdminTab
  
  // UI
  sidebarOpen: boolean
  isLoading: boolean
  
  // Actions
  setCurrentView: (view: AppView) => void
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setFarmerTab: (tab: FarmerTab) => void
  setAdminTab: (tab: AdminTab) => void
  setSelectedSeason: (seasonId: string | null) => void
  setSidebarOpen: (open: boolean) => void
  setIsLoading: (loading: boolean) => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'landing',
  user: null,
  token: null,
  farmerTab: 'home',
  adminTab: 'overview',
  selectedSeason: null,
  sidebarOpen: true,
  isLoading: false,
  
  setCurrentView: (view) => set({ currentView: view }),
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setFarmerTab: (tab) => set({ farmerTab: tab }),
  setAdminTab: (tab) => set({ adminTab: tab }),
  setSelectedSeason: (seasonId) => set({ selectedSeason: seasonId }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  logout: () => set({ 
    user: null, 
    token: null, 
    currentView: 'landing',
    farmerTab: 'home',
    adminTab: 'overview',
    selectedSeason: null
  }),
}))

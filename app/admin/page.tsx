"use client"

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import {
  Car as CarIcon,
  Plus,
  Edit,
  Trash2,
  Search,
  Users,
  LayoutDashboard,
  ExternalLink,
  X,
  PhoneCall,
  RefreshCw,
  Lock,
  LogOut,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Eye,
  EyeOff,
  Bell,
  Mail,
  Send,
  Check,
  Settings,
  Calculator,
  GitCompareArrows,
  Clock,
  ThumbsUp,
  Star,
  Award,
  Zap,
  Store,
  ChevronRight,
  TrendingUp,
  DollarSign,
  FileText,
  AlertTriangle,
  Building2,
  BarChart3,
  Receipt
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { Car } from '@/data/cars'
import { loginAdmin, logoutAdmin, getAdminSession } from '@/app/actions/authActions'
import { getCars, createCar, updateCar, deleteCar } from '@/app/actions/carActions'
import { getLeads, updateLeadStatus, deleteLead } from '@/app/actions/leadActions'
import { getBranches, createBranch, updateBranch, deleteBranch } from '@/app/actions/branchActions'
import { getExpenses, createExpense, deleteExpense, getExpenseStats } from '@/app/actions/expenseActions'
import { getTransactions, createTransaction, getTransactionStats } from '@/app/actions/transactionActions'
import { KanbanLeads, KanbanLeadItem } from '@/components/admin/KanbanLeads'
import { SpkModal } from '@/components/admin/SpkModal'
import { BranchManagement } from '@/components/admin/BranchManagement'
import { InventoryManager } from '@/components/admin/InventoryManager'
import { ReportDashboard } from '@/components/admin/ReportDashboard'
import { ExpenseTracker } from '@/components/admin/ExpenseTracker'

const formatIDR = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

type AdminTab = 'overview' | 'kanban' | 'inventory' | 'branches' | 'reports' | 'expenses'

export default function AdminDashboardPage() {
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')

  // Auth State (Server Session Driven)
  const [sessionUser, setSessionUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [loginForm, setLoginForm] = useState({ email: 'admin@denkenmotors.id', password: '' })
  const [loginError, setLoginError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Real Database Records
  const [dbCars, setDbCars] = useState<Car[]>([])
  const [dbLeads, setDbLeads] = useState<KanbanLeadItem[]>([])
  const [dbBranches, setDbBranches] = useState<any[]>([])
  const [dbExpenses, setDbExpenses] = useState<any[]>([])
  const [dbTransactions, setDbTransactions] = useState<any[]>([])
  const [transactionStats, setTransactionStats] = useState<any>({
    thisMonth: { revenue: 0, units: 0 },
    lastMonth: { revenue: 0, units: 0 },
    allTime: { revenue: 0, units: 0 },
    monthlyBreakdown: [],
  })
  const [expenseStats, setExpenseStats] = useState<any>({
    totalAll: 0, totalMonth: 0, countMonth: 0, byCategory: [],
  })
  const [loadingData, setLoadingData] = useState(false)

  // Modals & SPK State
  const [isCarModalOpen, setIsCarModalOpen] = useState(false)
  const [editingCar, setEditingCar] = useState<Car | null>(null)
  const [isSpkOpen, setIsSpkOpen] = useState(false)
  const [spkLead, setSpkLead] = useState<any>(null)
  const [spkCar, setSpkCar] = useState<any>(null)

  // Car Form State
  const [carForm, setCarForm] = useState({
    name: '',
    brand: '',
    year: 2024,
    price: 500000000,
    priceCredit: 475000000,
    monthly: 9500000,
    dp: 75000000,
    transmission: 'Automatic' as const,
    fuel: 'Bensin' as const,
    engine: '2.0L Turbocharged',
    mileage: 12000,
    color: 'Hitam Metalik',
    type: 'SUV' as const,
    condition: 'Bekas' as const,
    location: 'Jakarta',
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=85',
    gallery: [] as string[],
    badge: 'READY STOCK' as const,
    description: 'Unit istimewa, rawatan berkala bengkel resmi. Kondisi interior wangi & mulus, bebas tabrak dan bebas banjir.',
    features: ['Panoramic Sunroof', 'Keyless Entry', 'Leather Seats', 'Apple CarPlay & Android Auto', 'Cruise Control'],
    taxDate: 'Oktober 2026',
    plateNumber: 'B 1234 DEN (Genap)',
    ownership: 'Tangan Pertama (Pribadi)',
    serviceRecord: 'Bengkel Resmi (ATPM)',
    documents: ['BPKB Asli', 'STNK Hidup', 'Faktur Resmi', 'Kunci Serep', 'Buku Servis'],
    isFloodFree: true,
    isAccidentFree: true,
    isOdometerVerified: true,
    warrantyDays: 365,
  })

  // Branches & Store Fallback
  const branches = useStore((state) => state.branches)
  const currentBranch = dbBranches[0] || branches[0] || { name: 'DENKEN Jakarta (Pusat)', city: 'Jakarta', address: 'Jl. TB Simatupang No. 88' }

  // 1. Check server session on mount
  useEffect(() => {
    setMounted(true)
    const checkAuth = async () => {
      try {
        const session = await getAdminSession()
        if (session) {
          setSessionUser(session)
        }
      } catch (err) {
        console.error('Session check error:', err)
      } finally {
        setAuthLoading(false)
      }
    }
    checkAuth()
  }, [])

  // 2. Fetch fresh database data once authenticated
  const loadFreshData = async () => {
    setLoadingData(true)
    try {
      const ownerId = sessionUser?.userId || 'admin_owner_1'
      const [carsData, leadsData, branchesData, expensesData, transData, txStats, expStats] = await Promise.all([
        getCars(),
        getLeads(ownerId),
        getBranches(ownerId),
        getExpenses(ownerId),
        getTransactions(ownerId),
        getTransactionStats(ownerId),
        getExpenseStats(ownerId),
      ])
      if (carsData) setDbCars(carsData as any)
      if (leadsData) setDbLeads(leadsData as any)
      if (branchesData) setDbBranches(branchesData)
      if (expensesData) setDbExpenses(expensesData)
      if (transData) setDbTransactions(transData)
      if (txStats) setTransactionStats(txStats)
      if (expStats) setExpenseStats(expStats)
    } catch (err) {
      console.error('Failed to load fresh DB data:', err)
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (sessionUser) {
      loadFreshData()
    }
  }, [sessionUser])

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    startTransition(async () => {
      const res = await loginAdmin(loginForm.email, loginForm.password)
      if (res.success && res.user) {
        setSessionUser(res.user)
      } else {
        setLoginError(res.error || 'Email atau kata sandi tidak valid.')
      }
    })
  }

  // Handle Logout
  const handleLogout = async () => {
    await logoutAdmin()
    setSessionUser(null)
  }

  // Handle Lead Status Change (Kanban)
  const handleLeadStatusChange = async (id: string, newStatus: any, assignedTo?: string, notes?: string) => {
    setDbLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: newStatus, assignedTo: assignedTo || l.assignedTo, notes: notes || l.notes } : l))
    )
    await updateLeadStatus(id, newStatus, assignedTo, notes)
    const updatedCars = await getCars()
    if (updatedCars) setDbCars(updatedCars as any)
  }

  // Open SPK from Kanban
  const handleOpenSpk = (lead: any, car: any) => {
    setSpkLead(lead)
    setSpkCar(car)
    setIsSpkOpen(true)
  }

  // Save Car (Create / Update)
  const handleSaveCar = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const slug = editingCar ? editingCar.slug : carForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4)
      const payload = {
        ...carForm,
        slug,
        ownerId: sessionUser?.userId || 'admin_owner_1',
      }
      if (editingCar) {
        await updateCar(editingCar.id, payload as any)
      } else {
        await createCar(payload as any)
      }
      setIsCarModalOpen(false)
      setEditingCar(null)
      loadFreshData()
    })
  }

  const handleEditCarClick = (car: Car) => {
    setEditingCar(car)
    setCarForm({
      name: car.name,
      brand: car.brand,
      year: car.year,
      price: car.price,
      priceCredit: car.priceCredit || Math.round(car.price * 0.95),
      monthly: car.monthly,
      dp: car.dp,
      transmission: car.transmission as any,
      fuel: car.fuel as any,
      engine: car.engine,
      mileage: car.mileage,
      color: car.color,
      type: car.type as any,
      condition: car.condition as any,
      location: car.location,
      image: car.image,
      gallery: car.gallery || [car.image],
      badge: (car.badge as any) || 'READY STOCK',
      description: car.description,
      features: car.features || [],
      taxDate: car.taxDate || 'Oktober 2026',
      plateNumber: car.plateNumber || 'B 1234 DEN (Genap)',
      ownership: car.ownership || 'Tangan Pertama (Pribadi)',
      serviceRecord: car.serviceRecord || 'Bengkel Resmi (ATPM)',
      documents: car.documents || ['BPKB Asli', 'STNK Hidup', 'Faktur Resmi', 'Kunci Serep'],
      isFloodFree: car.isFloodFree !== undefined ? car.isFloodFree : true,
      isAccidentFree: car.isAccidentFree !== undefined ? car.isAccidentFree : true,
      isOdometerVerified: car.isOdometerVerified !== undefined ? car.isOdometerVerified : true,
      warrantyDays: car.warrantyDays || 365,
    })
    setIsCarModalOpen(true)
  }

  const handleDeleteCarClick = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus mobil ini dari stok?')) {
      await deleteCar(id)
      loadFreshData()
    }
  }

  // Branch CRUD handlers
  const handleCreateBranch = async (data: any) => {
    const ownerId = sessionUser?.userId || 'admin_owner_1'
    await createBranch({ ...data, ownerId })
    loadFreshData()
  }

  const handleUpdateBranch = async (id: string, data: any) => {
    await updateBranch(id, data)
    loadFreshData()
  }

  const handleDeleteBranch = async (id: string) => {
    await deleteBranch(id)
    loadFreshData()
  }

  // Inventory handlers
  const handleAssignBranch = async (carId: string, branchId: string | null) => {
    await updateCar(carId, { branchId: branchId || undefined } as any)
    loadFreshData()
  }

  const handleToggleStatus = async (carId: string, badge: string, isSoldOut: boolean) => {
    await updateCar(carId, { badge, isSoldOut } as any)
    loadFreshData()
  }

  // Expense handlers
  const handleCreateExpense = async (data: any) => {
    const ownerId = sessionUser?.userId || 'admin_owner_1'
    await createExpense({ ...data, ownerId })
    loadFreshData()
  }

  const handleDeleteExpense = async (id: string) => {
    await deleteExpense(id)
    loadFreshData()
  }

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        <p className="font-bold text-sm animate-pulse">Memverifikasi sesi aman...</p>
      </div>
    )
  }

  // LOGIN SCREEN (If not authenticated)
  if (!sessionUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-5 py-12">
        <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight text-foreground">
              DENKEN MOTORS
            </h1>
            <p className="text-xs text-muted-foreground">
              Portal Manajemen Showroom & CRM Prospek
            </p>
          </div>

          {loginError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                Email Administrator
              </label>
              <input
                type="email"
                required
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className="w-full rounded-xl border border-border bg-muted/40 p-3 text-xs font-semibold outline-none focus:border-primary transition"
                placeholder="admin@denkenmotors.id"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full rounded-xl border border-border bg-muted/40 p-3 pr-10 text-xs font-semibold outline-none focus:border-primary transition"
                  placeholder="Masukkan kata sandi..."
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-primary py-3.5 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-lg hover:bg-primary/90 transition disabled:opacity-50"
            >
              {isPending ? 'Memproses Masuk...' : 'Masuk Dashboard'}
            </button>
          </form>

          <p className="text-center text-[11px] text-muted-foreground">
            Akses dilindungi oleh enkripsi sesi server HTTP-Only Cookie.
          </p>
        </div>
      </div>
    )
  }

  // CALCULATE REAL METRICS FROM DATABASE
  const totalStockCount = dbCars.length
  const readyStockCount = dbCars.filter((c) => !c.isSoldOut && c.badge !== 'SOLD OUT').length
  const soldCount = dbCars.filter((c) => c.isSoldOut || c.badge === 'SOLD OUT').length
  const totalValuation = dbCars
    .filter((c) => !c.isSoldOut && c.badge !== 'SOLD OUT')
    .reduce((sum, c) => sum + (c.price || 0), 0)
  const activeLeadsCount = dbLeads.filter((l) => l.status !== 'Selesai' && l.status !== 'Ditolak' && l.status !== 'Batal').length

  const TABS: { id: AdminTab; label: string; icon: any; badge?: number }[] = [
    { id: 'overview', label: 'Ringkasan Bisnis', icon: LayoutDashboard },
    { id: 'kanban', label: 'Sales Pipeline CRM', icon: Users, badge: activeLeadsCount || undefined },
    { id: 'inventory', label: 'Stok & Dual Pricing', icon: CarIcon, badge: readyStockCount },
    { id: 'branches', label: 'Cabang Showroom', icon: Building2, badge: dbBranches.length },
    { id: 'reports', label: 'Laporan & Analisis', icon: BarChart3 },
    { id: 'expenses', label: 'Pengeluaran', icon: Receipt },
  ]

  return (
    <div className="min-h-screen bg-secondary/30 pb-20">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="mx-auto max-w-7xl px-5 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Store className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-display font-black text-base text-foreground flex items-center gap-2">
                DENKEN MOTORS <span className="text-xs font-normal text-muted-foreground">| Admin Portal</span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Showroom: <strong>{currentBranch.name}</strong> • Akun: <strong>{sessionUser.name}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadFreshData}
              disabled={loadingData}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition shadow-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingData ? 'animate-spin' : ''}`} /> Sync
            </button>
            <Link
              href="/jakarta"
              target="_blank"
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition shadow-sm"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Website
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition shadow-sm"
            >
              <LogOut className="h-3.5 w-3.5" /> Keluar
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="mx-auto max-w-7xl px-5 lg:px-8 flex gap-1 border-t border-border/40 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`rounded-full text-[10px] px-1.5 py-0.5 font-black ${
                  activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="mx-auto max-w-7xl px-5 lg:px-8 pt-8">
        {/* TAB 1: OVERVIEW & FINANCIAL VALUATION */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase tracking-wider">Valuasi Stok OTR</span>
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="font-display text-2xl sm:text-3xl font-black text-foreground">
                  {formatIDR(totalValuation)}
                </p>
                <p className="text-[11px] text-muted-foreground">Total modal & nilai jual unit aktif</p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase tracking-wider">Unit Ready Stock</span>
                  <CarIcon className="h-4 w-4 text-primary" />
                </div>
                <p className="font-display text-2xl sm:text-3xl font-black text-foreground">
                  {readyStockCount} <span className="text-sm font-normal text-muted-foreground">Unit</span>
                </p>
                <p className="text-[11px] text-muted-foreground">Tersedia untuk dipajang & test drive</p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase tracking-wider">Prospek Aktif</span>
                  <Users className="h-4 w-4 text-blue-500" />
                </div>
                <p className="font-display text-2xl sm:text-3xl font-black text-foreground">
                  {activeLeadsCount} <span className="text-sm font-normal text-muted-foreground">Orang</span>
                </p>
                <p className="text-[11px] text-muted-foreground">Sedang dalam tahap negosiasi / follow-up</p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-bold uppercase tracking-wider">Omzet Bulan Ini</span>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="font-display text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatIDR(transactionStats.thisMonth?.revenue || 0)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {transactionStats.thisMonth?.units || 0} unit terjual bulan ini
                </p>
              </div>
            </div>

            {/* Quick Actions & Recent Inventory Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold text-foreground">Inventaris Terkini</h2>
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    Kelola Semua <ChevronRight className="h-3 w-3" />
                  </button>
                </div>

                <div className="divide-y divide-border/40">
                  {dbCars.slice(0, 5).map((car) => (
                    <div key={car.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={car.image}
                          alt={car.name}
                          className="h-12 w-16 object-cover rounded-xl border border-border"
                        />
                        <div>
                          <p className="font-bold text-sm text-foreground">{car.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {car.year} • {car.plateNumber || 'Plat B'} • {car.taxDate || 'Pajak Hidup'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-mono font-bold text-sm text-primary">
                          {formatIDR(car.priceCredit || car.price)}
                        </p>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          car.isSoldOut ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {car.isSoldOut ? 'SOLD OUT' : 'READY'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Pipeline Status + Quick Links */}
              <div className="space-y-5">
                <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <h2 className="font-display text-lg font-bold text-foreground">Alur Penjualan</h2>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center p-3 rounded-xl bg-muted/40">
                      <span className="font-semibold text-foreground">Prospek Baru</span>
                      <span className="font-bold text-blue-500">{dbLeads.filter(l => l.status === 'Baru').length} Leads</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-muted/40">
                      <span className="font-semibold text-foreground">Follow-Up & Test Drive</span>
                      <span className="font-bold text-amber-500">{dbLeads.filter(l => l.status === 'FollowUp' || l.status === 'TestDrive').length} Leads</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-muted/40">
                      <span className="font-semibold text-foreground">SPK & Booking Fee</span>
                      <span className="font-bold text-emerald-500">{dbLeads.filter(l => l.status === 'SPK' || l.status === 'Disetujui').length} Deals</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('kanban')}
                    className="w-full rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-sm"
                  >
                    Buka Kanban Pipeline
                  </button>
                </div>

                {/* Quick Navigation */}
                <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-3">
                  <h2 className="font-display text-base font-bold text-foreground">Aksi Cepat</h2>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setActiveTab('branches')} className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition text-xs font-bold text-foreground">
                      <Building2 className="h-4 w-4 text-primary" /> Cabang
                    </button>
                    <button onClick={() => setActiveTab('reports')} className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition text-xs font-bold text-foreground">
                      <BarChart3 className="h-4 w-4 text-emerald-500" /> Laporan
                    </button>
                    <button onClick={() => setActiveTab('expenses')} className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition text-xs font-bold text-foreground">
                      <Receipt className="h-4 w-4 text-amber-500" /> Pengeluaran
                    </button>
                    <button onClick={() => { setEditingCar(null); setIsCarModalOpen(true) }} className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition text-xs font-bold text-foreground">
                      <Plus className="h-4 w-4 text-blue-500" /> + Mobil
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KANBAN SALES PIPELINE */}
        {activeTab === 'kanban' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-foreground">Sales Pipeline & Follow-Up</h2>
                <p className="text-xs text-muted-foreground">
                  Pantau prospek pembeli, jadwalkan test drive, kirim template WhatsApp, dan cetak SPK.
                </p>
              </div>
              <button
                onClick={loadFreshData}
                disabled={loadingData}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-bold hover:bg-muted transition"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingData ? 'animate-spin' : ''}`} /> Sinkronkan Data
              </button>
            </div>

            <KanbanLeads
              leads={dbLeads}
              allCars={dbCars}
              onStatusChange={handleLeadStatusChange}
              onOpenSpk={handleOpenSpk}
            />
          </div>
        )}

        {/* TAB 3: INVENTORY (Enhanced) */}
        {activeTab === 'inventory' && (
          <InventoryManager
            cars={dbCars}
            branches={dbBranches}
            onEditCar={handleEditCarClick}
            onDeleteCar={handleDeleteCarClick}
            onAddCar={() => { setEditingCar(null); setIsCarModalOpen(true) }}
            onAssignBranch={handleAssignBranch}
            onToggleStatus={handleToggleStatus}
          />
        )}

        {/* TAB 4: BRANCH MANAGEMENT */}
        {activeTab === 'branches' && (
          <BranchManagement
            branches={dbBranches}
            allCars={dbCars}
            onCreateBranch={handleCreateBranch}
            onUpdateBranch={handleUpdateBranch}
            onDeleteBranch={handleDeleteBranch}
          />
        )}

        {/* TAB 5: REPORTS & ANALYTICS */}
        {activeTab === 'reports' && (
          <ReportDashboard
            cars={dbCars}
            leads={dbLeads}
            transactions={dbTransactions}
            expenses={dbExpenses}
            transactionStats={transactionStats}
            expenseStats={expenseStats}
          />
        )}

        {/* TAB 6: EXPENSE TRACKER */}
        {activeTab === 'expenses' && (
          <ExpenseTracker
            expenses={dbExpenses}
            cars={dbCars}
            branches={dbBranches}
            onCreateExpense={handleCreateExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}
      </main>

      {/* MODAL: ADD / EDIT CAR */}
      {isCarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl bg-card border border-border shadow-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  {editingCar ? 'Perbarui Data Kendaraan' : 'Tambah Mobil Baru'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Lengkapi spesifikasi teknis, dual pricing, dan verifikasi sertifikasi inspeksi.
                </p>
              </div>
              <button
                onClick={() => setIsCarModalOpen(false)}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCar} className="space-y-4 text-xs">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Nama Model Kendaraan</label>
                  <input
                    type="text"
                    required
                    value={carForm.name}
                    onChange={(e) => setCarForm({ ...carForm, name: e.target.value })}
                    className="w-full rounded-xl border border-border bg-muted p-2.5 font-bold outline-none focus:border-primary"
                    placeholder="Contoh: BMW 330i M Sport"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Merek (Brand)</label>
                  <input
                    type="text"
                    required
                    value={carForm.brand}
                    onChange={(e) => setCarForm({ ...carForm, brand: e.target.value })}
                    className="w-full rounded-xl border border-border bg-muted p-2.5 font-bold outline-none focus:border-primary"
                    placeholder="Contoh: BMW"
                  />
                </div>
              </div>

              {/* Dual Pricing Inputs */}
              <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/20">
                <div>
                  <label className="font-bold text-primary block mb-1">Harga Paket Kredit (OTR)</label>
                  <input
                    type="number"
                    required
                    value={carForm.priceCredit}
                    onChange={(e) => setCarForm({ ...carForm, priceCredit: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border bg-background p-2.5 font-bold outline-none focus:border-primary"
                  />
                  <span className="text-[10px] text-muted-foreground">Harga promosi lebih terjangkau khusus leasing</span>
                </div>
                <div>
                  <label className="font-bold text-foreground block mb-1">Harga Tunai / Cash (OTR)</label>
                  <input
                    type="number"
                    required
                    value={carForm.price}
                    onChange={(e) => setCarForm({ ...carForm, price: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border bg-background p-2.5 font-bold outline-none focus:border-primary"
                  />
                  <span className="text-[10px] text-muted-foreground">Harga pembelian tunai langsung</span>
                </div>
              </div>

              {/* Local Dealership Attributes */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Masa Pajak STNK</label>
                  <input
                    type="text"
                    value={carForm.taxDate}
                    onChange={(e) => setCarForm({ ...carForm, taxDate: e.target.value })}
                    className="w-full rounded-xl border border-border bg-muted p-2.5 font-bold outline-none focus:border-primary"
                    placeholder="Contoh: Oktober 2026"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Plat & Nopol</label>
                  <input
                    type="text"
                    value={carForm.plateNumber}
                    onChange={(e) => setCarForm({ ...carForm, plateNumber: e.target.value })}
                    className="w-full rounded-xl border border-border bg-muted p-2.5 font-bold outline-none focus:border-primary"
                    placeholder="Contoh: B 1234 DEN (Genap)"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Status Kepemilikan</label>
                  <input
                    type="text"
                    value={carForm.ownership}
                    onChange={(e) => setCarForm({ ...carForm, ownership: e.target.value })}
                    className="w-full rounded-xl border border-border bg-muted p-2.5 font-bold outline-none focus:border-primary"
                    placeholder="Contoh: Tangan 1 (Pribadi)"
                  />
                </div>
              </div>

              {/* Technical Specs */}
              <div className="grid sm:grid-cols-4 gap-4">
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Tahun</label>
                  <input
                    type="number"
                    value={carForm.year}
                    onChange={(e) => setCarForm({ ...carForm, year: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border bg-muted p-2.5 font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Kilometer</label>
                  <input
                    type="number"
                    value={carForm.mileage}
                    onChange={(e) => setCarForm({ ...carForm, mileage: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border bg-muted p-2.5 font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Transmisi</label>
                  <select
                    value={carForm.transmission}
                    onChange={(e) => setCarForm({ ...carForm, transmission: e.target.value as any })}
                    className="w-full rounded-xl border border-border bg-muted p-2.5 font-bold outline-none"
                  >
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Bahan Bakar</label>
                  <select
                    value={carForm.fuel}
                    onChange={(e) => setCarForm({ ...carForm, fuel: e.target.value as any })}
                    className="w-full rounded-xl border border-border bg-muted p-2.5 font-bold outline-none"
                  >
                    <option value="Bensin">Bensin</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Listrik">Listrik</option>
                  </select>
                </div>
              </div>

              {/* Photo URL */}
              <div>
                <label className="font-bold text-muted-foreground block mb-1">URL Foto Utama</label>
                <input
                  type="text"
                  required
                  value={carForm.image}
                  onChange={(e) => setCarForm({ ...carForm, image: e.target.value })}
                  className="w-full rounded-xl border border-border bg-muted p-2.5 font-bold outline-none focus:border-primary"
                />
              </div>

              {/* 150-Point Inspection Toggles */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                <p className="font-bold text-foreground">Sertifikasi Inspeksi 150 Titik</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={carForm.isFloodFree}
                      onChange={(e) => setCarForm({ ...carForm, isFloodFree: e.target.checked })}
                      className="rounded text-primary"
                    />
                    <span className="font-semibold text-xs">100% Bebas Banjir</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={carForm.isAccidentFree}
                      onChange={(e) => setCarForm({ ...carForm, isAccidentFree: e.target.checked })}
                      className="rounded text-primary"
                    />
                    <span className="font-semibold text-xs">Bebas Tabrak Besar</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={carForm.isOdometerVerified}
                      onChange={(e) => setCarForm({ ...carForm, isOdometerVerified: e.target.checked })}
                      className="rounded text-primary"
                    />
                    <span className="font-semibold text-xs">Odometer Asli Record</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCarModalOpen(false)}
                  className="rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-sm disabled:opacity-50"
                >
                  {isPending ? 'Menyimpan...' : 'Simpan Data Kendaraan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SPK MODAL */}
      <SpkModal
        isOpen={isSpkOpen}
        onClose={() => setIsSpkOpen(false)}
        lead={spkLead}
        car={spkCar}
        showroomInfo={currentBranch}
      />
    </div>
  )
}

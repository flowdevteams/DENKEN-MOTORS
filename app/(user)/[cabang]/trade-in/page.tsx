"use client"

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  GitCompareArrows,
  CheckCircle2,
  ChevronRight,
  Calculator,
  Car as CarIcon,
  Sparkles,
  ShieldCheck,
  Calendar,
  Clock,
  ArrowRight,
  TrendingDown,
  DollarSign,
  Send,
  Building2,
  FileCheck
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { createLead } from '@/app/actions/leadActions'

const formatIDR = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`

const POPULAR_BRANDS = [
  'Toyota', 'Honda', 'Mitsubishi', 'Hyundai', 'Mazda', 'Nissan', 'BMW', 'Mercedes-Benz', 'Suzuki', 'Daihatsu'
]

export default function TradeInPage() {
  const params = useParams()
  const currentCabang = (params?.cabang as string) || 'jakarta'

  const cars = useStore((state) => state.cars)
  const availableShowroomCars = useMemo(() => {
    return cars.filter((c) => !c.isSoldOut && c.badge !== 'SOLD OUT')
  }, [cars])

  const [step, setStep] = useState(1)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 1: Mobil Lama Form State
  const [myCarBrand, setMyCarBrand] = useState('Honda')
  const [myCarModel, setMyCarModel] = useState('HR-V 1.5 E CVT')
  const [myCarYear, setMyCarYear] = useState('2020')
  const [myCarMileage, setMyCarMileage] = useState('45000')
  const [myCarTransmission, setMyCarTransmission] = useState<'Automatic' | 'Manual'>('Automatic')
  const [myCarCondition, setMyCarCondition] = useState<'Istimewa' | 'Bagus' | 'Ada Lecet Pemakaian'>('Bagus')
  const [myCarTaxStatus, setMyCarTaxStatus] = useState<'Pajak Hidup' | 'Pajak Mati < 1 Tahun' | 'Pajak Mati > 1 Tahun'>('Pajak Hidup')
  const [myCarPlate, setMyCarPlate] = useState<'Ganjil' | 'Genap'>('Genap')

  // Step 2: Mobil Impian & Kalkulasi Selisih
  const [targetCarId, setTargetCarId] = useState<string>(() => availableShowroomCars[0]?.id || '')
  const [remainderPaymentType, setRemainderPaymentType] = useState<'Tunai' | 'Kredit'>('Kredit')
  const [remainderTenor, setRemainderTenor] = useState<number>(4)
  const [additionalDp, setAdditionalDp] = useState<number>(0)

  // Step 3: Kontak & Jadwal Inspeksi
  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('Jakarta')
  const [inspectionDate, setInspectionDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 2)
    return d.toISOString().split('T')[0]
  })
  const [inspectionSession, setInspectionSession] = useState('13:30 - 15:30 WIB (Sesi Siang)')

  // 1. Dynamic Valuation Engine for Old Car
  const oldCarAppraisal = useMemo(() => {
    const age = 2026 - Number(myCarYear)
    let base = 380000000 - age * 32000000

    if (myCarBrand === 'Toyota' || myCarBrand === 'Honda') base += 20000000
    if (myCarBrand === 'BMW' || myCarBrand === 'Mercedes-Benz') base += 60000000

    const km = Number(myCarMileage) || 50000
    if (km < 30000) base += 15000000
    else if (km > 80000) base -= 15000000

    if (myCarCondition === 'Istimewa') base *= 1.05
    if (myCarCondition === 'Ada Lecet Pemakaian') base *= 0.93

    if (myCarTaxStatus === 'Pajak Mati < 1 Tahun') base -= 5000000
    if (myCarTaxStatus === 'Pajak Mati > 1 Tahun') base -= 12000000

    const min = Math.max(65000000, Math.round(base * 0.94))
    const max = Math.max(75000000, Math.round(base * 1.06))
    const median = Math.round((min + max) / 2)

    return { min, max, median }
  }, [myCarBrand, myCarYear, myCarMileage, myCarCondition, myCarTaxStatus])

  // 2. Net Difference & Remainder Loan Calculation
  const selectedTargetCar = useMemo(() => {
    return availableShowroomCars.find((c) => c.id === targetCarId) || availableShowroomCars[0]
  }, [availableShowroomCars, targetCarId])

  const targetCarPrice = selectedTargetCar ? (selectedTargetCar.priceCredit || selectedTargetCar.price) : 0
  const netDifference = Math.max(0, targetCarPrice - oldCarAppraisal.median)
  
  // Credit calculation for remainder balance
  const loanPrincipal = Math.max(0, netDifference - additionalDp)
  const annualInterestRate = 0.045 // 4.5% flat per tahun
  const totalLoanInterest = loanPrincipal * annualInterestRate * remainderTenor
  const monthlyInstallment = loanPrincipal > 0 ? (loanPrincipal + totalLoanInterest) / (remainderTenor * 12) : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await createLead({
        type: 'Trade_In' as any,
        name,
        whatsapp,
        email,
        city,
        carId: selectedTargetCar?.id,
        carName: selectedTargetCar ? selectedTargetCar.name : 'Unit Showroom',
        ownerId: selectedTargetCar?.ownerId || 'admin_owner_1',
        details: {
          oldCar: {
            brand: myCarBrand,
            model: myCarModel,
            year: myCarYear,
            mileage: myCarMileage,
            transmission: myCarTransmission,
            condition: myCarCondition,
            taxStatus: myCarTaxStatus,
            plate: myCarPlate,
            estimatedValuation: oldCarAppraisal.median,
          },
          targetCar: {
            name: selectedTargetCar?.name,
            price: targetCarPrice,
          },
          financialPlan: {
            netDifference,
            remainderPaymentType,
            additionalDp,
            tenor: remainderPaymentType === 'Kredit' ? remainderTenor : 0,
            monthlyInstallment: remainderPaymentType === 'Kredit' ? monthlyInstallment : 0,
          },
          inspectionSchedule: {
            date: inspectionDate,
            session: inspectionSession,
          }
        }
      })
      setIsSuccess(true)
    } catch (err) {
      console.error('Failed to submit trade-in form:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="pt-32 pb-24 min-h-[85vh] flex items-center justify-center bg-secondary/30 px-5">
        <div className="text-center max-w-xl mx-auto p-8 sm:p-12 rounded-3xl bg-card border border-border shadow-2xl space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div>
            <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-3.5 py-1 text-xs font-black tracking-widest uppercase">
              PENGAJUAN TRADE-IN SUKSES
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-black mt-3 text-foreground">
              Simulasi Tukar Tambah Terverifikasi
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1 leading-relaxed">
              Tim penaksir resmi (appraisal) DENKEN MOTORS akan menghubungi Anda via WhatsApp di <strong>{whatsapp}</strong> untuk mengonfirmasi jadwal inspeksi fisik gratis.
            </p>
          </div>

          {/* Detailed Summary Card */}
          <div className="rounded-2xl bg-muted/40 p-5 border border-border/60 text-left text-xs space-y-3">
            <div className="flex justify-between pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium">Mobil Lama Anda:</span>
              <span className="font-bold text-foreground">{myCarBrand} {myCarModel} ({myCarYear})</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium">Taksiran Nilai Tukar Tambah:</span>
              <span className="font-extrabold text-emerald-600">{formatIDR(oldCarAppraisal.median)}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-border/40">
              <span className="text-muted-foreground font-medium">Mobil Impian Showroom:</span>
              <span className="font-bold text-foreground">{selectedTargetCar?.name}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-muted-foreground font-medium">Sisa Selisih Dana:</span>
              <span className="font-black text-sm text-primary">{formatIDR(netDifference)}</span>
            </div>
            {remainderPaymentType === 'Kredit' && monthlyInstallment > 0 && (
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 flex justify-between items-center text-primary font-bold">
                <span>Rencana Cicilan ({remainderTenor} Thn):</span>
                <span>{formatIDR(monthlyInstallment)} / bln</span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`https://wa.me/6287709165697?text=Halo%20DENKEN%20MOTORS,%20saya%20*${encodeURIComponent(name)}*%20telah%20mengajukan%20Trade-In%20*${encodeURIComponent(myCarBrand + ' ' + myCarModel)}*%20ke%20*${encodeURIComponent(selectedTargetCar?.name || '')}*.%20Bisa%20dibantu%20jadwal%20inspeksinya?`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 font-bold text-xs text-white transition shadow-lg"
            >
              <Send className="h-4 w-4" /> Hubungi Sales via WhatsApp
            </a>
            <Link
              href={`/${currentCabang}`}
              className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-card px-6 text-xs font-bold text-muted-foreground hover:bg-muted"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-24 pb-24 min-h-screen bg-secondary/30">
      {/* Header Banner */}
      <div className="bg-card border-b border-border/60 py-16 text-foreground relative overflow-hidden mb-10 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
        <div className="relative mx-auto max-w-7xl px-5 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 mb-4 text-primary text-xs font-extrabold uppercase tracking-widest">
            <GitCompareArrows className="h-4 w-4" /> Smart Trade-In Suite
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-black tracking-tight">
            Kalkulator Selisih Tukar Tambah
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Dapatkan taksiran tertinggi untuk mobil lama Anda dan langsung hitung sisa kekurangan dana untuk upgrade ke mobil impian showroom.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-5 lg:px-8">
        {/* Stepper Progress Bar */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-border -z-10" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 transition-all duration-500"
            style={{ width: `${(step - 1) * 50}%` }}
          />

          {[
            { s: 1, label: '1. Mobil Lama Anda' },
            { s: 2, label: '2. Mobil Impian & Selisih' },
            { s: 3, label: '3. Jadwal & Konfirmasi' },
          ].map((item) => (
            <div key={item.s} className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-4 border-background font-black text-xs transition-all ${
                  step >= item.s ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground'
                }`}
              >
                {item.s}
              </div>
              <span className={`text-[11px] font-bold hidden sm:block ${step >= item.s ? 'text-primary' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Multi-Step Form */}
        <form
          onSubmit={
            step === 3
              ? handleSubmit
              : (e) => {
                  e.preventDefault()
                  setStep((s) => s + 1)
                }
          }
          className="rounded-3xl border border-border/60 bg-card p-6 sm:p-10 shadow-xl space-y-6 text-xs"
        >
          {/* STEP 1: DATA MOBIL LAMA */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="border-b border-border/50 pb-4">
                <h2 className="font-display text-lg font-extrabold text-foreground flex items-center gap-2">
                  <CarIcon className="h-5 w-5 text-primary" /> Rincian Mobil Lama Anda
                </h2>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Masukkan spesifikasi kendaraan lama Anda untuk mendapatkan taksiran harga pasar instan.
                </p>
              </div>

              {/* Brand Quick Selector */}
              <div>
                <label className="font-bold text-muted-foreground block mb-2">Pilih Merek Kendaraan</label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {POPULAR_BRANDS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setMyCarBrand(b)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs border shrink-0 transition ${
                        myCarBrand === b
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-muted/40 border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Model & Varian Mobil</label>
                  <input
                    type="text"
                    required
                    value={myCarModel}
                    onChange={(e) => setMyCarModel(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/40 p-3 font-bold outline-none focus:border-primary"
                    placeholder="Contoh: Innova Reborn 2.4 V Diesel"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Tahun Pembuatan</label>
                  <select
                    value={myCarYear}
                    onChange={(e) => setMyCarYear(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/40 p-3 font-bold outline-none focus:border-primary"
                  >
                    {Array.from({ length: 15 }, (_, i) => 2026 - i).map((yr) => (
                      <option key={yr} value={yr}>
                        Tahun {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Transmisi</label>
                  <select
                    value={myCarTransmission}
                    onChange={(e) => setMyCarTransmission(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-muted/40 p-3 font-bold outline-none"
                  >
                    <option value="Automatic">Automatic (AT)</option>
                    <option value="Manual">Manual (MT)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Estimasi Kilometer (KM)</label>
                  <input
                    type="number"
                    value={myCarMileage}
                    onChange={(e) => setMyCarMileage(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/40 p-3 font-bold outline-none"
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Kondisi Fisik & Mesin</label>
                  <select
                    value={myCarCondition}
                    onChange={(e) => setMyCarCondition(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-muted/40 p-3 font-bold outline-none"
                  >
                    <option value="Istimewa">Istimewa (Cat Orisinil, Bebas Cacat)</option>
                    <option value="Bagus">Bagus (Mulus, Rawatan Berkala)</option>
                    <option value="Ada Lecet Pemakaian">Ada Lecet Pemakaian Ringan</option>
                  </select>
                </div>
              </div>

              {/* Status Pajak & Plat (Indonesian Realities) */}
              <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-muted/30 border border-border/50">
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Status Pajak STNK</label>
                  <select
                    value={myCarTaxStatus}
                    onChange={(e) => setMyCarTaxStatus(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 font-bold outline-none"
                  >
                    <option value="Pajak Hidup">Pajak Hidup / Panjang (Nilai Maksimal)</option>
                    <option value="Pajak Mati < 1 Tahun">Pajak Mati Kurang dari 1 Tahun</option>
                    <option value="Pajak Mati > 1 Tahun">Pajak Mati Lebih dari 1 Tahun</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Plat Nomor Ganjil / Genap</label>
                  <select
                    value={myCarPlate}
                    onChange={(e) => setMyCarPlate(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-background p-2.5 font-bold outline-none"
                  >
                    <option value="Ganjil">Plat Nomor Ganjil</option>
                    <option value="Genap">Plat Nomor Genap</option>
                  </select>
                </div>
              </div>

              {/* Real-Time Appraisal Output Banner */}
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 uppercase tracking-wider">
                    ESTIMASI TAKSIRAN HARGA PASAR
                  </span>
                  <p className="font-display text-2xl font-black text-foreground mt-1">
                    {formatIDR(oldCarAppraisal.min)} – {formatIDR(oldCarAppraisal.max)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Nilai acuan tukar tambah: <strong>{formatIDR(oldCarAppraisal.median)}</strong> (Final setelah inspeksi fisik).
                  </p>
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-primary px-6 py-3 font-bold text-xs text-primary-foreground hover:bg-primary/90 transition shadow flex items-center gap-1.5 shrink-0"
                >
                  Pilih Mobil Impian & Hitung Selisih <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PILIH MOBIL SHOWROOM & HITUNG SELISIH (NET DIFFERENCE) */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="border-b border-border/50 pb-4">
                <h2 className="font-display text-lg font-extrabold text-foreground flex items-center gap-2">
                  <GitCompareArrows className="h-5 w-5 text-primary" /> Pilih Unit Impian & Hitung Selisih Dana
                </h2>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Tentukan mobil yang ingin Anda bawa pulang. Nilai mobil lama otomatis memotong harga showroom.
                </p>
              </div>

              {/* Showroom Target Car Selector Grid */}
              <div>
                <label className="font-bold text-muted-foreground block mb-2.5">
                  Pilih Mobil dari Stok DENKEN MOTORS:
                </label>
                <div className="grid sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {availableShowroomCars.map((car) => {
                    const isSelected = selectedTargetCar?.id === car.id
                    return (
                      <div
                        key={car.id}
                        onClick={() => setTargetCarId(car.id)}
                        className={`p-3 rounded-2xl border cursor-pointer flex items-center gap-3 transition ${
                          isSelected
                            ? 'border-primary bg-primary/10 shadow-sm'
                            : 'border-border bg-muted/20 hover:bg-muted/50'
                        }`}
                      >
                        <img
                          src={car.image}
                          alt={car.name}
                          className="h-12 w-16 object-cover rounded-xl border border-border shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-foreground truncate">{car.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {car.year} • {car.plateNumber || 'Plat B'}
                          </p>
                          <p className="font-mono font-black text-xs text-primary mt-0.5">
                            {formatIDR(car.priceCredit || car.price)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* THE NET-DIFFERENCE CALCULATION CARD */}
              <div className="rounded-3xl border border-border bg-gradient-to-br from-card to-muted/40 p-6 space-y-4 shadow-md">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-primary" /> Rincian Selisih Bersih (Net Difference):
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-border/50">
                    <span className="text-muted-foreground">Harga Mobil Impian ({selectedTargetCar?.name}):</span>
                    <span className="font-bold text-foreground">{formatIDR(targetCarPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border/50">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      Dikurangi Nilai Taksiran Mobil Lama Anda:
                    </span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      - {formatIDR(oldCarAppraisal.median)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 text-sm">
                    <span className="font-black text-foreground">Sisa Kekurangan Dana Bersih:</span>
                    <span className="font-black text-lg text-primary font-mono">{formatIDR(netDifference)}</span>
                  </div>
                </div>

                {/* Sisa Dana Payment Plan */}
                <div className="pt-4 border-t border-border/60 space-y-3">
                  <label className="font-bold text-xs text-foreground block">
                    Bagaimana Anda ingin melunasi sisa dana {formatIDR(netDifference)}?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRemainderPaymentType('Tunai')}
                      className={`p-3 rounded-xl border text-center font-bold transition ${
                        remainderPaymentType === 'Tunai'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      Pelunasan Tunai (Cash)
                      <span className="block text-[10px] font-normal mt-0.5 opacity-80">Bayar lunas saat serah terima</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRemainderPaymentType('Kredit')}
                      className={`p-3 rounded-xl border text-center font-bold transition ${
                        remainderPaymentType === 'Kredit'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      Cicil Sisa Dana (Kredit)
                      <span className="block text-[10px] font-normal mt-0.5 opacity-80">Cicilan ringan tenor 1-5 tahun</span>
                    </button>
                  </div>

                  {remainderPaymentType === 'Kredit' && (
                    <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-3 mt-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-muted-foreground">Pilih Tenor Pembiayaan:</span>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setRemainderTenor(t)}
                              className={`h-8 w-8 rounded-lg font-bold text-xs border transition ${
                                remainderTenor === t
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-card border-border text-foreground hover:bg-muted'
                              }`}
                            >
                              {t}Th
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-border/40">
                        <div>
                          <span className="text-[11px] text-muted-foreground block">Estimasi Cicilan Sisa Dana:</span>
                          <span className="font-display text-lg font-black text-primary">
                            {formatIDR(monthlyInstallment)} <span className="text-xs font-normal text-muted-foreground">/bln</span>
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground text-right">
                          Bunga spesial leasing Denken Motors
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-xl border border-border bg-card px-5 py-2.5 font-bold text-muted-foreground hover:bg-muted"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-6 py-2.5 font-bold text-xs text-primary-foreground hover:bg-primary/90 transition shadow flex items-center gap-1.5"
                >
                  Lanjut ke Jadwal Inspeksi <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: KONTAK & JADWAL INSPEKSI FISIK */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="border-b border-border/50 pb-4">
                <h2 className="font-display text-lg font-extrabold text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" /> Konfirmasi Kontak & Jadwal Inspeksi Gratis
                </h2>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Inspeksi fisik 150 titik mobil lama Anda dilakukan tanpa biaya di showroom atau di rumah Anda.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/40 p-3 font-bold outline-none focus:border-primary"
                    placeholder="Contoh: Hendra Wijaya"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Nomor WhatsApp Aktif</label>
                  <input
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/40 p-3 font-bold outline-none focus:border-primary"
                    placeholder="0812XXXXXXXX"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Domisili / Kota</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/40 p-3 font-bold outline-none focus:border-primary"
                    placeholder="Contoh: Jakarta Selatan"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Pilih Tanggal Janji Temu</label>
                  <input
                    type="date"
                    required
                    value={inspectionDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setInspectionDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/40 p-3 font-bold outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-muted-foreground block mb-1">Pilihan Sesi Waktu Inspeksi</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    '10:00 - 12:00 WIB (Sesi Pagi)',
                    '13:30 - 15:30 WIB (Sesi Siang)',
                    '16:00 - 18:00 WIB (Sesi Sore)',
                  ].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setInspectionSession(s)}
                      className={`p-2.5 rounded-xl border font-bold text-center transition ${
                        inspectionSession === s
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {s.split(' ')[0]}
                      <span className="block text-[9px] font-normal opacity-80">{s.split('(')[1].replace(')', '')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Guarantees */}
              <div className="rounded-2xl bg-muted/30 p-4 border border-border/50 text-[11px] text-muted-foreground space-y-1.5">
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" /> Jaminan Layanan Trade-In DENKEN MOTORS:
                </p>
                <p>• Transparansi 100% tanpa potongan biaya appraisal tersembunyi.</p>
                <p>• Nilai penaksiran mengikat selama 7 hari kalender.</p>
                <p>• Proses serah terima kendaraan lama dan kendaraan baru diselesaikan dalam 1 hari kerja.</p>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-xl border border-border bg-card px-5 py-2.5 font-bold text-muted-foreground hover:bg-muted"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-primary px-8 py-3.5 font-black uppercase tracking-wider text-xs text-primary-foreground hover:bg-primary/90 transition shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Memproses Pengajuan...' : 'Kirim Pengajuan Tukar Tambah'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

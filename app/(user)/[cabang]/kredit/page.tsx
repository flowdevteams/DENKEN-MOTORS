"use client"

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, ChevronRight, FileText } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useStore } from '@/store/useStore'

const formatDots = (n?: number | string | null) => {
  if (n === undefined || n === null || n === '') return ''
  const num = typeof n === 'number' ? n : parseInt(n.toString().replace(/\D/g, ''), 10)
  return isNaN(num) ? '' : num.toLocaleString('id-ID')
}

const parseDots = (s: string) => {
  const cleaned = s.replace(/\D/g, '')
  return cleaned ? parseInt(cleaned, 10) : 0
}

function CreditFormContent() {
  const searchParams = useSearchParams()
  const params = useParams()
  const allCars = useStore((state) => state.cars)
  const branches = useStore((state) => state.branches)
  const addLead = useStore((state) => state.addLead)

  const currentCabang = (params.cabang as string) || 'jakarta'
  const activeBranch = branches.find(b => (b.slug || b.city.toLowerCase().replace(/\s+/g, '-')) === currentCabang) || branches[0]
  
  const showroomParam = searchParams.get('showroom')
  const activeOwnerId = showroomParam || (activeBranch ? activeBranch.ownerId : 'admin_owner_1')
  
  let cars = allCars.filter((car) => (car.ownerId || 'admin_owner_1') === activeOwnerId)
  if (activeBranch) {
    cars = cars.filter(car => {
      const isBranchMatch = car.branchId === activeBranch.id;
      const isCityMatch = car.location.toLowerCase().includes(activeBranch.city.toLowerCase());
      const isNameMatch = car.location.toLowerCase().includes(activeBranch.name.toLowerCase());
      return isBranchMatch || isCityMatch || isNameMatch;
    })
  }

  const [step, setStep] = useState(1)
  const [isSuccess, setIsSuccess] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    email: '',
    city: '',
    carId: searchParams.get('carId') || '',
    dp: searchParams.get('dp') || '100000000',
    tenor: searchParams.get('tenor') || '5',
  })

  useEffect(() => {
    if (searchParams.get('carId')) {
      setFormData((prev) => ({ ...prev, carId: searchParams.get('carId') as string }))
    }
    if (searchParams.get('dp')) {
      setFormData((prev) => ({ ...prev, dp: searchParams.get('dp') as string }))
    }
    if (searchParams.get('tenor')) {
      setFormData((prev) => ({ ...prev, tenor: searchParams.get('tenor') as string }))
    }
  }, [searchParams])

  const selectedCar = cars.find((c) => c.id === formData.carId)

  const handleNext = () => setStep((s) => Math.min(s + 1, 4))
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    addLead({
      type: 'Kredit',
      name: formData.name,
      whatsapp: formData.whatsapp,
      email: formData.email,
      city: formData.city,
      carId: formData.carId,
      carName: selectedCar ? selectedCar.name : 'Belum Dipilih',
      details: {
        dp: formData.dp,
        tenor: formData.tenor,
        carPrice: selectedCar?.price,
      },
    })

    setIsSuccess(true)
  }

  if (isSuccess) {
    return (
      <div className="pt-32 pb-24 min-h-[80vh] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-10 rounded-3xl bg-card border border-border shadow-2xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="font-display text-3xl font-black mb-3">Pengajuan Berhasil!</h1>
          <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
            Terima kasih {formData.name}. Tim konsultan pembiayaan kami akan segera menghubungi nomor WhatsApp (
            {formData.whatsapp}) Anda untuk memandu proses verifikasi dokumen.
          </p>
          <Link
            href={`/${currentCabang}`}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-primary font-bold text-primary-foreground transition-all hover:bg-primary/90 shadow-lg"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-page-shell">
      <div className="mobile-container">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 sm:mb-12 text-center">
            <h1 className="font-display text-xl sm:text-4xl font-black tracking-tight mb-2 sm:mb-4">Formulir Pengajuan Kredit</h1>
          <p className="text-[11px] sm:text-base text-muted-foreground">
            Lengkapi data di bawah ini untuk memulai proses simulasi & pengajuan kredit mobil Anda.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 sm:mb-12 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-border -z-10" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 transition-all duration-500"
            style={{ width: `${(step - 1) * 33.3}%` }}
          />

          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 sm:border-4 border-background text-xs sm:text-sm font-bold transition-colors ${
                step >= s ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-muted-foreground'
              }`}
            >
              {s}
            </div>
          ))}
        </div>

        <form
          onSubmit={
            step === 4
              ? handleSubmit
              : (e) => {
                  e.preventDefault()
                  handleNext()
                }
          }
          className="rounded-2xl sm:rounded-3xl border border-border/50 bg-card p-4 sm:p-10 shadow-2xl"
        >
          {step === 1 && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="font-display text-lg sm:text-2xl font-bold mb-3 sm:mb-6">1. Data Pemohon</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                <div>
                  <label className="text-xs sm:text-sm font-bold mb-1 sm:mb-2 block">Nama Lengkap (KTP)</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-border bg-muted/50 p-2.5 sm:p-3.5 text-xs sm:text-sm outline-none focus:border-primary min-h-[40px]"
                    placeholder="Sesuai KTP"
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-bold mb-1 sm:mb-2 block">Nomor WhatsApp</label>
                  <input
                    required
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full rounded-xl border border-border bg-muted/50 p-2.5 sm:p-3.5 text-xs sm:text-sm outline-none focus:border-primary min-h-[40px]"
                    placeholder="0812xxxx"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <label className="text-xs sm:text-sm font-bold mb-1 sm:mb-2 block">Email</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-border bg-muted/50 p-2.5 sm:p-3.5 text-xs sm:text-sm outline-none focus:border-primary min-h-[40px]"
                    placeholder="email@contoh.com"
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-bold mb-1 sm:mb-2 block">Kota Domisili</label>
                  <input
                    required
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full rounded-xl border border-border bg-muted/50 p-2.5 sm:p-3.5 text-xs sm:text-sm outline-none focus:border-primary min-h-[40px]"
                    placeholder="Contoh: Jakarta"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="font-display text-xl sm:text-2xl font-bold mb-5 sm:mb-6">
                2. {searchParams.get('carId') ? 'Kendaraan Pilihan' : 'Pilih Kendaraan'}
              </h2>
              {!searchParams.get('carId') && (
                <div>
                  <label className="text-sm font-bold mb-2 block">Kendaraan Target</label>
                  <select
                    required
                    value={formData.carId}
                    onChange={(e) => setFormData({ ...formData, carId: e.target.value })}
                    className="w-full appearance-none rounded-xl border border-border bg-muted/50 p-4 outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="">-- Pilih Mobil --</option>
                    {cars.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.brand} {c.name} - Rp {(c.price / 1000000).toLocaleString('id-ID')} Jt
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {selectedCar && (
                <div className="rounded-2xl border border-border bg-muted/50 p-4 sm:p-5 flex flex-col sm:flex-row gap-3 sm:gap-5 sm:items-center">
                  <img
                    src={selectedCar.image}
                    alt={selectedCar.name}
                    className="h-40 w-full sm:h-20 sm:w-32 object-cover object-center rounded-xl border border-border/50"
                  />
                  <div>
                    <p className="font-bold font-display text-lg">{selectedCar.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedCar.year} • {selectedCar.transmission} • {selectedCar.engine}
                    </p>
                    <p className="text-sm font-bold text-primary mt-1">
                      Rp {selectedCar.price.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="font-display text-lg sm:text-2xl font-bold mb-3 sm:mb-6">3. Rencana Pembiayaan</h2>
              <div>
                <label className="text-xs sm:text-sm font-bold mb-1 sm:mb-2 block">Rencana Uang Muka (DP)</label>
                <div className="relative">
                  <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">Rp</span>
                  <input
                    required
                    type="text"
                    value={formatDots(formData.dp)}
                    onChange={(e) => setFormData({ ...formData, dp: parseDots(e.target.value).toString() })}
                    className="w-full rounded-xl border border-border bg-muted/50 p-2.5 sm:p-4 pl-9 sm:pl-12 font-mono font-bold text-xs sm:text-sm outline-none focus:border-primary min-h-[40px]"
                    placeholder="100.000.000"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-bold mb-1 sm:mb-2 block">Pilih Tenor Kredit</label>
                <div className="grid grid-cols-5 gap-1 sm:gap-2">
                  {[1, 2, 3, 4, 5].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData({ ...formData, tenor: t.toString() })}
                      className={`py-2 sm:py-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
                        formData.tenor === t.toString()
                          ? 'border-primary bg-primary text-primary-foreground shadow-md'
                          : 'border-border bg-muted/50 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {t} Thn
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <FileText className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
                <h2 className="font-display text-lg sm:text-2xl font-bold">4. Ringkasan Pengajuan</h2>
              </div>

              <div className="rounded-xl sm:rounded-2xl border border-border bg-muted/30 p-3 sm:p-6 space-y-3 sm:space-y-4 text-xs sm:text-sm font-medium">
                <div className="flex justify-between items-center pb-2 sm:pb-3 border-b border-border/50">
                  <span className="text-muted-foreground">Nama Lengkap</span>
                  <span className="font-bold text-foreground">{formData.name}</span>
                </div>
                <div className="flex justify-between items-center pb-2 sm:pb-3 border-b border-border/50">
                  <span className="text-muted-foreground">Nomor WhatsApp</span>
                  <span className="font-bold text-foreground">{formData.whatsapp}</span>
                </div>
                <div className="flex justify-between items-center pb-2 sm:pb-3 border-b border-border/50">
                  <span className="text-muted-foreground">Mobil Pilihan</span>
                  <span className="font-bold text-foreground truncate max-w-[160px] sm:max-w-none">{selectedCar?.name || '-'}</span>
                </div>
                <div className="flex justify-between items-center pb-2 sm:pb-3 border-b border-border/50">
                  <span className="text-muted-foreground">Uang Muka (DP)</span>
                  <span className="font-bold text-foreground">Rp {Number(formData.dp).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tenor Kredit</span>
                  <span className="font-bold text-foreground">{formData.tenor} Tahun</span>
                </div>
              </div>

              <label className="flex items-start gap-2.5 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                  Saya mengonfirmasi bahwa data yang saya berikan adalah benar, dan saya menyetujui syarat & ketentuan pengajuan pembiayaan di DENKEN MOTORS.
                </span>
              </label>
            </div>
          )}

          {/* Form Actions */}
          <div className="mt-6 sm:mt-10 flex gap-2.5 sm:gap-4 pt-4 sm:pt-6 border-t border-border/50">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="h-10 sm:h-12 rounded-full border border-border px-4 sm:px-8 text-xs sm:text-sm font-bold transition-all hover:bg-muted active:scale-95"
              >
                Kembali
              </button>
            )}
            <button
              type="submit"
              className="flex h-10 sm:h-12 flex-1 items-center justify-center gap-1.5 sm:gap-2 rounded-full bg-primary px-4 sm:px-8 text-xs sm:text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg active:scale-95"
            >
              {step === 4 ? 'Kirim Pengajuan' : 'Selanjutnya'} <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  )
}

export default function KreditPage() {
  return (
    <Suspense fallback={<div className="pt-32 pb-20 text-center min-h-screen"><p>Memuat formulir...</p></div>}>
      <CreditFormContent />
    </Suspense>
  )
}

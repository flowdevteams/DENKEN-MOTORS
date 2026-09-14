"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  ArrowRight,
  Car as CarIcon,
  MessageSquare,
  Calculator,
  Lock,
  Calendar
} from 'lucide-react'
import { useStore } from '@/store/useStore'
import { BookingModal } from '@/components/BookingModal'
import { TestDriveModal } from '@/components/TestDriveModal'

const formatIDR = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

export default function CarDetailPage() {
  const routeParams = useParams()
  const slug = (routeParams?.slug as string) || ''
  const cabang = (routeParams?.cabang as string) || 'jakarta'

  const cars = useStore((state) => state.cars)
  const car = cars.find((c) => c.slug === slug || c.id === slug)

  const [activeImage, setActiveImage] = useState(0)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [isTestDriveOpen, setIsTestDriveOpen] = useState(false)

  if (!car) {
    return (
      <div className="pt-32 pb-24 min-h-[80vh] flex flex-col items-center justify-center text-center px-5 bg-secondary/30">
        <div className="rounded-full bg-primary/10 p-6 mb-4 text-primary">
          <CarIcon className="h-12 w-12" />
        </div>
        <h1 className="font-display text-3xl font-bold">Mobil Tidak Ditemukan</h1>
        <p className="mt-2 text-muted-foreground max-w-md text-sm">
          Maaf, unit mobil yang Anda cari tidak ditemukan atau telah terjual. Jelajahi unit impian lainnya di katalog kami.
        </p>
        <Link
          href={`/${cabang}/mobil`}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-xs font-bold text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
        >
          Lihat Semua Mobil <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  const gallery = car.gallery && car.gallery.length > 0 ? car.gallery : [car.image]

  const handleNextPhoto = () => {
    setActiveImage((prev) => (prev + 1) % gallery.length)
  }

  const handlePrevPhoto = () => {
    setActiveImage((prev) => (prev - 1 + gallery.length) % gallery.length)
  }

  return (
    <div className="pt-24 pb-24 min-h-screen bg-secondary/30">
      {/* Breadcrumbs */}
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-6">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Link href={`/${cabang}`} className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={`/${cabang}/mobil`} className="hover:text-primary transition-colors">
            Mobil
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-bold">{car.name}</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10">
          {/* Left Column: Images & Specs */}
          <div className="space-y-10">
            {/* Gallery Slider */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative aspect-[16/10] overflow-hidden rounded-[2.5rem] bg-muted shadow-xl border border-border/60"
              >
                <img src={gallery[activeImage] || car.image} alt={car.name} className="h-full w-full object-cover object-center transition-all duration-500" />
                
                {car.badge && (
                  <span className="absolute left-6 top-6 rounded-full bg-primary/95 backdrop-blur-md px-5 py-2 text-xs font-bold tracking-[0.2em] text-primary-foreground shadow-lg z-10">
                    {car.badge}
                  </span>
                )}

                {/* Photo Index Counter Badge */}
                {gallery.length > 1 && (
                  <span className="absolute right-6 top-6 rounded-full bg-black/60 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-white shadow-lg z-10">
                    {activeImage + 1} / {gallery.length} Foto
                  </span>
                )}

                {/* Left & Right Slider Arrows */}
                {gallery.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevPhoto}
                      aria-label="Foto Sebelumnya"
                      className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md opacity-80 hover:opacity-100 hover:scale-110 transition-all z-10 shadow-lg"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={handleNextPhoto}
                      aria-label="Foto Selanjutnya"
                      className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md opacity-80 hover:opacity-100 hover:scale-110 transition-all z-10 shadow-lg"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}
              </motion.div>

              {gallery.length > 1 && (
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2.5">
                  {gallery.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-all ${
                        activeImage === idx
                          ? 'border-primary shadow-md scale-[1.05]'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`${car.name} ${idx + 1}`} className="h-full w-full object-cover object-center" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Specs Grid */}
            <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-xl">
              <h2 className="font-display text-2xl font-bold mb-6">Spesifikasi Kendaraan</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-muted/40 p-4 border border-border/40">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Tahun</p>
                  <p className="font-display font-bold text-base">{car.year}</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4 border border-border/40">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Kilometer</p>
                  <p className="font-display font-bold text-base">{car.mileage.toLocaleString('id-ID')} KM</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4 border border-border/40">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Transmisi</p>
                  <p className="font-display font-bold text-base">{car.transmission}</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4 border border-border/40">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Bahan Bakar</p>
                  <p className="font-display font-bold text-base">{car.fuel}</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4 border border-border/40">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Mesin</p>
                  <p className="font-display font-bold text-base">{car.engine}</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4 border border-border/40">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Warna</p>
                  <p className="font-display font-bold text-base">{car.color}</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4 border border-border/40">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Tipe Bodi</p>
                  <p className="font-display font-bold text-base">{car.type}</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4 border border-border/40">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Kondisi</p>
                  <p className="font-display font-bold text-base">{car.condition}</p>
                </div>
              </div>
            </div>

            {/* CERTIFIED 150-POINT INSPECTION REPORT */}
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-8 shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div>
                  <span className="rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest">
                    DENKEN CERTIFIED QUALITY
                  </span>
                  <h2 className="font-display text-2xl font-bold mt-2 text-foreground">
                    Sertifikasi Inspeksi 150 Titik
                  </h2>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-card px-4 py-2 border border-border/50 text-xs font-bold text-foreground">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  Garansi Mesin & Transmisi 1 Tahun
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3.5 bg-card/80 p-4 rounded-2xl border border-border/40">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">100% Bebas Tabrakan Besar</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Struktur sasis, pilar utama, dan apron utuh standar pabrik tanpa bekas las.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 bg-card/80 p-4 rounded-2xl border border-border/40">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">100% Bebas Terendam Banjir</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Kabin bebas bau lembab, jalur kelistrikan & bawah karpet bersih dari residu lumpur.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 bg-card/80 p-4 rounded-2xl border border-border/40">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Odometer Asli Terverifikasi</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Jarak tempuh {car.mileage.toLocaleString('id-ID')} KM sinkron dengan buku riwayat bengkel resmi.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 bg-card/80 p-4 rounded-2xl border border-border/40">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Dokumen & Legalitas Terjamin</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">BPKB, STNK, Faktur Asli telah lolos uji cek fisik Samsat & Ditlantas Polda.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Administrative Specs (Local Dealership) */}
            <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-xl">
              <h2 className="font-display text-2xl font-bold mb-6">Status Dokumen & Administrasi</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-muted/40 p-4 border border-border/40">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Masa Pajak STNK</p>
                  <p className="font-display font-bold text-base text-emerald-600 dark:text-emerald-400">{car.taxDate || 'Oktober 2026'}</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4 border border-border/40">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Plat & Nopol</p>
                  <p className="font-display font-bold text-base">{car.plateNumber || 'Plat B (Genap)'}</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4 border border-border/40">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Riwayat Pemilik</p>
                  <p className="font-display font-bold text-base">{car.ownership || 'Tangan 1 (Pribadi)'}</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4 border border-border/40">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Riwayat Servis</p>
                  <p className="font-display font-bold text-base">{car.serviceRecord || 'Bengkel Resmi ATPM'}</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4 border border-border/40 sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Kelengkapan Berkas</p>
                  <p className="font-display font-bold text-sm text-foreground">
                    {car.documents && car.documents.length > 0 
                      ? car.documents.join(' • ') 
                      : 'BPKB Asli • STNK • Faktur • Kunci Serep • Buku Manual'}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-xl">
              <h2 className="font-display text-2xl font-bold mb-4">Deskripsi Kendaraan</h2>
              <p className="text-muted-foreground leading-relaxed text-base">{car.description}</p>
            </div>

            {/* Features */}
            {car.features && car.features.length > 0 && (
              <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-xl">
                <h2 className="font-display text-2xl font-bold mb-6">Fitur & Perlengkapan Unggulan</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {car.features.map((f) => (
                    <div key={f} className="flex items-center gap-3 bg-muted/30 p-3.5 rounded-2xl border border-border/40">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-xs text-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Pricing & Action Card */}
          <div>
            <div className="sticky top-28 space-y-6">
              <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-2xl">
                <div className="mb-6">
                  <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                    {car.brand} • {car.year}
                    {car.isSoldOut && (
                      <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black text-white">SOLD OUT</span>
                    )}
                  </p>
                  <h1 className="font-display text-3xl font-extrabold tracking-tight mb-2 text-foreground">
                    {car.name}
                  </h1>
                  <p className="text-muted-foreground flex items-center gap-2 text-xs font-medium">
                    <MapPin className="h-4 w-4 text-primary" /> Showroom {car.location}
                  </p>
                </div>

                {/* DUAL PRICING HERO: KREDIT VS CASH */}
                <div className="mb-8 border-y border-border/50 py-6 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="rounded bg-primary/15 text-primary px-2 py-0.5 text-[10px] font-black tracking-widest">
                        HARGA SPESIAL PAKET KREDIT
                      </span>
                    </div>
                    <p className="font-display text-3xl sm:text-4xl font-black text-primary tracking-tight">
                      {formatIDR(car.priceCredit || Math.round(car.price * 0.95))}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border/30">
                    <span className="text-xs font-semibold text-muted-foreground">Harga Tunai (Cash OTR)</span>
                    <span className="font-display text-base font-bold text-foreground">{formatIDR(car.price)}</span>
                  </div>
                </div>

                {/* Monthly Installment Highlight */}
                <div className="rounded-2xl bg-primary/10 border border-primary/20 p-5 mb-8">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Estimasi Cicilan</p>
                    <p className="font-display text-2xl font-black text-primary">
                      {formatIDR(car.monthly)}
                      <span className="text-xs font-normal text-muted-foreground">/bln</span>
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Estimasi DP mulai <strong className="text-foreground">{formatIDR(car.dp)}</strong> dengan pilihan tenor hingga 5 tahun.
                  </p>
                </div>

                <div className="space-y-3">
                  {car.isSoldOut ? (
                    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-center mb-4">
                      <p className="font-display text-lg font-black text-red-600 mb-1">UNIT TERJUAL (SOLD OUT)</p>
                      <p className="text-xs text-muted-foreground">Mohon maaf, unit ini sudah tidak tersedia. Silakan cek koleksi kami yang lain.</p>
                    </div>
                  ) : (
                    <>
                      {/* PRIORITY ACTION: KUNCI UNIT (BOOKING FEE) */}
                      <button
                        type="button"
                        onClick={() => setIsBookingOpen(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.01]"
                      >
                        <Lock className="h-4 w-4" /> Kunci Unit Ini (Booking Fee)
                      </button>

                      {/* VIP TEST DRIVE SCHEDULER */}
                      <button
                        type="button"
                        onClick={() => setIsTestDriveOpen(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card hover:bg-muted py-3 text-xs font-bold text-foreground transition-all shadow-sm"
                      >
                        <Calendar className="h-4 w-4 text-primary" /> Jadwalkan Test Drive VIP
                      </button>

                      <Link
                        href={`/${cabang}/simulasi-kredit?carId=${car.id}`}
                        className="flex w-full items-center justify-center gap-2 rounded-full border border-primary/40 bg-primary/10 py-3 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground hover:scale-[1.01] shadow-sm"
                      >
                        <Calculator className="h-4 w-4" /> Hitung Simulasi Kredit
                      </Link>

                      <div className="grid grid-cols-2 gap-3">
                        <Link
                          href={`/${cabang}/beli-cash?carId=${car.id}`}
                          className="flex w-full items-center justify-center rounded-full bg-foreground py-3.5 text-xs font-bold text-background transition-all hover:bg-foreground/90 hover:scale-[1.02] shadow-lg"
                        >
                          Beli Cash
                        </Link>

                        <Link
                          href={`/${cabang}/kredit?carId=${car.id}`}
                          className="flex w-full items-center justify-center rounded-full bg-primary py-3.5 text-xs font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:scale-[1.02] shadow-lg shadow-primary/25"
                        >
                          Ajukan Kredit
                        </Link>
                      </div>
                    </>
                  )}

                  <div className="flex gap-3">
                    <a
                      href={`https://wa.me/6287709165697?text=Halo%20DENKEN%20MOTORS,%20saya%20tertarik%20dengan%20${encodeURIComponent(
                        car.name
                      )}%20(${formatIDR(car.price)}).%20Bisa%20info%20jadwal%20test%20drive?`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-background py-3.5 text-xs font-bold hover:bg-muted transition-all"
                    >
                      <MessageSquare className="h-4 w-4 text-emerald-500" /> Chat Sales Consultant
                    </a>
                  </div>
                </div>
              </div>

              {/* Certification Badge Box */}
              <div className="rounded-3xl border border-border/60 bg-card p-6 flex items-start gap-4 shadow-sm">
                <div className="rounded-2xl bg-primary/10 p-3.5 text-primary shrink-0 border border-primary/20">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">DENKEN Certified Guarantee</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Unit bersertifikat lulus 150 titik inspeksi ketat, bebas kecelakaan besar, dan jaminan keabsahan dokumen 100%.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        car={car}
        currentCabang={cabang}
      />

      <TestDriveModal
        isOpen={isTestDriveOpen}
        onClose={() => setIsTestDriveOpen(false)}
        car={car}
        currentCabang={cabang}
      />
    </div>
  )
}

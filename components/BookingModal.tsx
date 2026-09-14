"use client"

import { useState } from 'react'
import {
  X,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Upload,
  Building2,
  Copy,
  Check,
  CreditCard,
  QrCode,
  FileText,
  AlertCircle
} from 'lucide-react'
import { createLead } from '@/app/actions/leadActions'

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  car: any
  currentCabang?: string
}

export function BookingModal({ isOpen, onClose, car, currentCabang = 'jakarta' }: BookingModalProps) {
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [bookingFee] = useState(10000000) // Rp 10.000.000 tanda jadi standar mobil premium
  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [city, setCity] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'BCA' | 'Mandiri' | 'QRIS'>('BCA')
  const [proofFileName, setProofFileName] = useState('')
  const [copiedAccount, setCopiedAccount] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingCode, setBookingCode] = useState('')

  if (!isOpen || !car) return null

  const formatIDR = (n: number) => `Rp ${n.toLocaleString('id-ID')}`

  const bankAccounts = {
    BCA: {
      bank: 'Bank Central Asia (BCA)',
      accountNumber: '883-918-2819',
      accountName: 'PT DENKEN MOTORS INDONESIA',
    },
    Mandiri: {
      bank: 'Bank Mandiri',
      accountNumber: '127-00-98218-091',
      accountName: 'PT DENKEN MOTORS INDONESIA',
    },
    QRIS: {
      bank: 'QRIS Pembayaran Resmi (GOPAY/OVO/BCA/ShopeePay)',
      accountNumber: 'NMID: ID1020261123984',
      accountName: 'DENKEN MOTORS INDONESIA',
    }
  }

  const handleCopyAccount = (num: string) => {
    navigator.clipboard.writeText(num)
    setCopiedAccount(true)
    setTimeout(() => setCopiedAccount(false), 2000)
  }

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const code = `DK-LOCK-${Math.floor(1000 + Math.random() * 9000)}`
    setBookingCode(code)

    try {
      await createLead({
        type: 'Cash',
        name,
        whatsapp,
        city: city || 'Jakarta',
        carId: car.id,
        carName: car.name,
        ownerId: car.ownerId || 'admin_owner_1',
        details: {
          isBookingLock: true,
          bookingFee,
          paymentMethod,
          proofFileName: proofFileName || 'Bukti_Transfer_Tanda_Jadi.jpg',
          bookingCode: code,
          lockDurationHours: 48,
          timestamp: new Date().toISOString(),
        }
      })
      setStep('success')
    } catch (err) {
      console.error('Failed to submit booking lock:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-card border border-border shadow-2xl p-6 sm:p-8 my-8 max-h-[92vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Lock className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-display font-bold text-base text-foreground">
                Kunci Unit Online (Tanda Jadi)
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Kunci unit {car.name} selama 48 jam agar tidak dilepas ke pembeli lain
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSubmitBooking} className="mt-5 space-y-5 text-xs">
            {/* Unit Summary Card */}
            <div className="rounded-2xl bg-muted/40 border border-border/50 p-4 flex items-center gap-3.5">
              <img
                src={car.image}
                alt={car.name}
                className="h-14 w-20 object-cover rounded-xl border border-border/60 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  {car.year} • {car.plateNumber || 'Plat B'}
                </span>
                <p className="font-extrabold text-sm text-foreground truncate">{car.name}</p>
                <p className="font-mono text-xs font-bold text-muted-foreground mt-0.5">
                  Harga: {formatIDR(car.priceCredit || car.price)}
                </p>
              </div>
            </div>

            {/* Rekening Resmi Showroom */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-amber-500" /> Rekening Resmi PT Showroom
                </span>
                <span className="rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black px-2 py-0.5">
                  TANDA JADI: {formatIDR(bookingFee)}
                </span>
              </div>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-3 gap-2">
                {(['BCA', 'Mandiri', 'QRIS'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`rounded-xl p-2 font-bold text-center border transition ${
                      paymentMethod === m
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Account Details Box */}
              <div className="rounded-xl bg-card p-3 border border-border/70 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground">{bankAccounts[paymentMethod].bank}</p>
                  <p className="font-mono font-black text-sm text-foreground tracking-wider">
                    {bankAccounts[paymentMethod].accountNumber}
                  </p>
                  <p className="text-[10px] font-bold text-primary mt-0.5">
                    a/n {bankAccounts[paymentMethod].accountName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyAccount(bankAccounts[paymentMethod].accountNumber)}
                  className="flex items-center gap-1 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-[10px] font-bold text-foreground hover:bg-primary hover:text-primary-foreground transition"
                >
                  {copiedAccount ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  {copiedAccount ? 'Disalin' : 'Salin'}
                </button>
              </div>
            </div>

            {/* Input Data Pemesan */}
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-muted-foreground block mb-1">Nama Lengkap Pemesan</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/40 p-2.5 font-bold outline-none focus:border-primary"
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
                    className="w-full rounded-xl border border-border bg-muted/40 p-2.5 font-bold outline-none focus:border-primary"
                    placeholder="0812XXXXXXXX"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-muted-foreground block mb-1">Domisili / Kota</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/40 p-2.5 font-bold outline-none focus:border-primary"
                  placeholder="Contoh: Jakarta Selatan"
                />
              </div>

              {/* Upload Proof Mock / Selector */}
              <div>
                <label className="font-bold text-muted-foreground block mb-1">Bukti Transfer Tanda Jadi</label>
                <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-3 text-center">
                  <input
                    type="file"
                    id="proofUpload"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setProofFileName(e.target.files[0].name)
                      }
                    }}
                  />
                  <label htmlFor="proofUpload" className="cursor-pointer flex flex-col items-center gap-1">
                    <Upload className="h-5 w-5 text-primary" />
                    <span className="font-bold text-foreground">
                      {proofFileName ? proofFileName : 'Pilih Foto / Screenshot Struk Transfer'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Format JPG, PNG, atau PDF (Maks 5 MB)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Disclaimer Guarantee */}
            <div className="rounded-xl bg-muted/30 p-3 border border-border/40 text-[10px] text-muted-foreground space-y-1">
              <p className="font-bold text-foreground flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Jaminan Keamanan Transaksi:
              </p>
              <p>Tanda jadi resmi dilindungi oleh rekening perusahaan berbadan hukum PT Denken Motors Indonesia. Unit otomatis dikunci selama 48 jam untuk inspeksi dan akad pelunasan.</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg transition disabled:opacity-50"
            >
              {isSubmitting ? 'Memproses Penguncian...' : `Konfirmasi & Kunci Unit (${formatIDR(bookingFee)})`}
            </button>
          </form>
        ) : (
          /* SUCCESS SCREEN: VIP BOOKING PASS */
          <div className="mt-6 text-center space-y-5 py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-3 py-1 text-[10px] font-black tracking-widest uppercase">
                UNIT BERHASIL DIKUNCI
              </span>
              <h3 className="font-display text-xl font-extrabold text-foreground mt-2">
                Booking Pass Terverifikasi
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Terima kasih, <strong>{name}</strong>. Unit <strong>{car.name}</strong> kini berstatus dikunci untuk Anda selama 48 jam.
              </p>
            </div>

            <div className="rounded-2xl bg-muted/40 border border-border p-4 text-left text-xs space-y-2 max-w-sm mx-auto">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kode Booking:</span>
                <span className="font-mono font-black text-primary">{bookingCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unit Mobil:</span>
                <span className="font-bold text-foreground">{car.name} ({car.year})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tanda Jadi:</span>
                <span className="font-bold text-foreground">{formatIDR(bookingFee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Masa Penguncian:</span>
                <span className="font-bold text-emerald-600">48 Jam (Prioritas Utama)</span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Sales Consultant Denken Motors akan segera menghubungi Anda di WhatsApp ({whatsapp}) untuk konfirmasi jadwal inspeksi fisik & penandatanganan SPK.
            </p>

            <button
              onClick={onClose}
              className="w-full rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow"
            >
              Selesai & Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

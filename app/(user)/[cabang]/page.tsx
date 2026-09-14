import { Suspense } from 'react'
import { getCars } from '@/app/actions/carActions'
import HomeClient from './HomeClient'

export const revalidate = 60

export default async function Home() {
  // Ambil data mobil dari Supabase (Prisma)
  const dbCars = await getCars()

  return (
    <Suspense fallback={<div className="pt-32 pb-20 min-h-screen text-center"><p>Memuat halaman utama...</p></div>}>
      <HomeClient initialCars={dbCars} />
    </Suspense>
  )
}

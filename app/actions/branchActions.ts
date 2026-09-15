"use server"

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createBranch(data: {
  id?: string
  slug: string
  name: string
  city: string
  address: string
  mapUrl?: string
  phone?: string
  openDays?: string
  openHours?: string
  description?: string
  ownerId: string
}) {
  try {
    // Ensure User exists before creating Branch
    const userExists = await prisma.user.findUnique({ where: { id: data.ownerId } });
    if (!userExists) {
      await prisma.user.create({
        data: {
          id: data.ownerId,
          name: 'Showroom Admin',
          email: `${data.ownerId}@denkenmotors.id`,
          role: 'OWNER'
        }
      });
    }

    const branch = await prisma.branch.create({
      data: {
        id: data.id,
        slug: data.slug,
        name: data.name,
        city: data.city,
        address: data.address,
        mapUrl: data.mapUrl || '',
        phone: data.phone || '',
        openDays: data.openDays || 'Senin - Sabtu',
        openHours: data.openHours || '09:00 - 18:00',
        description: data.description || '',
        ownerId: data.ownerId,
      },
    })
    
    revalidatePath('/')
    revalidatePath('/admin')
    return { success: true, branch }
  } catch (error) {
    console.error('Error creating branch:', error)
    return { success: false, error: 'Gagal membuat cabang' }
  }
}

export async function getBranches(ownerId?: string) {
  try {
    const branches = await prisma.branch.findMany({
      where: ownerId ? { ownerId } : undefined,
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: {
            cars: true,
            transactions: true,
          }
        }
      }
    })
    return branches
  } catch (error) {
    console.error('Error fetching branches:', error)
    return []
  }
}

export async function updateBranch(id: string, data: {
  name?: string
  city?: string
  address?: string
  mapUrl?: string
  phone?: string
  openDays?: string
  openHours?: string
  description?: string
  isActive?: boolean
}) {
  try {
    const branch = await prisma.branch.update({
      where: { id },
      data,
    })
    revalidatePath('/')
    revalidatePath('/admin')
    return { success: true, branch }
  } catch (error) {
    console.error('Error updating branch:', error)
    return { success: false, error: 'Gagal memperbarui cabang' }
  }
}

export async function deleteBranch(id: string) {
  try {
    // First, unassign all cars from this branch
    await prisma.car.updateMany({
      where: { branchId: id },
      data: { branchId: null },
    })
    
    await prisma.branch.delete({ where: { id } })
    revalidatePath('/')
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('Error deleting branch:', error)
    return { success: false, error: 'Gagal menghapus cabang' }
  }
}

export async function getBranchStats(ownerId: string = 'admin_owner_1') {
  try {
    const branches = await prisma.branch.findMany({
      where: { ownerId },
      include: {
        cars: {
          select: {
            id: true,
            price: true,
            isSoldOut: true,
          }
        },
        _count: {
          select: {
            cars: true,
            transactions: true,
            expenses: true,
          }
        }
      }
    })

    return branches.map((b) => ({
      id: b.id,
      name: b.name,
      city: b.city,
      isActive: b.isActive,
      totalCars: b._count.cars,
      readyCars: b.cars.filter(c => !c.isSoldOut).length,
      soldCars: b.cars.filter(c => c.isSoldOut).length,
      totalValuation: b.cars.filter(c => !c.isSoldOut).reduce((s, c) => s + c.price, 0),
      totalTransactions: b._count.transactions,
      totalExpenses: b._count.expenses,
    }))
  } catch (error) {
    console.error('Error fetching branch stats:', error)
    return []
  }
}

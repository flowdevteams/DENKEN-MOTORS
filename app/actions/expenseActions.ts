"use server"

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { ExpenseCategory } from '@prisma/client'

export async function createExpense(data: {
  category: ExpenseCategory
  description: string
  amount: number
  date?: string
  carId?: string
  branchId?: string
  ownerId: string
}) {
  try {
    const expense = await prisma.expense.create({
      data: {
        category: data.category,
        description: data.description,
        amount: data.amount,
        date: data.date ? new Date(data.date) : new Date(),
        carId: data.carId || null,
        branchId: data.branchId || null,
        ownerId: data.ownerId,
      },
    })
    revalidatePath('/admin')
    return { success: true, expense }
  } catch (error) {
    console.error('Error creating expense:', error)
    return { success: false, error: 'Gagal mencatat pengeluaran' }
  }
}

export async function getExpenses(ownerId: string = 'admin_owner_1') {
  try {
    const expenses = await prisma.expense.findMany({
      where: { ownerId },
      orderBy: { date: 'desc' },
      include: {
        car: { select: { name: true, brand: true } },
        branch: { select: { name: true } },
      },
    })
    return expenses
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return []
  }
}

export async function getExpenseStats(ownerId: string = 'admin_owner_1') {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [allExpenses, monthlyExpenses] = await Promise.all([
      prisma.expense.aggregate({
        where: { ownerId },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: {
          ownerId,
          date: { gte: startOfMonth },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ])

    // Group by category for current month
    const byCategory = await prisma.expense.groupBy({
      by: ['category'],
      where: {
        ownerId,
        date: { gte: startOfMonth },
      },
      _sum: { amount: true },
      _count: true,
    })

    return {
      totalAll: allExpenses._sum.amount || 0,
      totalMonth: monthlyExpenses._sum.amount || 0,
      countMonth: monthlyExpenses._count || 0,
      byCategory: byCategory.map((c) => ({
        category: c.category,
        total: c._sum.amount || 0,
        count: c._count,
      })),
    }
  } catch (error) {
    console.error('Error fetching expense stats:', error)
    return { totalAll: 0, totalMonth: 0, countMonth: 0, byCategory: [] }
  }
}

export async function deleteExpense(id: string) {
  try {
    await prisma.expense.delete({ where: { id } })
    revalidatePath('/admin')
    return { success: true }
  } catch (error) {
    console.error('Error deleting expense:', error)
    return { success: false, error: 'Gagal menghapus pengeluaran' }
  }
}

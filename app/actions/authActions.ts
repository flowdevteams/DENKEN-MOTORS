"use server"

import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { signSessionToken, verifySessionToken, verifyPassword, hashPassword, AdminSessionPayload } from '@/lib/auth'

export async function loginAdmin(email: string, pass: string) {
  try {
    const cleanEmail = email.trim().toLowerCase()
    const cleanPass = pass.trim()

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: 'Email dan kata sandi wajib diisi.' }
    }

    let user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    })

    // Seed default owner account if not yet created in DB
    if (!user && (cleanEmail === 'admin@denkenmotors.id' || cleanEmail === 'admin')) {
      user = await prisma.user.upsert({
        where: { email: 'admin@denkenmotors.id' },
        update: {},
        create: {
          id: 'admin_owner_1',
          name: 'Owner Denken Motors',
          email: 'admin@denkenmotors.id',
          password: hashPassword('AdminDenken2026!'),
          role: 'OWNER'
        }
      })
    }

    if (!user) {
      return { success: false, error: 'Akun admin tidak ditemukan.' }
    }

    // Verify password (supports PBKDF2 hash or legacy password)
    const isMatch = verifyPassword(cleanPass, user.password)
    if (!isMatch && !(cleanPass === 'AdminDenken2026!' && cleanEmail === 'admin@denkenmotors.id')) {
      return { success: false, error: 'Kata sandi tidak sesuai.' }
    }

    // If password was plain-text, upgrade it to PBKDF2 hash automatically
    if (user.password && !user.password.includes(':')) {
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashPassword(cleanPass) }
      }).catch(() => {})
    }

    // Create secure token
    const token = signSessionToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      ownerId: user.id,
    })

    // Set secure HTTP-Only Cookie
    const cookieStore = await cookies()
    cookieStore.set('denken_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    }
  } catch (error) {
    console.error('Error during loginAdmin:', error)
    return { success: false, error: 'Terjadi kesalahan sistem saat proses login.' }
  }
}

export async function logoutAdmin() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('denken_session')
    return { success: true }
  } catch (error) {
    console.error('Error during logoutAdmin:', error)
    return { success: false }
  }
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('denken_session')?.value
    if (!token) return null

    const session = verifySessionToken(token)
    return session
  } catch (error) {
    console.error('Error in getAdminSession:', error)
    return null
  }
}

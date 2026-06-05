import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import prisma from './prisma'
import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

export interface AuthUser {
  id: string
  name: string
  phone: string
  role: Role
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10)
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = cookies()
  const token = cookieStore.get('token')?.value
  
  if (!token) return null
  
  const user = verifyToken(token)
  if (!user) return null
  
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id, isActive: true },
    select: { id: true, name: true, phone: true, role: true }
  })
  
  return dbUser as AuthUser | null
}

export async function requireAuth(roles?: Role[]): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('未登录')
  }
  
  if (roles && !roles.includes(user.role)) {
    throw new Error('权限不足')
  }
  
  return user
}

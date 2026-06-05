import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, hashPassword } from '@/lib/auth'
import { Role } from '@prisma/client'

export async function GET(request: Request) {
  try {
    await requireAuth([Role.ADMIN])
    
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') as Role | undefined
    
    const users = await prisma.user.findMany({
      where: {
        ...(role && { role }),
        isActive: true
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ users })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth([Role.ADMIN])
    
    const { name, phone, password, role } = await request.json()
    
    if (!name || !phone || !password || !role) {
      return NextResponse.json({ error: '请填写完整信息' }, { status: 400 })
    }
    
    const existing = await prisma.user.findUnique({ where: { phone } })
    if (existing) {
      return NextResponse.json({ error: '手机号已存在' }, { status: 400 })
    }
    
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        password: hashPassword(password),
        role: role as Role
      },
      select: { id: true, name: true, phone: true, role: true }
    })
    
    return NextResponse.json({ user })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

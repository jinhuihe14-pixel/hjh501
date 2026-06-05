import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, hashPassword } from '@/lib/auth'
import { Role } from '@prisma/client'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth([Role.ADMIN])
    
    const { name, phone, role, resetPassword } = await request.json()
    
    if (resetPassword) {
      await prisma.user.update({
        where: { id: params.id },
        data: { password: hashPassword('123456') }
      })
      return NextResponse.json({ success: true, message: '密码重置成功' })
    }
    
    if (!name || !phone || !role) {
      return NextResponse.json({ error: '请填写完整信息' }, { status: 400 })
    }
    
    const existing = await prisma.user.findUnique({ where: { phone } })
    if (existing && existing.id !== params.id) {
      return NextResponse.json({ error: '手机号已存在' }, { status: 400 })
    }
    
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { name, phone, role: role as Role },
      select: { id: true, name: true, phone: true, role: true }
    })
    
    return NextResponse.json({ user })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

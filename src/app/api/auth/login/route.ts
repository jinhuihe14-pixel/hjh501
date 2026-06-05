import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { phone, password } = await request.json()
    
    if (!phone || !password) {
      return NextResponse.json({ error: '请输入手机号和密码' }, { status: 400 })
    }
    
    const user = await prisma.user.findUnique({
      where: { phone, isActive: true }
    })
    
    if (!user || !verifyPassword(password, user.password)) {
      return NextResponse.json({ error: '手机号或密码错误' }, { status: 401 })
    }
    
    const token = generateToken({
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role
    })
    
    cookies().set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    })
    
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: '登录失败' }, { status: 500 })
  }
}

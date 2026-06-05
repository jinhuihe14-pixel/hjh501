import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')
    
    const customers = await prisma.customer.findMany({
      where: {
        ...(phone && { phone: { contains: phone } })
      },
      include: { vehicles: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    
    return NextResponse.json({ customers })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth()
    
    const data = await request.json()
    
    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        wechatId: data.wechatId,
        address: data.address
      }
    })
    
    return NextResponse.json({ customer })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

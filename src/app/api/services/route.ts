import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role } from '@prisma/client'

export async function GET() {
  try {
    await requireAuth()
    
    const services = await prisma.service.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json({ services })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth([Role.ADMIN])
    
    const data = await request.json()
    
    const service = await prisma.service.create({
      data: {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        workHours: parseInt(data.workHours) || 1,
        hourPrice: parseFloat(data.hourPrice) || 0,
        categoryId: data.categoryId
      }
    })
    
    return NextResponse.json({ service })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role } from '@prisma/client'

export async function GET() {
  try {
    await requireAuth()
    
    const categories = await prisma.serviceCategory.findMany({
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json({ categories })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth([Role.ADMIN])
    
    const data = await request.json()
    
    const category = await prisma.serviceCategory.create({
      data: {
        name: data.name,
        description: data.description || ''
      }
    })
    
    return NextResponse.json({ category })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role } from '@prisma/client'

export async function GET() {
  try {
    await requireAuth([Role.ADMIN, Role.FRONT_DESK])
    
    const today = new Date()
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    const reminders = await prisma.maintenanceRecord.findMany({
      where: {
        OR: [
          { nextDate: { lte: thirtyDaysLater, gte: today } },
        ],
        isReminded: false
      },
      include: {
        vehicle: {
          include: {
            customer: true
          }
        }
      },
      orderBy: { nextDate: 'asc' }
    })
    
    return NextResponse.json({ reminders })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth([Role.ADMIN, Role.FRONT_DESK])
    
    const { id } = await request.json()
    
    await prisma.maintenanceRecord.update({
      where: { id },
      data: { isReminded: true }
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        vehicle: true,
        frontDesk: { select: { id: true, name: true, role: true } },
        technician: { select: { id: true, name: true, role: true } },
        sales: { select: { id: true, name: true, role: true } },
        items: true,
        statusLogs: {
          include: {
            operator: { select: { id: true, name: true, role: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        performanceLogs: {
          include: {
            user: { select: { id: true, name: true, role: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })
    
    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }
    
    return NextResponse.json({ order })
  } catch (error: any) {
    console.error('Get order detail error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

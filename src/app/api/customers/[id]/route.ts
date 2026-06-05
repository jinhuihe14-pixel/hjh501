import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        vehicles: {
          orderBy: { createdAt: 'desc' }
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      }
    })
    
    if (!customer) {
      return NextResponse.json(
        { error: '客户不存在' },
        { status: 404 }
      )
    }
    
    const totalOrders = await prisma.order.count({
      where: { customerId: params.id }
    })
    
    const totalAmountResult = await prisma.order.aggregate({
      where: { customerId: params.id },
      _sum: { actualAmount: true }
    })
    
    return NextResponse.json({
      customer: {
        ...customer,
        totalOrders,
        totalAmount: totalAmountResult._sum.actualAmount || 0
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

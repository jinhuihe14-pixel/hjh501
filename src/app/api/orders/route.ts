import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { generateOrderNo, getCurrentMonth } from '@/lib/utils'
import { OrderType, OrderStatus, Role } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as OrderStatus | undefined
    
    let where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (user.role === Role.TECHNICIAN) {
      where.technicianId = user.id
    } else if (user.role === Role.SALES) {
      where.salesId = user.id
    } else if (user.role === Role.FRONT_DESK) {
      where.frontDeskId = user.id
    }
    
    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: true,
        vehicle: true,
        frontDesk: { select: { id: true, name: true } },
        technician: { select: { id: true, name: true } },
        sales: { select: { id: true, name: true } },
        items: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    
    return NextResponse.json({ orders })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth([Role.ADMIN, Role.FRONT_DESK])
    
    const data = await request.json()
    const month = getCurrentMonth()
    
    const order = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNo: generateOrderNo(),
          orderType: data.orderType as OrderType,
          totalAmount: parseFloat(data.totalAmount),
          discountAmount: parseFloat(data.discountAmount) || 0,
          actualAmount: parseFloat(data.actualAmount),
          customerId: data.customerId || null,
          vehicleId: data.vehicleId || null,
          frontDeskId: user.role === Role.FRONT_DESK ? user.id : data.frontDeskId,
          technicianId: data.technicianId || null,
          salesId: data.salesId || null,
          remark: data.remark,
          items: {
            create: data.items.map((item: any) => ({
              itemType: item.type,
              serviceId: item.serviceId || null,
              productId: item.productId || null,
              name: item.name,
              price: parseFloat(item.price),
              quantity: item.quantity,
              subtotal: parseFloat(item.subtotal),
              workHours: item.workHours || 0
            }))
          }
        },
        include: { items: true }
      })
      
      if (data.technicianId) {
        const totalHours = order.items.reduce((sum, item) => sum + item.workHours, 0)
        
        await tx.performanceLog.create({
          data: {
            userId: data.technicianId,
            orderId: order.id,
            type: 'SERVICE_HOURS',
            amount: order.actualAmount,
            commission: 0,
            workHours: totalHours,
            month
          }
        })
      }
      
      if (data.salesId) {
        const productItems = order.items.filter(item => item.itemType === 'product')
        const productTotal = productItems.reduce((sum, item) => sum + item.subtotal.toNumber(), 0)
        
        if (productTotal > 0) {
          await tx.performanceLog.create({
            data: {
              userId: data.salesId,
              orderId: order.id,
              type: 'PRODUCT_SALES',
              amount: productTotal,
              commission: 0,
              month
            }
          })
        }
      }
      
      if (user.role === Role.FRONT_DESK || data.frontDeskId) {
        const frontDeskUserId = user.role === Role.FRONT_DESK ? user.id : data.frontDeskId
        if (frontDeskUserId) {
          await tx.performanceLog.create({
            data: {
              userId: frontDeskUserId,
              orderId: order.id,
              type: 'ORDER_COMMISSION',
              amount: order.actualAmount,
              commission: 0,
              month
            }
          })
        }
      }
      
      return order
    })
    
    return NextResponse.json({ order })
  } catch (error: any) {
    console.error('Create order error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

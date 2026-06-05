import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role, OrderStatus } from '@prisma/client'

export async function GET(request: Request) {
  try {
    await requireAuth([Role.ADMIN])
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const where: any = {
      status: OrderStatus.COMPLETED
    }
    
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }
    
    if (type === 'revenue') {
      const orders = await prisma.order.findMany({
        where,
        select: {
          createdAt: true,
          actualAmount: true,
          orderType: true,
          items: {
            select: {
              itemType: true,
              subtotal: true,
              serviceId: true,
              productId: true,
              name: true
            }
          }
        }
      })
      
      const dailyRevenue: Record<string, number> = {}
      let totalRevenue = 0
      let serviceRevenue = 0
      let productRevenue = 0
      const serviceStats: Record<string, { name: string; count: number; amount: number }> = {}
      
      for (const order of orders) {
        const date = order.createdAt.toISOString().split('T')[0]
        const amount = order.actualAmount.toNumber()
        
        dailyRevenue[date] = (dailyRevenue[date] || 0) + amount
        totalRevenue += amount
        
        for (const item of order.items) {
          if (item.itemType === 'service') {
            serviceRevenue += item.subtotal.toNumber()
            const key = item.serviceId || item.name
            if (!serviceStats[key]) {
              serviceStats[key] = { name: item.name, count: 0, amount: 0 }
            }
            serviceStats[key].count += 1
            serviceStats[key].amount += item.subtotal.toNumber()
          } else {
            productRevenue += item.subtotal.toNumber()
          }
        }
      }
      
      const topServices = Object.values(serviceStats)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10)
      
      return NextResponse.json({
        dailyRevenue: Object.entries(dailyRevenue).map(([date, revenue]) => ({ date, revenue })),
        totalRevenue,
        serviceRevenue,
        productRevenue,
        topServices,
        orderCount: orders.length
      })
    }
    
    if (type === 'customer') {
      const customers = await prisma.customer.findMany({
        include: {
          _count: { select: { orders: true } },
          orders: {
            where: { status: OrderStatus.COMPLETED },
            select: { actualAmount: true }
          }
        },
        take: 100
      })
      
      const customerStats = customers.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        orderCount: c._count.orders,
        totalSpent: c.orders.reduce((sum, o) => sum + o.actualAmount.toNumber(), 0)
      }))
      
      const repeatCustomers = customerStats.filter(c => c.orderCount >= 2).length
      const newCustomers = customerStats.filter(c => c.orderCount === 1).length
      
      return NextResponse.json({
        customers: customerStats.sort((a, b) => b.totalSpent - a.totalSpent),
        totalCustomers: customers.length,
        repeatCustomers,
        newCustomers,
        repeatRate: customers.length > 0 ? (repeatCustomers / customers.length * 100).toFixed(1) : 0
      })
    }
    
    if (type === 'performance') {
      const users = await prisma.user.findMany({
        where: { isActive: true, role: { in: [Role.TECHNICIAN, Role.SALES, Role.FRONT_DESK] } },
        include: {
          technicianOrders: {
            where: { ...where, status: OrderStatus.COMPLETED },
            include: { items: true }
          },
          salesOrders: {
            where: { ...where, status: OrderStatus.COMPLETED },
            include: { items: true }
          },
          frontDeskOrders: {
            where: { ...where, status: OrderStatus.COMPLETED }
          }
        }
      })
      
      const performances = users.map(u => {
        let totalHours = 0
        let serviceAmount = 0
        let productSales = 0
        let orderAmount = 0
        
        for (const order of u.technicianOrders) {
          for (const item of order.items) {
            totalHours += item.workHours
            serviceAmount += item.subtotal.toNumber()
          }
        }
        
        for (const order of u.salesOrders) {
          for (const item of order.items) {
            if (item.itemType === 'product') {
              productSales += item.subtotal.toNumber()
            }
          }
        }
        
        for (const order of u.frontDeskOrders) {
          orderAmount += order.actualAmount.toNumber()
        }
        
        return {
          id: u.id,
          name: u.name,
          role: u.role,
          totalHours,
          serviceAmount,
          productSales,
          orderAmount,
          orderCount: u.technicianOrders.length + u.salesOrders.length + u.frontDeskOrders.length
        }
      })
      
      return NextResponse.json({ performances })
    }
    
    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

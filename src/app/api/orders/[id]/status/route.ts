import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { OrderStatus, StockLogType } from '@prisma/client'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    
    const { status, remark, technicianId } = await request.json()
    
    const order = await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({
        where: { id: params.id },
        include: { items: true }
      })
      
      if (!currentOrder) {
        throw new Error('订单不存在')
      }
      
      const updateData: any = {}
      
      if (status) {
        updateData.status = status as OrderStatus
      }
      
      if (remark) {
        updateData.remark = remark
      }
      
      if (technicianId) {
        updateData.technicianId = technicianId
      }
      
      const updatedOrder = await tx.order.update({
        where: { id: params.id },
        data: updateData
      })
      
      if (status && status !== currentOrder.status) {
        await tx.orderStatusLog.create({
          data: {
            orderId: params.id,
            fromStatus: currentOrder.status,
            toStatus: status as OrderStatus,
            operatorId: user.id,
            remark
          }
        })
      }
      
      if (status === OrderStatus.CANCELLED) {
        for (const item of currentOrder.items) {
          if (item.productId) {
            const product = await tx.product.findUnique({
              where: { id: item.productId }
            })
            
            if (product) {
              const beforeStock = product.stock
              const afterStock = beforeStock + item.quantity
              
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: afterStock }
              })
              
              await tx.stockLog.create({
                data: {
                  productId: item.productId,
                  type: StockLogType.IN,
                  quantity: item.quantity,
                  beforeStock,
                  afterStock,
                  remark: `订单取消回滚 ${currentOrder.orderNo}`,
                  operatorId: user.id
                }
              })
            }
          }
        }
        
        await tx.performanceLog.deleteMany({
          where: { orderId: params.id }
        })
      }
      
      return updatedOrder
    })
    
    return NextResponse.json({ order })
  } catch (error: any) {
    console.error('Update order status error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

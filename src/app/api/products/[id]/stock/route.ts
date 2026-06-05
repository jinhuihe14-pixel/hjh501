import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role, StockLogType } from '@prisma/client'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth([Role.ADMIN])
    
    const data = await request.json()
    const quantity = parseInt(data.quantity)
    
    if (!quantity || quantity <= 0) {
      return NextResponse.json({ error: '进货数量必须大于0' }, { status: 400 })
    }
    
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: params.id }
      })
      
      if (!product) {
        throw new Error('商品不存在')
      }
      
      const beforeStock = product.stock
      const afterStock = beforeStock + quantity
      
      await tx.product.update({
        where: { id: params.id },
        data: { stock: afterStock }
      })
      
      const stockLog = await tx.stockLog.create({
        data: {
          productId: params.id,
          type: StockLogType.IN,
          quantity,
          beforeStock,
          afterStock,
          remark: data.remark || null,
          operatorId: user.id
        },
        include: {
          operator: { select: { id: true, name: true } }
        }
      })
      
      return { product: { ...product, stock: afterStock }, stockLog }
    })
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Stock update error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

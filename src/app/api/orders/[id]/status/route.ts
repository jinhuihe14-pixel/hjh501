import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { OrderStatus, Role } from '@prisma/client'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    
    const { status } = await request.json()
    
    const order = await prisma.order.update({
      where: { id: params.id },
      data: { status: status as OrderStatus }
    })
    
    return NextResponse.json({ order })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

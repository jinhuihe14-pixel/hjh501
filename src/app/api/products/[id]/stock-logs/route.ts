import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()
    
    const stockLogs = await prisma.stockLog.findMany({
      where: { productId: params.id },
      include: {
        operator: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ stockLogs })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

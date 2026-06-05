import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const userId = searchParams.get('userId')
    
    if (!month) {
      return NextResponse.json({ error: '缺少月份参数' }, { status: 400 })
    }
    
    let targetUserId = userId
    
    if (user.role !== Role.ADMIN && !userId) {
      targetUserId = user.id
    }
    
    if (user.role !== Role.ADMIN && userId && userId !== user.id) {
      return NextResponse.json({ error: '权限不足' }, { status: 403 })
    }
    
    const startDate = new Date(`${month}-01`)
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + 1)
    
    const where: any = {
      date: {
        gte: startDate,
        lt: endDate
      }
    }
    
    if (targetUserId) {
      where.userId = targetUserId
    }
    
    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, role: true }
        }
      },
      orderBy: [
        { userId: 'asc' },
        { date: 'asc' }
      ]
    })
    
    return NextResponse.json({ attendances })
  } catch (error: any) {
    console.error('Get attendance error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

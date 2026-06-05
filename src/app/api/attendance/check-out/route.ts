import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: today
        }
      }
    })
    
    if (!existingAttendance || !existingAttendance.checkIn) {
      return NextResponse.json({ error: '请先打上班卡' }, { status: 400 })
    }
    
    if (existingAttendance.checkOut) {
      return NextResponse.json({ error: '今日已打过下班卡' }, { status: 400 })
    }
    
    const attendance = await prisma.attendance.update({
      where: {
        userId_date: {
          userId: user.id,
          date: today
        }
      },
      data: {
        checkOut: now
      }
    })
    
    return NextResponse.json({ attendance })
  } catch (error: any) {
    console.error('Check-out error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

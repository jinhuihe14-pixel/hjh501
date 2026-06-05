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
    
    if (existingAttendance && existingAttendance.checkIn) {
      return NextResponse.json({ error: '今日已打过上班卡' }, { status: 400 })
    }
    
    const checkInTime = now
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 0)
    
    const attendance = await prisma.attendance.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: today
        }
      },
      update: {
        checkIn: checkInTime,
        isLate
      },
      create: {
        userId: user.id,
        date: today,
        checkIn: checkInTime,
        isLate
      }
    })
    
    return NextResponse.json({ attendance })
  } catch (error: any) {
    console.error('Check-in error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

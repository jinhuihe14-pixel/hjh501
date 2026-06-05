import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role } from '@prisma/client'

export async function GET(request: Request) {
  try {
    await requireAuth([Role.ADMIN])
    
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    
    const rules = await prisma.salaryRule.findMany({
      where: month ? { effectiveMonth: month } : undefined,
      orderBy: [{ effectiveMonth: 'desc' }, { role: 'asc' }]
    })
    
    return NextResponse.json({ rules })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth([Role.ADMIN])
    
    const data = await request.json()
    
    const rule = await prisma.salaryRule.upsert({
      where: {
        effectiveMonth_role: {
          effectiveMonth: data.effectiveMonth,
          role: data.role as Role
        }
      },
      update: {
        baseSalary: parseFloat(data.baseSalary) || 0,
        frontDeskCommissionRate: parseFloat(data.frontDeskCommissionRate) || 0,
        salesCommissionRate: parseFloat(data.salesCommissionRate) || 0,
        fullBonus: parseFloat(data.fullBonus) || 0,
        lateDeduction: parseFloat(data.lateDeduction) || 0
      },
      create: {
        effectiveMonth: data.effectiveMonth,
        role: data.role as Role,
        baseSalary: parseFloat(data.baseSalary) || 0,
        frontDeskCommissionRate: parseFloat(data.frontDeskCommissionRate) || 0,
        salesCommissionRate: parseFloat(data.salesCommissionRate) || 0,
        fullBonus: parseFloat(data.fullBonus) || 0,
        lateDeduction: parseFloat(data.lateDeduction) || 0
      }
    })
    
    return NextResponse.json({ rule })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

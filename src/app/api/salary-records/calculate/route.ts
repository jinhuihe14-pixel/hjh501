import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { Role, SalaryStatus } from '@prisma/client'

export async function POST(request: Request) {
  try {
    await requireAuth([Role.ADMIN])
    
    const { month } = await request.json()
    
    const users = await prisma.user.findMany({
      where: { isActive: true, role: { in: [Role.FRONT_DESK, Role.TECHNICIAN, Role.SALES, Role.ADMIN] } }
    })
    
    const rules = await prisma.salaryRule.findMany({
      where: { effectiveMonth: month }
    })
    
    const ruleMap = new Map(rules.map(r => [r.role, r]))
    
    for (const user of users) {
      const rule = ruleMap.get(user.role)
      if (!rule) continue
      
      const performances = await prisma.performanceLog.findMany({
        where: { userId: user.id, month }
      })
      
      const attendances = await prisma.attendance.findMany({
        where: {
          userId: user.id,
          date: {
            gte: new Date(`${month}-01`),
            lt: new Date(new Date(`${month}-01`).setMonth(new Date(`${month}-01`).getMonth() + 1))
          }
        }
      })
      
      let workHours = 0
      let salesAmount = 0
      let orderAmount = 0
      
      for (const p of performances) {
        if (p.type === 'SERVICE_HOURS') {
          workHours += p.workHours
        } else if (p.type === 'PRODUCT_SALES') {
          salesAmount += p.amount.toNumber()
        } else if (p.type === 'ORDER_COMMISSION') {
          orderAmount += p.amount.toNumber()
        }
      }
      
      const lateCount = attendances.filter(a => a.isLate).length
      const isFull = lateCount === 0 && attendances.every(a => !a.isAbsent)
      
      let totalSalary = rule.baseSalary.toNumber()
      
      if (user.role === Role.TECHNICIAN) {
        const hourWage = workHours * 50
        totalSalary += hourWage
      }
      
      if (user.role === Role.SALES) {
        const salesCommission = salesAmount * (rule.salesCommissionRate.toNumber() / 100)
        totalSalary += salesCommission
      }
      
      if (user.role === Role.FRONT_DESK) {
        const orderCommission = orderAmount * (rule.frontDeskCommissionRate.toNumber() / 100)
        totalSalary += orderCommission
      }
      
      if (isFull) {
        totalSalary += rule.fullBonus.toNumber()
      }
      
      const lateDeduction = lateCount * rule.lateDeduction.toNumber()
      totalSalary -= lateDeduction
      
      await prisma.salaryRecord.upsert({
        where: {
          userId_month: { userId: user.id, month }
        },
        update: {
          baseSalary: rule.baseSalary,
          workHours,
          salesAmount,
          salesCommission: user.role === Role.SALES ? salesAmount * (rule.salesCommissionRate.toNumber() / 100) : 0,
          orderAmount,
          orderCommission: user.role === Role.FRONT_DESK ? orderAmount * (rule.frontDeskCommissionRate.toNumber() / 100) : 0,
          fullBonus: isFull ? rule.fullBonus : 0,
          lateCount,
          lateDeduction,
          totalSalary: Math.max(0, totalSalary)
        },
        create: {
          userId: user.id,
          month,
          baseSalary: rule.baseSalary,
          workHours,
          salesAmount,
          salesCommission: user.role === Role.SALES ? salesAmount * (rule.salesCommissionRate.toNumber() / 100) : 0,
          orderAmount,
          orderCommission: user.role === Role.FRONT_DESK ? orderAmount * (rule.frontDeskCommissionRate.toNumber() / 100) : 0,
          fullBonus: isFull ? rule.fullBonus : 0,
          lateCount,
          lateDeduction,
          totalSalary: Math.max(0, totalSalary),
          status: SalaryStatus.DRAFT
        }
      })
    }
    
    const records = await prisma.salaryRecord.findMany({
      where: { month },
      include: { user: { select: { id: true, name: true, role: true } } }
    })
    
    return NextResponse.json({ records })
  } catch (error: any) {
    console.error('Calculate salary error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

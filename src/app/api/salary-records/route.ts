import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, getCurrentUser } from '@/lib/auth'
import { Role, SalaryStatus } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const userId = searchParams.get('userId')
    
    let where: any = {}
    
    if (month) {
      where.month = month
    }
    
    if (user.role !== Role.ADMIN) {
      where.userId = user.id
    } else if (userId) {
      where.userId = userId
    }
    
    const records = await prisma.salaryRecord.findMany({
      where,
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: [{ month: 'desc' }, { userId: 'asc' }]
    })
    
    return NextResponse.json({ records })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAuth([Role.ADMIN])
    
    const { id, action, otherBonus, otherDeduction, remark } = await request.json()
    
    const record = await prisma.salaryRecord.findUnique({ where: { id } })
    if (!record) {
      return NextResponse.json({ error: '记录不存在' }, { status: 404 })
    }
    
    if (record.status === SalaryStatus.LOCKED) {
      return NextResponse.json({ error: '已锁定，无法修改' }, { status: 400 })
    }
    
    let data: any = {}
    
    if (action === 'confirm') {
      data.status = SalaryStatus.CONFIRMED
    } else if (action === 'lock') {
      data.status = SalaryStatus.LOCKED
    } else if (action === 'adjust') {
      const newOtherBonus = otherBonus !== undefined ? otherBonus : record.otherBonus.toNumber()
      const newOtherDeduction = otherDeduction !== undefined ? otherDeduction : record.otherDeduction.toNumber()
      const bonusDiff = newOtherBonus - record.otherBonus.toNumber()
      const deductionDiff = newOtherDeduction - record.otherDeduction.toNumber()
      
      data = {
        otherBonus: newOtherBonus,
        otherDeduction: newOtherDeduction,
        totalSalary: record.totalSalary.toNumber() + bonusDiff - deductionDiff,
        remark
      }
    }
    
    const updated = await prisma.salaryRecord.update({
      where: { id },
      data,
      include: { user: { select: { id: true, name: true, role: true } } }
    })
    
    return NextResponse.json({ record: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

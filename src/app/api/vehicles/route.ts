import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

const PLATE_REGEX = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼][A-Z][A-Z0-9]{5}$/

export async function GET(request: Request) {
  try {
    await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const plateNumber = searchParams.get('plateNumber')
    
    const vehicles = await prisma.vehicle.findMany({
      where: {
        ...(customerId && { customerId }),
        ...(plateNumber && { plateNumber: { contains: plateNumber } })
      },
      include: { customer: true },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ vehicles })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    await requireAuth()
    
    const data = await request.json()
    
    if (!PLATE_REGEX.test(data.plateNumber)) {
      return NextResponse.json(
        { error: '车牌号格式不正确，应为省份简称+字母+5位字母数字' },
        { status: 400 }
      )
    }
    
    const existing = await prisma.vehicle.findUnique({
      where: { plateNumber: data.plateNumber }
    })
    
    if (existing) {
      return NextResponse.json(
        { error: '该车牌号已存在' },
        { status: 400 }
      )
    }
    
    const vehicle = await prisma.vehicle.create({
      data: {
        plateNumber: data.plateNumber,
        brand: data.brand,
        model: data.model,
        color: data.color,
        vin: data.vin,
        currentMileage: parseInt(data.currentMileage) || 0,
        customerId: data.customerId
      }
    })
    
    return NextResponse.json({ vehicle })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

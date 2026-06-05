import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = bcrypt.hashSync('123456', 10)

  const admin = await prisma.user.upsert({
    where: { phone: '13800000001' },
    update: {},
    create: {
      name: '张店长',
      phone: '13800000001',
      email: 'admin@example.com',
      password,
      role: Role.ADMIN
    }
  })

  const frontdesk = await prisma.user.upsert({
    where: { phone: '13800000002' },
    update: {},
    create: {
      name: '李前台',
      phone: '13800000002',
      password,
      role: Role.FRONT_DESK
    }
  })

  const technician = await prisma.user.upsert({
    where: { phone: '13800000003' },
    update: {},
    create: {
      name: '王技师',
      phone: '13800000003',
      password,
      role: Role.TECHNICIAN
    }
  })

  const sales = await prisma.user.upsert({
    where: { phone: '13800000004' },
    update: {},
    create: {
      name: '赵销售',
      phone: '13800000004',
      password,
      role: Role.SALES
    }
  })

  const category = await prisma.serviceCategory.upsert({
    where: { id: 'cat-1' },
    update: {},
    create: {
      id: 'cat-1',
      name: '汽车美容',
      description: '汽车美容保养服务'
    }
  })

  const services = [
    { name: '普通洗车', price: 35, workHours: 1, hourPrice: 30 },
    { name: '精洗', price: 88, workHours: 2, hourPrice: 40 },
    { name: '内饰精洗', price: 268, workHours: 4, hourPrice: 50 },
    { name: '漆面镀膜', price: 588, workHours: 6, hourPrice: 80 },
    { name: '保养换油', price: 398, workHours: 2, hourPrice: 60 },
  ]

  for (const service of services) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: {},
      create: {
        ...service,
        categoryId: category.id
      }
    })
  }

  const products = [
    { name: '车载香薰-海洋味', price: 68, cost: 25, stock: 50, commissionRate: 10 },
    { name: '车载香薰-古龙味', price: 68, cost: 25, stock: 50, commissionRate: 10 },
    { name: '汽车坐垫-亚麻', price: 298, cost: 120, stock: 20, commissionRate: 15 },
    { name: '汽车坐垫-真皮', price: 888, cost: 350, stock: 10, commissionRate: 20 },
    { name: '玻璃水', price: 25, cost: 8, stock: 100, commissionRate: 5 },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { name: product.name },
      update: {},
      create: product
    })
  }

  const currentMonth = new Date().toISOString().slice(0, 7)
  
  for (const role of [Role.ADMIN, Role.FRONT_DESK, Role.TECHNICIAN, Role.SALES]) {
    await prisma.salaryRule.upsert({
      where: { effectiveMonth_role: { effectiveMonth: currentMonth, role } },
      update: {},
      create: {
        effectiveMonth: currentMonth,
        role,
        baseSalary: role === Role.ADMIN ? 8000 : role === Role.TECHNICIAN ? 3000 : 2500,
        frontDeskCommissionRate: 2,
        salesCommissionRate: 5,
        fullBonus: 200,
        lateDeduction: 50
      }
    })
  }

  console.log('Seed data created successfully!')
  console.log('Demo accounts:')
  console.log('  Admin: 13800000001 / 123456')
  console.log('  Front Desk: 13800000002 / 123456')
  console.log('  Technician: 13800000003 / 123456')
  console.log('  Sales: 13800000004 / 123456')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

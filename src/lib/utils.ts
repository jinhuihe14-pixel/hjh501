import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatMoney(amount: number | string | null): string {
  if (amount === null || amount === undefined) return '¥0.00'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return `¥${num.toFixed(2)}`
}

export function generateOrderNo(): string {
  const now = new Date()
  const timestamp = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0') +
    now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0') +
    now.getSeconds().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `ORD${timestamp}${random}`
}

export function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
}

export function getNextMonth(): string {
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return `${nextMonth.getFullYear()}-${(nextMonth.getMonth() + 1).toString().padStart(2, '0')}`
}

export const RoleLabels: Record<string, string> = {
  ADMIN: '店长',
  FRONT_DESK: '前台收银',
  TECHNICIAN: '美容技师',
  SALES: '销售导购',
  CUSTOMER: '客户'
}

export const OrderStatusLabels: Record<string, string> = {
  PENDING: '待施工',
  IN_PROGRESS: '施工中',
  COMPLETED: '已完成',
  CANCELLED: '已取消'
}

export const SalaryStatusLabels: Record<string, string> = {
  DRAFT: '草稿',
  CONFIRMED: '已确认',
  LOCKED: '已锁定'
}

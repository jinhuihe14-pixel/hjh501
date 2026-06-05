'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { RoleLabels } from '@/lib/utils'

interface User {
  id: string
  name: string
  phone: string
  role: string
}

const menuItems = [
  { href: '/frontdesk/orders', label: '开单收银', icon: '🛒' },
  { href: '/frontdesk/order-list', label: '订单列表', icon: '📋' },
  { href: '/frontdesk/customers', label: '客户管理', icon: '👤' },
  { href: '/frontdesk/maintenance', label: '保养提醒', icon: '🔔' },
]

export default function FrontDeskLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      
      if (!data.user || data.user.role !== 'FRONT_DESK') {
        router.push('/login')
      } else {
        setUser(data.user)
      }
    }
    
    checkAuth()
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">💼</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">前台收银系统</h1>
              <p className="text-xs text-gray-500">FrontDesk</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                pathname === item.href
                  ? 'bg-blue-500/10 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{RoleLabels[user.role]}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full btn btn-secondary text-sm"
          >
            退出登录
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

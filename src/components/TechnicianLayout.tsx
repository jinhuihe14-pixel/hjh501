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
  { href: '/technician/tasks', label: '我的工单', icon: '📋' },
  { href: '/technician/performance', label: '业绩查询', icon: '📊' },
  { href: '/technician/salary', label: '薪资查看', icon: '💰' },
]

export default function TechnicianLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      
      if (!data.user || data.user.role !== 'TECHNICIAN') {
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
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        <header className="bg-blue-500 text-white p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span>🔧</span>
              </div>
              <div>
                <h1 className="font-bold">技师工作台</h1>
                <p className="text-xs opacity-80">Technician</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30"
            >
              退出
            </button>
          </div>
        </header>

        <div className="p-4 pb-20">
          {children}
        </div>

        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t">
          <div className="flex">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center py-3 ${
                  pathname === item.href
                    ? 'text-blue-500'
                    : 'text-gray-500'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}

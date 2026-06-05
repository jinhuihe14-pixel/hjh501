'use client'

import { useEffect, useState, useMemo } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { getCurrentMonth } from '@/lib/utils'

interface Attendance {
  id: string
  userId: string
  date: string
  checkIn: string | null
  checkOut: string | null
  isLate: boolean
  isAbsent: boolean
  user: {
    id: string
    name: string
    role: string
  }
}

interface User {
  id: string
  name: string
  role: string
}

export default function AdminAttendancePage() {
  const [month, setMonth] = useState(getCurrentMonth())
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [month])

  const loadData = async () => {
    setLoading(true)
    
    const [attRes, usersRes] = await Promise.all([
      fetch(`/api/attendance?month=${month}`),
      fetch('/api/users')
    ])
    
    const attData = await attRes.json()
    const usersData = await usersRes.json()
    
    if (attData.attendances) {
      setAttendances(attData.attendances)
    }
    
    if (usersData.users) {
      const activeUsers = usersData.users.filter((u: User) => 
        u.role !== 'CUSTOMER'
      )
      setUsers(activeUsers)
    }
    
    setLoading(false)
  }

  const daysInMonth = useMemo(() => {
    const [year, monthNum] = month.split('-').map(Number)
    return new Date(year, monthNum, 0).getDate()
  }, [month])

  const getAttendanceStatus = (userId: string, day: number) => {
    const [year, monthNum] = month.split('-').map(Number)
    const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    const attendance = attendances.find(a => {
      const attDate = new Date(a.date)
      const attDateStr = `${attDate.getFullYear()}-${String(attDate.getMonth() + 1).padStart(2, '0')}-${String(attDate.getDate()).padStart(2, '0')}`
      return a.userId === userId && attDateStr === dateStr
    })
    
    if (!attendance) {
      const today = new Date()
      const checkDate = new Date(year, monthNum - 1, day)
      
      if (checkDate > today) {
        return { icon: '', className: 'bg-gray-50', title: '' }
      }
      
      return { icon: '✗', className: 'bg-red-50 text-red-500', title: '缺勤' }
    }
    
    if (attendance.isLate) {
      return { icon: '⚠', className: 'bg-orange-50 text-orange-500', title: '迟到' }
    }
    
    return { icon: '✓', className: 'bg-green-50 text-green-500', title: '正常' }
  }

  const handleMonthChange = (direction: number) => {
    const [year, monthNum] = month.split('-').map(Number)
    const newDate = new Date(year, monthNum - 1 + direction, 1)
    const newMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`
    setMonth(newMonth)
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">考勤管理</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleMonthChange(-1)}
              className="btn btn-secondary"
            >
              上月
            </button>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="input"
            />
            <button
              onClick={() => handleMonthChange(1)}
              className="btn btn-secondary"
            >
              下月
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="sticky left-0 bg-gray-50 px-3 py-3 text-left font-medium text-gray-600 border-b min-w-[120px] z-10">
                    员工
                  </th>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                    <th key={day} className="px-1 py-3 text-center font-medium text-gray-600 border-b min-w-[36px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="sticky left-0 bg-white px-3 py-2 border-b z-10">
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{
                          user.role === 'ADMIN' ? '店长' :
                          user.role === 'TECHNICIAN' ? '技师' :
                          user.role === 'FRONT_DESK' ? '前台' :
                          user.role === 'SALES' ? '销售' : user.role
                        }</p>
                      </div>
                    </td>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                      const status = getAttendanceStatus(user.id, day)
                      return (
                        <td
                          key={day}
                          className={`px-1 py-2 text-center border-b ${status.className}`}
                          title={status.title}
                        >
                          <span className="font-bold">{status.icon}</span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-green-50 text-green-500 rounded flex items-center justify-center font-bold">✓</span>
            <span className="text-gray-600">正常</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-orange-50 text-orange-500 rounded flex items-center justify-center font-bold">⚠</span>
            <span className="text-gray-600">迟到</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-red-50 text-red-500 rounded flex items-center justify-center font-bold">✗</span>
            <span className="text-gray-600">缺勤</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

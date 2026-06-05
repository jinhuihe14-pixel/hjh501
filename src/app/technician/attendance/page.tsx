'use client'

import { useEffect, useState } from 'react'
import TechnicianLayout from '@/components/TechnicianLayout'
import { formatDateTime, getCurrentMonth } from '@/lib/utils'

interface Attendance {
  id: string
  date: string
  checkIn: string | null
  checkOut: string | null
  isLate: boolean
}

export default function TechnicianAttendancePage() {
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadTodayAttendance()
  }, [])

  const loadTodayAttendance = async () => {
    const month = getCurrentMonth()
    const res = await fetch(`/api/attendance?month=${month}`)
    const data = await res.json()
    
    if (data.attendances) {
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      
      const todayRecord = data.attendances.find((a: Attendance) => {
        const attendanceDate = new Date(a.date).toISOString().split('T')[0]
        return attendanceDate === todayStr
      })
      
      setTodayAttendance(todayRecord || null)
    }
  }

  const handleCheckIn = async () => {
    setLoading(true)
    setMessage('')
    
    const res = await fetch('/api/attendance/check-in', {
      method: 'POST'
    })
    
    const data = await res.json()
    
    if (res.ok) {
      setTodayAttendance(data.attendance)
      setMessage(data.attendance.isLate ? '打卡成功（迟到）' : '打卡成功')
    } else {
      setMessage(data.error || '打卡失败')
    }
    
    setLoading(false)
  }

  const handleCheckOut = async () => {
    setLoading(true)
    setMessage('')
    
    const res = await fetch('/api/attendance/check-out', {
      method: 'POST'
    })
    
    const data = await res.json()
    
    if (res.ok) {
      setTodayAttendance(data.attendance)
      setMessage('下班打卡成功')
    } else {
      setMessage(data.error || '打卡失败')
    }
    
    setLoading(false)
  }

  const hasCheckedIn = todayAttendance?.checkIn
  const hasCheckedOut = todayAttendance?.checkOut

  return (
    <TechnicianLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">考勤打卡</h2>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg text-center ${
            message.includes('失败') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-500">上班打卡</p>
              <p className={`text-lg font-bold mt-2 ${
                !hasCheckedIn ? 'text-gray-400' : 
                todayAttendance?.isLate ? 'text-orange-500' : 'text-green-600'
              }`}>
                {hasCheckedIn ? formatDateTime(todayAttendance.checkIn!).split(' ')[1] : '--:--'}
              </p>
              {todayAttendance?.isLate && (
                <p className="text-xs text-orange-500 mt-1">迟到</p>
              )}
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-500">下班打卡</p>
              <p className={`text-lg font-bold mt-2 ${
                hasCheckedOut ? 'text-green-600' : 'text-gray-400'
              }`}>
                {hasCheckedOut ? formatDateTime(todayAttendance.checkOut!).split(' ')[1] : '--:--'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleCheckIn}
              disabled={loading || !!hasCheckedIn}
              className={`w-full py-4 rounded-lg font-bold text-white transition-colors ${
                hasCheckedIn
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
              }`}
            >
              {loading ? '打卡中...' : hasCheckedIn ? '已打上班卡' : '上班打卡'}
            </button>
            <button
              onClick={handleCheckOut}
              disabled={loading || !hasCheckedIn || !!hasCheckedOut}
              className={`w-full py-4 rounded-lg font-bold text-white transition-colors ${
                !hasCheckedIn || hasCheckedOut
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700'
              }`}
            >
              {loading ? '打卡中...' : !hasCheckedIn ? '请先打上班卡' : hasCheckedOut ? '已打下班卡' : '下班打卡'}
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700">
            <span className="font-bold">温馨提示：</span>
            上班时间为 9:00，超过 9:00 打卡将标记为迟到。
          </p>
        </div>
      </div>
    </TechnicianLayout>
  )
}

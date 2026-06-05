'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'

interface Reminder {
  id: string
  vehicleId: string
  serviceType: string
  mileage: number
  lastDate: string
  nextDate: string | null
  nextMileage: number
  isReminded: boolean
  vehicle: {
    plateNumber: string
    brand: string
    model: string
    customer: {
      name: string
      phone: string
    }
  }
}

export default function MaintenancePage() {
  const [reminders, setReminders] = useState<Reminder[]>([])

  useEffect(() => {
    loadReminders()
  }, [])

  const loadReminders = async () => {
    const res = await fetch('/api/maintenance/remind')
    const data = await res.json()
    if (data.reminders) {
      setReminders(data.reminders)
    }
  }

  const markAsReminded = async (id: string) => {
    await fetch('/api/maintenance/remind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    loadReminders()
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">保养提醒</h1>
            <p className="text-gray-500">管理车辆保养提醒，主动联系客户</p>
          </div>
        </div>

        {reminders.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-12">
              <span className="text-6xl mb-4 block">✅</span>
              <p className="text-gray-500">暂无需要提醒的保养车辆</p>
            </div>
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>车牌号</th>
                  <th>车主</th>
                  <th>联系电话</th>
                  <th>上次保养</th>
                  <th>建议保养时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {reminders.map((reminder) => (
                  <tr key={reminder.id}>
                    <td className="font-medium">{reminder.vehicle.plateNumber}</td>
                    <td>{reminder.vehicle.customer.name}</td>
                    <td>{reminder.vehicle.customer.phone}</td>
                    <td>{new Date(reminder.lastDate).toLocaleDateString('zh-CN')}</td>
                    <td>
                      {reminder.nextDate && (
                        <span className="badge badge-warning">
                          {new Date(reminder.nextDate).toLocaleDateString('zh-CN')}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => markAsReminded(reminder.id)}
                          className="text-green-600 hover:underline text-sm"
                        >
                          已提醒
                        </button>
                        <button className="text-primary hover:underline text-sm">
                          发短信
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

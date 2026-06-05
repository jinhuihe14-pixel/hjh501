'use client'

import { useEffect, useState } from 'react'
import FrontDeskLayout from '@/components/FrontDeskLayout'

interface Reminder {
  id: string
  serviceType: string
  isReminded: boolean
  vehicle: {
    plateNumber: string
    customer: {
      name: string
      phone: string
    }
  }
}

export default function FrontDeskMaintenancePage() {
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
    <FrontDeskLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">保养提醒</h1>
          <p className="text-gray-500">查看需要保养提醒的车辆</p>
        </div>

        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>车牌号</th>
                <th>车主</th>
                <th>联系电话</th>
                <th>保养项目</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {reminders.map((reminder) => (
                <tr key={reminder.id}>
                  <td className="font-medium">{reminder.vehicle.plateNumber}</td>
                  <td>{reminder.vehicle.customer.name}</td>
                  <td>{reminder.vehicle.customer.phone}</td>
                  <td>{reminder.serviceType}</td>
                  <td>
                    <span className={`badge ${reminder.isReminded ? 'badge-success' : 'badge-warning'}`}>
                      {reminder.isReminded ? '已提醒' : '待提醒'}
                    </span>
                  </td>
                  <td>
                    {!reminder.isReminded && (
                      <button
                        onClick={() => markAsReminded(reminder.id)}
                        className="text-green-600 hover:underline text-sm"
                      >
                        标记已提醒
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {reminders.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-8">
                    暂无需要提醒的保养车辆
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </FrontDeskLayout>
  )
}

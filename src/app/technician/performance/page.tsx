'use client'

import { useEffect, useState } from 'react'
import TechnicianLayout from '@/components/TechnicianLayout'
import { formatMoney } from '@/lib/utils'

export default function TechnicianPerformancePage() {
  const [performance, setPerformance] = useState({
    totalHours: 0,
    monthHours: 0,
    totalOrders: 0,
    monthOrders: 0,
    totalRevenue: 0,
    monthRevenue: 0
  })
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const res = await fetch('/api/orders')
    const data = await res.json()
    
    if (data.orders) {
      const myOrders = data.orders.filter((o: any) => o.technician)
      const monthOrders = myOrders.filter((o: any) => {
        const orderMonth = new Date(o.createdAt).getMonth()
        const nowMonth = new Date().getMonth()
        return orderMonth === nowMonth
      })
      
      const totalHours = myOrders.reduce((sum: number, o: any) => 
        sum + o.items.reduce((s: number, item: any) => s + item.workHours, 0), 0
      )
      const monthHours = monthOrders.reduce((sum: number, o: any) => 
        sum + o.items.reduce((s: number, item: any) => s + item.workHours, 0), 0
      )
      
      setOrders(myOrders.slice(0, 10))
      setPerformance({
        totalHours,
        monthHours,
        totalOrders: myOrders.length,
        monthOrders: monthOrders.length,
        totalRevenue: myOrders.reduce((sum: number, o: any) => sum + parseFloat(o.actualAmount), 0),
        monthRevenue: monthOrders.reduce((sum: number, o: any) => sum + parseFloat(o.actualAmount), 0)
      })
    }
  }

  return (
    <TechnicianLayout>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-600">本月工时</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {performance.monthHours} h
            </p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-sm text-green-600">本月产值</p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {formatMoney(performance.monthRevenue)}
            </p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4">
            <p className="text-sm text-purple-600">累计工时</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">
              {performance.totalHours} h
            </p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4">
            <p className="text-sm text-orange-600">本月工单</p>
            <p className="text-2xl font-bold text-orange-700 mt-1">
              {performance.monthOrders} 单
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h3 className="font-bold mb-4">最近工单</h3>
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{order.orderNo}</p>
                  <p className="text-sm text-gray-500">
                    {order.items.map((i: any) => i.name).join(', ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">
                    {order.items.reduce((sum: number, i: any) => sum + i.workHours, 0)}h
                  </p>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="text-gray-500 text-center py-4">暂无工单</p>
            )}
          </div>
        </div>
      </div>
    </TechnicianLayout>
  )
}

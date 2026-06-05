'use client'

import { useEffect, useState } from 'react'
import SalesLayout from '@/components/SalesLayout'
import { formatMoney } from '@/lib/utils'

interface Performance {
  totalSales: number
  orderCount: number
  monthSales: number
  commission: number
}

export default function SalesPerformancePage() {
  const [performance, setPerformance] = useState<Performance>({
    totalSales: 0,
    orderCount: 0,
    monthSales: 0,
    commission: 0
  })
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const res = await fetch('/api/orders')
    const data = await res.json()
    
    if (data.orders) {
      const myOrders = data.orders.filter((o: any) => o.sales)
      const monthOrders = myOrders.filter((o: any) => {
        const orderMonth = new Date(o.createdAt).getMonth()
        const nowMonth = new Date().getMonth()
        return orderMonth === nowMonth
      })
      
      setOrders(myOrders.slice(0, 10))
      setPerformance({
        totalSales: myOrders.reduce((sum: number, o: any) => sum + parseFloat(o.actualAmount), 0),
        orderCount: myOrders.length,
        monthSales: monthOrders.reduce((sum: number, o: any) => sum + parseFloat(o.actualAmount), 0),
        commission: monthOrders.reduce((sum: number, o: any) => sum + parseFloat(o.actualAmount), 0) * 0.05
      })
    }
  }

  return (
    <SalesLayout>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-purple-50 rounded-xl p-4">
            <p className="text-sm text-purple-600">本月销售额</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">
              {formatMoney(performance.monthSales)}
            </p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-sm text-green-600">预估提成</p>
            <p className="text-2xl font-bold text-green-700 mt-1">
              {formatMoney(performance.commission)}
            </p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-600">累计销售</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {formatMoney(performance.totalSales)}
            </p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4">
            <p className="text-sm text-orange-600">订单数</p>
            <p className="text-2xl font-bold text-orange-700 mt-1">
              {performance.orderCount} 单
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <h3 className="font-bold mb-4">最近订单</h3>
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{order.orderNo}</p>
                  <p className="text-sm text-gray-500">
                    {order.customer?.name || '散客'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">
                    {formatMoney(order.actualAmount)}
                  </p>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="text-gray-500 text-center py-4">暂无订单</p>
            )}
          </div>
        </div>
      </div>
    </SalesLayout>
  )
}

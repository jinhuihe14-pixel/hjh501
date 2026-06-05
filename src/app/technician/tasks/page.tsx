'use client'

import { useEffect, useState } from 'react'
import TechnicianLayout from '@/components/TechnicianLayout'
import { formatMoney, formatDateTime } from '@/lib/utils'

interface Order {
  id: string
  orderNo: string
  status: string
  customer: { name: string } | null
  vehicle: { plateNumber: string } | null
  items: { name: string; workHours: number }[]
  actualAmount: number
  createdAt: string
}

export default function TechnicianTasksPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<string>('')

  useEffect(() => {
    loadOrders()
  }, [filter])

  const loadOrders = async () => {
    const url = filter ? `/api/orders?status=${filter}` : '/api/orders'
    const res = await fetch(url)
    const data = await res.json()
    if (data.orders) {
      setOrders(data.orders)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    loadOrders()
  }

  const filteredOrders = filter 
    ? orders.filter(o => o.status === filter)
    : orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED')

  return (
    <TechnicianLayout>
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              filter === '' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            待处理
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              filter === 'PENDING' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            待施工
          </button>
          <button
            onClick={() => setFilter('IN_PROGRESS')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              filter === 'IN_PROGRESS' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            施工中
          </button>
          <button
            onClick={() => setFilter('COMPLETED')}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              filter === 'COMPLETED' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            已完成
          </button>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <span className="text-5xl mb-4 block">📭</span>
            <p>暂无工单</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-bold">{order.orderNo}</div>
                    <div className="text-sm text-gray-500">
                      {order.customer?.name || '散客'} · {order.vehicle?.plateNumber || '无车辆'}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    order.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {order.status === 'PENDING' ? '待施工' :
                     order.status === 'IN_PROGRESS' ? '施工中' : '已完成'}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.name}</span>
                      <span className="text-gray-500">{item.workHours}工时</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {formatDateTime(order.createdAt)}
                  </div>
                  <div className="font-bold text-lg text-primary">
                    {formatMoney(order.actualAmount)}
                  </div>
                </div>

                {order.status === 'PENDING' && (
                  <button
                    onClick={() => updateStatus(order.id, 'IN_PROGRESS')}
                    className="w-full mt-3 py-2 bg-blue-500 text-white rounded-lg font-medium"
                  >
                    开始施工
                  </button>
                )}
                {order.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => updateStatus(order.id, 'COMPLETED')}
                    className="w-full mt-3 py-2 bg-green-500 text-white rounded-lg font-medium"
                  >
                    完成施工
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </TechnicianLayout>
  )
}

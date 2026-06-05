'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { formatMoney, formatDateTime, OrderStatusLabels } from '@/lib/utils'

interface Order {
  id: string
  orderNo: string
  orderType: string
  status: string
  totalAmount: number
  actualAmount: number
  customer: { name: string } | null
  vehicle: { plateNumber: string } | null
  technician: { name: string } | null
  sales: { name: string } | null
  frontDesk: { name: string } | null
  items: any[]
  createdAt: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    loadOrders()
  }, [statusFilter])

  const loadOrders = async () => {
    const url = statusFilter ? `/api/orders?status=${statusFilter}` : '/api/orders'
    const res = await fetch(url)
    const data = await res.json()
    if (data.orders) {
      setOrders(data.orders)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">订单管理</h1>
            <p className="text-gray-500">查看和管理所有订单</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              className="input w-40"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">全部状态</option>
              <option value="PENDING">待施工</option>
              <option value="IN_PROGRESS">施工中</option>
              <option value="COMPLETED">已完成</option>
              <option value="CANCELLED">已取消</option>
            </select>
          </div>
        </div>

        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>客户</th>
                <th>车辆</th>
                <th>类型</th>
                <th>金额</th>
                <th>技师</th>
                <th>导购</th>
                <th>开单员</th>
                <th>状态</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="font-medium text-primary">{order.orderNo}</td>
                  <td>{order.customer?.name || '散客'}</td>
                  <td>{order.vehicle?.plateNumber || '-'}</td>
                  <td>
                    {order.orderType === 'SERVICE' ? '服务' :
                     order.orderType === 'PRODUCT' ? '商品' : '混合'}
                  </td>
                  <td className="font-medium">{formatMoney(order.actualAmount)}</td>
                  <td>{order.technician?.name || '-'}</td>
                  <td>{order.sales?.name || '-'}</td>
                  <td>{order.frontDesk?.name || '-'}</td>
                  <td>
                    <span className={`badge ${
                      order.status === 'COMPLETED' ? 'badge-success' :
                      order.status === 'IN_PROGRESS' ? 'badge-info' :
                      order.status === 'CANCELLED' ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {OrderStatusLabels[order.status]}
                    </span>
                  </td>
                  <td className="text-gray-500">{formatDateTime(order.createdAt)}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center text-gray-500 py-8">
                    暂无订单数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  )
}

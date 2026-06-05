'use client'

import { useEffect, useState } from 'react'
import FrontDeskLayout from '@/components/FrontDeskLayout'
import { formatMoney, formatDateTime, OrderStatusLabels, PaymentMethodLabels } from '@/lib/utils'

export default function FrontDeskOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    const res = await fetch('/api/orders')
    const data = await res.json()
    if (data.orders) {
      setOrders(data.orders)
    }
  }

  return (
    <FrontDeskLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">订单列表</h1>
          <p className="text-gray-500">查看所有订单记录</p>
        </div>

        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>客户</th>
                <th>金额</th>
                <th>支付方式</th>
                <th>技师</th>
                <th>导购</th>
                <th>状态</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="font-medium text-primary">{order.orderNo}</td>
                  <td>{order.customer?.name || '散客'}</td>
                  <td className="font-medium">{formatMoney(order.actualAmount)}</td>
                  <td>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      order.paymentMethod === 'CREDIT' ? 'bg-orange-100 text-orange-800' :
                      order.paymentMethod === 'WECHAT' ? 'bg-green-100 text-green-800' :
                      order.paymentMethod === 'ALIPAY' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {PaymentMethodLabels[order.paymentMethod] || '-'}
                    </span>
                  </td>
                  <td>{order.technician?.name || '-'}</td>
                  <td>{order.sales?.name || '-'}</td>
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
                  <td colSpan={8} className="text-center text-gray-500 py-8">
                    暂无订单数据
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

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import { formatMoney } from '@/lib/utils'

interface Stats {
  todayRevenue: number
  todayOrders: number
  monthRevenue: number
  monthOrders: number
  totalCustomers: number
  totalVehicles: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    todayRevenue: 0,
    todayOrders: 0,
    monthRevenue: 0,
    monthOrders: 0,
    totalCustomers: 0,
    totalVehicles: 0
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])

  useEffect(() => {
    const loadData = async () => {
      const [ordersRes, customersRes, vehiclesRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/customers'),
        fetch('/api/vehicles')
      ])
      
      const ordersData = await ordersRes.json()
      const customersData = await customersRes.json()
      const vehiclesData = await vehiclesRes.json()
      
      if (ordersData.orders) {
        const today = new Date().toDateString()
        const thisMonth = new Date().getMonth()
        
        const todayOrders = ordersData.orders.filter((o: any) => 
          new Date(o.createdAt).toDateString() === today
        )
        const monthOrders = ordersData.orders.filter((o: any) => 
          new Date(o.createdAt).getMonth() === thisMonth
        )
        
        setStats(prev => ({
          ...prev,
          todayRevenue: todayOrders.reduce((sum: number, o: any) => sum + parseFloat(o.actualAmount), 0),
          todayOrders: todayOrders.length,
          monthRevenue: monthOrders.reduce((sum: number, o: any) => sum + parseFloat(o.actualAmount), 0),
          monthOrders: monthOrders.length
        }))
        
        setRecentOrders(ordersData.orders.slice(0, 10))
      }
      
      if (customersData.customers) {
        setStats(prev => ({
          ...prev,
          totalCustomers: customersData.customers.length
        }))
      }
      
      if (vehiclesData.vehicles) {
        setStats(prev => ({
          ...prev,
          totalVehicles: vehiclesData.vehicles.length
        }))
      }
    }
    
    loadData()
  }, [])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据概览</h1>
          <p className="text-gray-500">欢迎回来，查看门店运营数据</p>
        </div>

        <div className="grid grid-cols-6 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今日营收</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatMoney(stats.todayRevenue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今日订单</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.todayOrders} 单
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本月营收</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatMoney(stats.monthRevenue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本月订单</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.monthOrders} 单
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🛒</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">客户总数</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalCustomers} 人
                </p>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">车辆总数</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.totalVehicles} 辆
                </p>
              </div>
              <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🚗</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900">最近订单</h2>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{order.orderNo}</p>
                      <p className="text-sm text-gray-500">
                        {order.customer?.name || '散客'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatMoney(order.actualAmount)}
                      </p>
                      <p className={`text-sm ${
                        order.status === 'COMPLETED' ? 'text-green-600' :
                        order.status === 'IN_PROGRESS' ? 'text-blue-600' :
                        'text-yellow-600'
                      }`}>
                        {order.status === 'COMPLETED' ? '已完成' :
                         order.status === 'IN_PROGRESS' ? '施工中' : '待施工'}
                      </p>
                    </div>
                  </div>
                ))}
                {recentOrders.length === 0 && (
                  <p className="text-gray-500 text-center py-4">暂无订单</p>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900">快捷操作</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => router.push('/frontdesk/orders')}
                  className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-left"
                >
                  <span className="text-2xl mb-2 block">➕</span>
                  <p className="font-medium text-gray-900">新建订单</p>
                  <p className="text-sm text-gray-500">快速开单</p>
                </button>
                <button
                  onClick={() => router.push('/admin/employees')}
                  className="p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors text-left"
                >
                  <span className="text-2xl mb-2 block">👥</span>
                  <p className="font-medium text-gray-900">员工管理</p>
                  <p className="text-sm text-gray-500">添加员工账号</p>
                </button>
                <button
                  onClick={() => router.push('/admin/salary-records')}
                  className="p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors text-left"
                >
                  <span className="text-2xl mb-2 block">💰</span>
                  <p className="font-medium text-gray-900">薪资核算</p>
                  <p className="text-sm text-gray-500">生成工资单</p>
                </button>
                <button
                  onClick={() => router.push('/admin/reports')}
                  className="p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors text-left"
                >
                  <span className="text-2xl mb-2 block">📊</span>
                  <p className="font-medium text-gray-900">查看报表</p>
                  <p className="text-sm text-gray-500">数据分析</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

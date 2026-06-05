'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { formatMoney, RoleLabels } from '@/lib/utils'

export default function ReportsPage() {
  const [reportType, setReportType] = useState('revenue')
  const [data, setData] = useState<any>(null)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadReport()
  }, [reportType, dateRange])

  const loadReport = async () => {
    const res = await fetch(
      `/api/reports?type=${reportType}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
    )
    const data = await res.json()
    setData(data)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">报表统计</h1>
            <p className="text-gray-500">查看门店运营数据报表</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              className="input w-40"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="revenue">营收报表</option>
              <option value="customer">客户分析</option>
              <option value="performance">员工业绩</option>
            </select>
            <input
              type="date"
              className="input w-40"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
            <input
              type="date"
              className="input w-40"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
          </div>
        </div>

        {reportType === 'revenue' && data && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-6">
              <div className="card p-6">
                <p className="text-sm text-gray-500">总营收</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatMoney(data.totalRevenue)}
                </p>
              </div>
              <div className="card p-6">
                <p className="text-sm text-gray-500">订单数</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {data.orderCount} 单
                </p>
              </div>
              <div className="card p-6">
                <p className="text-sm text-gray-500">服务营收</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {formatMoney(data.serviceRevenue)}
                </p>
              </div>
              <div className="card p-6">
                <p className="text-sm text-gray-500">商品营收</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatMoney(data.productRevenue)}
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold">热销服务项目 TOP10</h2>
              </div>
              <div className="card-body">
                <table className="table">
                  <thead>
                    <tr>
                      <th>排名</th>
                      <th>服务项目</th>
                      <th>销量</th>
                      <th>营收</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topServices?.map((item: any, index: number) => (
                      <tr key={index}>
                        <td>
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            index < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="font-medium">{item.name}</td>
                        <td>{item.count} 次</td>
                        <td>{formatMoney(item.amount)}</td>
                      </tr>
                    ))}
                    {(!data.topServices || data.topServices.length === 0) && (
                      <tr>
                        <td colSpan={4} className="text-center text-gray-500 py-4">
                          暂无数据
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {reportType === 'customer' && data && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-6">
              <div className="card p-6">
                <p className="text-sm text-gray-500">客户总数</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {data.totalCustomers}
                </p>
              </div>
              <div className="card p-6">
                <p className="text-sm text-gray-500">回头客</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {data.repeatCustomers}
                </p>
              </div>
              <div className="card p-6">
                <p className="text-sm text-gray-500">新客户</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {data.newCustomers}
                </p>
              </div>
              <div className="card p-6">
                <p className="text-sm text-gray-500">复购率</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {data.repeatRate}%
                </p>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold">客户消费排行</h2>
              </div>
              <div className="card-body">
                <table className="table">
                  <thead>
                    <tr>
                      <th>客户</th>
                      <th>手机号</th>
                      <th>消费次数</th>
                      <th>累计消费</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.customers?.slice(0, 10).map((customer: any) => (
                      <tr key={customer.id}>
                        <td className="font-medium">{customer.name}</td>
                        <td>{customer.phone}</td>
                        <td>{customer.orderCount} 次</td>
                        <td className="font-medium text-primary">
                          {formatMoney(customer.totalSpent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {reportType === 'performance' && data && (
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold">员工业绩统计</h2>
            </div>
            <div className="card-body">
              <table className="table">
                <thead>
                  <tr>
                    <th>员工</th>
                    <th>岗位</th>
                    <th>服务工时</th>
                    <th>服务营收</th>
                    <th>商品销售额</th>
                    <th>开单金额</th>
                    <th>订单数</th>
                  </tr>
                </thead>
                <tbody>
                  {data.performances?.map((p: any) => (
                    <tr key={p.id}>
                      <td className="font-medium">{p.name}</td>
                      <td>{RoleLabels[p.role]}</td>
                      <td>{p.totalHours} 小时</td>
                      <td>{formatMoney(p.serviceAmount)}</td>
                      <td>{formatMoney(p.productSales)}</td>
                      <td>{formatMoney(p.orderAmount)}</td>
                      <td>{p.orderCount}</td>
                    </tr>
                  ))}
                  {(!data.performances || data.performances.length === 0) && (
                    <tr>
                      <td colSpan={7} className="text-center text-gray-500 py-4">
                        暂无数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

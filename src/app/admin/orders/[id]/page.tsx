'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import { formatMoney, formatDateTime, OrderStatusLabels, RoleLabels } from '@/lib/utils'
import { ArrowLeft, Printer, User, Calendar, ClipboardList, Users, TrendingUp } from 'lucide-react'

interface OrderDetail {
  id: string
  orderNo: string
  orderType: string
  status: string
  totalAmount: number
  discountAmount: number
  actualAmount: number
  customerId: string | null
  vehicleId: string | null
  frontDeskId: string | null
  technicianId: string | null
  salesId: string | null
  remark: string | null
  paymentMethod: string | null
  paidAt: string | null
  createdAt: string
  updatedAt: string
  customer: { id: string; name: string; phone: string } | null
  vehicle: { id: string; plateNumber: string; brand: string; model: string; color: string | null } | null
  frontDesk: { id: string; name: string; role: string } | null
  technician: { id: string; name: string; role: string } | null
  sales: { id: string; name: string; role: string } | null
  items: Array<{
    id: string
    itemType: string
    name: string
    price: number
    quantity: number
    subtotal: number
    workHours: number
  }>
  statusLogs: Array<{
    id: string
    fromStatus: string | null
    toStatus: string
    operatorId: string
    remark: string | null
    createdAt: string
    operator: { id: string; name: string; role: string }
  }>
  performanceLogs: Array<{
    id: string
    userId: string
    type: string
    amount: number
    commission: number
    workHours: number
    month: string
    createdAt: string
    user: { id: string; name: string; role: string }
  }>
}

interface Technician {
  id: string
  name: string
  role: string
}

const PerformanceTypeLabels: Record<string, string> = {
  SERVICE_HOURS: '服务工时',
  PRODUCT_SALES: '商品销售',
  ORDER_COMMISSION: '开单提成'
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [selectedTechnician, setSelectedTechnician] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrderDetail()
    loadTechnicians()
  }, [params.id])

  const loadOrderDetail = async () => {
    try {
      const res = await fetch(`/api/orders/${params.id}`)
      const data = await res.json()
      if (data.order) {
        setOrder(data.order)
      }
    } catch (error) {
      console.error('Load order detail error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTechnicians = async () => {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      if (data.users) {
        setTechnicians(data.users.filter((u: Technician) => u.role === 'TECHNICIAN'))
      }
    } catch (error) {
      console.error('Load technicians error:', error)
    }
  }

  const handleAssignTechnician = async () => {
    if (!selectedTechnician) {
      alert('请选择技师')
      return
    }
    try {
      const res = await fetch(`/api/orders/${params.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId: selectedTechnician, remark: '指派技师' })
      })
      if (res.ok) {
        alert('指派成功')
        loadOrderDetail()
      }
    } catch (error) {
      console.error('Assign technician error:', error)
    }
  }

  const handleForceComplete = async () => {
    if (!confirm('确定要强制完成此订单吗？')) return
    try {
      const res = await fetch(`/api/orders/${params.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED', remark: '店长强制完成' })
      })
      if (res.ok) {
        alert('订单已完成')
        loadOrderDetail()
      }
    } catch (error) {
      console.error('Force complete error:', error)
    }
  }

  const handleCancelOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${params.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED', remark: '取消订单' })
      })
      if (res.ok) {
        alert('订单已取消，库存已回滚')
        setShowCancelConfirm(false)
        loadOrderDetail()
      }
    } catch (error) {
      console.error('Cancel order error:', error)
    }
  }

  const handlePrintReceipt = () => {
    if (!order) return
    
    const receipt = `
=============================
      汽车美容服务小票
=============================
订单号：${order.orderNo}
开单时间：${formatDateTime(order.createdAt)}
-----------------------------
客户：${order.customer?.name || '散客'}
车辆：${order.vehicle?.plateNumber || '无'}
      ${order.vehicle?.brand || ''} ${order.vehicle?.model || ''}
-----------------------------
服务项目：
${order.items.map(item => `  ${item.name} × ${item.quantity}  ${formatMoney(item.subtotal)}`).join('\n')}
-----------------------------
小计：${formatMoney(order.totalAmount)}
优惠：${formatMoney(order.discountAmount)}
实收：${formatMoney(order.actualAmount)}
-----------------------------
开单员：${order.frontDesk?.name || '-'}
技师：${order.technician?.name || '-'}
导购：${order.sales?.name || '-'}
-----------------------------
备注：${order.remark || '无'}
=============================
      感谢惠顾，欢迎再来！
=============================
    `.trim()
    
    navigator.clipboard.writeText(receipt).then(() => {
      alert('小票已复制到剪贴板')
    }).catch(() => {
      alert('复制失败，请手动复制')
      console.log(receipt)
    })
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      </AdminLayout>
    )
  }

  if (!order) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">订单不存在</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">订单详情</h1>
            <p className="text-gray-500">订单号：{order.orderNo}</p>
          </div>
          <span className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${
            order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
            order.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
            order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {OrderStatusLabels[order.status]}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="card">
              <div className="card-header flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">订单信息</h2>
              </div>
              <div className="card-body space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">订单类型</label>
                    <p className="font-medium">
                      {order.orderType === 'SERVICE' ? '服务订单' :
                       order.orderType === 'PRODUCT' ? '商品订单' : '混合订单'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">创建时间</label>
                    <p className="font-medium">{formatDateTime(order.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">订单金额</label>
                    <p className="font-medium">{formatMoney(order.totalAmount)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">优惠减免</label>
                    <p className="font-medium text-red-500">-{formatMoney(order.discountAmount)}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm text-gray-500">实收金额</label>
                    <p className="font-bold text-xl text-primary">{formatMoney(order.actualAmount)}</p>
                  </div>
                </div>
                {order.remark && (
                  <div className="pt-4 border-t">
                    <label className="text-sm text-gray-500">订单备注</label>
                    <p className="font-medium">{order.remark}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">客户车辆信息</h2>
              </div>
              <div className="card-body space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">客户姓名</label>
                    <p className="font-medium">{order.customer?.name || '散客'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">联系电话</label>
                    <p className="font-medium">{order.customer?.phone || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">车牌号</label>
                    <p className="font-medium">{order.vehicle?.plateNumber || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">车辆信息</label>
                    <p className="font-medium">
                      {order.vehicle ? `${order.vehicle.brand} ${order.vehicle.model} ${order.vehicle.color || ''}` : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">服务/商品明细</h2>
              </div>
              <div className="card-body">
                <table className="table">
                  <thead>
                    <tr>
                      <th>项目</th>
                      <th>类型</th>
                      <th>单价</th>
                      <th>数量</th>
                      <th>工时</th>
                      <th>小计</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id}>
                        <td className="font-medium">{item.name}</td>
                        <td>{item.itemType === 'service' ? '服务' : '商品'}</td>
                        <td>{formatMoney(item.price)}</td>
                        <td>{item.quantity}</td>
                        <td>{item.workHours || '-'}</td>
                        <td className="font-medium">{formatMoney(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <div className="card-header flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">关联人员</h2>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">前台开单</div>
                    <div className="font-medium">{order.frontDesk?.name || '-'}</div>
                    {order.frontDesk && (
                      <div className="text-xs text-gray-400">{RoleLabels[order.frontDesk.role]}</div>
                    )}
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">服务技师</div>
                    <div className="font-medium">{order.technician?.name || '-'}</div>
                    {order.technician && (
                      <div className="text-xs text-gray-400">{RoleLabels[order.technician.role]}</div>
                    )}
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">销售导购</div>
                    <div className="font-medium">{order.sales?.name || '-'}</div>
                    {order.sales && (
                      <div className="text-xs text-gray-400">{RoleLabels[order.sales.role]}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">状态流转时间线</h2>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {order.statusLogs.map((log, index) => (
                    <div key={log.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          index === order.statusLogs.length - 1 ? 'bg-primary' : 'bg-gray-300'
                        }`} />
                        {index < order.statusLogs.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            {log.fromStatus ? `${OrderStatusLabels[log.fromStatus]} → ` : ''}
                            <span className="text-primary">{OrderStatusLabels[log.toStatus]}</span>
                          </div>
                          <div className="text-sm text-gray-500">{formatDateTime(log.createdAt)}</div>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          操作人：{log.operator.name}（{RoleLabels[log.operator.role]}）
                        </div>
                        {log.remark && (
                          <div className="text-sm text-gray-600 mt-1 bg-gray-50 px-3 py-2 rounded">
                            {log.remark}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {order.performanceLogs.length > 0 && (
              <div className="card">
                <div className="card-header flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold">绩效提成明细</h2>
                </div>
                <div className="card-body">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>人员</th>
                        <th>类型</th>
                        <th>金额</th>
                        <th>提成</th>
                        <th>工时</th>
                        <th>月份</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.performanceLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="font-medium">{log.user.name}</td>
                          <td>{PerformanceTypeLabels[log.type] || log.type}</td>
                          <td>{formatMoney(log.amount)}</td>
                          <td>{formatMoney(log.commission)}</td>
                          <td>{log.workHours || '-'}</td>
                          <td>{log.month}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="card sticky top-8">
              <div className="card-header">
                <h2 className="font-semibold">操作</h2>
              </div>
              <div className="card-body space-y-4">
                {order.status === 'PENDING' && (
                  <>
                    <div>
                      <label className="label">指派技师</label>
                      <select
                        className="input"
                        value={selectedTechnician}
                        onChange={(e) => setSelectedTechnician(e.target.value)}
                      >
                        <option value="">请选择技师</option>
                        {technicians.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={handleAssignTechnician}
                      className="btn btn-primary w-full"
                    >
                      确认指派
                    </button>
                  </>
                )}

                {order.status === 'IN_PROGRESS' && (
                  <button
                    onClick={handleForceComplete}
                    className="btn btn-primary w-full"
                  >
                    强制完成
                  </button>
                )}

                {order.status === 'COMPLETED' && (
                  <button
                    onClick={handlePrintReceipt}
                    className="btn btn-secondary w-full flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    打印小票
                  </button>
                )}

                {(order.status === 'PENDING' || order.status === 'IN_PROGRESS') && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="btn btn-danger w-full"
                  >
                    取消订单
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold mb-4">确认取消订单</h3>
              <p className="text-gray-600 mb-6">
                取消订单后，已扣减的商品库存将自动回滚，相关绩效记录将被删除。此操作不可撤销。
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="btn btn-secondary flex-1"
                >
                  再想想
                </button>
                <button
                  onClick={handleCancelOrder}
                  className="btn btn-danger flex-1"
                >
                  确认取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

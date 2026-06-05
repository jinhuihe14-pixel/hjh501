'use client'

import { useEffect, useState } from 'react'
import FrontDeskLayout from '@/components/FrontDeskLayout'
import { formatMoney, formatDate } from '@/lib/utils'

interface Vehicle {
  id: string
  plateNumber: string
  brand: string
  model: string
  color: string | null
  vin: string | null
  currentMileage: number
  createdAt: string
}

interface Order {
  id: string
  orderNo: string
  status: string
  actualAmount: number
  createdAt: string
}

interface Customer {
  id: string
  name: string
  phone: string
  wechatId: string | null
  address: string | null
  vehicles: Vehicle[]
  totalOrders: number
  totalAmount: number
  orders: Order[]
  createdAt: string
}

const PLATE_REGEX = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼][A-Z][A-Z0-9]{5}$/

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchPhone, setSearchPhone] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [vehicleForm, setVehicleForm] = useState({
    plateNumber: '',
    brand: '',
    model: '',
    color: '',
    vin: '',
    currentMileage: ''
  })
  const [vehicleError, setVehicleError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    wechatId: '',
    address: ''
  })

  useEffect(() => {
    if (searchPhone) {
      searchCustomers(searchPhone)
    } else {
      loadCustomers()
    }
  }, [searchPhone])

  const loadCustomers = async () => {
    const res = await fetch('/api/customers')
    const data = await res.json()
    if (data.customers) {
      setCustomers(data.customers)
    }
  }

  const searchCustomers = async (phone: string) => {
    const res = await fetch(`/api/customers?phone=${phone}`)
    const data = await res.json()
    if (data.customers) {
      setCustomers(data.customers)
    }
  }

  const loadCustomerDetail = async (id: string) => {
    const res = await fetch(`/api/customers/${id}`)
    const data = await res.json()
    if (data.customer) {
      setSelectedCustomer(data.customer)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })

    if (res.ok) {
      setShowModal(false)
      setFormData({ name: '', phone: '', wechatId: '', address: '' })
      loadCustomers()
    }
  }

  const validatePlateNumber = (plate: string): string | null => {
    if (!PLATE_REGEX.test(plate)) {
      return '车牌号格式不正确，应为省份简称+字母+5位字母数字（如：京A12345）'
    }
    return null
  }

  const checkPlateUnique = async (plate: string): Promise<boolean> => {
    const res = await fetch(`/api/vehicles?plateNumber=${plate}`)
    const data = await res.json()
    return !data.vehicles || data.vehicles.length === 0
  }

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setVehicleError('')

    const plateError = validatePlateNumber(vehicleForm.plateNumber)
    if (plateError) {
      setVehicleError(plateError)
      return
    }

    const isUnique = await checkPlateUnique(vehicleForm.plateNumber)
    if (!isUnique) {
      setVehicleError('该车牌号已存在')
      return
    }

    const res = await fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...vehicleForm,
        customerId: selectedCustomer?.id
      })
    })

    if (res.ok) {
      setShowVehicleModal(false)
      setVehicleForm({
        plateNumber: '',
        brand: '',
        model: '',
        color: '',
        vin: '',
        currentMileage: ''
      })
      if (selectedCustomer) {
        loadCustomerDetail(selectedCustomer.id)
      }
      loadCustomers()
    } else {
      const data = await res.json()
      setVehicleError(data.error || '添加失败')
    }
  }

  return (
    <FrontDeskLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">客户管理</h1>
            <p className="text-gray-500">管理客户信息和车辆档案</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
          >
            + 添加客户
          </button>
        </div>

        <div className="card">
          <div className="card-body">
            <input
              type="text"
              className="input"
              placeholder="搜索客户手机号..."
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <div className="card overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>姓名</th>
                    <th>手机号</th>
                    <th>车辆</th>
                    <th>注册时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className={`cursor-pointer transition-colors ${
                        selectedCustomer?.id === customer.id
                          ? 'bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => loadCustomerDetail(customer.id)}
                    >
                      <td className="font-medium">{customer.name}</td>
                      <td>{customer.phone}</td>
                      <td>
                        {customer.vehicles && customer.vehicles.length > 0 ? (
                          <div className="space-y-1">
                            {customer.vehicles.slice(0, 2).map((v, i) => (
                              <div key={i} className="text-sm">
                                <span className="badge badge-info">{v.plateNumber}</span>
                                <span className="text-gray-500 ml-2">{v.brand} {v.model}</span>
                              </div>
                            ))}
                            {customer.vehicles.length > 2 && (
                              <span className="text-xs text-gray-400">+{customer.vehicles.length - 2} 辆</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">无车辆</span>
                        )}
                      </td>
                      <td className="text-gray-500">
                        {formatDate(customer.createdAt)}
                      </td>
                      <td>
                        <button className="text-primary hover:underline text-sm">
                          编辑
                        </button>
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-gray-500 py-8">
                        暂无客户数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            {selectedCustomer ? (
              <div className="card sticky top-8">
                <div className="card-header flex items-center justify-between">
                  <h2 className="font-semibold">客户详情</h2>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="card-body space-y-6">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-700">基本信息</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">姓名：</span>
                        <span className="font-medium">{selectedCustomer.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">手机号：</span>
                        <span>{selectedCustomer.phone}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">地址：</span>
                        <span>{selectedCustomer.address || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{selectedCustomer.totalOrders || 0}</p>
                      <p className="text-xs text-gray-500">历史订单</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{formatMoney(selectedCustomer.totalAmount || 0)}</p>
                      <p className="text-xs text-gray-500">消费总额</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-700">车辆档案</h3>
                      <button
                        onClick={() => setShowVehicleModal(true)}
                        className="text-sm text-primary hover:underline"
                      >
                        + 添加车辆
                      </button>
                    </div>
                    {selectedCustomer.vehicles && selectedCustomer.vehicles.length > 0 ? (
                      <div className="space-y-3">
                        {selectedCustomer.vehicles.map((vehicle) => (
                          <div key={vehicle.id} className="p-3 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="badge badge-info text-sm">{vehicle.plateNumber}</span>
                              <span className="font-medium">{vehicle.brand} {vehicle.model}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                              <div>颜色：{vehicle.color || '-'}</div>
                              <div>里程：{vehicle.currentMileage} km</div>
                              <div className="col-span-2">VIN：{vehicle.vin || '-'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-4">暂无车辆</p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">最近订单</h3>
                    {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                      <div className="space-y-2">
                        {selectedCustomer.orders.map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-2 border rounded-lg">
                            <div>
                              <p className="text-sm font-medium">{order.orderNo}</p>
                              <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-green-600">{formatMoney(order.actualAmount)}</p>
                              <p className="text-xs text-gray-500">
                                {order.status === 'COMPLETED' ? '已完成' :
                                 order.status === 'IN_PROGRESS' ? '施工中' : '待施工'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-4">暂无订单</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card sticky top-8">
                <div className="card-body text-center text-gray-400 py-12">
                  <p className="text-4xl mb-2">👤</p>
                  <p>点击左侧客户查看详情</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">添加客户</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">姓名</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">手机号</label>
                  <input
                    type="tel"
                    className="input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">微信号</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.wechatId}
                    onChange={(e) => setFormData({ ...formData, wechatId: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">地址</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    className="btn btn-secondary flex-1"
                    onClick={() => setShowModal(false)}
                  >
                    取消
                  </button>
                  <button type="submit" className="btn btn-primary flex-1">
                    添加
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showVehicleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">添加车辆</h2>
              <form onSubmit={handleVehicleSubmit} className="space-y-4">
                {vehicleError && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                    {vehicleError}
                  </div>
                )}
                <div>
                  <label className="label">车牌号 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="input"
                    placeholder="如：京A12345"
                    value={vehicleForm.plateNumber}
                    onChange={(e) => {
                      setVehicleForm({ ...vehicleForm, plateNumber: e.target.value.toUpperCase() })
                      setVehicleError('')
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="label">品牌 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="input"
                    placeholder="如：奔驰、宝马"
                    value={vehicleForm.brand}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, brand: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">车型 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="input"
                    placeholder="如：S350、X5"
                    value={vehicleForm.model}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">颜色</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="如：黑色"
                      value={vehicleForm.color}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, color: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">当前里程(km)</label>
                    <input
                      type="number"
                      className="input"
                      placeholder="如：10000"
                      value={vehicleForm.currentMileage}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, currentMileage: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">VIN码</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="17位车架号"
                    value={vehicleForm.vin}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, vin: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    className="btn btn-secondary flex-1"
                    onClick={() => {
                      setShowVehicleModal(false)
                      setVehicleError('')
                    }}
                  >
                    取消
                  </button>
                  <button type="submit" className="btn btn-primary flex-1">
                    添加
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </FrontDeskLayout>
  )
}

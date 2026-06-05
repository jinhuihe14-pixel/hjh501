'use client'

import { useEffect, useState } from 'react'
import FrontDeskLayout from '@/components/FrontDeskLayout'

interface Customer {
  id: string
  name: string
  phone: string
  vehicles: { plateNumber: string; brand: string; model: string }[]
  createdAt: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchPhone, setSearchPhone] = useState('')
  const [showModal, setShowModal] = useState(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })

    if (res.ok) {
      setShowModal(false)
      loadCustomers()
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
                <tr key={customer.id}>
                  <td className="font-medium">{customer.name}</td>
                  <td>{customer.phone}</td>
                  <td>
                    {customer.vehicles.length > 0 ? (
                      <div className="space-y-1">
                        {customer.vehicles.map((v, i) => (
                          <div key={i} className="text-sm">
                            <span className="badge badge-info">{v.plateNumber}</span>
                            <span className="text-gray-500 ml-2">{v.brand} {v.model}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">无车辆</span>
                    )}
                  </td>
                  <td className="text-gray-500">
                    {new Date(customer.createdAt).toLocaleDateString('zh-CN')}
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
      </div>
    </FrontDeskLayout>
  )
}

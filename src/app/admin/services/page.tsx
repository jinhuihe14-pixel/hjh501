'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { formatMoney } from '@/lib/utils'

interface Service {
  id: string
  name: string
  description: string | null
  price: number
  workHours: number
  hourPrice: number
  category: { name: string } | null
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    workHours: '1',
    hourPrice: '',
    categoryId: ''
  })

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    const res = await fetch('/api/services')
    const data = await res.json()
    if (data.services) {
      setServices(data.services)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const res = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })

    if (res.ok) {
      setShowModal(false)
      loadServices()
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">服务项目管理</h1>
            <p className="text-gray-500">管理门店提供的美容服务项目</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
          >
            + 添加服务
          </button>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {services.map((service) => (
            <div key={service.id} className="card hover:shadow-md transition-shadow">
              <div className="card-body">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{service.name}</h3>
                  <span className="badge badge-info">{service.category?.name || '未分类'}</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  {service.description || '暂无描述'}
                </p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {formatMoney(service.price)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {service.workHours} 工时 · 工时费 {formatMoney(service.hourPrice)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {services.length === 0 && (
            <div className="col-span-4 text-center py-12 text-gray-500">
              暂无服务项目
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">添加服务项目</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">服务名称</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">描述</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">服务价格 (元)</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">工时 (小时)</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.workHours}
                      onChange={(e) => setFormData({ ...formData, workHours: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">工时单价 (元/小时)</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.hourPrice}
                    onChange={(e) => setFormData({ ...formData, hourPrice: e.target.value })}
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
    </AdminLayout>
  )
}

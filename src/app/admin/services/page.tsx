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
  category: { id: string; name: string } | null
  isActive: boolean
}

interface ServiceCategory {
  id: string
  name: string
  description: string | null
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showQuickCreate, setShowQuickCreate] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    workHours: '1',
    hourPrice: '',
    categoryId: ''
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadServices()
    loadCategories()
  }, [])

  const loadServices = async () => {
    const res = await fetch('/api/services')
    const data = await res.json()
    if (data.services) {
      setServices(data.services)
    }
  }

  const loadCategories = async () => {
    const res = await fetch('/api/service-categories')
    const data = await res.json()
    if (data.categories) {
      setCategories(data.categories)
      if (data.categories.length === 0) {
        setShowQuickCreate(true)
      }
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.categoryId) {
      errors.categoryId = '请选择服务分类'
    }

    const price = parseFloat(formData.price)
    if (isNaN(price) || price <= 0) {
      errors.price = '价格必须为正数'
    } else if (!/^\d+(\.\d{1,2})?$/.test(formData.price)) {
      errors.price = '价格最多保留两位小数'
    }

    const workHours = parseInt(formData.workHours)
    if (isNaN(workHours) || workHours <= 0 || !Number.isInteger(workHours)) {
      errors.workHours = '工时必须为正整数'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleQuickCreateCategory = async () => {
    if (!newCategoryName.trim()) return

    const res = await fetch('/api/service-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategoryName })
    })

    if (res.ok) {
      const data = await res.json()
      setCategories([...categories, data.category])
      setFormData({ ...formData, categoryId: data.category.id })
      setNewCategoryName('')
      setShowQuickCreate(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const res = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })

    if (res.ok) {
      setShowModal(false)
      loadServices()
      resetForm()
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      workHours: '1',
      hourPrice: '',
      categoryId: ''
    })
    setFormErrors({})
  }

  const filteredServices = selectedFilter === 'all' 
    ? services 
    : services.filter(s => s.category?.id === selectedFilter)

  const isFormValid = formData.categoryId && !formErrors.price && !formErrors.workHours

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

        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedFilter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedFilter(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedFilter === cat.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-4 gap-6">
          {filteredServices.map((service) => (
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
          {filteredServices.length === 0 && (
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
                  <label className="label">
                    服务分类 <span className="text-red-500">*</span>
                  </label>
                  {categories.length > 0 && !showQuickCreate ? (
                    <div>
                      <select
                        className="input"
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        required
                      >
                        <option value="">请选择服务分类</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowQuickCreate(true)}
                        className="text-sm text-primary hover:underline mt-1"
                      >
                        + 创建新分类
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="input flex-1"
                          placeholder="输入分类名称"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={handleQuickCreateCategory}
                          className="btn btn-secondary"
                        >
                          创建
                        </button>
                      </div>
                      {categories.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowQuickCreate(false)}
                          className="text-sm text-gray-500 hover:underline"
                        >
                          选择已有分类
                        </button>
                      )}
                    </div>
                  )}
                  {formErrors.categoryId && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.categoryId}</p>
                  )}
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
                      step="0.01"
                      className={`input ${formErrors.price ? 'border-red-500' : ''}`}
                      value={formData.price}
                      onChange={(e) => {
                        setFormData({ ...formData, price: e.target.value })
                        setFormErrors({ ...formErrors, price: '' })
                      }}
                      required
                    />
                    {formErrors.price && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.price}</p>
                    )}
                  </div>
                  <div>
                    <label className="label">工时 (小时)</label>
                    <input
                      type="number"
                      step="1"
                      className={`input ${formErrors.workHours ? 'border-red-500' : ''}`}
                      value={formData.workHours}
                      onChange={(e) => {
                        setFormData({ ...formData, workHours: e.target.value })
                        setFormErrors({ ...formErrors, workHours: '' })
                      }}
                      required
                    />
                    {formErrors.workHours && (
                      <p className="text-red-500 text-sm mt-1">{formErrors.workHours}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="label">工时单价 (元/小时)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={formData.hourPrice}
                    onChange={(e) => setFormData({ ...formData, hourPrice: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    className="btn btn-secondary flex-1"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                      setShowQuickCreate(categories.length === 0)
                    }}
                  >
                    取消
                  </button>
                  <button 
                    type="submit" 
                    className={`btn flex-1 ${isFormValid ? 'btn-primary' : 'btn-disabled'}`}
                    disabled={!isFormValid}
                  >
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

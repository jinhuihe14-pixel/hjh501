'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { formatMoney } from '@/lib/utils'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  cost: number
  stock: number
  commissionRate: number
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    stock: '0',
    commissionRate: '5'
  })

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    const res = await fetch('/api/products')
    const data = await res.json()
    if (data.products) {
      setProducts(data.products)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })

    if (res.ok) {
      setShowModal(false)
      loadProducts()
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">商品管理</h1>
            <p className="text-gray-500">管理门店售卖的汽车用品</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
          >
            + 添加商品
          </button>
        </div>

        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>商品名称</th>
                <th>售价</th>
                <th>成本</th>
                <th>库存</th>
                <th>提成比例</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.description}</div>
                  </td>
                  <td className="font-bold text-primary">{formatMoney(product.price)}</td>
                  <td>{formatMoney(product.cost)}</td>
                  <td>
                    <span className={`badge ${product.stock > 10 ? 'badge-success' : 'badge-warning'}`}>
                      {product.stock} 件
                    </span>
                  </td>
                  <td>{product.commissionRate}%</td>
                  <td>
                    <button className="text-primary hover:underline text-sm">
                      编辑
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-8">
                    暂无商品数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">添加商品</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">商品名称</label>
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
                    <label className="label">售价 (元)</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">成本 (元)</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">库存数量</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">销售提成 (%)</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.commissionRate}
                      onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                    />
                  </div>
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

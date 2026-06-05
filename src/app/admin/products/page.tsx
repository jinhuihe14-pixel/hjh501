'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { formatMoney, formatDateTime } from '@/lib/utils'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  cost: number
  stock: number
  commissionRate: number
}

interface StockLog {
  id: string
  type: 'IN' | 'OUT' | 'ADJUST'
  quantity: number
  beforeStock: number
  afterStock: number
  remark: string | null
  operator: { name: string } | null
  createdAt: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showStockModal, setShowStockModal] = useState(false)
  const [showStockLogsModal, setShowStockLogsModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [stockLogs, setStockLogs] = useState<StockLog[]>([])
  const [stockFormData, setStockFormData] = useState({
    quantity: '',
    remark: ''
  })
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

  const openStockModal = (product: Product) => {
    setSelectedProduct(product)
    setStockFormData({ quantity: '', remark: '' })
    setShowStockModal(true)
  }

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return
    
    const res = await fetch(`/api/products/${selectedProduct.id}/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stockFormData)
    })

    if (res.ok) {
      setShowStockModal(false)
      loadProducts()
    }
  }

  const openStockLogsModal = async (product: Product) => {
    setSelectedProduct(product)
    const res = await fetch(`/api/products/${product.id}/stock-logs`)
    const data = await res.json()
    if (data.stockLogs) {
      setStockLogs(data.stockLogs)
      setShowStockLogsModal(true)
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => openStockModal(product)}
                        className="text-green-600 hover:underline text-sm"
                      >
                        进货
                      </button>
                      <button
                        onClick={() => openStockLogsModal(product)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        库存记录
                      </button>
                    </div>
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

        {showStockModal && selectedProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-2">商品进货</h2>
              <p className="text-sm text-gray-500 mb-4">
                当前商品：{selectedProduct.name}（当前库存：{selectedProduct.stock} 件）
              </p>
              <form onSubmit={handleStockSubmit} className="space-y-4">
                <div>
                  <label className="label">进货数量</label>
                  <input
                    type="number"
                    className="input"
                    min="1"
                    value={stockFormData.quantity}
                    onChange={(e) => setStockFormData({ ...stockFormData, quantity: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">备注</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={stockFormData.remark}
                    onChange={(e) => setStockFormData({ ...stockFormData, remark: e.target.value })}
                    placeholder="可选，如进货渠道等"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    className="btn btn-secondary flex-1"
                    onClick={() => setShowStockModal(false)}
                  >
                    取消
                  </button>
                  <button type="submit" className="btn btn-primary flex-1">
                    确认进货
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showStockLogsModal && selectedProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
              <h2 className="text-lg font-semibold mb-2">库存变动记录</h2>
              <p className="text-sm text-gray-500 mb-4">
                商品：{selectedProduct.name}
              </p>
              <div className="flex-1 overflow-y-auto">
                {stockLogs.length > 0 ? (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>时间</th>
                        <th>类型</th>
                        <th>变动数量</th>
                        <th>变动前</th>
                        <th>变动后</th>
                        <th>操作人</th>
                        <th>备注</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="text-sm">{formatDateTime(log.createdAt)}</td>
                          <td>
                            <span className={`badge ${
                              log.type === 'IN' ? 'badge-success' :
                              log.type === 'OUT' ? 'badge-error' : 'badge-warning'
                            }`}>
                              {log.type === 'IN' ? '进货' : log.type === 'OUT' ? '出库' : '调整'}
                            </span>
                          </td>
                          <td className={log.type === 'IN' ? 'text-green-600' : 'text-red-600'}>
                            {log.type === 'IN' ? '+' : '-'}{log.quantity}
                          </td>
                          <td>{log.beforeStock}</td>
                          <td>{log.afterStock}</td>
                          <td className="text-sm text-gray-600">{log.operator?.name || '-'}</td>
                          <td className="text-sm text-gray-500">{log.remark || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center text-gray-500 py-8">暂无库存变动记录</p>
                )}
              </div>
              <div className="pt-4 border-t mt-4">
                <button
                  type="button"
                  className="btn btn-secondary w-full"
                  onClick={() => setShowStockLogsModal(false)}
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

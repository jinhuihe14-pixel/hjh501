'use client'

import { useEffect, useState } from 'react'
import FrontDeskLayout from '@/components/FrontDeskLayout'
import { formatMoney } from '@/lib/utils'

interface Service {
  id: string
  name: string
  price: number
  workHours: number
}

interface Product {
  id: string
  name: string
  price: number
  commissionRate: number
}

interface Customer {
  id: string
  name: string
  phone: string
  vehicles: { id: string; plateNumber: string }[]
}

interface User {
  id: string
  name: string
  role: string
}

interface CartItem {
  id: string
  type: 'service' | 'product'
  name: string
  price: number
  quantity: number
  workHours?: number
  serviceId?: string
  productId?: string
}

export default function CreateOrderPage() {
  const [services, setServices] = useState<Service[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [technicians, setTechnicians] = useState<User[]>([])
  const [salespersons, setSalespersons] = useState<User[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<string>('')
  const [selectedTechnician, setSelectedTechnician] = useState<string>('')
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>('')
  const [searchPhone, setSearchPhone] = useState('')
  const [remark, setRemark] = useState('')
  const [discount, setDiscount] = useState('0')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (searchPhone) {
      searchCustomers(searchPhone)
    }
  }, [searchPhone])

  const loadData = async () => {
    const [servicesRes, productsRes, usersRes] = await Promise.all([
      fetch('/api/services'),
      fetch('/api/products'),
      fetch('/api/users')
    ])
    
    const servicesData = await servicesRes.json()
    const productsData = await productsRes.json()
    const usersData = await usersRes.json()
    
    if (servicesData.services) setServices(servicesData.services)
    if (productsData.products) setProducts(productsData.products)
    if (usersData.users) {
      setTechnicians(usersData.users.filter((u: User) => u.role === 'TECHNICIAN'))
      setSalespersons(usersData.users.filter((u: User) => u.role === 'SALES'))
    }
  }

  const searchCustomers = async (phone: string) => {
    const res = await fetch(`/api/customers?phone=${phone}`)
    const data = await res.json()
    if (data.customers) setCustomers(data.customers)
  }

  const addToCart = (item: Service | Product, type: 'service' | 'product') => {
    const existing = cart.find(c => 
      (type === 'service' && c.serviceId === item.id) ||
      (type === 'product' && c.productId === item.id)
    )
    
    if (existing) {
      setCart(cart.map(c => c.id === existing.id ? { ...c, quantity: c.quantity + 1 } : c))
    } else {
      setCart([...cart, {
        id: `${type}-${item.id}`,
        type,
        name: item.name,
        price: item.price,
        quantity: 1,
        workHours: type === 'service' ? (item as Service).workHours : 0,
        serviceId: type === 'service' ? item.id : undefined,
        productId: type === 'product' ? item.id : undefined
      }])
    }
  }

  const removeFromCart = (id: string) => {
    setCart(cart.filter(c => c.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return
    setCart(cart.map(c => c.id === id ? { ...c, quantity } : c))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discountAmount = parseFloat(discount) || 0
  const total = Math.max(0, subtotal - discountAmount)

  const handleSubmit = async () => {
    if (cart.length === 0) {
      alert('请添加商品或服务到购物车')
      return
    }

    const orderData = {
      orderType: cart.every(c => c.type === 'service') ? 'SERVICE' :
                  cart.every(c => c.type === 'product') ? 'PRODUCT' : 'COMBINED',
      totalAmount: subtotal,
      discountAmount,
      actualAmount: total,
      customerId: selectedCustomer?.id || null,
      vehicleId: selectedVehicle || null,
      technicianId: selectedTechnician || null,
      salesId: selectedSalesperson || null,
      remark,
      items: cart.map(c => ({
        type: c.type,
        serviceId: c.serviceId,
        productId: c.productId,
        name: c.name,
        price: c.price,
        quantity: c.quantity,
        subtotal: c.price * c.quantity,
        workHours: c.workHours || 0
      }))
    }

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    })

    if (res.ok) {
      alert('开单成功！')
      setCart([])
      setSelectedCustomer(null)
      setSelectedVehicle('')
      setSelectedTechnician('')
      setSelectedSalesperson('')
      setRemark('')
      setDiscount('0')
    }
  }

  return (
    <FrontDeskLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">开单收银</h1>
          <p className="text-gray-500">快速为客户创建服务订单</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold">客户信息</h2>
              </div>
              <div className="card-body space-y-4">
                <div className="flex gap-4">
                  <input
                    type="text"
                    className="input flex-1"
                    placeholder="搜索客户手机号"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                  />
                </div>
                
                {customers.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                    {customers.map((customer) => (
                      <div
                        key={customer.id}
                        className={`p-3 cursor-pointer hover:bg-gray-50 ${
                          selectedCustomer?.id === customer.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => {
                          setSelectedCustomer(customer)
                          setSelectedVehicle(customer.vehicles[0]?.id || '')
                        }}
                      >
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-gray-500">{customer.phone}</div>
                        {customer.vehicles.length > 0 && (
                          <div className="text-sm text-blue-600">
                            车辆：{customer.vehicles.map(v => v.plateNumber).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {selectedCustomer && selectedCustomer.vehicles.length > 0 && (
                  <div>
                    <label className="label">选择车辆</label>
                    <select
                      className="input"
                      value={selectedVehicle}
                      onChange={(e) => setSelectedVehicle(e.target.value)}
                    >
                      {selectedCustomer.vehicles.map((v) => (
                        <option key={v.id} value={v.id}>{v.plateNumber}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">选择技师</label>
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
                  <div>
                    <label className="label">选择导购</label>
                    <select
                      className="input"
                      value={selectedSalesperson}
                      onChange={(e) => setSelectedSalesperson(e.target.value)}
                    >
                      <option value="">请选择导购</option>
                      {salespersons.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold">服务项目</h2>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-3 gap-3">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => addToCart(service, 'service')}
                      className="p-4 border rounded-lg hover:border-primary hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="font-medium">{service.name}</div>
                      <div className="text-primary font-bold">{formatMoney(service.price)}</div>
                      <div className="text-xs text-gray-500">{service.workHours} 工时</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold">汽车用品</h2>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-3 gap-3">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product, 'product')}
                      className="p-4 border rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left"
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-green-600 font-bold">{formatMoney(product.price)}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card sticky top-8">
              <div className="card-header">
                <h2 className="font-semibold">收银台</h2>
              </div>
              <div className="card-body space-y-4">
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-sm text-gray-500">
                          {formatMoney(item.price)} × {item.quantity}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm"
                        >
                          -
                        </button>
                        <span className="w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-sm"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                  {cart.length === 0 && (
                    <p className="text-gray-500 text-center py-8">购物车为空</p>
                  )}
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">小计</span>
                    <span>{formatMoney(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">优惠减免</span>
                    <input
                      type="number"
                      className="input w-24 text-right py-1 text-sm"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>应收金额</span>
                    <span className="text-red-500">{formatMoney(total)}</span>
                  </div>
                </div>

                <div>
                  <label className="label">备注</label>
                  <textarea
                    className="input"
                    rows={2}
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="订单备注..."
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  className="btn btn-primary w-full py-3 text-lg"
                >
                  确认开单
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FrontDeskLayout>
  )
}

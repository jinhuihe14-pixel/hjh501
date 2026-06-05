'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  stock: number
  commissionRate: number
}

interface Vehicle {
  id: string
  plateNumber: string
  brand: string
  model: string
}

interface Customer {
  id: string
  name: string
  phone: string
  vehicles: Vehicle[]
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
  stock?: number
  workHours?: number
  serviceId?: string
  productId?: string
}

const PLATE_REGEX = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼][A-Z][A-Z0-9]{5}$/

export default function CreateOrderPage() {
  const router = useRouter()
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
  const [paymentMethod, setPaymentMethod] = useState('')

  const paymentMethods = [
    { value: 'WECHAT', label: '微信支付', color: 'green' },
    { value: 'ALIPAY', label: '支付宝', color: 'blue' },
    { value: 'CASH', label: '现金', color: 'yellow' },
    { value: 'BANK_CARD', label: '银行卡', color: 'purple' },
    { value: 'CREDIT', label: '挂账', color: 'orange' }
  ]

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
        stock: type === 'product' ? (item as Product).stock : undefined,
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
      const data = await res.json()
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
        const updatedCustomer = {
          ...selectedCustomer,
          vehicles: [...selectedCustomer.vehicles, data.vehicle]
        }
        setSelectedCustomer(updatedCustomer)
        setSelectedVehicle(data.vehicle.id)
        
        setCustomers(customers.map(c => 
          c.id === selectedCustomer.id ? updatedCustomer : c
        ))
      }
    } else {
      const data = await res.json()
      setVehicleError(data.error || '添加失败')
    }
  }

  const handleSubmit = async () => {
    if (cart.length === 0) {
      alert('请添加商品或服务到购物车')
      return
    }

    const hasOutOfStock = cart.some(item => 
      item.type === 'product' && item.stock === 0
    )
    if (hasOutOfStock) {
      alert('购物车中有缺货商品，请移除后再提交')
      return
    }

    const hasLowStock = cart.some(item => 
      item.type === 'product' && item.stock !== undefined && item.quantity > item.stock
    )
    if (hasLowStock) {
      alert('购物车中有商品库存不足，请调整数量后再提交')
      return
    }

    if (!paymentMethod) {
      alert('请选择支付方式')
      return
    }

    if (paymentMethod === 'CREDIT') {
      const confirmed = confirm('确定挂账？客户后续需要补交')
      if (!confirmed) {
        return
      }
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
      paymentMethod,
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
      const data = await res.json()
      alert('开单成功！')
      router.push(`/frontdesk/orders/${data.order.id}`)
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

                {selectedCustomer && (
                  <div>
                    {selectedCustomer.vehicles.length > 0 ? (
                      <>
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
                      </>
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <p className="text-sm text-gray-500 mb-2">该客户暂无车辆</p>
                        <button
                          type="button"
                          onClick={() => setShowVehicleModal(true)}
                          className="text-sm text-primary hover:underline font-medium"
                        >
                          + 添加车辆
                        </button>
                      </div>
                    )}
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
                  {cart.map((item) => {
                    const isOutOfStock = item.type === 'product' && item.stock === 0
                    const isLowStock = item.type === 'product' && item.stock !== undefined && item.quantity > item.stock
                    return (
                      <div key={item.id} className="flex items-center justify-between py-2 border-b">
                        <div className="flex-1">
                          <div className="font-medium text-sm flex items-center gap-2">
                            {item.name}
                            {isOutOfStock && (
                              <span className="badge badge-error">缺货</span>
                            )}
                            {isLowStock && !isOutOfStock && (
                              <span className="badge badge-warning">
                                库存不足，当前库存 {item.stock} 件
                              </span>
                            )}
                          </div>
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
                    )
                  })}
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

                <div>
                  <label className="label">支付方式 <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-5 gap-2">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setPaymentMethod(method.value)}
                        className={`py-2 px-1 text-sm rounded-lg border-2 transition-all ${
                          paymentMethod === method.value
                            ? 'border-primary bg-blue-50 text-primary font-medium'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>
                  {!paymentMethod && (
                    <p className="text-xs text-red-500 mt-1">请选择支付方式</p>
                  )}
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!paymentMethod}
                  className={`w-full py-3 text-lg font-medium rounded-lg transition-all ${
                    paymentMethod
                      ? 'btn btn-primary'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  确认开单
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

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
    </FrontDeskLayout>
  )
}

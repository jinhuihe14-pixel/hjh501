'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { RoleLabels } from '@/lib/utils'

interface User {
  id: string
  name: string
  phone: string
  role: string
  createdAt: string
}

export default function EmployeesPage() {
  const [users, setUsers] = useState<User[]>([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    role: 'TECHNICIAN'
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    const res = await fetch('/api/users')
    const data = await res.json()
    if (data.users) {
      setUsers(data.users)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })

    if (res.ok) {
      setShowModal(false)
      setFormData({ name: '', phone: '', password: '', role: 'TECHNICIAN' })
      loadUsers()
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">员工管理</h1>
            <p className="text-gray-500">管理门店员工账号和权限</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
          >
            + 添加员工
          </button>
        </div>

        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>手机号</th>
                <th>岗位</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="font-medium">{user.name}</td>
                  <td>{user.phone}</td>
                  <td>
                    <span className="badge badge-info">
                      {RoleLabels[user.role]}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString('zh-CN')}</td>
                  <td>
                    <button className="text-primary hover:underline text-sm">
                      编辑
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-500 py-8">
                    暂无员工数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">添加员工</h2>
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
                  <label className="label">初始密码</label>
                  <input
                    type="password"
                    className="input"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">岗位</label>
                  <select
                    className="input"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="ADMIN">店长</option>
                    <option value="FRONT_DESK">前台收银</option>
                    <option value="TECHNICIAN">美容技师</option>
                    <option value="SALES">销售导购</option>
                  </select>
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
                    确认添加
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

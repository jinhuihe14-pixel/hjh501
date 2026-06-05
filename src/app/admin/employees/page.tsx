'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [addFormData, setAddFormData] = useState({
    name: '',
    phone: '',
    password: '',
    role: 'TECHNICIAN'
  })
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    role: 'TECHNICIAN'
  })
  const [addErrors, setAddErrors] = useState<Record<string, string>>({})
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
  }

  const loadUsers = async () => {
    const res = await fetch('/api/users')
    const data = await res.json()
    if (data.users) {
      setUsers(data.users)
    }
  }

  const validateAddForm = async (): Promise<boolean> => {
    const errors: Record<string, string> = {}
    
    if (!addFormData.name.trim()) {
      errors.name = '请输入姓名'
    }
    if (!addFormData.phone.trim()) {
      errors.phone = '请输入手机号'
    }
    if (!addFormData.password.trim()) {
      errors.password = '请输入初始密码'
    }
    
    if (addFormData.phone.trim()) {
      const existingUser = users.find(u => u.phone === addFormData.phone)
      if (existingUser) {
        errors.phone = '手机号已存在'
      }
    }
    
    setAddErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateEditForm = async (): Promise<boolean> => {
    const errors: Record<string, string> = {}
    
    if (!editFormData.name.trim()) {
      errors.name = '请输入姓名'
    }
    if (!editFormData.phone.trim()) {
      errors.phone = '请输入手机号'
    }
    
    if (editFormData.phone.trim() && editingUser) {
      const existingUser = users.find(u => u.phone === editFormData.phone && u.id !== editingUser.id)
      if (existingUser) {
        errors.phone = '手机号已存在'
      }
    }
    
    setEditErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const isValid = await validateAddForm()
    if (!isValid) return

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addFormData)
    })

    if (res.ok) {
      setShowAddModal(false)
      setAddFormData({ name: '', phone: '', password: '', role: 'TECHNICIAN' })
      setAddErrors({})
      loadUsers()
      showToast('员工添加成功', 'success')
    } else {
      const data = await res.json()
      showToast(data.error || '添加失败', 'error')
    }
  }

  const handleEditClick = (user: User) => {
    setEditingUser(user)
    setEditFormData({
      name: user.name,
      phone: user.phone,
      role: user.role
    })
    setEditErrors({})
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingUser) return
    
    const isValid = await validateEditForm()
    if (!isValid) return

    const res = await fetch(`/api/users/${editingUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editFormData)
    })

    if (res.ok) {
      setShowEditModal(false)
      setEditingUser(null)
      setEditFormData({ name: '', phone: '', role: 'TECHNICIAN' })
      setEditErrors({})
      loadUsers()
      showToast('员工信息更新成功', 'success')
    } else {
      const data = await res.json()
      showToast(data.error || '更新失败', 'error')
    }
  }

  const handleResetPassword = async () => {
    if (!editingUser) return
    
    const res = await fetch(`/api/users/${editingUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetPassword: true })
    })

    if (res.ok) {
      showToast('密码已重置为 123456', 'success')
    } else {
      const data = await res.json()
      showToast(data.error || '重置失败', 'error')
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {toast.message}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">员工管理</h1>
            <p className="text-gray-500">管理门店员工账号和权限</p>
          </div>
          <button
            onClick={() => {
              setShowAddModal(true)
              setAddFormData({ name: '', phone: '', password: '', role: 'TECHNICIAN' })
              setAddErrors({})
            }}
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
                    <button
                      onClick={() => handleEditClick(user)}
                      className="text-primary hover:underline text-sm"
                    >
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

        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">添加员工</h2>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="label">姓名</label>
                  <input
                    type="text"
                    className={`input ${addErrors.name ? 'border-red-500' : ''}`}
                    value={addFormData.name}
                    onChange={(e) => {
                      setAddFormData({ ...addFormData, name: e.target.value })
                      if (addErrors.name) setAddErrors({ ...addErrors, name: '' })
                    }}
                  />
                  {addErrors.name && <p className="text-red-500 text-sm mt-1">{addErrors.name}</p>}
                </div>
                <div>
                  <label className="label">手机号</label>
                  <input
                    type="tel"
                    className={`input ${addErrors.phone ? 'border-red-500' : ''}`}
                    value={addFormData.phone}
                    onChange={(e) => {
                      setAddFormData({ ...addFormData, phone: e.target.value })
                      if (addErrors.phone) setAddErrors({ ...addErrors, phone: '' })
                    }}
                  />
                  {addErrors.phone && <p className="text-red-500 text-sm mt-1">{addErrors.phone}</p>}
                </div>
                <div>
                  <label className="label">初始密码</label>
                  <input
                    type="password"
                    className={`input ${addErrors.password ? 'border-red-500' : ''}`}
                    value={addFormData.password}
                    onChange={(e) => {
                      setAddFormData({ ...addFormData, password: e.target.value })
                      if (addErrors.password) setAddErrors({ ...addErrors, password: '' })
                    }}
                  />
                  {addErrors.password && <p className="text-red-500 text-sm mt-1">{addErrors.password}</p>}
                </div>
                <div>
                  <label className="label">岗位</label>
                  <select
                    className="input"
                    value={addFormData.role}
                    onChange={(e) => setAddFormData({ ...addFormData, role: e.target.value })}
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
                    onClick={() => setShowAddModal(false)}
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

        {showEditModal && editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">编辑员工</h2>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="label">姓名</label>
                  <input
                    type="text"
                    className={`input ${editErrors.name ? 'border-red-500' : ''}`}
                    value={editFormData.name}
                    onChange={(e) => {
                      setEditFormData({ ...editFormData, name: e.target.value })
                      if (editErrors.name) setEditErrors({ ...editErrors, name: '' })
                    }}
                  />
                  {editErrors.name && <p className="text-red-500 text-sm mt-1">{editErrors.name}</p>}
                </div>
                <div>
                  <label className="label">手机号</label>
                  <input
                    type="tel"
                    className={`input ${editErrors.phone ? 'border-red-500' : ''}`}
                    value={editFormData.phone}
                    onChange={(e) => {
                      setEditFormData({ ...editFormData, phone: e.target.value })
                      if (editErrors.phone) setEditErrors({ ...editErrors, phone: '' })
                    }}
                  />
                  {editErrors.phone && <p className="text-red-500 text-sm mt-1">{editErrors.phone}</p>}
                </div>
                <div>
                  <label className="label">岗位</label>
                  <select
                    className="input"
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  >
                    <option value="ADMIN">店长</option>
                    <option value="FRONT_DESK">前台收银</option>
                    <option value="TECHNICIAN">美容技师</option>
                    <option value="SALES">销售导购</option>
                  </select>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                  >
                    🔑 重置密码为 123456
                  </button>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    className="btn btn-secondary flex-1"
                    onClick={() => setShowEditModal(false)}
                  >
                    取消
                  </button>
                  <button type="submit" className="btn btn-primary flex-1">
                    保存修改
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

'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { RoleLabels, getNextMonth } from '@/lib/utils'

interface SalaryRule {
  id: string
  effectiveMonth: string
  role: string
  baseSalary: number
  frontDeskCommissionRate: number
  salesCommissionRate: number
  fullBonus: number
  lateDeduction: number
}

export default function SalaryRulesPage() {
  const [rules, setRules] = useState<SalaryRule[]>([])
  const [selectedRole, setSelectedRole] = useState('TECHNICIAN')
  const [formData, setFormData] = useState({
    effectiveMonth: getNextMonth(),
    baseSalary: '3000',
    frontDeskCommissionRate: '2',
    salesCommissionRate: '5',
    fullBonus: '200',
    lateDeduction: '50'
  })

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    const res = await fetch('/api/salary-rules')
    const data = await res.json()
    if (data.rules) {
      setRules(data.rules)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const res = await fetch('/api/salary-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        role: selectedRole
      })
    })

    if (res.ok) {
      loadRules()
    }
  }

  const roleRules = rules.filter(r => r.role === selectedRole)

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">薪资规则配置</h1>
          <p className="text-gray-500">设置各岗位薪资计算参数，修改次月生效</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="card col-span-1">
            <div className="card-header">
              <h2 className="font-semibold">选择岗位</h2>
            </div>
            <div className="card-body space-y-2">
              {['TECHNICIAN', 'FRONT_DESK', 'SALES', 'ADMIN'].map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    selectedRole === role
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {RoleLabels[role]}
                </button>
              ))}
            </div>
          </div>

          <div className="card col-span-2">
            <div className="card-header">
              <h2 className="font-semibold">
                {RoleLabels[selectedRole]} - 薪资参数配置
              </h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">生效月份</label>
                    <input
                      type="month"
                      className="input"
                      value={formData.effectiveMonth}
                      onChange={(e) => setFormData({ ...formData, effectiveMonth: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">固定底薪 (元)</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.baseSalary}
                      onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                    />
                  </div>
                </div>

                {selectedRole === 'FRONT_DESK' && (
                  <div>
                    <label className="label">开单提成比例 (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="input"
                      value={formData.frontDeskCommissionRate}
                      onChange={(e) => setFormData({ ...formData, frontDeskCommissionRate: e.target.value })}
                    />
                  </div>
                )}

                {selectedRole === 'SALES' && (
                  <div>
                    <label className="label">商品销售提成比例 (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="input"
                      value={formData.salesCommissionRate}
                      onChange={(e) => setFormData({ ...formData, salesCommissionRate: e.target.value })}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">全勤奖金 (元)</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.fullBonus}
                      onChange={(e) => setFormData({ ...formData, fullBonus: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">单次迟到扣款 (元)</label>
                    <input
                      type="number"
                      className="input"
                      value={formData.lateDeduction}
                      onChange={(e) => setFormData({ ...formData, lateDeduction: e.target.value })}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-full">
                  保存配置
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold">历史配置记录</h2>
          </div>
          <div className="card-body">
            <table className="table">
              <thead>
                <tr>
                  <th>生效月份</th>
                  <th>岗位</th>
                  <th>底薪</th>
                  <th>提成比例</th>
                  <th>全勤奖</th>
                  <th>迟到扣款</th>
                </tr>
              </thead>
              <tbody>
                {roleRules.map((rule) => (
                  <tr key={rule.id}>
                    <td>{rule.effectiveMonth}</td>
                    <td>{RoleLabels[rule.role]}</td>
                    <td>¥{rule.baseSalary}</td>
                    <td>
                      {rule.role === 'FRONT_DESK' && `${rule.frontDeskCommissionRate}%`}
                      {rule.role === 'SALES' && `${rule.salesCommissionRate}%`}
                      {rule.role === 'TECHNICIAN' && '按工时计算'}
                      {rule.role === 'ADMIN' && '-'}
                    </td>
                    <td>¥{rule.fullBonus}</td>
                    <td>¥{rule.lateDeduction}</td>
                  </tr>
                ))}
                {roleRules.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-500 py-8">
                      暂无配置记录
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { RoleLabels, SalaryStatusLabels, formatMoney, getCurrentMonth } from '@/lib/utils'

interface SalaryRecord {
  id: string
  month: string
  userId: string
  baseSalary: number
  workHours: number
  salesAmount: number
  salesCommission: number
  orderAmount: number
  orderCommission: number
  fullBonus: number
  lateCount: number
  lateDeduction: number
  otherBonus: number
  otherDeduction: number
  totalSalary: number
  status: string
  remark: string | null
  user: {
    id: string
    name: string
    role: string
  }
}

export default function SalaryRecordsPage() {
  const [records, setRecords] = useState<SalaryRecord[]>([])
  const [month, setMonth] = useState(getCurrentMonth())
  const [loading, setLoading] = useState(false)
  const [adjustModal, setAdjustModal] = useState<SalaryRecord | null>(null)
  const [adjustData, setAdjustData] = useState({ otherBonus: '0', otherDeduction: '0', remark: '' })

  useEffect(() => {
    loadRecords()
  }, [month])

  const loadRecords = async () => {
    const res = await fetch(`/api/salary-records?month=${month}`)
    const data = await res.json()
    if (data.records) {
      setRecords(data.records)
    }
  }

  const handleCalculate = async () => {
    setLoading(true)
    const res = await fetch('/api/salary-records/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month })
    })
    
    if (res.ok) {
      loadRecords()
    }
    setLoading(false)
  }

  const handleAction = async (id: string, action: string) => {
    const res = await fetch('/api/salary-records', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action })
    })
    
    if (res.ok) {
      loadRecords()
    }
  }

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjustModal) return

    const res = await fetch('/api/salary-records', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: adjustModal.id,
        action: 'adjust',
        otherBonus: parseFloat(adjustData.otherBonus),
        otherDeduction: parseFloat(adjustData.otherDeduction),
        remark: adjustData.remark
      })
    })
    
    if (res.ok) {
      setAdjustModal(null)
      loadRecords()
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">薪资核算</h1>
            <p className="text-gray-500">自动计算员工薪资，支持手动调整</p>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="month"
              className="input w-40"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
            <button
              onClick={handleCalculate}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? '计算中...' : '计算薪资'}
            </button>
          </div>
        </div>

        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>员工</th>
                <th>岗位</th>
                <th>底薪</th>
                <th>工时/提成</th>
                <th>全勤奖</th>
                <th>迟到扣款</th>
                <th>其他调整</th>
                <th>应发工资</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td className="font-medium">{record.user.name}</td>
                  <td>{RoleLabels[record.user.role]}</td>
                  <td>{formatMoney(record.baseSalary)}</td>
                  <td>
                    {record.user.role === 'TECHNICIAN' && (
                      <span>{record.workHours}工时</span>
                    )}
                    {record.user.role === 'SALES' && (
                      <span>{formatMoney(record.salesCommission)}</span>
                    )}
                    {record.user.role === 'FRONT_DESK' && (
                      <span>{formatMoney(record.orderCommission)}</span>
                    )}
                  </td>
                  <td>{formatMoney(record.fullBonus)}</td>
                  <td className="text-red-500">
                    {record.lateCount > 0 && `(${record.lateCount}次)`}
                    -{formatMoney(record.lateDeduction)}
                  </td>
                  <td>
                    {record.otherBonus > 0 && (
                      <span className="text-green-600">+{formatMoney(record.otherBonus)}</span>
                    )}
                    {record.otherDeduction > 0 && (
                      <span className="text-red-500">-{formatMoney(record.otherDeduction)}</span>
                    )}
                    {record.otherBonus === 0 && record.otherDeduction === 0 && '-'}
                  </td>
                  <td className="font-bold text-primary text-lg">
                    {formatMoney(record.totalSalary)}
                  </td>
                  <td>
                    <span className={`badge ${
                      record.status === 'LOCKED' ? 'badge-success' :
                      record.status === 'CONFIRMED' ? 'badge-info' : 'badge-warning'
                    }`}>
                      {SalaryStatusLabels[record.status]}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {record.status !== 'LOCKED' && (
                        <>
                          <button
                            onClick={() => {
                              setAdjustModal(record)
                              setAdjustData({
                                otherBonus: record.otherBonus.toString(),
                                otherDeduction: record.otherDeduction.toString(),
                                remark: record.remark || ''
                              })
                            }}
                            className="text-primary hover:underline text-sm"
                          >
                            调整
                          </button>
                          {record.status === 'DRAFT' && (
                            <button
                              onClick={() => handleAction(record.id, 'confirm')}
                              className="text-green-600 hover:underline text-sm"
                            >
                              确认
                            </button>
                          )}
                          {record.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleAction(record.id, 'lock')}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              锁定
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center text-gray-500 py-8">
                    暂无薪资记录，请先点击"计算薪资"生成本月工资单
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {adjustModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">调整薪资 - {adjustModal.user.name}</h2>
              <form onSubmit={handleAdjust} className="space-y-4">
                <div>
                  <label className="label">额外奖金 (元)</label>
                  <input
                    type="number"
                    className="input"
                    value={adjustData.otherBonus}
                    onChange={(e) => setAdjustData({ ...adjustData, otherBonus: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">额外扣款 (元)</label>
                  <input
                    type="number"
                    className="input"
                    value={adjustData.otherDeduction}
                    onChange={(e) => setAdjustData({ ...adjustData, otherDeduction: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">备注</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={adjustData.remark}
                    onChange={(e) => setAdjustData({ ...adjustData, remark: e.target.value })}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    className="btn btn-secondary flex-1"
                    onClick={() => setAdjustModal(null)}
                  >
                    取消
                  </button>
                  <button type="submit" className="btn btn-primary flex-1">
                    确认调整
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

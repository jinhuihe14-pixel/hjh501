'use client'

import { useEffect, useState } from 'react'
import TechnicianLayout from '@/components/TechnicianLayout'
import { formatMoney, getCurrentMonth } from '@/lib/utils'

interface SalaryRecord {
  id: string
  month: string
  baseSalary: number
  workHours: number
  hourWage: number
  fullBonus: number
  lateCount: number
  lateDeduction: number
  otherBonus: number
  otherDeduction: number
  totalSalary: number
  status: string
}

export default function TechnicianSalaryPage() {
  const [records, setRecords] = useState<SalaryRecord[]>([])
  const [month, setMonth] = useState(getCurrentMonth())

  useEffect(() => {
    loadSalary()
  }, [month])

  const loadSalary = async () => {
    const res = await fetch(`/api/salary-records?month=${month}`)
    const data = await res.json()
    if (data.records) {
      setRecords(data.records)
    }
  }

  const record = records[0]

  return (
    <TechnicianLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="month"
            className="input flex-1"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>

        {!record ? (
          <div className="text-center py-12 text-gray-500">
            <span className="text-5xl mb-4 block">💰</span>
            <p>暂无薪资数据</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <p className="text-sm opacity-80">本月预估工资</p>
              <p className="text-4xl font-bold mt-2">
                {formatMoney(record.totalSalary)}
              </p>
              <div className="mt-4 flex items-center gap-4 text-sm opacity-80">
                <span>{record.workHours} 工时</span>
                <span>状态：{
                  record.status === 'LOCKED' ? '已锁定' :
                  record.status === 'CONFIRMED' ? '已确认' : '待确认'
                }</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <h3 className="font-bold mb-4">薪资明细</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">底薪</span>
                  <span>{formatMoney(record.baseSalary)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">工时工资</span>
                  <span className="text-green-600">+{formatMoney(record.hourWage)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">全勤奖</span>
                  <span className="text-green-600">+{formatMoney(record.fullBonus)}</span>
                </div>
                {record.otherBonus > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">其他奖金</span>
                    <span className="text-green-600">+{formatMoney(record.otherBonus)}</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">迟到扣款 ({record.lateCount}次)</span>
                    <span className="text-red-500">-{formatMoney(record.lateDeduction)}</span>
                  </div>
                  {record.otherDeduction > 0 && (
                    <div className="flex justify-between mt-3">
                      <span className="text-gray-500">其他扣款</span>
                      <span className="text-red-500">-{formatMoney(record.otherDeduction)}</span>
                    </div>
                  )}
                </div>
                <div className="border-t pt-3 flex justify-between font-bold">
                  <span>实发工资</span>
                  <span className="text-primary text-lg">{formatMoney(record.totalSalary)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TechnicianLayout>
  )
}

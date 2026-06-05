import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '汽车美容门店管理系统',
  description: '全栈汽车美容门店管理系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        
        if (data.user) {
          switch (data.user.role) {
            case 'ADMIN':
              router.push('/admin/dashboard')
              break
            case 'FRONT_DESK':
              router.push('/frontdesk/orders')
              break
            case 'TECHNICIAN':
              router.push('/technician/tasks')
              break
            case 'SALES':
              router.push('/sales/performance')
              break
            default:
              router.push('/login')
          }
        } else {
          router.push('/login')
        }
      } catch (error) {
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return null
}

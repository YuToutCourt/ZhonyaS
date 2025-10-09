'use client'

import { TeamView } from '@/components/teams/TeamView'
import { Navbar } from '@/components/Navbar'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, use } from 'react'

interface TeamViewPageProps {
  params: Promise<{
    id: string
  }>
}

export default function TeamViewPage({ params }: TeamViewPageProps) {
  const { theme } = useTheme()
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const resolvedParams = use(params)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800' 
          : 'bg-gradient-to-br from-slate-50 to-slate-100'
      }`}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800' 
        : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      <Navbar showBackButton={true} backUrl="/teams" backLabel="Back to Teams" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TeamView teamId={parseInt(resolvedParams.id)} />
      </div>
    </div>
  )
}

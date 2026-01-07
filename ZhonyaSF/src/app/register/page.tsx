'use client'

import React, { useState } from 'react'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { useTheme } from '@/contexts/ThemeContext'
import Image from 'next/image'
import Link from 'next/link'

export default function RegisterPage() {
  const [mode, setMode] = useState<'login' | 'register'>('register')
  const { theme } = useTheme()

  const handleSuccess = () => {
    // Attendre un peu pour que l'état soit mis à jour, puis rediriger
    setTimeout(() => {
      window.location.href = '/'
    }, 100)
  }

  const handleSwitchToLogin = () => {
    setMode('login')
  }

  const handleSwitchToRegister = () => {
    setMode('register')
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800' 
        : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      {/* Navigation */}
      <nav className={`backdrop-blur-md border-b sticky top-0 z-50 transition-colors duration-300 ${
        theme === 'dark'
          ? 'bg-slate-900/80 border-blue-800/30'
          : 'bg-white/80 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/images/logo.png"
                alt="ZhonyaS logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className={`text-xl font-bold transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                ZhonyaS
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {mode === 'register' && (
            <RegisterForm 
              onSuccess={handleSuccess}
              onSwitchToLogin={handleSwitchToLogin}
            />
          )}
          
          {mode === 'login' && (
            <LoginForm 
              onSuccess={handleSuccess}
              onSwitchToRegister={handleSwitchToRegister}
            />
          )}
        </div>
      </div>
    </div>
  )
}

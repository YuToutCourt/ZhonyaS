'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { LogOut, Users, Github, Search } from 'lucide-react'

interface NavbarProps {
  showBackButton?: boolean
  backUrl?: string
  backLabel?: string
}

export function Navbar({ showBackButton = false, backUrl = '/', backLabel = 'Back' }: NavbarProps) {
  const { theme } = useTheme()
  const { user, logout } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/player?username=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <nav className={`backdrop-blur-md border-b sticky top-0 z-50 transition-colors duration-300 ${
      theme === 'dark'
        ? 'bg-slate-900/80 border-blue-800/30'
        : 'bg-white/80 border-slate-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section - Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/images/logo.png"
                alt="ZhonyaS Logo"
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

          {/* Center section - Search bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`} />
              <Input
                type="text"
                placeholder="Rechercher un joueur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 transition-colors duration-300 ${
                  theme === 'dark'
                    ? 'bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400 focus:border-blue-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-blue-500'
                }`}
              />
            </form>
          </div>
          
          {/* Right section */}
          <div className="flex items-center space-x-2">
            {user ? (
              <>
                {/* Mes équipes */}
                <Button
                  variant="ghost"
                  asChild
                  className={`transition-colors duration-300 ${
                    theme === 'dark' 
                      ? 'text-slate-300 hover:text-white hover:bg-slate-700' 
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Link href="/teams">
                    <Users className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Mes équipes</span>
                  </Link>
                </Button>

                {/* GitHub */}
                <Button
                  variant="ghost"
                  asChild
                  className={`transition-colors duration-300 ${
                    theme === 'dark' 
                      ? 'text-slate-300 hover:text-white hover:bg-slate-700' 
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Link href="https://github.com/yourusername/ZhonyaS" target="_blank" rel="noopener noreferrer">
                    <Github className="w-4 h-4" />
                  </Link>
                </Button>

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Logout */}
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className={`transition-colors duration-300 ${
                    theme === 'dark' 
                      ? 'text-slate-400 hover:text-slate-300 hover:bg-slate-700' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="ml-2 hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <>
                {/* GitHub (même pour non connectés) */}
                <Button
                  variant="ghost"
                  asChild
                  className={`transition-colors duration-300 ${
                    theme === 'dark' 
                      ? 'text-slate-300 hover:text-white hover:bg-slate-700' 
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Link href="https://github.com/yourusername/ZhonyaS" target="_blank" rel="noopener noreferrer">
                    <Github className="w-4 h-4" />
                  </Link>
                </Button>

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Login */}
                <Button
                  variant="ghost"
                  asChild
                  className={`transition-colors duration-300 ${
                    theme === 'dark' 
                      ? 'text-slate-300 hover:text-white hover:bg-slate-700' 
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Link href="/login">
                    Login
                  </Link>
                </Button>

                {/* Register */}
                <Button
                  variant="default"
                  asChild
                  className="transition-colors duration-300"
                >
                  <Link href="/register">
                    Register
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}


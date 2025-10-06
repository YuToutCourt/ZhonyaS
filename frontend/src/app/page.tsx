'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Github, User, LogOut, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'

export default function HomePage() {
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { theme } = useTheme()
  const { user, logout, isLoading: authLoading } = useAuth()

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !username.includes('#')) {
      return
    }
    
    setIsLoading(true)
    window.location.href = `/player?username=${encodeURIComponent(username)}`
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
            <div className="flex items-center space-x-8">
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
              <Link 
                href="https://github.com/YuToutCourt/ZhonyaS" 
                target="_blank"
                className={`flex items-center space-x-2 transition-colors duration-300 ${
                  theme === 'dark' 
                    ? 'text-slate-400 hover:text-yellow-400' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-3">
              <form onSubmit={handleSearch} className="flex items-center space-x-3">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search player..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-80 transition-colors duration-300 ${
                      theme === 'dark'
                        ? 'bg-slate-800/50 border-blue-600/30 text-white placeholder:text-slate-400 focus:border-yellow-400 focus:ring-yellow-400/20'
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                    required
                  />
                  <Search className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-400'
                  }`} />
                </div>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className={`transition-colors duration-300 ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } px-6`}
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </Button>
              </form>
              
              {/* Authentication Section */}
              {!authLoading && (
                <div className="flex items-center space-x-2">
                  {user ? (
                    <div className="flex items-center space-x-3">
                      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-300 ${
                        theme === 'dark' 
                          ? 'bg-slate-800/50 text-slate-300' 
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        <User className="w-4 h-4" />
                        <span className="text-sm font-medium">{user.username}</span>
                      </div>
                      <Link href="/teams">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`transition-colors duration-300 ${
                            theme === 'dark' 
                              ? 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50' 
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Mes Équipes
                        </Button>
                      </Link>
                      <Button
                        onClick={logout}
                        variant="ghost"
                        size="sm"
                        className={`transition-colors duration-300 ${
                          theme === 'dark' 
                            ? 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Déconnexion
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Link href="/login">
                        <Button
                          variant="ghost"
                          className={`transition-colors duration-300 ${
                            theme === 'dark' 
                              ? 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50' 
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          Connexion
                        </Button>
                      </Link>
                      <Link href="/register">
                        <Button
                          className={`transition-colors duration-300 ${
                            theme === 'dark'
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          Inscription
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
              
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className={`text-6xl font-bold mb-6 transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'text-white' 
                  : 'text-slate-900'
              }`}>
                Scout players like a
                <span className={`transition-colors duration-300 ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-r from-blue-400 to-yellow-400 bg-clip-text text-transparent' 
                    : 'text-blue-600'
                }`}>
                  {' '}pro
                </span>
              </h1>
              <p className={`text-xl leading-relaxed mb-8 max-w-2xl transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'text-slate-300' 
                  : 'text-slate-600'
              }`}>
                Get instant insights into any League of Legends player's performance. 
                Analyze their champion pool, win rates, and play patterns before your next game.
              </p>
              
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 max-w-md">
                <Input
                  type="text"
                  placeholder="Enter summoner name#tag"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`flex-1 transition-colors duration-300 ${
                    theme === 'dark'
                      ? 'bg-slate-800/50 border-blue-600/30 text-white placeholder:text-slate-400 focus:border-yellow-400 focus:ring-yellow-400/20'
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  required
                />
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className={`transition-colors duration-300 ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } px-8 py-3`}
                >
                  {isLoading ? 'Searching...' : 'Analyze Player'}
                </Button>
              </form>
            </div>
            
            <div className="relative">
              <div className="relative z-10">
                <Image
                  src="/images/BIG_BRAUM.png"
                  alt="League of Legends Illustration - Braum"
                  width={600}
                  height={600}
                  className="w-full h-auto drop-shadow-2xl"
                  priority
                />
              </div>
              <div className={`absolute inset-0 rounded-full blur-3xl transform rotate-12 transition-colors duration-300 ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-blue-400/30 to-yellow-400/30'
                  : 'bg-gradient-to-r from-blue-400/20 to-purple-400/20'
              }`}></div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  )
}
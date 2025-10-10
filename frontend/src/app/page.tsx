'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, TrendingUp, Users, BarChart3 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { useTheme } from '@/contexts/ThemeContext'

export default function HomePage() {
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { theme } = useTheme()

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
      <Navbar />

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

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className={`text-3xl font-bold text-center mb-12 transition-colors duration-300 ${
          theme === 'dark' ? 'text-white' : 'text-slate-900'
        }`}>
          Découvrez nos fonctionnalités
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Classement Card */}
          <Link href="/leaderboard">
            <Card className={`h-full cursor-pointer transition-all duration-300 hover:scale-105 ${
              theme === 'dark' 
                ? 'bg-slate-800/50 border-blue-600/20 hover:border-blue-500/40' 
                : 'bg-white border-slate-200 hover:border-blue-400'
            }`}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-lg transition-colors duration-300 ${
                    theme === 'dark' ? 'bg-blue-600/20' : 'bg-blue-100'
                  }`}>
                    <TrendingUp className={`w-6 h-6 transition-colors duration-300 ${
                      theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                  </div>
                  <CardTitle className={`transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    Classement
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className={`transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Découvrez le top 50 des meilleurs joueurs (min. 100 parties et 10 champions). Comparez vos performances avec les meilleurs !
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          {/* Teams Card */}
          <Link href="/teams">
            <Card className={`h-full cursor-pointer transition-all duration-300 hover:scale-105 ${
              theme === 'dark' 
                ? 'bg-slate-800/50 border-blue-600/20 hover:border-blue-500/40' 
                : 'bg-white border-slate-200 hover:border-blue-400'
            }`}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-lg transition-colors duration-300 ${
                    theme === 'dark' ? 'bg-purple-600/20' : 'bg-purple-100'
                  }`}>
                    <Users className={`w-6 h-6 transition-colors duration-300 ${
                      theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                    }`} />
                  </div>
                  <CardTitle className={`transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    Mes Équipes
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className={`transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Créez et gérez vos équipes, comparez les joueurs et préparez vos stratégies pour la victoire.
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
      
    </div>
  )
}
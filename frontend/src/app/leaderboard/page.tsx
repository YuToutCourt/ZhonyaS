'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { useTheme } from '@/contexts/ThemeContext'
import { API_URL } from '@/lib/config'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Trophy, Medal, Award, TrendingUp, Info } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'
import Image from 'next/image'
import Link from 'next/link'

interface LeaderboardPlayer {
  id: number
  name: string
  tag: string
  puuid: string
  soloq: string | null
  flex: string | null
  total_champions: number
  total_games: number
  total_wins: number
  total_losses: number
  overall_winrate: number
  overall_kda: number
  overall_kp: number
  average_score: number
}

export default function LeaderboardPage() {
  const { theme } = useTheme()
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${API_URL}/api/leaderboard?limit=50`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch leaderboard')
      }
      
      const data = await response.json()
      setLeaderboard(data.leaderboard)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />
    if (rank === 2) return <Medal className="w-6 h-6 text-slate-400" />
    if (rank === 3) return <Award className="w-6 h-6 text-amber-700" />
    return null
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500 font-bold'
    if (rank === 2) return 'text-slate-400 font-bold'
    if (rank === 3) return 'text-amber-700 font-bold'
    return theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
  }

  const parseRankTier = (rank: string | null) => {
    if (!rank) return 'unranked'
    const parts = rank.split(' ')
    return parts[0]?.toLowerCase() || 'unranked'
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800' 
          : 'bg-gradient-to-br from-slate-50 to-slate-100'
      }`}>
        <Navbar />
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className={`h-20 w-full transition-colors duration-300 ${
                theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'
              }`} />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800' 
          : 'bg-gradient-to-br from-slate-50 to-slate-100'
      }`}>
        <Navbar />
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
          <Card className={`shadow-lg transition-colors duration-300 ${
            theme === 'dark' 
              ? 'bg-slate-800/50 border-red-600/20' 
              : 'bg-white border-red-200'
          }`}>
            <CardContent className="pt-6">
              <p className={`text-center transition-colors duration-300 ${
                theme === 'dark' ? 'text-red-400' : 'text-red-600'
              }`}>
                {error}
              </p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800' 
        : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Header */}
        <div className={`rounded-xl shadow-lg p-6 mb-6 transition-colors duration-300 ${
          theme === 'dark' 
            ? 'bg-slate-800/50 border border-blue-600/20' 
            : 'bg-white'
        }`}>
          <div className="flex items-center space-x-4">
            <TrendingUp className={`w-10 h-10 transition-colors duration-300 ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <div>
              <h1 className={`text-3xl font-bold transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                Classement des Joueurs
              </h1>
              <p className={`text-sm mt-1 transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Top 50 des meilleurs joueurs (minimum 100 parties et 10 champions différents)
              </p>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <Card className={`shadow-lg transition-colors duration-300 ${
          theme === 'dark' 
            ? 'bg-slate-800/50 border-blue-600/20' 
            : 'bg-white border-slate-200'
        }`}>
          <CardHeader>
            <CardTitle className={`transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              Classement
            </CardTitle>
            <CardDescription className={`transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={`transition-colors duration-300 ${
                    theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
                  }`}>
                    <TableHead className={`w-16 transition-colors duration-300 ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Rang
                    </TableHead>
                    <TableHead className={`transition-colors duration-300 ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Joueur
                    </TableHead>
                    <TableHead className={`transition-colors duration-300 ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Rang
                    </TableHead>
                    <TableHead className={`text-center transition-colors duration-300 ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      <Tooltip content="Score calculé sur la moyenne de tous les champions ayant au moins 10 parties, basé sur leur dangerousness">
                        <div className="flex items-center justify-center gap-1 cursor-help">
                          Score
                          <Info className="w-3 h-3" />
                        </div>
                      </Tooltip>
                    </TableHead>
                    <TableHead className={`text-center transition-colors duration-300 ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Parties
                    </TableHead>
                    <TableHead className={`text-center transition-colors duration-300 ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      WR
                    </TableHead>
                    <TableHead className={`text-center transition-colors duration-300 ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      KDA
                    </TableHead>
                    <TableHead className={`text-center transition-colors duration-300 ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      KP
                    </TableHead>
                    <TableHead className={`text-center transition-colors duration-300 ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      Champions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((player, index) => {
                    const rank = index + 1
                    const rankTier = parseRankTier(player.soloq)
                    
                    return (
                      <TableRow 
                        key={player.id} 
                        className={`transition-colors duration-300 ${
                          theme === 'dark' 
                            ? 'border-slate-700 hover:bg-slate-700/50' 
                            : 'border-slate-200 hover:bg-slate-50'
                        } ${rank <= 3 ? 'bg-opacity-50' : ''}`}
                      >
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getRankIcon(rank)}
                            <span className={getRankColor(rank)}>{rank}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link 
                            href={`/player?username=${player.name}%23${player.tag}`}
                            className={`font-medium hover:underline transition-colors duration-300 ${
                              theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                            }`}
                          >
                            {player.name}#{player.tag}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Image
                              src={`/images/${rankTier}.webp`}
                              alt={rankTier}
                              width={32}
                              height={32}
                              className="rounded"
                            />
                            {player.soloq && (
                              <span className={`text-sm transition-colors duration-300 ${
                                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                              }`}>
                                {player.soloq.split(' ').slice(0, 2).join(' ')}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant="secondary"
                            className={`font-bold transition-colors duration-300 ${
                              theme === 'dark' 
                                ? 'bg-slate-700 text-slate-200 border border-slate-600' 
                                : 'bg-slate-100 text-slate-800 border border-slate-300'
                            }`}
                          >
                            {player.average_score}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-center transition-colors duration-300 ${
                          theme === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}>
                          {player.total_games}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-medium ${
                            player.overall_winrate >= 55 ? (theme === 'dark' ? 'text-green-400' : 'text-green-600') : 
                            player.overall_winrate >= 50 ? (theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600') : 
                            (theme === 'dark' ? 'text-red-400' : 'text-red-600')
                          }`}>
                            {player.overall_winrate}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-medium ${
                            player.overall_kda >= 4 ? (theme === 'dark' ? 'text-green-400' : 'text-green-600') : 
                            player.overall_kda >= 3 ? (theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600') : 
                            (theme === 'dark' ? 'text-red-400' : 'text-red-600')
                          }`}>
                            {player.overall_kda}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-medium ${
                            player.overall_kp >= 65 ? (theme === 'dark' ? 'text-green-400' : 'text-green-600') : 
                            player.overall_kp >= 50 ? (theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600') : 
                            (theme === 'dark' ? 'text-red-400' : 'text-red-600')
                          }`}>
                            {player.overall_kp}%
                          </span>
                        </TableCell>
                        <TableCell className={`text-center transition-colors duration-300 ${
                          theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          {player.total_champions}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  )
}


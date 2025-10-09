'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { X, Trophy, Target, Users, TrendingUp, Crown } from 'lucide-react'
import Image from 'next/image'
import { useTheme } from '@/contexts/ThemeContext'
import { RankDisplay } from './RankDisplay'

interface TeamPlayer {
  id: number
  team_id: number
  player_id: number
  position: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'
  is_sub: boolean
  player_name?: string
  player_tag?: string
  player_stats?: PlayerStats
  top_champions?: ChampionStats[]
  detailed_stats?: DetailedPlayerStats
}

interface PlayerStats {
  total_games: number
  winrate: number
  ranked_solo: string
  ranked_flex: string
  kda: number
  kill_participation: number
}

interface ChampionStats {
  champion_name: string
  games_played: number
  winrate: number
  kda: number
  role: string
}

interface DetailedPlayerStats {
  total_games: number
  total_wins: number
  total_losses: number
  winrate: number
  ranked_solo: string
  ranked_flex: string
  global_kda: number
  global_kills: number
  global_deaths: number
  global_assists: number
  global_kill_participation: number
  score_moyen: number
  champions: ChampionStats[]
  recent_games?: RecentGame[]
}

interface RecentGame {
  champion: string
  result: 'WIN' | 'LOSS'
  kda: string
  game_duration: string
  date: string
}

const POSITION_IMAGES = {
  TOP: '/images/positions/top.png',
  JUNGLE: '/images/positions/jungle.png',
  MID: '/images/positions/mid.png',
  ADC: '/images/positions/bot.png',
  SUPPORT: '/images/positions/supp.png'
}

const POSITION_NAMES = {
  TOP: 'Top',
  JUNGLE: 'Jungle',
  MID: 'Mid',
  ADC: 'ADC',
  SUPPORT: 'Support'
}

interface PlayerDetailModalProps {
  player: TeamPlayer
  onClose: () => void
}

const PositionIcon = ({ position, isSub = false }: { position: string, isSub?: boolean }) => {
  const { theme } = useTheme()
  
  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <Image
          src={POSITION_IMAGES[position as keyof typeof POSITION_IMAGES]}
          alt={position}
          width={24}
          height={24}
          className="w-6 h-6"
        />
        {isSub && (
          <Crown className="absolute -top-1 -right-1 w-3 h-3 text-yellow-500" />
        )}
      </div>
      <span className={`text-sm font-medium transition-colors duration-300 ${
        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
      }`}>
        {POSITION_NAMES[position as keyof typeof POSITION_NAMES]}
      </span>
    </div>
  )
}

export function PlayerDetailModal({ player, onClose }: PlayerDetailModalProps) {
  const [detailedStats, setDetailedStats] = useState<DetailedPlayerStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    if (player.player_name && player.player_tag) {
      fetchDetailedStats()
    }
  }, [player])

  const fetchDetailedStats = async () => {
    if (!player.player_name || !player.player_tag) return

    setIsLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('/api/player/details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: `${player.player_name}#${player.player_tag}`
        })
      })

      if (response.ok) {
        const data = await response.json()
        setDetailedStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching detailed stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const stats = detailedStats || player.player_stats

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-slate-200'
      }`}>
        <DialogHeader>
          <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <PositionIcon position={player.position} isSub={player.is_sub} />
          </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className={`transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'text-slate-400 hover:text-slate-300 hover:bg-slate-700' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <DialogTitle className={`text-2xl font-bold transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            {player.player_name}#{player.player_tag}
          </DialogTitle>
          <DialogDescription className={`transition-colors duration-300 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Détails complets du joueur
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Player Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className={`transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'bg-slate-700/50 border-slate-600' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className={`text-sm font-medium transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    Total Games
                  </CardTitle>
                  <Users className={`h-4 w-4 transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    {stats?.total_games || 0}
                  </div>
                </CardContent>
              </Card>

              <Card className={`transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'bg-slate-700/50 border-slate-600' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className={`text-sm font-medium transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    Winrate
                  </CardTitle>
                  <Trophy className={`h-4 w-4 transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    {stats?.winrate && typeof stats.winrate === 'number' ? `${stats.winrate.toFixed(1)}%` : '0%'}
                  </div>
                </CardContent>
              </Card>

              <Card className={`transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'bg-slate-700/50 border-slate-600' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className={`text-sm font-medium transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    KDA
                  </CardTitle>
                  <TrendingUp className={`h-4 w-4 transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    {stats?.kda && typeof stats.kda === 'number' ? stats.kda.toFixed(2) : '0.00'}
                  </div>
                </CardContent>
              </Card>

              <Card className={`transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'bg-slate-700/50 border-slate-600' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className={`text-sm font-medium transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    Kill Participation
                  </CardTitle>
                  <Target className={`h-4 w-4 transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    {stats?.kill_participation && typeof stats.kill_participation === 'number' ? `${stats.kill_participation.toFixed(1)}%` : '0%'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ranks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className={`transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'bg-slate-700/50 border-slate-600' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <CardHeader>
                  <CardTitle className={`text-lg font-semibold transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    Ranked Solo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RankDisplay rank={stats?.ranked_solo || 'N/A'} />
                </CardContent>
              </Card>

              <Card className={`transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'bg-slate-700/50 border-slate-600' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <CardHeader>
                  <CardTitle className={`text-lg font-semibold transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    Ranked Flex
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RankDisplay rank={stats?.ranked_flex || 'N/A'} />
                </CardContent>
              </Card>
            </div>

            {/* Champions Table */}
            {detailedStats?.champions && detailedStats.champions.length > 0 && (
              <Card className={`transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'bg-slate-700/50 border-slate-600' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <CardHeader>
                  <CardTitle className={`transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    Champions joués
                  </CardTitle>
                  <CardDescription className={`transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Tous les champions joués par ce joueur
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className={`transition-colors duration-300 ${
                        theme === 'dark' 
                          ? 'border-slate-600 hover:bg-slate-700/50' 
                          : 'border-slate-200 hover:bg-slate-100'
                      }`}>
                        <TableHead className={`transition-colors duration-300 ${
                          theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                        }`}>
                          Champion
                        </TableHead>
                        <TableHead className={`transition-colors duration-300 ${
                          theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                        }`}>
                          Rôle
                        </TableHead>
                        <TableHead className={`transition-colors duration-300 ${
                          theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                        }`}>
                          Games
                        </TableHead>
                        <TableHead className={`transition-colors duration-300 ${
                          theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                        }`}>
                          Winrate
                        </TableHead>
                        <TableHead className={`transition-colors duration-300 ${
                          theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                        }`}>
                          KDA
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailedStats.champions.map((champion, index) => (
                        <TableRow key={index} className={`transition-colors duration-300 ${
                          theme === 'dark' 
                            ? 'border-slate-600 hover:bg-slate-700/50' 
                            : 'border-slate-200 hover:bg-slate-100'
                        }`}>
                          <TableCell className={`font-medium transition-colors duration-300 ${
                            theme === 'dark' ? 'text-white' : 'text-slate-900'
                          }`}>
                            {champion.champion_name}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Image
                                src={POSITION_IMAGES[champion.role as keyof typeof POSITION_IMAGES] || '/images/positions/fill.png'}
                                alt={champion.role}
                                width={20}
                                height={20}
                                className="w-5 h-5"
                              />
                              <span className={`text-sm font-medium transition-colors duration-300 ${
                                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                              }`}>
                                {POSITION_NAMES[champion.role as keyof typeof POSITION_NAMES] || champion.role}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className={`transition-colors duration-300 ${
                            theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                          }`}>
                            {champion.games_played}
                          </TableCell>
                          <TableCell className={`transition-colors duration-300 ${
                            theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                          }`}>
                            {typeof champion.winrate === 'number' ? champion.winrate.toFixed(1) : '0.0'}%
                          </TableCell>
                          <TableCell className={`transition-colors duration-300 ${
                            theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                          }`}>
                            {typeof champion.kda === 'number' ? champion.kda.toFixed(2) : '0.00'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Recent Games */}
            {detailedStats?.recent_games && detailedStats.recent_games.length > 0 && (
              <Card className={`transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'bg-slate-700/50 border-slate-600' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <CardHeader>
                  <CardTitle className={`transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    Parties récentes
                  </CardTitle>
                  <CardDescription className={`transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Les 10 dernières parties
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {detailedStats.recent_games.map((game, index) => (
                      <div key={index} className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-300 ${
                        theme === 'dark' 
                          ? 'bg-slate-600/50' 
                          : 'bg-slate-100'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                            {game.champion}
                          </Badge>
                          <span className={`font-medium transition-colors duration-300 ${
                            theme === 'dark' ? 'text-white' : 'text-slate-900'
                          }`}>
                            {game.kda}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`text-sm transition-colors duration-300 ${
                            theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                          }`}>
                            {game.game_duration}
                          </span>
                          <Badge className={
                            game.result === 'WIN' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }>
                            {game.result === 'WIN' ? 'Victoire' : 'Défaite'}
                          </Badge>
                          <span className={`text-sm transition-colors duration-300 ${
                            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            {game.date}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

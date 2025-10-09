'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, Users, Trophy, Target, Crown, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { useRouter } from 'next/navigation'
import { RankDisplay } from './RankDisplay'

interface Team {
  id: number
  team_name: string
  user_id: number
  created_at: string
  updated_at: string
  players?: TeamPlayer[]
  stats?: TeamStats
}

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
  champion_id: number
  champion_name: string
  games_played: number
  wins: number
  losses: number
  winrate: number
  kda: number
  kill_participation: number
  dangerousness: number
  role: string
}

interface TeamStats {
  total_games: number
  winrate: number
  ranked_solo_avg: string
  ranked_flex_avg: string
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

const POSITION_ORDER = {
  TOP: 1,
  JUNGLE: 2,
  MID: 3,
  ADC: 4,
  SUPPORT: 5
}

interface TeamViewProps {
  teamId: number
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

export function TeamView({ teamId }: TeamViewProps) {
  const [team, setTeam] = useState<Team | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [downloadCount, setDownloadCount] = useState(10)
  const [isDownloading, setIsDownloading] = useState(false)
  const { theme } = useTheme()
  const router = useRouter()

  useEffect(() => {
    fetchTeamDetails()
  }, [teamId])

  const fetchTeamDetails = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`/api/teams/${teamId}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const teamData = data.team
        
        // Les statistiques sont déjà calculées par le backend
        setTeam(teamData)
      } else if (response.status === 404) {
        router.push('/teams')
      }
    } catch (error) {
      console.error('Error fetching team details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadGames = async () => {
    if (!team?.players) return

    setIsDownloading(true)
    try {
      const token = localStorage.getItem('access_token')
      
      // Download games for each player sequentially
      for (const player of team.players) {
        if (player.player_name && player.player_tag) {
          const response = await fetch('/api/download', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              username: `${player.player_name}#${player.player_tag}`,
              nb_games: downloadCount,
              session_id: `team_${teamId}_${Date.now()}`
            })
          })

          if (!response.ok) {
            console.error(`Failed to download games for ${player.player_name}#${player.player_tag}`)
          }
        }
      }
      
      // Refresh team data after download
      await fetchTeamDetails()
    } catch (error) {
      console.error('Error downloading games:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <h2 className={`text-2xl font-bold mb-4 transition-colors duration-300 ${
          theme === 'dark' ? 'text-white' : 'text-slate-900'
        }`}>
          Équipe non trouvée
        </h2>
        <p className={`transition-colors duration-300 ${
          theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
        }`}>
          Utilisez le bouton "Back to Teams" en haut de la page
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            {team.team_name}
          </h1>
          <p className={`text-lg transition-colors duration-300 ${
            theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Analyse détaillée de l'équipe
          </p>
        </div>
        
        {/* Download Games Button */}
        <div className="flex items-center space-x-2">
          <input
            type="number"
            value={downloadCount}
            onChange={(e) => setDownloadCount(parseInt(e.target.value) || 10)}
            min="1"
            max="50"
            className={`w-20 px-2 py-1 rounded border transition-colors duration-300 ${
              theme === 'dark'
                ? 'bg-slate-700 border-slate-600 text-white'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          />
          <Button
            onClick={handleDownloadGames}
            disabled={isDownloading || !team.players?.length}
            className={`transition-colors duration-300 ${
              theme === 'dark'
                ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <Download className="w-4 h-4 mr-2" />
            {isDownloading ? 'Téléchargement...' : 'Download Games'}
          </Button>
        </div>
      </div>

      {/* Team Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className={`transition-colors duration-300 ${
          theme === 'dark' 
            ? 'bg-slate-800/50 border-slate-700' 
            : 'bg-white border-slate-200'
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
              {team.stats?.total_games || 0}
            </div>
          </CardContent>
        </Card>

        <Card className={`transition-colors duration-300 ${
          theme === 'dark' 
            ? 'bg-slate-800/50 border-slate-700' 
            : 'bg-white border-slate-200'
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
              {team.stats?.winrate ? `${Number(team.stats.winrate).toFixed(1)}%` : '0%'}
            </div>
          </CardContent>
        </Card>

        <Card className={`transition-colors duration-300 ${
          theme === 'dark' 
            ? 'bg-slate-800/50 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Ranked Solo
            </CardTitle>
            <Target className={`h-4 w-4 transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`} />
          </CardHeader>
          <CardContent>
            <RankDisplay rank={team.stats?.ranked_solo_avg || 'N/A'} />
          </CardContent>
        </Card>

        <Card className={`transition-colors duration-300 ${
          theme === 'dark' 
            ? 'bg-slate-800/50 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Ranked Flex
            </CardTitle>
            <Target className={`h-4 w-4 transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`} />
          </CardHeader>
          <CardContent>
            <RankDisplay rank={team.stats?.ranked_flex_avg || 'N/A'} />
          </CardContent>
        </Card>
      </div>

      {/* Players Table */}
      <Card className={`transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-slate-800/50 border-slate-700' 
          : 'bg-white border-slate-200'
      }`}>
        <CardHeader>
          <CardTitle className={`transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            Joueurs de l'équipe
          </CardTitle>
          <CardDescription className={`transition-colors duration-300 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Cliquez sur un joueur pour voir ses détails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className={`transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'border-slate-700 hover:bg-slate-800/50' 
                  : 'border-slate-200 hover:bg-slate-50'
              }`}>
                <TableHead className={`transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Position
                </TableHead>
                <TableHead className={`transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Joueur
                </TableHead>
                <TableHead className={`transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Stats
                </TableHead>
                <TableHead className={`transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Top 3 Champions
                </TableHead>
                <TableHead className={`transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.players?.sort((a, b) => {
                const orderA = POSITION_ORDER[a.position as keyof typeof POSITION_ORDER] || 999
                const orderB = POSITION_ORDER[b.position as keyof typeof POSITION_ORDER] || 999
                return orderA - orderB
              }).map((player) => (
                <TableRow 
                  key={player.id}
                  className={`transition-colors duration-300 ${
                    theme === 'dark' 
                      ? 'border-slate-700 hover:bg-slate-800/70' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <TableCell>
                    <PositionIcon position={player.position} isSub={player.is_sub} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium transition-colors duration-300 ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>
                        {player.player_name}#{player.player_tag}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {player.player_stats ? (
                      <div className="space-y-1">
                        <div className={`text-sm transition-colors duration-300 ${
                          theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                        }`}>
                          {player.player_stats.total_games} games • {Number(player.player_stats.winrate).toFixed(1)}% WR
                        </div>
                        <div className={`text-sm transition-colors duration-300 ${
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          KDA: {Number(player.player_stats.kda).toFixed(2)}
                        </div>
                      </div>
                    ) : (
                      <span className={`text-sm transition-colors duration-300 ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Aucune donnée
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {player.top_champions && player.top_champions.length > 0 ? (
                      <div className="space-y-2">
                        {player.top_champions.slice(0, 3).map((champion, index) => (
                          <div key={index} className={`flex items-center space-x-2`}>
                            <Image
                              src={`/images/${champion.champion_name}.png`}
                              alt={champion.champion_name}
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded"
                              onError={(e) => {
                                e.currentTarget.src = '/images/logo.png'
                              }}
                            />
                            <div className="flex flex-col">
                              <span className={`text-sm font-medium transition-colors duration-300 ${
                                theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                              }`}>
                                {champion.champion_name}
                              </span>
                              <span className={`text-xs transition-colors duration-300 ${
                                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                              }`}>
                                {champion.games_played}G • {Number(champion.winrate).toFixed(0)}% WR • {Number(champion.kda).toFixed(2)} KDA
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className={`text-sm transition-colors duration-300 ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        Aucune donnée
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className={`transition-colors duration-300 ${
                        theme === 'dark' 
                          ? 'text-slate-400 hover:text-slate-300 hover:bg-slate-700' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Link href={`/player?username=${player.player_name}%23${player.player_tag}`}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

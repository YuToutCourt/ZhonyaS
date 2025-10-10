'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Users, Trophy, Target, Swords, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { RankDisplay } from '@/components/teams/RankDisplay'
import { Navbar } from '@/components/Navbar'

interface Matchup {
  id: number
  user_id: number
  team1_id: number
  team2_id: number
  matchup_name: string
  scheduled_date?: string | null
  status: 'UPCOMING' | 'COMPLETED' | 'CANCELLED'
  team1_name: string
  team2_name: string
  team1: TeamDetails
  team2: TeamDetails
}

interface TeamDetails {
  id: number
  team_name: string
  user_id: number
  created_at: string
  updated_at: string
  players: TeamPlayer[]
  stats: TeamStats
}

interface TeamPlayer {
  id: number
  team_id: number
  player_id: number
  position: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'
  is_sub: boolean
  player_name: string
  player_tag: string
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

const POSITION_ORDER = {
  TOP: 1,
  JUNGLE: 2,
  MID: 3,
  ADC: 4,
  SUPPORT: 5
}

export default function MatchupPage() {
  const params = useParams()
  const router = useRouter()
  const { theme } = useTheme()
  const [matchup, setMatchup] = useState<Matchup | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Vérifier le token dans localStorage
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchMatchupDetails()
  }, [params.id])

  const fetchMatchupDetails = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`/api/matchups/${params.id}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMatchup(data.matchup)
      } else if (response.status === 401 || response.status === 403) {
        router.push('/login')
      } else if (response.status === 404) {
        router.push('/teams')
      }
    } catch (error) {
      console.error('Error fetching matchup details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!matchup) {
    return (
      <div className="text-center py-12">
        <h2 className={`text-2xl font-bold mb-4 transition-colors duration-300 ${
          theme === 'dark' ? 'text-white' : 'text-slate-900'
        }`}>
          Matchup non trouvé
        </h2>
        <Button onClick={() => router.push('/teams')}>
          Retour aux équipes
        </Button>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800' 
        : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/teams')}
            className={`mb-4 transition-colors duration-300 ${
              theme === 'dark'
                ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux équipes
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-4xl font-bold flex items-center space-x-3 transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                <Swords className="w-8 h-8" />
                <span>{matchup.matchup_name}</span>
              </h1>
              <p className={`text-lg mt-2 transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Matchup #{matchup.id}
              </p>
            </div>
            <Badge className={getStatusBadgeColor(matchup.status)}>
              {matchup.status}
            </Badge>
          </div>
        </div>

        {/* Team Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Team 1 */}
          <Card className={`transition-colors duration-300 ${
            theme === 'dark'
              ? 'bg-slate-800/50 border-slate-700'
              : 'bg-white border-slate-200'
          }`}>
            <CardHeader>
              <CardTitle className={`text-2xl transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                {matchup.team1.team_name}
              </CardTitle>
              <CardDescription className={`transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Équipe 1
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg transition-colors duration-300 ${
                  theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-100'
                }`}>
                  <div className="flex items-center space-x-2 mb-1">
                    <Users className="w-4 h-4" />
                    <span className={`text-sm transition-colors duration-300 ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Games
                    </span>
                  </div>
                  <div className={`text-2xl font-bold transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    {matchup.team1.stats.total_games}
                  </div>
                </div>
                <div className={`p-4 rounded-lg transition-colors duration-300 ${
                  theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-100'
                }`}>
                  <div className="flex items-center space-x-2 mb-1">
                    <Trophy className="w-4 h-4" />
                    <span className={`text-sm transition-colors duration-300 ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Winrate
                    </span>
                  </div>
                  <div className={`text-2xl font-bold transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    {Number(matchup.team1.stats.winrate).toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className={`p-4 rounded-lg transition-colors duration-300 ${
                theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-100'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-4 h-4" />
                  <span className={`text-sm font-medium transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    Ranks
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm transition-colors duration-300 ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Solo/Duo:
                    </span>
                    <RankDisplay rank={matchup.team1.stats.ranked_solo_avg} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm transition-colors duration-300 ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Flex:
                    </span>
                    <RankDisplay rank={matchup.team1.stats.ranked_flex_avg} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team 2 */}
          <Card className={`transition-colors duration-300 ${
            theme === 'dark'
              ? 'bg-slate-800/50 border-slate-700'
              : 'bg-white border-slate-200'
          }`}>
            <CardHeader>
              <CardTitle className={`text-2xl transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                {matchup.team2.team_name}
              </CardTitle>
              <CardDescription className={`transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Équipe 2
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg transition-colors duration-300 ${
                  theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-100'
                }`}>
                  <div className="flex items-center space-x-2 mb-1">
                    <Users className="w-4 h-4" />
                    <span className={`text-sm transition-colors duration-300 ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Games
                    </span>
                  </div>
                  <div className={`text-2xl font-bold transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    {matchup.team2.stats.total_games}
                  </div>
                </div>
                <div className={`p-4 rounded-lg transition-colors duration-300 ${
                  theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-100'
                }`}>
                  <div className="flex items-center space-x-2 mb-1">
                    <Trophy className="w-4 h-4" />
                    <span className={`text-sm transition-colors duration-300 ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Winrate
                    </span>
                  </div>
                  <div className={`text-2xl font-bold transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    {Number(matchup.team2.stats.winrate).toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className={`p-4 rounded-lg transition-colors duration-300 ${
                theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-100'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-4 h-4" />
                  <span className={`text-sm font-medium transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    Ranks
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm transition-colors duration-300 ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Solo/Duo:
                    </span>
                    <RankDisplay rank={matchup.team2.stats.ranked_solo_avg} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm transition-colors duration-300 ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      Flex:
                    </span>
                    <RankDisplay rank={matchup.team2.stats.ranked_flex_avg} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Players Comparison */}
        <Card className={`transition-colors duration-300 ${
          theme === 'dark'
            ? 'bg-slate-800/50 border-slate-700'
            : 'bg-white border-slate-200'
        }`}>
          <CardHeader>
            <CardTitle className={`transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              Comparaison des joueurs par position
            </CardTitle>
            <CardDescription className={`transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>
              Face-à-face détaillé position par position
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'].map((position) => {
                const player1 = matchup.team1.players
                  ?.sort((a, b) => POSITION_ORDER[a.position] - POSITION_ORDER[b.position])
                  .find(p => p.position === position)
                const player2 = matchup.team2.players
                  ?.sort((a, b) => POSITION_ORDER[a.position] - POSITION_ORDER[b.position])
                  .find(p => p.position === position)

                return (
                  <div key={position} className={`p-6 rounded-lg transition-colors duration-300 ${
                    theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-50'
                  }`}>
                    <h3 className={`text-xl font-bold mb-4 flex items-center space-x-2 transition-colors duration-300 ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      <Image
                        src={POSITION_IMAGES[position as keyof typeof POSITION_IMAGES]}
                        alt={position}
                        width={32}
                        height={32}
                        className="w-8 h-8"
                      />
                      <span>{position}</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Player 1 */}
                      <div className={`p-4 rounded-lg transition-colors duration-300 ${
                        theme === 'dark' ? 'bg-slate-800/50' : 'bg-white'
                      }`}>
                        {player1 ? (
                          <>
                            <div className="flex items-center justify-between mb-4">
                              <h4 className={`font-bold transition-colors duration-300 ${
                                theme === 'dark' ? 'text-white' : 'text-slate-900'
                              }`}>
                                {player1.player_name}#{player1.player_tag}
                              </h4>
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
                                <Link href={`/player?username=${player1.player_name}%23${player1.player_tag}`}>
                                  <ExternalLink className="w-4 h-4" />
                                </Link>
                              </Button>
                            </div>
                            {player1.player_stats ? (
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className={`text-sm transition-colors duration-300 ${
                                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                                  }`}>
                                    Solo/Duo:
                                  </span>
                                  <RankDisplay rank={player1.player_stats.ranked_solo}/>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className={`text-sm transition-colors duration-300 ${
                                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                                  }`}>
                                    Flex:
                                  </span>
                                  <RankDisplay rank={player1.player_stats.ranked_flex}/>
                                </div>
                                <div className={`h-px my-2 transition-colors duration-300 ${
                                  theme === 'dark' ? 'bg-slate-600' : 'bg-slate-200'
                                }`} />
                                <div className="flex justify-between">
                                  <span className={`text-sm transition-colors duration-300 ${
                                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                                  }`}>
                                    Games:
                                  </span>
                                  <span className={`text-sm font-medium transition-colors duration-300 ${
                                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                                  }`}>
                                    {player1.player_stats.total_games}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className={`text-sm transition-colors duration-300 ${
                                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                                  }`}>
                                    Winrate:
                                  </span>
                                  <span className={`text-sm font-medium transition-colors duration-300 ${
                                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                                  }`}>
                                    {Number(player1.player_stats.winrate).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className={`text-sm transition-colors duration-300 ${
                                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                                  }`}>
                                    KDA:
                                  </span>
                                  <span className={`text-sm font-medium transition-colors duration-300 ${
                                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                                  }`}>
                                    {Number(player1.player_stats.kda).toFixed(2)}
                                  </span>
                                </div>
                                {player1.top_champions && player1.top_champions.length > 0 && (
                                  <div className="mt-4 space-y-2">
                                    <span className={`text-sm font-medium transition-colors duration-300 ${
                                      theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                                    }`}>
                                      Top Champions:
                                    </span>
                                    {player1.top_champions.slice(0, 3).map((champion, idx) => (
                                      <div key={idx} className="flex items-center space-x-2">
                                        <Image
                                          src={`/images/${champion.champion_name}.png`}
                                          alt={champion.champion_name}
                                          width={24}
                                          height={24}
                                          className="w-6 h-6 rounded"
                                          onError={(e) => {
                                            e.currentTarget.src = '/images/logo.png'
                                          }}
                                        />
                                        <span className={`text-sm transition-colors duration-300 ${
                                          theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                                        }`}>
                                          {champion.champion_name} ({champion.games_played}G, {Number(champion.winrate).toFixed(0)}%)
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className={`text-sm transition-colors duration-300 ${
                                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                              }`}>
                                Aucune statistique disponible
                              </p>
                            )}
                          </>
                        ) : (
                          <p className={`text-sm transition-colors duration-300 ${
                            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            Pas de joueur
                          </p>
                        )}
                      </div>

                      {/* VS Divider */}
                      <div className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2">
                        <div className={`text-2xl font-bold transition-colors duration-300 ${
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          
                        </div>
                      </div>

                      {/* Player 2 */}
                      <div className={`p-4 rounded-lg transition-colors duration-300 ${
                        theme === 'dark' ? 'bg-slate-800/50' : 'bg-white'
                      }`}>
                        {player2 ? (
                          <>
                            <div className="flex items-center justify-between mb-4">
                              <h4 className={`font-bold transition-colors duration-300 ${
                                theme === 'dark' ? 'text-white' : 'text-slate-900'
                              }`}>
                                {player2.player_name}#{player2.player_tag}
                              </h4>
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
                                <Link href={`/player?username=${player2.player_name}%23${player2.player_tag}`}>
                                  <ExternalLink className="w-4 h-4" />
                                </Link>
                              </Button>
                            </div>
                            {player2.player_stats ? (
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className={`text-sm transition-colors duration-300 ${
                                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                                  }`}>
                                    Solo/Duo:
                                  </span>
                                  <RankDisplay rank={player2.player_stats.ranked_solo} />
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className={`text-sm transition-colors duration-300 ${
                                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                                  }`}>
                                    Flex:
                                  </span>
                                  <RankDisplay rank={player2.player_stats.ranked_flex} />
                                </div>
                                <div className={`h-px my-2 transition-colors duration-300 ${
                                  theme === 'dark' ? 'bg-slate-600' : 'bg-slate-200'
                                }`} />
                                <div className="flex justify-between">
                                  <span className={`text-sm transition-colors duration-300 ${
                                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                                  }`}>
                                    Games:
                                  </span>
                                  <span className={`text-sm font-medium transition-colors duration-300 ${
                                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                                  }`}>
                                    {player2.player_stats.total_games}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className={`text-sm transition-colors duration-300 ${
                                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                                  }`}>
                                    Winrate:
                                  </span>
                                  <span className={`text-sm font-medium transition-colors duration-300 ${
                                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                                  }`}>
                                    {Number(player2.player_stats.winrate).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className={`text-sm transition-colors duration-300 ${
                                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                                  }`}>
                                    KDA:
                                  </span>
                                  <span className={`text-sm font-medium transition-colors duration-300 ${
                                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                                  }`}>
                                    {Number(player2.player_stats.kda).toFixed(2)}
                                  </span>
                                </div>
                                {player2.top_champions && player2.top_champions.length > 0 && (
                                  <div className="mt-4 space-y-2">
                                    <span className={`text-sm font-medium transition-colors duration-300 ${
                                      theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                                    }`}>
                                      Top Champions:
                                    </span>
                                    {player2.top_champions.slice(0, 3).map((champion, idx) => (
                                      <div key={idx} className="flex items-center space-x-2">
                                        <Image
                                          src={`/images/${champion.champion_name}.png`}
                                          alt={champion.champion_name}
                                          width={24}
                                          height={24}
                                          className="w-6 h-6 rounded"
                                          onError={(e) => {
                                            e.currentTarget.src = '/images/logo.png'
                                          }}
                                        />
                                        <span className={`text-sm transition-colors duration-300 ${
                                          theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                                        }`}>
                                          {champion.champion_name} ({champion.games_played}G, {Number(champion.winrate).toFixed(0)}%)
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className={`text-sm transition-colors duration-300 ${
                                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                              }`}>
                                Aucune statistique disponible
                              </p>
                            )}
                          </>
                        ) : (
                          <p className={`text-sm transition-colors duration-300 ${
                            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            Pas de joueur
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


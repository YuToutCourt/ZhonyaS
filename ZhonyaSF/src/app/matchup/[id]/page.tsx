'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Users, Trophy, Target, Swords, ExternalLink, Brain, Gamepad2, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { RankDisplay } from '@/components/teams/RankDisplay'
import { Navbar } from '@/components/Navbar'
import { AIAnalysisDialog } from '@/components/teams/AIAnalysisDialog'
import { apiClient } from '@/lib/api'

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
  const [selectedPosition, setSelectedPosition] = useState<'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'>('TOP')
  const [isAIDialogopen, setIsAIDialogopen] = useState(false)
  const [isStartingDraft, setIsStartingDraft] = useState(false)
  const [showDraftSetup, setShowDraftSetup] = useState(false)
  const [draftSetup, setDraftSetup] = useState({ side: 'BLUE' as 'BLUE' | 'RED', team: 1 as 1 | 2 })

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

  // Generate multisearch URLs for individual teams
  const generateTeamUrls = (teamPlayers: any[]) => {
    if (!teamPlayers || teamPlayers.length === 0) return { uggUrl: '', opggUrl: '' }
    
    const uggPlayerNames = teamPlayers
      .filter(player => player.player_name && player.player_tag)
      .map(player => `${player.player_name}-${player.player_tag}`)
      .join(',')
    
    const opggPlayerNames = teamPlayers
      .filter(player => player.player_name && player.player_tag)
      .map(player => `${player.player_name}%23${player.player_tag}`)
      .join(',')
    
    return {
      uggUrl: `https://u.gg/lol/multisearch?summoners=${uggPlayerNames}&region=euw1`,
      opggUrl: `https://op.gg/fr/lol/multisearch/euw?summoners=${opggPlayerNames}`
    }
  }

  const team1Urls = generateTeamUrls(matchup?.team1?.players || [])
  const team2Urls = generateTeamUrls(matchup?.team2?.players || [])

  const startDraftSimulation = async () => {
    setIsStartingDraft(true)
    
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        alert('Token non trouvé')
        return
      }

      const result = await apiClient.startDraftSimulation(
        matchup!.id,
        draftSetup.side,
        draftSetup.team,
        token
      )
      
      // Rediriger vers la page de draft
      router.push(`/draft/${result.session_id}`)
    } catch (err: any) {
      alert(err.message || 'Erreur lors du démarrage du draft')
    } finally {
      setIsStartingDraft(false)
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
              <div className="flex items-center justify-between">
                <div>
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
                </div>
                {/* Compact Multisearch Links for Team 1 */}
                {matchup.team1?.players && matchup.team1.players.length > 0 && (
                  <div className="flex gap-1">
                    <a 
                      href={team1Urls.uggUrl}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all duration-300 hover:scale-105 ${
                        theme === 'dark' 
                          ? 'bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600' 
                          : 'bg-slate-100 hover:bg-slate-200 border border-slate-200'
                      }`}
                      title="U.GG Team Search"
                    >
                      <Image
                        src="/images/ugg.jpg"
                        alt="U.GG"
                        width={14}
                        height={14}
                        className="rounded"
                      />
                      <span className={`text-xs font-medium transition-colors duration-300 ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        U.GG
                      </span>
                    </a>
                    <a 
                      href={team1Urls.opggUrl}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all duration-300 hover:scale-105 ${
                        theme === 'dark' 
                          ? 'bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600' 
                          : 'bg-slate-100 hover:bg-slate-200 border border-slate-200'
                      }`}
                      title="OP.GG Team Search"
                    >
                      <Image
                        src="/images/op_gg.png"
                        alt="OP.GG"
                        width={14}
                        height={14}
                        className="rounded"
                      />
                      <span className={`text-xs font-medium transition-colors duration-300 ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        OP.GG
                      </span>
                    </a>
                  </div>
                )}
              </div>
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
              <div className="flex items-center justify-between">
                <div>
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
                </div>
                {/* Compact Multisearch Links for Team 2 */}
                {matchup.team2?.players && matchup.team2.players.length > 0 && (
                  <div className="flex gap-1">
                    <a 
                      href={team2Urls.uggUrl}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all duration-300 hover:scale-105 ${
                        theme === 'dark' 
                          ? 'bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600' 
                          : 'bg-slate-100 hover:bg-slate-200 border border-slate-200'
                      }`}
                      title="U.GG Team Search"
                    >
                      <Image
                        src="/images/ugg.jpg"
                        alt="U.GG"
                        width={14}
                        height={14}
                        className="rounded"
                      />
                      <span className={`text-xs font-medium transition-colors duration-300 ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        U.GG
                      </span>
                    </a>
                    <a 
                      href={team2Urls.opggUrl}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all duration-300 hover:scale-105 ${
                        theme === 'dark' 
                          ? 'bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600' 
                          : 'bg-slate-100 hover:bg-slate-200 border border-slate-200'
                      }`}
                      title="OP.GG Team Search"
                    >
                      <Image
                        src="/images/op_gg.png"
                        alt="OP.GG"
                        width={14}
                        height={14}
                        className="rounded"
                      />
                      <span className={`text-xs font-medium transition-colors duration-300 ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        OP.GG
                      </span>
                    </a>
                  </div>
                )}
              </div>
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
            {/* Position Selector Buttons */}
            <div className="flex flex-col space-y-4 mb-6">
              <div className="flex flex-wrap gap-2 justify-center">
                {(['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'] as const).map((position) => (
                  <Button
                    key={position}
                    onClick={() => setSelectedPosition(position)}
                    variant={selectedPosition === position ? 'default' : 'outline'}
                    className={`flex items-center space-x-2 transition-all duration-300 ${
                      selectedPosition === position
                        ? theme === 'dark'
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                        : theme === 'dark'
                          ? 'border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'
                          : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Image
                      src={POSITION_IMAGES[position]}
                      alt={position}
                      width={24}
                      height={24}
                      className="w-6 h-6"
                    />
                    <span>{position}</span>
                  </Button>
                ))}
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-center gap-3">
                <Button
                  onClick={() => setIsAIDialogopen(true)}
                  className={`flex items-center space-x-2 px-6 py-3 font-semibold transition-all duration-300 hover:scale-105 ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                  }`}
                >
                  <Brain className="w-5 h-5" />
                  <span>ASK IA</span>
                </Button>
                
                <Button
                  onClick={() => setShowDraftSetup(true)}
                  className={`flex items-center space-x-2 px-6 py-3 font-semibold transition-all duration-300 hover:scale-105 ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                  }`}
                >
                  <Gamepad2 className="w-5 h-5" />
                  <span>SIMULATION DRAFT</span>
                </Button>
              </div>
            </div>

            {/* Draft Setup Modal */}
            {showDraftSetup && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className={`rounded-lg p-6 max-w-md w-full transition-colors duration-300 ${
                  theme === 'dark' ? 'bg-slate-800' : 'bg-white'
                }`}>
                  <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Configuration du Draft
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Team Selection */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        Choisissez votre équipe
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setDraftSetup({...draftSetup, team: 1})}
                          className={`p-3 rounded-lg border-2 transition-colors ${
                            draftSetup.team === 1
                              ? 'border-blue-500 bg-blue-500/20'
                              : theme === 'dark'
                                ? 'border-slate-600 hover:border-slate-500'
                                : 'border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            {matchup.team1.team_name}
                          </div>
                        </button>
                        <button
                          onClick={() => setDraftSetup({...draftSetup, team: 2})}
                          className={`p-3 rounded-lg border-2 transition-colors ${
                            draftSetup.team === 2
                              ? 'border-red-500 bg-red-500/20'
                              : theme === 'dark'
                                ? 'border-slate-600 hover:border-slate-500'
                                : 'border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            {matchup.team2.team_name}
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Side Selection */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        Choisissez votre côté
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setDraftSetup({...draftSetup, side: 'BLUE'})}
                          className={`p-3 rounded-lg border-2 transition-colors ${
                            draftSetup.side === 'BLUE'
                              ? 'border-blue-500 bg-blue-500/20'
                              : theme === 'dark'
                                ? 'border-slate-600 hover:border-slate-500'
                                : 'border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            Bleu
                          </div>
                          <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                            Pick en premier
                          </div>
                        </button>
                        <button
                          onClick={() => setDraftSetup({...draftSetup, side: 'RED'})}
                          className={`p-3 rounded-lg border-2 transition-colors ${
                            draftSetup.side === 'RED'
                              ? 'border-red-500 bg-red-500/20'
                              : theme === 'dark'
                                ? 'border-slate-600 hover:border-slate-500'
                                : 'border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            Rouge
                          </div>
                          <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                            Counterpick
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setShowDraftSetup(false)}
                        className="flex-1"
                      >
                        Annuler
                      </Button>
                      <Button
                        onClick={startDraftSimulation}
                        disabled={isStartingDraft}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {isStartingDraft ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Démarrage...
                          </>
                        ) : (
                          <>
                            <Swords className="w-4 h-4 mr-2" />
                            Commencer
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Position Comparison */}
            <div className="space-y-8">
              {(() => {
                const position = selectedPosition
                const player1 = matchup.team1.players
                  ?.sort((a, b) => POSITION_ORDER[a.position] - POSITION_ORDER[b.position])
                  .find(p => p.position === position)
                const player2 = matchup.team2.players
                  ?.sort((a, b) => POSITION_ORDER[a.position] - POSITION_ORDER[b.position])
                  .find(p => p.position === position)

                return (
                  <div className={`p-6 rounded-lg transition-colors duration-300 ${
                    theme === 'dark' ? 'bg-slate-700/30' : 'bg-slate-50'
                  }`}>
                    <h3 className={`text-xl font-bold mb-4 flex items-center space-x-2 transition-colors duration-300 ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      <Image
                        src={POSITION_IMAGES[position]}
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
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis Dialog */}
      <AIAnalysisDialog
        isOpen={isAIDialogopen}
        onClose={() => setIsAIDialogopen(false)}
        matchupId={matchup.id}
        selectedPosition={selectedPosition}
        team1Name={matchup.team1.team_name}
        team2Name={matchup.team2.team_name}
      />
    </div>
  )
}


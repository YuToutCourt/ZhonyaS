'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Download, Users, Trophy, Target, Crown, ExternalLink, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'
import { useRouter } from 'next/navigation'
import { RankDisplay } from './RankDisplay'
import { useSocket } from '@/hooks/useSocket'

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
  all_champions?: ChampionStats[]  // Tous les champions pour l'IA
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

interface PlayerDownloadProgress {
  player_name: string
  player_tag: string
  position: string
  status: 'pending' | 'downloading' | 'completed' | 'error'
  progress: number
  current: number
  total: number
  error?: string
}

export function TeamView({ teamId }: TeamViewProps) {
  const [team, setTeam] = useState<Team | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [downloadCount, setDownloadCount] = useState(10)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<Record<string, PlayerDownloadProgress>>({})
  const [showProgressDialog, setShowProgressDialog] = useState(false)
  const { theme } = useTheme()
  const router = useRouter()
  const socket = useSocket()
  
  // Download time period filter states
  const [downloadFilterType, setDownloadFilterType] = useState<'all' | 'season' | 'custom'>('all')
  const [downloadSeason, setDownloadSeason] = useState<string>('')
  const [downloadStartDate, setDownloadStartDate] = useState<string>('')
  const [downloadEndDate, setDownloadEndDate] = useState<string>('')
  
  // Generate seasons (2025 = Season 15, 2024 = Season 14, etc.)
  const generateSeasons = () => {
    const currentYear = new Date().getFullYear()
    const seasons = []
    
    // Add placeholder first
    seasons.push({ value: '', label: 'Select Season' })
    
    // Generate seasons from current year down to 2023
    // Riot API only allows fetching matches from 2023 onwards
    for (let year = currentYear; year >= 2023; year--) {
      const seasonNumber = year - 2010 // 2025 = Season 15, 2024 = Season 14, etc.
      seasons.push({ 
        value: seasonNumber.toString(), 
        label: `Season ${seasonNumber} (${year})` 
      })
    }
    
    return seasons // Most recent first (after placeholder)
  }
  
  const seasons = generateSeasons()

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

  useEffect(() => {
    if (!socket) return

    const handleProgress = (data: any) => {
      const playerKey = `${data.player_name}#${data.player_tag}`
      
      setDownloadProgress(prev => ({
        ...prev,
        [playerKey]: {
          player_name: data.player_name,
          player_tag: data.player_tag,
          position: prev[playerKey]?.position || '',
          status: data.progress >= 100 ? 'completed' : 'downloading',
          progress: data.progress,
          current: data.current,
          total: data.total,
        }
      }))
    }

    const handleComplete = (data: any) => {
      const playerKey = `${data.player_name}#${data.player_tag}`
      
      setDownloadProgress(prev => ({
        ...prev,
        [playerKey]: {
          ...prev[playerKey],
          status: 'completed',
          progress: 100,
        }
      }))
    }

    const handleError = (data: any) => {
      const playerKey = `${data.player_name}#${data.player_tag}`
      
      setDownloadProgress(prev => ({
        ...prev,
        [playerKey]: {
          ...prev[playerKey],
          status: 'error',
          error: data.error,
        }
      }))
    }

    socket.on('download_progress', handleProgress)
    socket.on('download_complete', handleComplete)
    socket.on('download_error', handleError)

    return () => {
      socket.off('download_progress', handleProgress)
      socket.off('download_complete', handleComplete)
      socket.off('download_error', handleError)
    }
  }, [socket])

  const handleDownloadGames = async () => {
    if (!team?.players) return

    setIsDownloading(true)
    setShowProgressDialog(true)
    
    // Calculate startTime and endTime based on filter type
    let startTime: number | undefined = undefined
    let endTime: number | undefined = undefined
    
    if (downloadFilterType === 'season' && downloadSeason) {
      // Convert season to year (Season 13 = 2023, Season 14 = 2024, etc.)
      const year = parseInt(downloadSeason) + 2010
      // Season starts January 1st and ends December 31st
      startTime = Math.floor(new Date(`${year}-01-01T00:00:00Z`).getTime() / 1000)
      endTime = Math.floor(new Date(`${year}-12-31T23:59:59Z`).getTime() / 1000)
    } else if (downloadFilterType === 'custom') {
      if (downloadStartDate) {
        startTime = Math.floor(new Date(downloadStartDate).getTime() / 1000)
      }
      if (downloadEndDate) {
        endTime = Math.floor(new Date(downloadEndDate).getTime() / 1000)
      }
    }
    
    // Initialize progress for all players
    const initialProgress: Record<string, PlayerDownloadProgress> = {}
    team.players.forEach(player => {
      if (player.player_name && player.player_tag) {
        const playerKey = `${player.player_name}#${player.player_tag}`
        initialProgress[playerKey] = {
          player_name: player.player_name,
          player_tag: player.player_tag,
          position: player.position,
          status: 'pending',
          progress: 0,
          current: 0,
          total: downloadCount,
        }
      }
    })
    setDownloadProgress(initialProgress)

    try {
      const token = localStorage.getItem('access_token')
      const sessionId = `team_${teamId}_${Date.now()}`
      
      // Download games for each player sequentially
      for (const player of team.players) {
        if (player.player_name && player.player_tag) {
          const playerKey = `${player.player_name}#${player.player_tag}`
          
          // Update status to downloading
          setDownloadProgress(prev => ({
            ...prev,
            [playerKey]: { ...prev[playerKey], status: 'downloading' }
          }))

          const requestBody: any = {
            username: `${player.player_name}#${player.player_tag}`,
            nb_games: downloadCount,
            session_id: sessionId
          }
          
          if (startTime !== undefined) {
            requestBody.startTime = startTime
          }
          if (endTime !== undefined) {
            requestBody.endTime = endTime
          }

          const response = await fetch('/api/download', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
          })

          if (!response.ok) {
            setDownloadProgress(prev => ({
              ...prev,
              [playerKey]: {
                ...prev[playerKey],
                status: 'error',
                error: 'Échec du téléchargement'
              }
            }))
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

  const POSITION_COLORS: Record<string, string> = {
    TOP: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    JUNGLE: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    MID: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    ADC: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    SUPPORT: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
  }

  // Generate multisearch URLs with team players
  const generateMultisearchUrls = () => {
    if (!team?.players) return { uggUrl: '', opggUrl: '' }
    
    const uggPlayerNames = team.players
      .filter(player => player.player_name && player.player_tag)
      .map(player => `${player.player_name}-${player.player_tag}`)
      .join(',')
    
    const opggPlayerNames = team.players
      .filter(player => player.player_name && player.player_tag)
      .map(player => `${player.player_name}%23${player.player_tag}`)
      .join(',')
    
    return {
      uggUrl: `https://u.gg/lol/multisearch?summoners=${uggPlayerNames}&region=euw1`,
      opggUrl: `https://op.gg/fr/lol/multisearch/euw?summoners=${opggPlayerNames}`
    }
  }

  const { uggUrl, opggUrl } = generateMultisearchUrls()

  return (
    <div className="space-y-6">
      {/* Download Progress Modal */}
      {showProgressDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className={`w-full max-w-2xl transition-colors duration-300 ${
            theme === 'dark' 
              ? 'bg-slate-800 border-slate-700' 
              : 'bg-white border-slate-200'
          }`}>
            <CardHeader>
              <CardTitle className={`flex items-center justify-between transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                <span className="flex items-center space-x-2">
                  <Download className="w-5 h-5" />
                  <span>Téléchargement des Games</span>
                </span>
                {!isDownloading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowProgressDialog(false)}
                    className={`transition-colors duration-300 ${
                      theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
                    }`}
                  >
                    Fermer
                  </Button>
                )}
              </CardTitle>
              <CardDescription className={`transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Téléchargement séquentiel : {downloadCount} games par joueur
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.values(downloadProgress).map((playerProgress) => {
                const playerKey = `${playerProgress.player_name}#${playerProgress.player_tag}`
                
                return (
                  <div
                    key={playerKey}
                    className={`p-4 rounded-lg border transition-colors duration-300 ${
                      theme === 'dark'
                        ? 'bg-slate-800/50 border-slate-700'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <Badge className={POSITION_COLORS[playerProgress.position]}>
                          {playerProgress.position}
                        </Badge>
                        <span className={`font-medium transition-colors duration-300 ${
                          theme === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}>
                          {playerProgress.player_name}#{playerProgress.player_tag}
                        </span>
                      </div>
                      
                      {playerProgress.status === 'pending' && (
                        <Badge variant="outline" className={`transition-colors duration-300 ${
                          theme === 'dark' ? 'text-slate-400 border-slate-600' : 'text-slate-600 border-slate-300'
                        }`}>
                          En attente
                        </Badge>
                      )}
                      {playerProgress.status === 'downloading' && (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      )}
                      {playerProgress.status === 'completed' && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                      {playerProgress.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Progress 
                        value={playerProgress.progress} 
                        className={`h-2 ${
                          playerProgress.status === 'error' ? 'bg-red-200 dark:bg-red-900/20' : ''
                        }`}
                      />
                      <div className={`flex items-center justify-between text-sm transition-colors duration-300 ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        <span>
                          {playerProgress.status === 'completed' 
                            ? 'Téléchargement terminé' 
                            : playerProgress.status === 'error'
                            ? `Erreur: ${playerProgress.error || 'Échec du téléchargement'}`
                            : playerProgress.status === 'downloading'
                            ? `${playerProgress.current} / ${playerProgress.total} games`
                            : 'En attente...'}
                        </span>
                        <span className="font-medium">
                          {Math.round(playerProgress.progress)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {isDownloading && (
                <div className={`text-center text-sm transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                  Téléchargement en cours...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <h1 className={`text-3xl font-bold transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              {team.team_name}
            </h1>
            {/* Compact Multisearch Links */}
            {team?.players && team.players.length > 0 && (
              <div className="flex gap-2">
                <a 
                  href={uggUrl}
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
                    width={16}
                    height={16}
                    className="rounded"
                  />
                  <span className={`text-xs font-medium transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    U.GG
                  </span>
                </a>
                <a 
                  href={opggUrl}
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
                    width={16}
                    height={16}
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
          <p className={`text-lg transition-colors duration-300 ${
            theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Analyse détaillée de l'équipe
          </p>
        </div>
        
        {/* Download Configuration */}
        <div className="flex flex-col gap-4">
          {/* Time Period Filter */}
          <div className="space-y-2">
            <label className={`text-sm font-medium transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Time Period
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={downloadFilterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDownloadFilterType('all')}
                className={`flex-1 transition-colors duration-300 ${
                  downloadFilterType === 'all'
                    ? theme === 'dark'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                    : theme === 'dark'
                    ? 'border-slate-600 hover:bg-slate-700'
                    : 'hover:bg-slate-100'
                }`}
              >
                All Time
              </Button>
              <Button
                type="button"
                variant={downloadFilterType === 'season' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDownloadFilterType('season')}
                className={`flex-1 transition-colors duration-300 ${
                  downloadFilterType === 'season'
                    ? theme === 'dark'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                    : theme === 'dark'
                    ? 'border-slate-600 hover:bg-slate-700'
                    : 'hover:bg-slate-100'
                }`}
              >
                Season
              </Button>
              <Button
                type="button"
                variant={downloadFilterType === 'custom' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDownloadFilterType('custom')}
                className={`flex-1 transition-colors duration-300 ${
                  downloadFilterType === 'custom'
                    ? theme === 'dark'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                    : theme === 'dark'
                    ? 'border-slate-600 hover:bg-slate-700'
                    : 'hover:bg-slate-100'
                }`}
              >
                Custom
              </Button>
            </div>

            {/* Season Selection */}
            {downloadFilterType === 'season' && (
              <select
                value={downloadSeason}
                onChange={(e) => setDownloadSeason(e.target.value)}
                className={`w-full px-3 py-2 rounded-md border transition-colors duration-300 ${
                  theme === 'dark'
                    ? 'bg-slate-700 border-slate-600 text-slate-300'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                {seasons.map((season) => (
                  <option key={season.value} value={season.value}>
                    {season.label}
                  </option>
                ))}
              </select>
            )}

            {/* Custom Date Range */}
            {downloadFilterType === 'custom' && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className={`text-xs mb-1 block transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={downloadStartDate}
                    onChange={(e) => setDownloadStartDate(e.target.value)}
                    min="2023-01-01"
                    max={new Date().toISOString().split('T')[0]}
                    className={`transition-colors duration-300 ${
                      theme === 'dark'
                        ? 'bg-slate-700 border-slate-600 text-slate-300'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <label className={`text-xs mb-1 block transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={downloadEndDate}
                    onChange={(e) => setDownloadEndDate(e.target.value)}
                    min="2023-01-01"
                    max={new Date().toISOString().split('T')[0]}
                    className={`transition-colors duration-300 ${
                      theme === 'dark'
                        ? 'bg-slate-700 border-slate-600 text-slate-300'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Games count and download button */}
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <label className={`text-sm font-medium mb-1 block transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Games per Player
              </label>
              <input
                type="number"
                value={downloadCount}
                onChange={(e) => setDownloadCount(parseInt(e.target.value) || 10)}
                min="1"
                max="50"
                className={`w-full px-3 py-2 rounded border transition-colors duration-300 ${
                  theme === 'dark'
                    ? 'bg-slate-700 border-slate-600 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
            <div className="flex-1 self-end">
              <Button
                onClick={handleDownloadGames}
                disabled={isDownloading || !team.players?.length}
                className={`w-full transition-colors duration-300 ${
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                <Download className="w-4 h-4 mr-2" />
                {isDownloading ? 'Downloading...' : 'Download Games'}
              </Button>
            </div>
          </div>
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

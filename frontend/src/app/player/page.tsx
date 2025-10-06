'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Search, 
  Download, 
  Filter,
  X,
  Check
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { io, Socket } from 'socket.io-client'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useTheme } from '@/contexts/ThemeContext'

interface Player {
  name: string
  tag: string
  soloq: string | null
  flexq: string | null
  global_kda: number
  global_kill: number
  global_death: number
  global_assists: number
  global_kp: number
  global_winrate: number
  nb_game: number
  nb_win: number
  nb_lose: number
  score_moyen: number
  role: string[]
}

interface Champion {
  nom: string
  nombre_de_parties: number
  nombre_win: number
  nombre_lose: number
  winrate: number
  kill: number
  death: number
  assit: number
  dangerousness: number
  kda: number
  kill_participation: number
}

interface FilterOptions {
  role: string[]
  champion: string[]
  match_types: string[]
  seasons: string[]
  start_date: string
  end_date: string
}

export default function PlayerPage() {
  const searchParams = useSearchParams()
  const username = searchParams.get('username') || ''
  const { theme } = useTheme()
  
  const [player, setPlayer] = useState<Player | null>(null)
  const [champions, setChampions] = useState<Champion[]>([])
  const [allChampions, setAllChampions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadGames, setDownloadGames] = useState(1)
  const [championSearch, setChampionSearch] = useState('')
  const [isChampionSelectOpen, setIsChampionSelectOpen] = useState(false)
  
  const [filters, setFilters] = useState<FilterOptions>({
    role: ['all'],
    champion: ['all'],
    match_types: ['all'],
    seasons: ['all'],
    start_date: '',
    end_date: ''
  })

  // Images pour les rôles
  const roleImages = {
    'all': '/images/fill.png',
    'TOP': '/images/top.png',
    'JUNGLE': '/images/jungle.png',
    'MIDDLE': '/images/mid.png',
    'BOTTOM': '/images/bot.png',
    'UTILITY': '/images/supp.png'
  }

  // Mapping pour l'affichage des rôles
  const roleDisplayNames = {
    'all': 'All',
    'TOP': 'Top',
    'JUNGLE': 'Jungle',
    'MIDDLE': 'Mid',
    'BOTTOM': 'Bot',
    'UTILITY': 'Support'
  }

  // Génération des saisons (2025 = Saison 15, 2024 = Saison 14, etc.)
  const generateSeasons = () => {
    const currentYear = new Date().getFullYear()
    const seasons = []
    
    // Saison actuelle (2025 = Saison 15)
    seasons.push({ value: 'all', label: 'All Seasons' })
    
    // Générer les saisons depuis 2021 (Saison 11) jusqu'à l'année actuelle
    for (let year = 2021; year <= currentYear; year++) {
      const seasonNumber = year - 2010 // 2021 = Saison 11, 2022 = Saison 12, etc.
      seasons.push({ 
        value: seasonNumber.toString(), 
        label: `Season ${seasonNumber} (${year})` 
      })
    }
    
    return seasons.reverse() // Plus récent en premier
  }

  const seasons = generateSeasons()

  // Initialisation du socket
  useEffect(() => {
    const newSocket = io('http://localhost:5001')
    setSocket(newSocket)

    newSocket.on('connect', () => {
      console.log('Connected to server')
    })

    newSocket.on('progress', (data) => {
      setDownloadProgress(data.progress)
    })

    newSocket.on('download_complete', (data) => {
      setIsDownloading(false)
      setDownloadProgress(0)
      fetchPlayerData()
    })

    newSocket.on('download_error', (data) => {
      setIsDownloading(false)
      setDownloadProgress(0)
      setError(data.error)
    })

    return () => {
      newSocket.close()
    }
  }, [])

  // Chargement des données du joueur
  const fetchPlayerData = async () => {
    if (!username) return
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('http://localhost:5001/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch player data')
      }
      
      const data = await response.json()
      setPlayer(data.player)
      setChampions(data.champions)
      setAllChampions(data.all_champions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Filtrage des données
  const applyFilters = async () => {
    if (!username) return
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('http://localhost:5001/api/filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          ...filters
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to filter data')
      }
      
      const data = await response.json()
      setPlayer(data.player)
      setChampions(data.champions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Téléchargement de nouveaux jeux
  const handleDownload = async () => {
    if (!username || !socket) return
    
    try {
      setIsDownloading(true)
      setDownloadProgress(0)
      
      const response = await fetch('http://localhost:5001/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          nb_games: downloadGames,
          session_id: socket.id
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start download')
      }
      
      socket.emit('join', { session_id: socket.id })
    } catch (err) {
      setIsDownloading(false)
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  useEffect(() => {
    fetchPlayerData()
  }, [username])

  if (loading && !player) {
    return <LoadingSkeleton />
  }

  if (error) {
    return <ErrorPage error={error} />
  }

  if (!player) {
    return <ErrorPage error="Player not found" />
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
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search player..."
                  defaultValue={username}
                  className={`w-80 transition-colors duration-300 ${
                    theme === 'dark'
                      ? 'bg-slate-800/50 border-blue-600/30 text-white placeholder:text-slate-400 focus:border-yellow-400 focus:ring-yellow-400/20'
                      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500'
                  }`}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      window.location.href = `/player?username=${encodeURIComponent((e.target as HTMLInputElement).value)}`
                    }
                  }}
                />
                <Search className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-400'
                }`} />
              </div>
              <Button 
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Search player..."]') as HTMLInputElement
                  if (input.value) {
                    window.location.href = `/player?username=${encodeURIComponent(input.value)}`
                  }
                }}
                className={`transition-colors duration-300 ${
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Search className="w-4 h-4" />
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Player Header */}
        <div className="mb-8">
          <div className={`rounded-2xl shadow-lg p-8 mb-6 transition-colors duration-300 ${
            theme === 'dark' 
              ? 'bg-slate-800/50 border border-blue-600/20' 
              : 'bg-white'
          }`}>
            <h1 className={`text-4xl font-bold mb-6 transition-colors duration-300 ${
              theme === 'dark' 
                ? 'text-white' 
                : 'text-slate-900'
            }`}>
              {player.name}#{player.tag}
            </h1>
            
            {/* Player Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
              <div className="text-center">
                <div className={`text-3xl font-bold mb-1 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  {player.nb_game}
                </div>
                <div className={`text-sm font-medium transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Total Games
                </div>
              </div>
              
              <div className="text-center">
                <div className={`text-3xl font-bold mb-1 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  {player.global_winrate}%
                </div>
                <div className={`text-sm font-medium transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Winrate
                </div>
              </div>
              
              <div className="text-center">
                <div className={`text-3xl font-bold mb-1 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  {player.global_kda}
                </div>
                <div className={`text-sm font-medium transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  KDA
                </div>
              </div>
              
              <div className="text-center">
                <div className={`text-3xl font-bold mb-1 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  {player.global_kp}%
                </div>
                <div className={`text-sm font-medium transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  KP
                </div>
              </div>
              
              <div className="text-center">
                <div className={`text-3xl font-bold mb-1 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  {player.score_moyen}
                </div>
                <div className={`text-sm font-medium transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Score
                </div>
              </div>
            </div>

            {/* Rank Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RankCard title="Ranked Solo" rank={player.soloq} theme={theme} />
              <RankCard title="Ranked Flex" rank={player.flexq} theme={theme} />
            </div>
          </div>
        </div>

        {/* Filters and Download */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Filters */}
          <Card className={`lg:col-span-3 shadow-lg transition-colors duration-300 ${
            theme === 'dark' 
              ? 'bg-slate-800/50 border-blue-600/20' 
              : 'bg-white border-slate-200'
          }`}>
            <CardHeader>
              <CardTitle className={`flex items-center space-x-2 transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                <Filter className="w-5 h-5" />
                <span>Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Role Selection */}
                <div>
                  <label className={`text-sm font-medium mb-2 block transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Role
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['all', 'TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'].map((role) => (
                      <Button
                        key={role}
                        variant={filters.role.includes(role) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          if (role === 'all') {
                            setFilters({ ...filters, role: ['all'] })
                          } else {
                            const newRoles = filters.role.includes(role)
                              ? filters.role.filter(r => r !== role)
                              : [...filters.role.filter(r => r !== 'all'), role]
                            setFilters({ ...filters, role: newRoles.length === 0 ? ['all'] : newRoles })
                          }
                        }}
                        className={`transition-colors duration-300 ${
                          filters.role.includes(role) 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : theme === 'dark'
                              ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Image
                            src={roleImages[role as keyof typeof roleImages]}
                            alt={role}
                            width={20}
                            height={20}
                            className="rounded"
                          />
                          <span className="text-xs">{roleDisplayNames[role as keyof typeof roleDisplayNames]}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Queue Type Multi-Select */}
                <div>
                  <label className={`text-sm font-medium mb-2 block transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Queue Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['all', 'soloq', 'flex', 'normal', 'tourney'].map((queue) => (
                      <Button
                        key={queue}
                        variant={filters.match_types.includes(queue) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          if (queue === 'all') {
                            setFilters({ ...filters, match_types: ['all'] })
                          } else {
                            const newQueues = filters.match_types.includes(queue)
                              ? filters.match_types.filter(q => q !== queue)
                              : [...filters.match_types.filter(q => q !== 'all'), queue]
                            setFilters({ ...filters, match_types: newQueues.length === 0 ? ['all'] : newQueues })
                          }
                        }}
                        className={`transition-colors duration-300 ${
                          filters.match_types.includes(queue) 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : theme === 'dark'
                              ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {queue.charAt(0).toUpperCase() + queue.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Champion Multi-Select with Search */}
                <div className="md:col-span-2">
                  <label className={`text-sm font-medium mb-2 block transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Champions
                  </label>
                  
                  {/* Search Input */}
                  <div className="relative mb-3">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`} />
                    <Input
                      type="text"
                      placeholder="Search champions..."
                      value={championSearch}
                      onChange={(e) => setChampionSearch(e.target.value)}
                      className={`pl-10 pr-4 transition-colors duration-300 ${
                        theme === 'dark'
                          ? 'bg-slate-700 border-slate-600 text-slate-300 placeholder:text-slate-400'
                          : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-500'
                      }`}
                    />
                  </div>

                  {/* Selected Champions */}
                  {filters.champion.length > 0 && filters.champion[0] !== 'all' && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {filters.champion.map((champName) => (
                        <div
                          key={champName}
                          className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm transition-colors duration-300 ${
                            theme === 'dark'
                              ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                              : 'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}
                        >
                          <Image
                            src={`/images/${champName}.png`}
                            alt={champName}
                            width={16}
                            height={16}
                            className="rounded"
                          />
                          <span>{champName}</span>
                          <button
                            onClick={() => {
                              const newChampions = filters.champion.filter(c => c !== champName)
                              setFilters({ ...filters, champion: newChampions.length === 0 ? ['all'] : newChampions })
                            }}
                            className="hover:bg-red-500/20 rounded-full p-0.5 transition-colors duration-200"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Champion List */}
                  <div className={`max-h-64 overflow-y-auto border rounded-lg transition-colors duration-300 ${
                    theme === 'dark' ? 'border-slate-600 bg-slate-700/50' : 'border-slate-200 bg-white'
                  }`}>
                    {/* All Champions Button */}
                    <button
                      onClick={() => setFilters({ ...filters, champion: ['all'] })}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors duration-200 ${
                        filters.champion.includes('all')
                          ? theme === 'dark' ? 'bg-blue-600/20' : 'bg-blue-100'
                          : ''
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200 ${
                        filters.champion.includes('all')
                          ? 'bg-blue-600 border-blue-600'
                          : theme === 'dark' ? 'border-slate-500' : 'border-slate-300'
                      }`}>
                        {filters.champion.includes('all') && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <Image
                        src="/images/fill.png"
                        alt="All Champions"
                        width={20}
                        height={20}
                        className="rounded"
                      />
                      <span className={`font-medium transition-colors duration-300 ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>
                        All Champions
                      </span>
                    </button>

                    {/* Filtered Champions */}
                    {allChampions
                      .filter(champ => 
                        champ.name.toLowerCase().includes(championSearch.toLowerCase())
                      )
                      .map((champ) => (
                        <button
                          key={champ.name}
                          onClick={() => {
                            if (filters.champion.includes('all')) {
                              setFilters({ ...filters, champion: [champ.name] })
                            } else {
                              const newChampions = filters.champion.includes(champ.name)
                                ? filters.champion.filter(c => c !== champ.name)
                                : [...filters.champion, champ.name]
                              setFilters({ ...filters, champion: newChampions.length === 0 ? ['all'] : newChampions })
                            }
                          }}
                          className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors duration-200 ${
                            filters.champion.includes(champ.name)
                              ? theme === 'dark' ? 'bg-blue-600/20' : 'bg-blue-100'
                              : ''
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors duration-200 ${
                            filters.champion.includes(champ.name)
                              ? 'bg-blue-600 border-blue-600'
                              : theme === 'dark' ? 'border-slate-500' : 'border-slate-300'
                          }`}>
                            {filters.champion.includes(champ.name) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <Image
                            src={`/images/${champ.name}.png`}
                            alt={champ.name}
                            width={20}
                            height={20}
                            className="rounded"
                          />
                          <span className={`font-medium transition-colors duration-300 ${
                            theme === 'dark' ? 'text-white' : 'text-slate-900'
                          }`}>
                            {champ.name}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>

                {/* Season Selection */}
                <div>
                  <label className={`text-sm font-medium mb-2 block transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Season
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {seasons.map((season) => (
                      <Button
                        key={season.value}
                        variant={filters.seasons.includes(season.value) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          if (season.value === 'all') {
                            setFilters({ ...filters, seasons: ['all'] })
                          } else {
                            const newSeasons = filters.seasons.includes(season.value)
                              ? filters.seasons.filter(s => s !== season.value)
                              : [...filters.seasons.filter(s => s !== 'all'), season.value]
                            setFilters({ ...filters, seasons: newSeasons.length === 0 ? ['all'] : newSeasons })
                          }
                        }}
                        className={`transition-colors duration-300 ${
                          filters.seasons.includes(season.value) 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : theme === 'dark'
                              ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {season.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <label className={`text-sm font-medium mb-2 block transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Date Range
                  </label>
                  <div className="space-y-2">
                    <Input
                      type="date"
                      placeholder="Start Date"
                      value={filters.start_date}
                      onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                      className={`transition-colors duration-300 ${
                        theme === 'dark'
                          ? 'bg-slate-700 border-slate-600 text-slate-300'
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}
                      min="2021-06-16"
                    />
                    <Input
                      type="date"
                      placeholder="End Date"
                      value={filters.end_date}
                      onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                      className={`transition-colors duration-300 ${
                        theme === 'dark'
                          ? 'bg-slate-700 border-slate-600 text-slate-300'
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}
                      min="2021-06-16"
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={applyFilters} 
                disabled={loading}
                className={`w-full transition-colors duration-300 ${
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {loading ? 'Applying...' : 'Apply Filters'}
              </Button>
            </CardContent>
          </Card>

          {/* Download - Compact */}
          <Card className={`shadow-lg transition-colors duration-300 ${
            theme === 'dark' 
              ? 'bg-slate-800/50 border-blue-600/20' 
              : 'bg-white border-slate-200'
          }`}>
            <CardHeader className="pb-3">
              <CardTitle className={`flex items-center space-x-2 text-lg transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                <Download className="w-5 h-5" />
                <span>Download</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className={`text-sm font-medium mb-2 block transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  Games (1-10000)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="10000"
                  value={downloadGames}
                  onChange={(e) => setDownloadGames(parseInt(e.target.value) || 1)}
                  className={`transition-colors duration-300 ${
                    theme === 'dark'
                      ? 'bg-slate-700 border-slate-600 text-slate-300'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {isDownloading && (
                <div className="space-y-2">
                  <div className={`flex items-center justify-between text-sm transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    <span>Downloading...</span>
                    <span>{downloadProgress}%</span>
                  </div>
                  <Progress value={downloadProgress} className="h-2" />
                </div>
              )}

              <Button 
                onClick={handleDownload} 
                disabled={isDownloading}
                className={`w-full transition-colors duration-300 ${
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isDownloading ? 'Downloading...' : 'Download Games'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Champions Table */}
        <ChampionsTable champions={champions} loading={loading} theme={theme} />
      </div>
    </div>
  )
}

// Composants auxiliaires
function LoadingSkeleton() {
  const { theme } = useTheme()
  
  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800' 
        : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className={`text-xl transition-colors duration-300 ${
          theme === 'dark' ? 'text-white' : 'text-slate-900'
        }`}>
          Loading player data...
        </p>
      </div>
    </div>
  )
}

function ErrorPage({ error }: { error: string }) {
  const { theme } = useTheme()
  
  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800' 
        : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      <div className="max-w-2xl mx-auto px-6 text-center">
        {/* Image d'erreur */}
        <div className="mb-8">
          <Image
            src="/images/BIG_TEEMO.png"
            alt="Error - Teemo"
            width={300}
            height={300}
            className="mx-auto drop-shadow-2xl hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Contenu d'erreur */}
        <div className={`rounded-2xl shadow-2xl p-8 transition-colors duration-300 ${
          theme === 'dark' 
            ? 'bg-slate-800/80 border border-red-500/30 backdrop-blur-sm' 
            : 'bg-white/90 border border-red-200 backdrop-blur-sm'
        }`}>
          <div className="mb-6">
            <div className={`text-6xl mb-4 transition-colors duration-300 ${
              theme === 'dark' ? 'text-red-400' : 'text-red-500'
            }`}>
              😵
            </div>
            <h1 className={`text-3xl font-bold mb-4 transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              Oops! Player Not Found
            </h1>
            <p className={`text-lg transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
            }`}>
              {error}
            </p>
          </div>

          <div className="space-y-4">
            <div className={`text-sm transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>
              <p>Make sure you entered the correct summoner name and tag.</p>
              <p>Example: <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">PlayerName#TAG</span></p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className={`transition-colors duration-300 ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}>
                <Link href="/" className="flex items-center space-x-2">
                  <Search className="w-4 h-4" />
                  <span>Search Again</span>
                </Link>
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.history.back()}
                className={`transition-colors duration-300 ${
                  theme === 'dark'
                    ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RankCard({ title, rank, theme }: { title: string, rank: string | null, theme: string }) {
  if (!rank) {
    return (
      <div className={`p-6 rounded-xl border transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-slate-700/50 border-slate-600' 
          : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center space-x-4">
          <Image
            src="/images/unranked.webp"
            alt="Unranked"
            width={64}
            height={64}
            className="rounded-lg"
          />
          <div>
            <h3 className={`text-lg font-semibold transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              {title}
            </h3>
            <p className={`transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Unranked
            </p>
          </div>
        </div>
      </div>
    )
  }

  const rankParts = rank.split(' ')
  const tier = rankParts[0]?.toLowerCase()
  const rankText = rankParts.slice(0, 2).join(' ')
  const lp = rankParts[2]?.replace('(', '') || ''
  const winrate = rankParts[7]?.split('%')[0] || '0'

  return (
    <div className={`p-6 rounded-xl border transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-slate-700/50 border-slate-600' 
        : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="flex items-center space-x-4">
        <Image
          src={`/images/${tier}.webp`}
          alt={rankText}
          width={64}
          height={64}
          className="rounded-lg"
        />
        <div className="flex-1">
          <h3 className={`text-lg font-semibold transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            {title}
          </h3>
          <p className={`font-medium transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            {rankText} {lp}
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`text-sm transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              {rankParts[5]}
            </span>
            <span className={`text-sm font-medium transition-colors duration-300 ${
              parseInt(winrate) >= 50 
                ? (theme === 'dark' ? 'text-green-400' : 'text-green-600')
                : (theme === 'dark' ? 'text-red-400' : 'text-red-600')
            }`}>
              {winrate}%
            </span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
              <div className="flex h-full">
                {/* Victoires en vert */}
                <div 
                  className="bg-green-500 h-full"
                  style={{ width: `${parseInt(winrate)}%` }}
                />
                {/* Défaites en rouge */}
                <div 
                  className="bg-red-500 h-full"
                  style={{ width: `${100 - parseInt(winrate)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChampionsTable({ champions, loading, theme }: { champions: Champion[], loading: boolean, theme: string }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className={`h-16 w-full transition-colors duration-300 ${
            theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'
          }`} />
        ))}
      </div>
    )
  }

  const minGamesRequired = 4

  return (
    <Card className={`shadow-lg transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-slate-800/50 border-blue-600/20' 
        : 'bg-white border-slate-200'
    }`}>
      <CardHeader>
        <CardTitle className={`transition-colors duration-300 ${
          theme === 'dark' ? 'text-white' : 'text-slate-900'
        }`}>
          Champion Performance
        </CardTitle>
        <CardDescription className={`transition-colors duration-300 ${
          theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
        }`}>
          Performance statistics for each champion played
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className={`transition-colors duration-300 ${
              theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
            }`}>
              <TableHead className={`transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Champion
              </TableHead>
              <TableHead className={`transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Games
              </TableHead>
              <TableHead className={`transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Winrate
              </TableHead>
              <TableHead className={`transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                KDA
              </TableHead>
              <TableHead className={`transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                KP
              </TableHead>
              <TableHead className={`transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}>
                Dangerousness
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {champions
              .filter(champ => champ.nombre_de_parties >= minGamesRequired)
              .sort((a, b) => b.dangerousness - a.dangerousness)
              .map((champion) => (
                <TableRow key={champion.nom} className={`transition-colors duration-300 ${
                  theme === 'dark' 
                    ? 'border-slate-700 hover:bg-slate-700/50' 
                    : 'border-slate-200 hover:bg-slate-50'
                }`}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Image
                        src={`/images/${champion.nom}.png`}
                        alt={champion.nom}
                        width={48}
                        height={48}
                        className="rounded-lg cursor-pointer hover:scale-110 transition-transform"
                        onClick={() => window.open(`https://u.gg/lol/champions/${champion.nom}/counter`, '_blank')}
                      />
                      <span className={`font-medium transition-colors duration-300 ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>
                        {champion.nom}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className={`transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    {champion.nombre_de_parties}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${
                        champion.winrate >= 70 ? (theme === 'dark' ? 'text-green-400' : 'text-green-600') : 
                        champion.winrate >= 50 ? (theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600') : 
                        (theme === 'dark' ? 'text-red-400' : 'text-red-600')
                      }`}>
                        {champion.winrate}%
                      </span>
                      <span className={`text-sm transition-colors duration-300 ${
                        theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
                      }`}>
                        ({champion.nombre_win}W/{champion.nombre_lose}L)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium ${
                        champion.kda >= 4 ? (theme === 'dark' ? 'text-green-400' : 'text-green-600') : 
                        champion.kda >= 3 ? (theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600') : 
                        (theme === 'dark' ? 'text-red-400' : 'text-red-600')
                      }`}>
                        {champion.kda}
                      </span>
                      <span className={`text-sm transition-colors duration-300 ${
                        theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
                      }`}>
                        ({champion.kill}/{champion.death}/{champion.assit})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`font-medium ${
                      champion.kill_participation >= 65 ? (theme === 'dark' ? 'text-green-400' : 'text-green-600') : 
                      champion.kill_participation >= 50 ? (theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600') : 
                      (theme === 'dark' ? 'text-red-400' : 'text-red-600')
                    }`}>
                      {champion.kill_participation}%
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={champion.dangerousness >= 700 ? 'destructive' : 'secondary'}
                      className="font-medium"
                    >
                      {champion.dangerousness}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
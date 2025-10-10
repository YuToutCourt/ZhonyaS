'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Search, 
  Download, 
  Filter,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown
} from 'lucide-react'
import Image from 'next/image'
import { io, Socket } from 'socket.io-client'
import { Navbar } from '@/components/Navbar'
import { useTheme } from '@/contexts/ThemeContext'
import { API_URL } from '@/lib/config'

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
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)
  const [minGamesRequired, setMinGamesRequired] = useState(4)
  
  const [filters, setFilters] = useState<FilterOptions>({
    role: ['all'],
    champion: ['all'],
    match_types: ['all'],
    seasons: ['all'],
    start_date: '',
    end_date: ''
  })

  // Table sorting
  type SortKey = 'name' | 'games' | 'winrate' | 'kda' | 'kp' | 'dangerousness'
  const [sortKey, setSortKey] = useState<SortKey>('dangerousness')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

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
    const newSocket = io(API_URL)
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
      
      const response = await fetch(`${API_URL}/api/search`, {
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
      
      const response = await fetch(`${API_URL}/api/filter`, {
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
      
      const response = await fetch(`${API_URL}/api/download`, {
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

  // Close champion dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (isChampionSelectOpen) {
        setIsChampionSelectOpen(false)
      }
    }

    if (isChampionSelectOpen) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isChampionSelectOpen])

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
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Player Header - Compact */}
        <div className={`rounded-xl shadow-lg p-6 mb-6 transition-colors duration-300 ${
          theme === 'dark' 
            ? 'bg-slate-800/50 border border-blue-600/20' 
            : 'bg-white'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Player Name & Stats */}
            <div className="flex-1">
              <h1 className={`text-2xl font-bold mb-4 transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                {player.name}#{player.tag}
              </h1>
              
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                <div>
                  <div className={`text-xl font-bold transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    {player.nb_game}
                  </div>
                  <div className={`text-xs font-medium transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Games
                  </div>
                </div>
                
                <div>
                  <div className={`text-xl font-bold transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    {player.global_winrate}%
                  </div>
                  <div className={`text-xs font-medium transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    WR
                  </div>
                </div>
                
                <div>
                  <div className={`text-xl font-bold transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    {player.global_kda}
                  </div>
                  <div className={`text-xs font-medium transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    KDA
                  </div>
                </div>
                
                <div>
                  <div className={`text-xl font-bold transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    {player.global_kp}%
                  </div>
                  <div className={`text-xs font-medium transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    KP
                  </div>
                </div>
                
                <div>
                  <div className={`text-xl font-bold transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    {player.score_moyen}
                  </div>
                  <div className={`text-xs font-medium transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Score
                  </div>
                </div>
              </div>
            </div>

            {/* Ranks - Compact Side by Side */}
            <div className="flex gap-4 lg:gap-6">
              <CompactRankCard title="Solo/Duo" rank={player.soloq} theme={theme} />
              <CompactRankCard title="Flex" rank={player.flexq} theme={theme} />
            </div>
          </div>
        </div>

        {/* Filters and Download - Compact */}
        <Card className={`shadow-lg transition-colors duration-300 mb-6 ${
          theme === 'dark' 
            ? 'bg-slate-800/50 border-blue-600/20' 
            : 'bg-white border-slate-200'
        }`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className={`flex items-center space-x-2 transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                <Filter className="w-5 h-5" />
                <span>Filters & Download</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                className={`transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {isFiltersExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </Button>
            </div>
          </CardHeader>
          
          {isFiltersExpanded && (
            <CardContent className="space-y-4 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Role Selection - Compact */}
                <div>
                  <label className={`text-sm font-medium mb-2 block transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Role
                  </label>
                  <div className="flex flex-wrap gap-1">
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
                        className={`p-2 transition-colors duration-300 ${
                          filters.role.includes(role) 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : theme === 'dark'
                              ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Image
                          src={roleImages[role as keyof typeof roleImages]}
                          alt={role}
                          width={18}
                          height={18}
                          className="rounded"
                        />
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Queue Type - Compact */}
                <div>
                  <label className={`text-sm font-medium mb-2 block transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Queue
                  </label>
                  <div className="flex flex-wrap gap-1">
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
                        className={`px-2 py-1 text-xs transition-colors duration-300 ${
                          filters.match_types.includes(queue) 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : theme === 'dark'
                              ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {queue === 'all' ? 'All' : queue.charAt(0).toUpperCase() + queue.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Season - Compact */}
                <div>
                  <label className={`text-sm font-medium mb-2 block transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Season
                  </label>
                  <select
                    value={filters.seasons[0]}
                    onChange={(e) => setFilters({ ...filters, seasons: [e.target.value] })}
                    className={`w-full px-3 py-2 rounded-md border text-sm transition-colors duration-300 ${
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
                </div>

                {/* Champion Select with Search */}
                <div className="lg:col-span-2">
                  <label className={`text-sm font-medium mb-2 block transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Champions {filters.champion.length > 0 && filters.champion[0] !== 'all' && (
                      <span className={`ml-2 text-xs transition-colors duration-300 ${
                        theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                      }`}>
                        ({filters.champion.length} selected)
                      </span>
                    )}
                  </label>
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    {/* Select Trigger */}
                    <button
                      type="button"
                      onClick={() => setIsChampionSelectOpen(!isChampionSelectOpen)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md border text-sm transition-colors duration-300 ${
                        theme === 'dark'
                          ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                          : 'bg-white border-slate-300 text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2 flex-1 overflow-hidden">
                        {filters.champion.length > 0 && filters.champion[0] !== 'all' ? (
                          <>
                            <div className="flex items-center gap-1">
                              {filters.champion.slice(0, 2).map((champName) => (
                                <div key={champName} className="flex items-center gap-1 px-2 py-0.5 bg-blue-600/20 rounded">
                                  <Image
                                    src={`/images/${champName}.png`}
                                    alt={champName}
                                    width={16}
                                    height={16}
                                    className="rounded"
                                  />
                                  <span className="text-xs">{champName}</span>
                                </div>
                              ))}
                              {filters.champion.length > 2 && (
                                <span className="text-xs px-2 py-0.5 bg-blue-600/20 rounded">
                                  +{filters.champion.length - 2}
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>
                            All Champions
                          </span>
                        )}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                        isChampionSelectOpen ? 'transform rotate-180' : ''
                      }`} />
                    </button>

                    {/* Dropdown */}
                    {isChampionSelectOpen && (
                      <div className={`absolute z-20 w-full mt-1 border rounded-lg shadow-xl transition-colors duration-300 ${
                        theme === 'dark' ? 'border-slate-600 bg-slate-700' : 'border-slate-200 bg-white'
                      }`}>
                        {/* Search Input */}
                        <div className="p-2 border-b border-slate-200 dark:border-slate-600">
                          <div className="relative">
                            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${
                              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                            }`} />
                            <Input
                              type="text"
                              placeholder="Search champions..."
                              value={championSearch}
                              onChange={(e) => setChampionSearch(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className={`pl-10 pr-4 h-8 text-sm transition-colors duration-300 ${
                                theme === 'dark'
                                  ? 'bg-slate-600 border-slate-500 text-slate-300 placeholder:text-slate-400'
                                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-500'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Champion List */}
                        <div className="max-h-60 overflow-y-auto">
                          {/* All Champions Option */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setFilters({ ...filters, champion: ['all'] })
                              setChampionSearch('')
                            }}
                            className={`w-full flex items-center space-x-3 px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors duration-200 ${
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
                              width={24}
                              height={24}
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
                                type="button"
                                key={champ.name}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (filters.champion.includes('all')) {
                                    setFilters({ ...filters, champion: [champ.name] })
                                  } else {
                                    const newChampions = filters.champion.includes(champ.name)
                                      ? filters.champion.filter(c => c !== champ.name)
                                      : [...filters.champion, champ.name]
                                    setFilters({ ...filters, champion: newChampions.length === 0 ? ['all'] : newChampions })
                                  }
                                }}
                                className={`w-full flex items-center space-x-3 px-3 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors duration-200 ${
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
                                  width={24}
                                  height={24}
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

                        {/* Footer with buttons */}
                        <div className="p-2 border-t border-slate-200 dark:border-slate-600 flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setFilters({ ...filters, champion: ['all'] })
                              setChampionSearch('')
                            }}
                            className="flex-1 h-7 text-xs"
                          >
                            Clear All
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setIsChampionSelectOpen(false)
                              setChampionSearch('')
                            }}
                            className="flex-1 h-7 text-xs bg-blue-600 hover:bg-blue-700"
                          >
                            Done
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Date Range - Compact */}
                <div className="lg:col-span-2">
                  <label className={`text-sm font-medium mb-2 block transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Date Range
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={filters.start_date}
                      onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                      className={`text-sm transition-colors duration-300 ${
                        theme === 'dark'
                          ? 'bg-slate-700 border-slate-600 text-slate-300'
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}
                      min="2021-06-16"
                    />
                    <Input
                      type="date"
                      value={filters.end_date}
                      onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                      className={`text-sm transition-colors duration-300 ${
                        theme === 'dark'
                          ? 'bg-slate-700 border-slate-600 text-slate-300'
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}
                      min="2021-06-16"
                    />
                  </div>
                </div>
              </div>

              {/* Download Section */}
              <div className="flex items-end gap-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex-1">
                  <label className={`text-sm font-medium mb-2 block transition-colors duration-300 ${
                    theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Download Games
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
                    placeholder="1-10000"
                  />
                </div>
                
                <Button 
                  onClick={handleDownload} 
                  disabled={isDownloading}
                  className={`transition-colors duration-300 ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isDownloading ? 'Downloading...' : 'Download'}
                </Button>
                
                <Button 
                  onClick={applyFilters} 
                  disabled={loading}
                  className={`transition-colors duration-300 ${
                    theme === 'dark'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {loading ? 'Applying...' : 'Apply Filters'}
                </Button>
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
            </CardContent>
          )}
        </Card>

        {/* Champions Table */}
        <ChampionsTable 
          champions={champions} 
          loading={loading} 
          theme={theme}
          sortKey={sortKey}
          sortOrder={sortOrder}
          minGamesRequired={minGamesRequired}
          onMinGamesChange={setMinGamesRequired}
          onSort={(key) => {
            if (sortKey === key) {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
            } else {
              setSortKey(key)
              setSortOrder('desc')
            }
          }}
        />
      </div>
    </div>
  )
}

// Composants auxiliaires
function LoadingSkeleton() {
  const { theme } = useTheme()
  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800' 
        : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      <Navbar />
      <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 64px)' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className={`text-xl transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            Loading player data...
          </p>
        </div>
      </div>
    </div>
  )
}

function ErrorPage({ error }: { error: string }) {
  const { theme } = useTheme()
  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800' 
        : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      <Navbar />
      <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 64px)' }}>
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
    </div>
  )
}

function CompactRankCard({ title, rank, theme }: { title: string, rank: string | null, theme: string }) {
  if (!rank) {
    return (
      <div className={`p-4 rounded-lg border transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-slate-700/50 border-slate-600' 
          : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center space-x-3">
          <Image
            src="/images/unranked.webp"
            alt="Unranked"
            width={48}
            height={48}
            className="rounded-lg"
          />
          <div>
            <h3 className={`text-sm font-semibold transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              {title}
            </h3>
            <p className={`text-xs transition-colors duration-300 ${
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
    <div className={`p-4 rounded-lg border transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-slate-700/50 border-slate-600' 
        : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="flex items-center space-x-3">
        <Image
          src={`/images/${tier}.webp`}
          alt={rankText}
          width={48}
          height={48}
          className="rounded-lg"
        />
        <div>
          <h3 className={`text-sm font-semibold transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            {title}
          </h3>
          <p className={`text-xs font-medium transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            {rankText} {lp}
          </p>
          <div className={`text-xs font-medium transition-colors duration-300 ${
            parseInt(winrate) >= 50 
              ? (theme === 'dark' ? 'text-green-400' : 'text-green-600')
              : (theme === 'dark' ? 'text-red-400' : 'text-red-600')
          }`}>
            {winrate}% WR
          </div>
        </div>
      </div>
    </div>
  )
}

type SortKey = 'name' | 'games' | 'winrate' | 'kda' | 'kp' | 'dangerousness'

interface ChampionsTableProps {
  champions: Champion[]
  loading: boolean
  theme: string
  sortKey: SortKey
  sortOrder: 'asc' | 'desc'
  minGamesRequired: number
  onMinGamesChange: (value: number) => void
  onSort: (key: SortKey) => void
}

function ChampionsTable({ champions, loading, theme, sortKey, sortOrder, minGamesRequired, onMinGamesChange, onSort }: ChampionsTableProps) {
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

  const SortableHeader = ({ column, label }: { column: SortKey, label: string }) => (
    <TableHead 
      className={`cursor-pointer transition-colors duration-300 ${
        theme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'
      }`}
      onClick={() => onSort(column)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        {sortKey === column ? (
          sortOrder === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronsUpDown className="w-4 h-4 opacity-40" />
        )}
      </div>
    </TableHead>
  )

  const sortedChampions = [...champions]
    .filter(champ => champ.nombre_de_parties >= minGamesRequired)
    .sort((a, b) => {
      let compareValue = 0
      
      switch (sortKey) {
        case 'name':
          compareValue = a.nom.localeCompare(b.nom)
          break
        case 'games':
          compareValue = a.nombre_de_parties - b.nombre_de_parties
          break
        case 'winrate':
          compareValue = a.winrate - b.winrate
          break
        case 'kda':
          compareValue = a.kda - b.kda
          break
        case 'kp':
          compareValue = a.kill_participation - b.kill_participation
          break
        case 'dangerousness':
          compareValue = a.dangerousness - b.dangerousness
          break
      }
      
      return sortOrder === 'desc' ? -compareValue : compareValue
    })

  return (
    <Card className={`shadow-lg transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-slate-800/50 border-blue-600/20' 
        : 'bg-white border-slate-200'
    }`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-6">
          <div>
            <CardTitle className={`transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              Champion Performance
            </CardTitle>
            <CardDescription className={`transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Click on column headers to sort
            </CardDescription>
          </div>
          
          {/* Compact Min Games Slider */}
          <div className="flex items-center gap-4">
            <div className="w-48">
              <label className={`text-xs font-medium mb-1 block transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Min games: <span className={`font-bold transition-colors duration-300 ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`}>{minGamesRequired}</span>
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={minGamesRequired}
                onChange={(e) => onMinGamesChange(parseInt(e.target.value))}
                className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer transition-colors duration-300 ${
                  theme === 'dark'
                    ? 'bg-slate-700 accent-blue-600'
                    : 'bg-slate-200 accent-blue-600'
                }`}
                style={{
                  background: theme === 'dark' 
                    ? `linear-gradient(to right, #2563eb 0%, #2563eb ${(minGamesRequired - 1) / 50 * 100}%, #334155 ${(minGamesRequired - 1) / 50 * 100}%, #334155 100%)`
                    : `linear-gradient(to right, #2563eb 0%, #2563eb ${(minGamesRequired - 1) / 50 * 100}%, #e2e8f0 ${(minGamesRequired - 1) / 50 * 100}%, #e2e8f0 100%)`
                }}
              />
            </div>
            <div className={`text-center px-4 py-2 rounded-lg transition-colors duration-300 ${
              theme === 'dark' 
                ? 'bg-slate-700/50 border border-slate-600' 
                : 'bg-slate-50 border border-slate-200'
            }`}>
              <div className={`text-lg font-bold transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                {sortedChampions.length}
              </div>
              <div className={`text-xs font-medium transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Champs
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className={`transition-colors duration-300 ${
              theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
            }`}>
              <SortableHeader column="name" label="Champion" />
              <SortableHeader column="games" label="Games" />
              <SortableHeader column="winrate" label="Winrate" />
              <SortableHeader column="kda" label="KDA" />
              <SortableHeader column="kp" label="KP" />
              <SortableHeader column="dangerousness" label="Dangerousness" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedChampions.map((champion) => (
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
                      className={`font-medium ${
                        champion.dangerousness >= 65 
                          ? (theme === 'dark' ? 'bg-green-600/20 text-green-400 border-green-500' : 'bg-green-100 text-green-700 border-green-300')
                          : champion.dangerousness >= 25
                            ? (theme === 'dark' ? 'bg-yellow-600/20 text-yellow-400 border-yellow-500' : 'bg-yellow-100 text-yellow-700 border-yellow-300')
                            : (theme === 'dark' ? 'bg-red-600/20 text-red-400 border-red-500' : 'bg-red-100 text-red-700 border-red-300')
                      } border transition-colors duration-300`}
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
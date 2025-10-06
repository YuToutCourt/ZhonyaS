'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2 } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

interface Player {
  id: number
  name: string
  tag: string
  soloq?: string
  flexq?: string
}

interface PlayerSearchProps {
  onPlayerSelect: (player: Player, position: string) => void
  onClose: () => void
}

export function PlayerSearch({ onPlayerSelect, onClose }: PlayerSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Player[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<string>('')
  const { theme } = useTheme()

  const POSITIONS = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'] as const

  // Fonction pour récupérer l'ID du joueur depuis la base de données
  const getPlayerIdFromDatabase = async (name: string, tag: string) => {
    try {
      const response = await fetch('/api/player-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, tag })
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.player_id
      }
      return null
    } catch (error) {
      console.error('Error getting player ID:', error)
      return null
    }
  }

  // Recherche avec debounce
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (query: string) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(async () => {
          if (query.length >= 3 && query.includes('#')) {
            await performSearch(query)
          } else {
            setSearchResults([])
          }
        }, 500)
      }
    })(),
    []
  )

  useEffect(() => {
    debouncedSearch(searchQuery)
  }, [searchQuery, debouncedSearch])

  const performSearch = async (query: string) => {
    setIsSearching(true)
    try {
      const [name, tag] = query.split('#')
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: query })
      })

      if (response.ok) {
        const data = await response.json()
        // Récupérer l'ID réel du joueur depuis la base de données
        const playerId = await getPlayerIdFromDatabase(data.player.name, data.player.tag)
        setSearchResults([{
          id: playerId,
          name: data.player.name,
          tag: data.player.tag,
          soloq: data.player.soloq,
          flexq: data.player.flexq
        }])
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Error searching player:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handlePlayerSelect = (player: Player) => {
    if (selectedPosition) {
      onPlayerSelect(player, selectedPosition)
      setSearchQuery('')
      setSearchResults([])
      setSelectedPosition('')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <div className="flex-1">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un joueur (nom#tag)"
            className={`transition-colors duration-300 ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-600 text-white placeholder:text-slate-400'
                : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-500'
            }`}
          />
        </div>
        {isSearching && <Loader2 className="w-4 h-4 animate-spin" />}
      </div>

      {/* Sélection de position */}
      <div className="flex flex-wrap gap-2">
        {POSITIONS.map((position) => (
          <Button
            key={position}
            variant={selectedPosition === position ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedPosition(position)}
            className={`transition-colors duration-300 ${
              selectedPosition === position
                ? 'bg-blue-600 text-white'
                : theme === 'dark'
                  ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {position}
          </Button>
        ))}
      </div>

      {/* Résultats de recherche */}
      {searchResults.length > 0 && (
        <Card className={`transition-colors duration-300 ${
          theme === 'dark' 
            ? 'bg-slate-800/50 border-slate-700' 
            : 'bg-slate-50 border-slate-200'
        }`}>
          <CardContent className="p-4">
            <div className="space-y-3">
              {searchResults.map((player) => (
                <div 
                  key={player.id} 
                  className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  onClick={() => handlePlayerSelect(player)}
                >
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className={`font-medium transition-colors duration-300 ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>
                        {player.name}#{player.tag}
                      </p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className={`transition-colors duration-300 ${
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          SoloQ: {player.soloq || 'N/A'}
                        </span>
                        <span className={`transition-colors duration-300 ${
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          Flex: {player.flexq || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedPosition && (
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        {selectedPosition}
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      disabled={!selectedPosition}
                      className={`transition-colors duration-300 ${
                        theme === 'dark'
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      Ajouter
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {searchQuery.length > 0 && searchQuery.length < 3 && (
        <p className={`text-sm transition-colors duration-300 ${
          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
        }`}>
          Tapez au moins 3 caractères pour rechercher
        </p>
      )}

      {searchQuery.length >= 3 && !searchQuery.includes('#') && (
        <p className={`text-sm transition-colors duration-300 ${
          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
        }`}>
          Incluez le tag du joueur (ex: Nom#Tag)
        </p>
      )}
    </div>
  )
}

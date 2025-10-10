'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Save, X, Crown } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { PositionIcon } from './PositionIcon'
import { OpggImport } from './OpggImport'

interface Player {
  id: number
  name: string
  tag: string
  soloq?: string
  flexq?: string
}

interface TeamPlayer {
  id?: number
  team_id?: number
  position: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'
  player_id: number
  is_sub: boolean
  player_name?: string
  player_tag?: string
}

interface Team {
  id: number
  team_name: string
  user_id: number
  created_at: string
  updated_at: string
  players?: TeamPlayer[]
}

const POSITIONS = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'] as const
const POSITION_COLORS = {
  TOP: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  JUNGLE: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  MID: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  ADC: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  SUPPORT: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
}

interface EditTeamDialogProps {
  team: any
  onClose: () => void
  onTeamUpdated: (team: any) => void
}

export function EditTeamDialog({ team, onClose, onTeamUpdated }: EditTeamDialogProps) {
  const [teamName, setTeamName] = useState(team.team_name)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Player[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>(team.players || [])
  const { theme } = useTheme()

  const handleOpggImport = (players: any[]) => {
    // Remplacer tous les joueurs par ceux importés depuis OP.GG
    const importedPlayers: TeamPlayer[] = players.map(player => ({
      position: player.position as 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT',
      player_id: player.id,
      is_sub: false,
      player_name: player.name,
      player_tag: player.tag
    }))
    setTeamPlayers(importedPlayers)
  }

  const handleSearch = async () => {
    if (!searchQuery || !searchQuery.includes('#')) return

    setIsSearching(true)
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: searchQuery })
      })

      if (response.ok) {
        const data = await response.json()
        setSearchResults([{
          id: data.player.id,
          name: data.player.name,
          tag: data.player.tag,
          soloq: data.player.soloq,
          flexq: data.player.flexq
        }])
      }
    } catch (error) {
      console.error('Error searching player:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const addPlayerToTeam = (player: Player, position: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT') => {
    // Remove existing player in this position
    const updatedPlayers = teamPlayers.filter(p => p.position !== position)
    
    // Add new player
    updatedPlayers.push({
      position,
      player_id: player.id,
      is_sub: false,
      player_name: player.name,
      player_tag: player.tag
    })

    setTeamPlayers(updatedPlayers)
    setSearchQuery('')
    setSearchResults([])
  }

  const removePlayerFromPosition = (position: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT') => {
    setTeamPlayers(teamPlayers.filter(p => p.position !== position))
  }

  const toggleSubStatus = (position: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT') => {
    setTeamPlayers(teamPlayers.map(p => 
      p.position === position ? { ...p, is_sub: !p.is_sub } : p
    ))
  }

  const handleUpdateTeam = async () => {
    if (!teamName.trim()) return

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`/api/teams/${team.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          team_name: teamName,
          players: teamPlayers
        })
      })

      if (response.ok) {
        const updatedTeam = await response.json()
        onTeamUpdated(updatedTeam.team)
        onClose()
      }
    } catch (error) {
      console.error('Error updating team:', error)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className={`max-w-[65vw] w-full max-h-[65vh] overflow-y-auto transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-slate-900 border-slate-700' 
          : 'bg-white border-slate-200'
      }`}>
        <DialogHeader>
          <DialogTitle className={`text-2xl font-bold transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            Modifier l'équipe
          </DialogTitle>
          <DialogDescription className={`text-lg transition-colors duration-300 ${
            theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Mettez à jour la composition de votre équipe
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Team Name */}
          <div className="space-y-2">
            <Label className={`text-sm font-medium transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Nom de l'équipe
            </Label>
            <Input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Entrez le nom de votre équipe"
              className={`transition-colors duration-300 ${
                theme === 'dark'
                  ? 'bg-slate-800 border-slate-600 text-white placeholder:text-slate-400'
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-500'
              }`}
            />
          </div>

          {/* OP.GG Import */}
          <OpggImport onPlayersImported={handleOpggImport} />

          {/* Separator */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className={`w-full border-t transition-colors duration-300 ${
                theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
              }`} />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className={`px-2 transition-colors duration-300 ${
                theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-500'
              }`}>
                Ou recherchez individuellement
              </span>
            </div>
          </div>

          {/* Player Search */}
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
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.includes('#')}
                className={`transition-colors duration-300 ${
                  theme === 'dark'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <Card className={`transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'bg-slate-800/50 border-slate-700' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <CardHeader>
                  <CardTitle className={`text-lg transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    Résultats de recherche
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {searchResults.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className={`font-medium transition-colors duration-300 ${
                              theme === 'dark' ? 'text-white' : 'text-slate-900'
                            }`}>
                              {player.name}#{player.tag}
                            </p>
                            <p className={`text-sm transition-colors duration-300 ${
                              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                            }`}>
                              SoloQ: {player.soloq || 'N/A'} | Flex: {player.flexq || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Select onValueChange={(position) => addPlayerToTeam(player, position as any)}>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Position" />
                            </SelectTrigger>
                            <SelectContent>
                              {POSITIONS.map((position) => (
                                <SelectItem key={position} value={position}>
                                  {position}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Team Composition */}
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              Composition de l'équipe
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {POSITIONS.map((position) => {
                const player = teamPlayers.find(p => p.position === position)
                return (
                  <Card key={position} className={`transition-colors duration-300 ${
                    theme === 'dark' 
                      ? 'bg-slate-800/50 border-slate-700' 
                      : 'bg-white border-slate-200'
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <PositionIcon position={position} size="sm" />
                          <Badge className={POSITION_COLORS[position]}>
                            {position}
                          </Badge>
                        </div>
                        {player && (
                          <div className="flex items-center space-x-2">
                            {/* <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSubStatus(position)}
                              className={`transition-colors duration-300 ${
                                player.is_sub 
                                  ? 'text-yellow-600 hover:text-yellow-700' 
                                  : 'text-slate-400 hover:text-yellow-600'
                              }`}
                            >
                              <Crown className="w-4 h-4" />
                            </Button> */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removePlayerFromPosition(position)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {player ? (
                        <div className="space-y-2">
                          <p className={`font-medium transition-colors duration-300 truncate ${
                            theme === 'dark' ? 'text-white' : 'text-slate-900'
                          }`} title={`${player.player_name}#${player.player_tag}`}>
                            {player.player_name}#{player.player_tag}
                          </p>
                          {player.is_sub && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                              Remplaçant
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <p className={`text-sm transition-colors duration-300 ${
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          Aucun joueur assigné
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className={`transition-colors duration-300 ${
                theme === 'dark'
                  ? 'border-slate-600 text-slate-300 hover:bg-slate-800'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpdateTeam}
              disabled={!teamName.trim()}
              className={`transition-colors duration-300 ${
                theme === 'dark'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

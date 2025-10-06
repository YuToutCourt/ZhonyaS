'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Trash2, Edit, Crown } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { CreateTeamDialog } from './CreateTeamDialog'
import { EditTeamDialog } from './EditTeamDialog'

interface Team {
  id: number
  team_name: string
  user_id: number
  created_at: string
  updated_at: string
  players?: TeamPlayer[]
}

interface TeamPlayer {
  id: number
  team_id: number
  player_id: number
  position: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'
  is_sub: boolean
  player_name?: string
  player_tag?: string
}

const POSITION_COLORS = {
  TOP: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  JUNGLE: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  MID: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  ADC: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  SUPPORT: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
}

export function TeamManagement() {
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const { theme } = useTheme()

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('/api/teams', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTeams(data.teams || [])
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTeam = async (teamId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette équipe ?')) return

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setTeams(teams.filter(team => team.id !== teamId))
      }
    } catch (error) {
      console.error('Error deleting team:', error)
    }
  }

  const handleTeamCreated = (newTeam: Team) => {
    setTeams([...teams, newTeam])
    setShowCreateDialog(false)
  }

  const handleTeamUpdated = (updatedTeam: Team) => {
    setTeams(teams.map(team => team.id === updatedTeam.id ? updatedTeam : team))
    setEditingTeam(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-3xl font-bold transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            Mes Équipes
          </h2>
          <p className={`text-lg transition-colors duration-300 ${
            theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Gérez vos équipes et analysez les performances
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className={`transition-colors duration-300 ${
            theme === 'dark'
              ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <Plus className="w-4 h-4 mr-2" />
          Créer une équipe
        </Button>
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <Card className={`transition-colors duration-300 ${
          theme === 'dark' 
            ? 'bg-slate-800/50 border-slate-700' 
            : 'bg-white border-slate-200'
        }`}>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className={`w-16 h-16 mb-4 transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-300'
            }`} />
            <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              Aucune équipe créée
            </h3>
            <p className={`text-center mb-6 transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Créez votre première équipe pour commencer à analyser les performances de vos joueurs.
            </p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className={`transition-colors duration-300 ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer ma première équipe
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card key={team.id} className={`transition-colors duration-300 ${
              theme === 'dark' 
                ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800/70' 
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className={`transition-colors duration-300 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    {team.team_name}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTeam(team)}
                      className={`transition-colors duration-300 ${
                        theme === 'dark' 
                          ? 'text-slate-400 hover:text-slate-300 hover:bg-slate-700' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTeam(team.id)}
                      className={`transition-colors duration-300 ${
                        theme === 'dark' 
                          ? 'text-slate-400 hover:text-red-400 hover:bg-slate-700' 
                          : 'text-slate-600 hover:text-red-600 hover:bg-slate-100'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription className={`transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Créée le {new Date(team.created_at).toLocaleDateString('fr-FR')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Users className={`w-4 h-4 transition-colors duration-300 ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`} />
                    <span className={`text-sm font-medium transition-colors duration-300 ${
                      theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      {team.players?.length || 0} joueur(s)
                    </span>
                  </div>
                  
                  {/* Players by position */}
                  <div className="space-y-2">
                    {['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'].map((position) => {
                      const player = team.players?.find(p => p.position === position)
                      return (
                        <div key={position} className="flex items-center justify-between">
                          <Badge className={POSITION_COLORS[position as keyof typeof POSITION_COLORS]}>
                            {position}
                          </Badge>
                          <span className={`text-sm transition-colors duration-300 ${
                            theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                          }`}>
                            {player ? (
                              <span className="flex items-center space-x-1">
                                {player.is_sub && <Crown className="w-3 h-3 text-yellow-500" />}
                                <span className="truncate" title={`${player.player_name}#${player.player_tag}`}>{player.player_name}#{player.player_tag}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400">Vide</span>
                            )}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateTeamDialog
          onClose={() => setShowCreateDialog(false)}
          onTeamCreated={handleTeamCreated}
        />
      )}

      {editingTeam && (
        <EditTeamDialog
          team={editingTeam}
          onClose={() => setEditingTeam(null)}
          onTeamUpdated={handleTeamUpdated}
        />
      )}
    </div>
  )
}

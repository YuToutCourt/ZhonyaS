'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Trash2, Edit, Crown, Eye, Swords } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useRouter } from 'next/navigation'
import { CreateTeamDialog } from './CreateTeamDialog'
import { EditTeamDialog } from './EditTeamDialog'
import { CreateMatchupDialog } from './CreateMatchupDialog'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { PositionIcon } from './PositionIcon'

interface Team {
  id: number
  team_name: string
  user_id: number
  created_at: string
  updated_at: string
  players?: TeamPlayer[]
}

interface TeamPlayer {
  id?: number
  team_id?: number
  player_id: number
  position: 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'
  is_sub: boolean
  player_name?: string
  player_tag?: string
}

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
  const [matchups, setMatchups] = useState<Matchup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showCreateMatchupDialog, setShowCreateMatchupDialog] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null)
  const [deletingMatchup, setDeletingMatchup] = useState<Matchup | null>(null)
  const { theme } = useTheme()
  const router = useRouter()

  useEffect(() => {
    fetchTeams()
    fetchMatchups()
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

  const fetchMatchups = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('/api/matchups', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setMatchups(data.matchups || [])
      }
    } catch (error) {
      console.error('Error fetching matchups:', error)
    }
  }

  const handleDeleteTeam = async () => {
    if (!deletingTeam) return

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`/api/teams/${deletingTeam.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setTeams(teams.filter(team => team.id !== deletingTeam.id))
        setDeletingTeam(null)
      }
    } catch (error) {
      console.error('Error deleting team:', error)
      throw error
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

  const handleMatchupCreated = (newMatchup: Matchup) => {
    setMatchups([newMatchup, ...matchups])
    setShowCreateMatchupDialog(false)
  }

  const handleDeleteMatchup = async () => {
    if (!deletingMatchup) return

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`/api/matchups/${deletingMatchup.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setMatchups(matchups.filter(matchup => matchup.id !== deletingMatchup.id))
        setDeletingMatchup(null)
      }
    } catch (error) {
      console.error('Error deleting matchup:', error)
      throw error
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
                      onClick={() => router.push(`/teams/${team.id}`)}
                      className={`transition-colors duration-300 ${
                        theme === 'dark' 
                          ? 'text-slate-400 hover:text-slate-300 hover:bg-slate-700' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
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
                      onClick={() => setDeletingTeam(team)}
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
                          <div className="flex items-center space-x-2">
                            <PositionIcon position={position as any} />
                            <Badge className={POSITION_COLORS[position as keyof typeof POSITION_COLORS]}>
                              {position}
                            </Badge>
                          </div>
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

      {/* Matchups Section */}
      <div className="mt-12 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-3xl font-bold transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              Mes Matchups
            </h2>
            <p className={`text-lg transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Affrontements entre vos équipes
            </p>
          </div>
          <Button
            onClick={() => setShowCreateMatchupDialog(true)}
            disabled={teams.length < 2}
            className={`transition-colors duration-300 ${
              theme === 'dark'
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            <Swords className="w-4 h-4 mr-2" />
            Créer un Match
          </Button>
        </div>

        {teams.length < 2 ? (
          <Card className={`transition-colors duration-300 ${
            theme === 'dark' 
              ? 'bg-slate-800/50 border-slate-700' 
              : 'bg-white border-slate-200'
          }`}>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Swords className={`w-16 h-16 mb-4 transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-300'
              }`} />
              <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                Pas assez d'équipes
              </h3>
              <p className={`text-center transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Vous avez besoin d'au moins 2 équipes pour créer un matchup.
              </p>
            </CardContent>
          </Card>
        ) : matchups.length === 0 ? (
          <Card className={`transition-colors duration-300 ${
            theme === 'dark' 
              ? 'bg-slate-800/50 border-slate-700' 
              : 'bg-white border-slate-200'
          }`}>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Swords className={`w-16 h-16 mb-4 transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-300'
              }`} />
              <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                Aucun matchup créé
              </h3>
              <p className={`text-center mb-6 transition-colors duration-300 ${
                theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Créez votre premier matchup pour comparer vos équipes.
              </p>
              <Button
                onClick={() => setShowCreateMatchupDialog(true)}
                className={`transition-colors duration-300 ${
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                <Swords className="w-4 h-4 mr-2" />
                Créer mon premier matchup
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matchups.filter(m => m && m.matchup_name).map((matchup) => (
              <Card key={matchup.id} className={`transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800/70' 
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className={`transition-colors duration-300 ${
                      theme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      {matchup.matchup_name}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/matchup/${matchup.id}`)}
                        className={`transition-colors duration-300 ${
                          theme === 'dark' 
                            ? 'text-slate-400 hover:text-slate-300 hover:bg-slate-700' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingMatchup(matchup)}
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
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`text-lg font-semibold transition-colors duration-300 ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>
                        {matchup.team1_name}
                      </div>
                      <div className={`text-2xl font-bold transition-colors duration-300 ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        VS
                      </div>
                      <div className={`text-lg font-semibold transition-colors duration-300 ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>
                        {matchup.team2_name}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge className={getStatusBadgeColor(matchup.status)}>
                        {matchup.status}
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => router.push(`/matchup/${matchup.id}`)}
                        className={`transition-colors duration-300 ${
                          theme === 'dark'
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        Voir le face-à-face
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showCreateMatchupDialog && (
        <CreateMatchupDialog
          teams={teams}
          onClose={() => setShowCreateMatchupDialog(false)}
          onMatchupCreated={handleMatchupCreated}
        />
      )}

      {/* Delete Team Confirmation Dialog */}
      {deletingTeam && (
        <DeleteConfirmDialog
          open={!!deletingTeam}
          onClose={() => setDeletingTeam(null)}
          onConfirm={handleDeleteTeam}
          title="Supprimer l'équipe ?"
          description="Cette action est irréversible. Tous les joueurs de cette équipe seront retirés et l'équipe sera définitivement supprimée."
          itemName={deletingTeam.team_name}
          type="team"
        />
      )}

      {/* Delete Matchup Confirmation Dialog */}
      {deletingMatchup && (
        <DeleteConfirmDialog
          open={!!deletingMatchup}
          onClose={() => setDeletingMatchup(null)}
          onConfirm={handleDeleteMatchup}
          title="Supprimer le matchup ?"
          description="Cette action est irréversible. Le matchup sera définitivement supprimé."
          itemName={deletingMatchup.matchup_name}
          type="matchup"
        />
      )}
    </div>
  )
}


'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTheme } from '@/contexts/ThemeContext'
import { X, Swords } from 'lucide-react'

interface Team {
  id: number
  team_name: string
}

interface CreateMatchupDialogProps {
  teams: Team[]
  onClose: () => void
  onMatchupCreated: (matchup: any) => void
}

export function CreateMatchupDialog({ teams, onClose, onMatchupCreated }: CreateMatchupDialogProps) {
  const [matchupName, setMatchupName] = useState('')
  const [team1Id, setTeam1Id] = useState<number | null>(null)
  const [team2Id, setTeam2Id] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { theme } = useTheme()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!matchupName.trim()) {
      setError('Le nom du matchup est requis')
      return
    }

    if (!team1Id || !team2Id) {
      setError('Veuillez sélectionner les deux équipes')
      return
    }

    if (team1Id === team2Id) {
      setError('Les deux équipes doivent être différentes')
      return
    }

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('/api/matchups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          matchup_name: matchupName,
          team1_id: team1Id,
          team2_id: team2Id,
          status: 'UPCOMING'
        })
      })

      const data = await response.json()

      if (response.ok) {
        onMatchupCreated(data.matchup)
      } else {
        setError(data.error || 'Erreur lors de la création du matchup')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-[500px] transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-slate-200'
      }`}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className={`text-2xl font-bold flex items-center space-x-2 transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              <Swords className="w-6 h-6" />
              <span>Créer un Matchup</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className={`transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'text-slate-400 hover:text-slate-300 hover:bg-slate-700' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <DialogDescription className={`transition-colors duration-300 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Créez un affrontement entre deux de vos équipes
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="matchupName" className={`transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Nom du matchup *
            </Label>
            <Input
              id="matchupName"
              placeholder="Ex: Finale du tournoi 2025"
              value={matchupName}
              onChange={(e) => setMatchupName(e.target.value)}
              className={`transition-colors duration-300 ${
                theme === 'dark'
                  ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-400'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team1" className={`transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Équipe 1 *
            </Label>
            <Select
              value={team1Id?.toString()}
              onValueChange={(value) => setTeam1Id(parseInt(value))}
            >
              <SelectTrigger className={`transition-colors duration-300 ${
                theme === 'dark'
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}>
                <SelectValue placeholder="Sélectionnez la première équipe" />
              </SelectTrigger>
              <SelectContent className={`transition-colors duration-300 ${
                theme === 'dark'
                  ? 'bg-slate-700 border-slate-600'
                  : 'bg-white border-slate-300'
              }`}>
                {teams.map((team) => (
                  <SelectItem 
                    key={team.id} 
                    value={team.id.toString()}
                    className={`transition-colors duration-300 ${
                      theme === 'dark'
                        ? 'text-white hover:bg-slate-600'
                        : 'text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {team.team_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-center py-2">
            <div className={`text-2xl font-bold transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>
              VS
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="team2" className={`transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Équipe 2 *
            </Label>
            <Select
              value={team2Id?.toString()}
              onValueChange={(value) => setTeam2Id(parseInt(value))}
            >
              <SelectTrigger className={`transition-colors duration-300 ${
                theme === 'dark'
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}>
                <SelectValue placeholder="Sélectionnez la deuxième équipe" />
              </SelectTrigger>
              <SelectContent className={`transition-colors duration-300 ${
                theme === 'dark'
                  ? 'bg-slate-700 border-slate-600'
                  : 'bg-white border-slate-300'
              }`}>
                {teams.map((team) => (
                  <SelectItem 
                    key={team.id} 
                    value={team.id.toString()}
                    className={`transition-colors duration-300 ${
                      theme === 'dark'
                        ? 'text-white hover:bg-slate-600'
                        : 'text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {team.team_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className={`transition-colors duration-300 ${
                theme === 'dark'
                  ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`transition-colors duration-300 ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isSubmitting ? 'Création...' : 'Créer le matchup'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


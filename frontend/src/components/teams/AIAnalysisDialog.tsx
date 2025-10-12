'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Brain, Users, Swords, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { apiClient } from '@/lib/api'
import { useTheme } from '@/contexts/ThemeContext'
import Image from 'next/image'

interface AIAnalysisDialogProps {
  isOpen: boolean
  onClose: () => void
  matchupId: number
  selectedPosition: string
  team1Name: string
  team2Name: string
}

type AnalysisType = 'player' | 'team' | null
type TeamSelection = 1 | 2

const POSITION_IMAGES = {
  TOP: '/images/positions/top.png',
  JUNGLE: '/images/positions/jungle.png',
  MID: '/images/positions/mid.png',
  ADC: '/images/positions/bot.png',
  SUPPORT: '/images/positions/supp.png'
}

export function AIAnalysisDialog({
  isOpen,
  onClose,
  matchupId,
  selectedPosition,
  team1Name,
  team2Name
}: AIAnalysisDialogProps) {
  const { theme } = useTheme()
  const [analysisType, setAnalysisType] = useState<AnalysisType>(null)
  const [selectedTeam, setSelectedTeam] = useState<TeamSelection>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    setIsLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        setError('Token non trouvé. Veuillez vous reconnecter.')
        setIsLoading(false)
        return
      }

      if (analysisType === 'player') {
        const result = await apiClient.analyzePlayerMatchup(
          matchupId,
          selectedPosition,
          token
        )
        setAnalysis(result.analysis)
      } else if (analysisType === 'team') {
        const result = await apiClient.analyzeTeamDraft(
          matchupId,
          selectedTeam,
          token
        )
        setAnalysis(result.analysis)
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'analyse')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setAnalysisType(null)
    setAnalysis(null)
    setError(null)
    setSelectedTeam(1)
    onClose()
  }

  const formatAnalysis = (text: string) => {
    // Split the analysis into sections and format it nicely
    const lines = text.split('\n')
    return lines.map((line, index) => {
      // Bold headers (lines that end with :)
      if (line.trim().match(/^[*#]+\s*.+[*]*$/)) {
        return (
          <h3 key={index} className={`font-bold text-lg mt-4 mb-2 ${
            theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
          }`}>
            {line.replace(/[*#]/g, '').trim()}
          </h3>
        )
      }
      
      // List items
      if (line.trim().match(/^[-•]\s+/)) {
        return (
          <li key={index} className={`ml-4 mb-1 ${
            theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
          }`}>
            {line.replace(/^[-•]\s+/, '')}
          </li>
        )
      }

      // Numbered items
      if (line.trim().match(/^\d+\.\s+/)) {
        return (
          <li key={index} className={`ml-4 mb-1 list-decimal ${
            theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
          }`}>
            {line.replace(/^\d+\.\s+/, '')}
          </li>
        )
      }
      
      // Regular text
      if (line.trim()) {
        return (
          <p key={index} className={`mb-2 ${
            theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
          }`}>
            {line}
          </p>
        )
      }
      
      return <br key={index} />
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
        theme === 'dark'
          ? 'bg-slate-800 border-slate-700'
          : 'bg-white border-slate-200'
      }`}>
        <DialogHeader>
          <DialogTitle className={`flex items-center space-x-2 text-2xl transition-colors duration-300 ${
            theme === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>
            <Brain className="w-6 h-6" />
            <span>Analyse IA</span>
          </DialogTitle>
          <DialogDescription className={`transition-colors duration-300 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Choisissez le type d'analyse que vous souhaitez effectuer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {!analysisType && !analysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Player Matchup Analysis */}
              <Card
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  theme === 'dark'
                    ? 'bg-slate-700/50 border-slate-600 hover:border-blue-500'
                    : 'bg-slate-50 border-slate-200 hover:border-blue-400'
                }`}
                onClick={() => setAnalysisType('player')}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`p-4 rounded-full transition-colors duration-300 ${
                      theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'
                    }`}>
                      <Swords className={`w-8 h-8 transition-colors duration-300 ${
                        theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className={`font-bold text-lg mb-2 transition-colors duration-300 ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>
                        Analyse de Matchup
                      </h3>
                      <p className={`text-sm transition-colors duration-300 ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        Analyse détaillée du matchup entre deux joueurs d'une position spécifique
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Team Draft Analysis */}
              <Card
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  theme === 'dark'
                    ? 'bg-slate-700/50 border-slate-600 hover:border-purple-500'
                    : 'bg-slate-50 border-slate-200 hover:border-purple-400'
                }`}
                onClick={() => setAnalysisType('team')}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`p-4 rounded-full transition-colors duration-300 ${
                      theme === 'dark' ? 'bg-purple-900/30' : 'bg-purple-100'
                    }`}>
                      <Users className={`w-8 h-8 transition-colors duration-300 ${
                        theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className={`font-bold text-lg mb-2 transition-colors duration-300 ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>
                        Analyse de Draft
                      </h3>
                      <p className={`text-sm transition-colors duration-300 ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        Stratégie de draft complète et recommandations pour une équipe
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {analysisType === 'player' && !analysis && (
            <div className="space-y-4">
              <div>
                <h4 className={`font-semibold mb-3 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  Position sélectionnée
                </h4>
                <div className="flex items-center space-x-3">
                  <Image
                    src={POSITION_IMAGES[selectedPosition as keyof typeof POSITION_IMAGES]}
                    alt={selectedPosition}
                    width={32}
                    height={32}
                    className="w-8 h-8"
                  />
                  <Badge className={`${
                    theme === 'dark'
                      ? 'bg-blue-900/50 text-blue-300'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedPosition}
                  </Badge>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => setAnalysisType(null)}
                  variant="outline"
                  className={`transition-colors duration-300 ${
                    theme === 'dark'
                      ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Retour
                </Button>
                <Button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className={`flex items-center space-x-2 ${
                    theme === 'dark'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyse en cours...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4" />
                      <span>Analyser</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {analysisType === 'team' && !analysis && (
            <div className="space-y-4">
              <div>
                <h4 className={`font-semibold mb-3 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  Quelle équipe souhaitez-vous analyser ?
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <Card
                    className={`cursor-pointer transition-all duration-300 ${
                      selectedTeam === 1
                        ? theme === 'dark'
                          ? 'bg-blue-900/50 border-blue-500'
                          : 'bg-blue-100 border-blue-500'
                        : theme === 'dark'
                          ? 'bg-slate-700/50 border-slate-600 hover:border-blue-400'
                          : 'bg-slate-50 border-slate-200 hover:border-blue-300'
                    }`}
                    onClick={() => setSelectedTeam(1)}
                  >
                    <CardContent className="p-4">
                      <div className="text-center">
                        <h5 className={`font-bold mb-1 transition-colors duration-300 ${
                          theme === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}>
                          {team1Name}
                        </h5>
                        <p className={`text-sm transition-colors duration-300 ${
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          Équipe 1
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className={`cursor-pointer transition-all duration-300 ${
                      selectedTeam === 2
                        ? theme === 'dark'
                          ? 'bg-purple-900/50 border-purple-500'
                          : 'bg-purple-100 border-purple-500'
                        : theme === 'dark'
                          ? 'bg-slate-700/50 border-slate-600 hover:border-purple-400'
                          : 'bg-slate-50 border-slate-200 hover:border-purple-300'
                    }`}
                    onClick={() => setSelectedTeam(2)}
                  >
                    <CardContent className="p-4">
                      <div className="text-center">
                        <h5 className={`font-bold mb-1 transition-colors duration-300 ${
                          theme === 'dark' ? 'text-white' : 'text-slate-900'
                        }`}>
                          {team2Name}
                        </h5>
                        <p className={`text-sm transition-colors duration-300 ${
                          theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                        }`}>
                          Équipe 2
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => setAnalysisType(null)}
                  variant="outline"
                  className={`transition-colors duration-300 ${
                    theme === 'dark'
                      ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Retour
                </Button>
                <Button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className={`flex items-center space-x-2 ${
                    theme === 'dark'
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyse en cours...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4" />
                      <span>Analyser</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className={`p-4 rounded-lg ${
              theme === 'dark'
                ? 'bg-red-900/20 border border-red-800'
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-red-400' : 'text-red-600'
              }`}>
                {error}
              </p>
            </div>
          )}

          {analysis && (
            <div className={`rounded-lg p-6 space-y-3 ${
              theme === 'dark'
                ? 'bg-slate-700/30'
                : 'bg-slate-50'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className={`font-bold text-lg transition-colors duration-300 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  Résultat de l'analyse
                </h4>
                <Button
                  onClick={() => {
                    setAnalysis(null)
                    setAnalysisType(null)
                  }}
                  variant="outline"
                  size="sm"
                  className={`transition-colors duration-300 ${
                    theme === 'dark'
                      ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Nouvelle analyse
                </Button>
              </div>
              <div className="prose prose-sm max-w-none">
                {formatAnalysis(analysis)}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, Shield, Swords, X, Check, Search } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useTheme } from '@/contexts/ThemeContext'
import Image from 'next/image'
import { Navbar } from '@/components/Navbar'

interface Champion {
  id: number
  name: string
  url_image: string
}

export default function DraftPage() {
  const params = useParams()
  const router = useRouter()
  const { theme } = useTheme()
  const sessionId = params.sessionId as string

  const [draftState, setDraftState] = useState<any>(null)
  const [allChampions, setAllChampions] = useState<Champion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [aiLastAction, setAiLastAction] = useState<{champion: string, phase: string} | null>(null)
  const [selectedChampion, setSelectedChampion] = useState<string | null>(null)
  const [isAIThinking, setIsAIThinking] = useState(false)
  const [isDraftComplete, setIsDraftComplete] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchAllChampions()
    fetchDraftState()
  }, [sessionId])

  const fetchAllChampions = async () => {
    try {
      const response = await fetch('/api/champions')
      if (response.ok) {
        const data = await response.json()
        setAllChampions(data.champions)
      }
    } catch (err) {
      console.error('Error fetching champions:', err)
    }
  }

  const fetchDraftState = async (shouldTriggerAI = true) => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return

      const state = await apiClient.getDraftState(sessionId, token)
      setDraftState(state)
      setIsLoading(false)

      // Si c'est le tour de l'IA, la faire jouer après un délai
      if (shouldTriggerAI && state.current_phase && !state.current_phase.is_player_turn && !state.is_complete) {
        console.log('DEBUG: fetchDraftState déclenche l\'IA')
        setTimeout(() => {
          handleAITurn()
        }, 1500) // 1.5 secondes pour que l'utilisateur voie bien l'état
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du draft')
      setIsLoading(false)
    }
  }

  const handleAITurn = async () => {
    // Protection contre les appels multiples
    if (isAIThinking) {
      return
    }

    try {
      const token = localStorage.getItem('access_token')
      if (!token) return

      // Vérifier l'état actuel avant d'appeler l'IA
      const currentState = await apiClient.getDraftState(sessionId, token)
      console.log('DEBUG: État avant appel IA:', {
        hasPhase: !!currentState.current_phase,
        isPlayerTurn: currentState.current_phase?.is_player_turn,
        isComplete: currentState.is_complete,
        side: currentState.current_phase?.side,
        phase: currentState.current_phase?.phase
      })
      if (!currentState.current_phase || currentState.current_phase.is_player_turn || currentState.is_complete) {
        console.log('DEBUG: Annulation de l\'appel IA - ce n\'est pas le tour de l\'IA')
        return
      }
      setIsAIThinking(true)

      const result = await apiClient.aiPlayTurn(sessionId, token)
      
      setDraftState(result)
      
      if (result.ai_action) {
        setAiLastAction(result.ai_action)
      }

      setIsAIThinking(false)

      // Si c'est toujours le tour de l'IA (cas rare), rejouer
      if (result.current_phase && !result.current_phase.is_player_turn && !result.is_complete) {
        setTimeout(() => {
          handleAITurn()
        }, 1500)
      }

      // Le draft est terminé, mais on ne redirige pas automatiquement
      // L'utilisateur peut rester sur la page pour voir les résultats
      if (result.is_complete) {
        setIsDraftComplete(true)
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'action de l\'IA')
      setIsAIThinking(false)
    }
  }

  const handleChampionClick = (championName: string) => {
    if (!draftState?.current_phase?.is_player_turn || isProcessing) return
    setSelectedChampion(championName)
  }

  const handleConfirmAction = async () => {
    if (!selectedChampion || !draftState?.current_phase?.is_player_turn || isProcessing) return

    setIsProcessing(true)
    setError(null)
    setAiLastAction(null)

    try {
      const token = localStorage.getItem('access_token')
      if (!token) return

      const result = await apiClient.draftAction(sessionId, selectedChampion, token)
      
      setDraftState(result)
      setSearchTerm('')
      setSelectedChampion(null)
      setIsProcessing(false)

      // Laisser l'utilisateur voir son choix pendant 1.5 secondes
      if (!result.is_complete && result.current_phase && !result.current_phase.is_player_turn) {
        setTimeout(() => {
          handleAITurn()
        }, 1500)
      }

      if (result.is_complete) {
        setTimeout(() => {
          router.push('/teams')
        }, 5000)
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'action')
      setIsProcessing(false)
    }
  }

  const handleQuitDraft = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (token) {
        await apiClient.cancelDraft(sessionId, token)
      }
    } catch (err) {
      console.error('Error canceling draft:', err)
    }
    router.push('/teams')
  }

  const getChampionStatus = (championName: string): 'available' | 'banned' | 'picked-blue' | 'picked-red' => {
    if (!draftState) return 'available'

    const blueBans = draftState.blue_team?.bans || []
    const redBans = draftState.red_team?.bans || []
    
    if (blueBans.includes(championName) || redBans.includes(championName)) {
      return 'banned'
    }

    const bluePicks = draftState.blue_team?.picks || []
    const redPicks = draftState.red_team?.picks || []

    if (bluePicks.some((p: any) => p.champion === championName)) {
      return 'picked-blue'
    }

    if (redPicks.some((p: any) => p.champion === championName)) {
      return 'picked-red'
    }

    return 'available'
  }

  const getFilteredChampions = () => {
    let filtered = allChampions

    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error && !draftState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/teams')}>
              Retour aux équipes
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!draftState) return null

  const { current_phase, blue_team, red_team, is_complete } = draftState
  const isPlayerTurn = current_phase?.is_player_turn && !is_complete
  const phase = current_phase?.phase

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-slate-100 to-slate-200'
    }`}>
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleQuitDraft}
            className={`transition-colors duration-300 ${
              theme === 'dark'
                ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quitter le draft
          </Button>

          {/* Phase indicator - Improved */}
          <div className={`px-8 py-4 rounded-xl flex items-center space-x-4 transition-all duration-300 ${
            is_complete
              ? theme === 'dark' ? 'bg-green-900/30 border-2 border-green-500' : 'bg-green-50 border-2 border-green-500'
              : isPlayerTurn
                ? theme === 'dark' ? 'bg-gradient-to-r from-green-900/40 to-blue-900/40 border-2 border-green-500' : 'bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-400'
                : theme === 'dark' ? 'bg-gradient-to-r from-orange-900/40 to-red-900/40 border-2 border-orange-500' : 'bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-400'
          } backdrop-blur-sm shadow-2xl`}>
            {is_complete ? (
              <>
                <Check className="w-8 h-8 text-green-500" />
                <span className={`font-bold text-2xl ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Draft terminé !
                </span>
              </>
            ) : isAIThinking ? (
              <>
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                <div>
                  <div className={`font-bold text-xl ${theme === 'dark' ? 'text-purple-300' : 'text-purple-700'}`}>
                    L'IA réfléchit...
                  </div>
                  <p className={`text-sm ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                    Analyse en cours
                  </p>
                </div>
              </>
            ) : (
              <>
                {isPlayerTurn ? (
                  <Shield className="w-8 h-8 text-green-500 animate-pulse" />
                ) : (
                  <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                )}
                <div>
                  <div className={`font-bold text-xl ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    {isPlayerTurn ? '🎮 À VOUS DE JOUER' : '🤖 Tour de l\'IA'}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={`${phase === 'BAN' ? 'bg-red-600' : 'bg-blue-600'} text-base px-3 py-1`}>
                      {phase === 'BAN' ? '🚫 PHASE DE BAN' : '⭐ PHASE DE PICK'}
                    </Badge>
                    {isPlayerTurn && selectedChampion && (
                      <Badge className="bg-yellow-600 text-base px-3 py-1">
                        {selectedChampion} sélectionné
                      </Badge>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            Session: {sessionId.slice(0, 8)}...
          </div>
        </div>

        {/* AI Last Action */}
        {aiLastAction && (
          <div className={`mb-4 p-4 rounded-lg border-l-4 transition-colors duration-300 ${
            theme === 'dark'
              ? 'bg-orange-900/20 border-orange-500'
              : 'bg-orange-50 border-orange-500'
          }`}>
            <p className={`font-medium ${theme === 'dark' ? 'text-orange-300' : 'text-orange-800'}`}>
              L'IA a {aiLastAction.phase === 'BAN' ? 'banni' : 'choisi'} : <strong>{aiLastAction.champion}</strong>
            </p>
          </div>
        )}

        {/* Draft Complete Actions */}
        {isDraftComplete && (
          <div className={`mb-6 p-6 rounded-xl border-2 transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-gradient-to-r from-green-900/30 to-blue-900/30 border-green-500'
              : 'bg-gradient-to-r from-green-50 to-blue-50 border-green-400'
          }`}>
            <div className="text-center">
              <div className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                🎉 Draft terminé avec succès !
              </div>
              <p className={`text-lg mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                Vous pouvez maintenant analyser les résultats ou commencer un nouveau draft.
              </p>
              <div className={`text-sm mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                <p><span className="text-blue-400 font-medium">{blue_team?.name}</span> (Bleu) vs <span className="text-red-400 font-medium">{red_team?.name}</span> (Rouge)</p>
              </div>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button
                  onClick={() => router.push('/teams')}
                  className={`px-6 py-3 transition-colors duration-300 ${
                    theme === 'dark'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour aux équipes
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className={`mb-4 p-4 rounded-lg ${
            theme === 'dark'
              ? 'bg-red-900/20 border border-red-800'
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
              {error}
            </p>
          </div>
        )}

        {/* Main Draft Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Side - Blue Team */}
          <div className="col-span-3">
            <Card className={`transition-colors duration-300 ${
              theme === 'dark'
                ? 'bg-blue-950/30 border-blue-700'
                : 'bg-blue-50 border-blue-200'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-center mb-4">
                  <Shield className="w-5 h-5 mr-2 text-blue-500" />
                  <div className="text-center">
                    <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-blue-300' : 'text-blue-800'}`}>
                      {blue_team.is_player ? 'VOUS' : 'IA'} (Bleu)
                    </h3>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                      {blue_team.name}
                    </p>
                  </div>
                </div>

                {/* Blue Picks */}
                <div className="space-y-2">
                  {blue_team.picks.map((pick: any, idx: number) => (
                    <div key={idx} className={`p-3 rounded-lg flex items-center space-x-3 ${
                      theme === 'dark' ? 'bg-slate-800/70' : 'bg-white/70'
                    }`}>
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                        theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                      }`}>
                        {idx + 1}
                      </div>
                      <Image
                        src={`/images/${pick.champion}.png`}
                        alt={pick.champion}
                        width={40}
                        height={40}
                        className="rounded"
                        onError={(e) => {
                          e.currentTarget.src = '/images/logo.png'
                        }}
                      />
                      <div className="flex-1">
                        <div className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {pick.champion}
                        </div>
                      </div>
                    </div>
                  ))}
                  {[...Array(5 - blue_team.picks.length)].map((_, idx) => (
                    <div key={`empty-${idx}`} className={`p-3 rounded-lg border-2 border-dashed ${
                      theme === 'dark' ? 'border-slate-700 bg-slate-900/30' : 'border-slate-300 bg-slate-100/50'
                    }`}>
                      <div className="w-10 h-10 bg-slate-700/30 rounded"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center - Champion Grid */}
          <div className="col-span-6">
            {/* Banned Champions - Separated by Team */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Blue Team Bans */}
              <Card className={`transition-colors duration-300 ${
                theme === 'dark' ? 'bg-blue-950/30 border-blue-700' : 'bg-blue-50 border-blue-200'
              }`}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-center mb-2">
                    <Shield className="w-4 h-4 mr-2 text-blue-500" />
                    <div className="text-center">
                      <h4 className={`font-semibold text-sm ${
                        theme === 'dark' ? 'text-blue-300' : 'text-blue-800'
                      }`}>
                        Bans Bleu ({blue_team?.bans?.length || 0}/5)
                      </h4>
                      <p className={`text-xs ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                        {blue_team?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-center min-h-[52px]">
                    {blue_team?.bans?.map((champName: string, index: number) => {
                        const champ = allChampions.find(c => c.name === champName)
                        return (
                          <div key={`blue-ban-${index}-${champName}`} className="relative">
                            <Image
                              src={champ ? `/images/${champ.name}.png` : '/images/logo.png'}
                              alt={champName}
                              width={48}
                              height={48}
                              className="rounded opacity-40 grayscale"
                              onError={(e) => {
                                e.currentTarget.src = '/images/logo.png'
                              }}
                            />
                            <X className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-red-600" />
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>

              {/* Red Team Bans */}
              <Card className={`transition-colors duration-300 ${
                theme === 'dark' ? 'bg-red-950/30 border-red-700' : 'bg-red-50 border-red-200'
              }`}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-center mb-2">
                    <Shield className="w-4 h-4 mr-2 text-red-500" />
                    <div className="text-center">
                      <h4 className={`font-semibold text-sm ${
                        theme === 'dark' ? 'text-red-300' : 'text-red-800'
                      }`}>
                        Bans Rouge ({red_team?.bans?.length || 0}/5)
                      </h4>
                      <p className={`text-xs ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                        {red_team?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-center min-h-[52px]">
                    {red_team?.bans?.map((champName: string, index: number) => {
                        const champ = allChampions.find(c => c.name === champName)
                        return (
                          <div key={`red-ban-${index}-${champName}`} className="relative">
                            <Image
                              src={champ ? `/images/${champ.name}.png` : '/images/logo.png'}
                              alt={champName}
                              width={48}
                              height={48}
                              className="rounded opacity-40 grayscale"
                              onError={(e) => {
                                e.currentTarget.src = '/images/logo.png'
                              }}
                            />
                            <X className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-red-600" />
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Confirm Button */}
            {isPlayerTurn && (
              <div className="mb-4 space-y-3">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`} />
                  <Input
                    type="text"
                    placeholder="Rechercher un champion..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-10 py-6 text-lg ${
                      theme === 'dark'
                        ? 'bg-slate-800 border-slate-600 text-white'
                        : 'bg-white border-slate-300'
                    }`}
                  />
                </div>

                {/* Confirm Button */}
                {selectedChampion && (
                  <Button
                    onClick={handleConfirmAction}
                    disabled={isProcessing}
                    className={`w-full py-6 text-xl font-bold transition-all duration-300 ${
                      phase === 'BAN'
                        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                        En cours...
                      </>
                    ) : (
                      <>
                        {phase === 'BAN' ? (
                          <>
                            <X className="w-6 h-6 mr-2" />
                            BANNIR {selectedChampion}
                          </>
                        ) : (
                          <>
                            <Check className="w-6 h-6 mr-2" />
                            CHOISIR {selectedChampion}
                          </>
                        )}
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Champion Grid */}
            <Card className={`transition-colors duration-300 ${
              theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <CardContent className="p-4">
                <div className="grid grid-cols-8 gap-2 max-h-[600px] overflow-y-auto">
                  {getFilteredChampions().map((champion) => {
                    const status = getChampionStatus(champion.name)
                    const isAvailable = status === 'available'
                    const isBanned = status === 'banned'
                    const isPickedBlue = status === 'picked-blue'
                    const isPickedRed = status === 'picked-red'

                    return (
                      <button
                        key={champion.id}
                        onClick={() => isAvailable && isPlayerTurn ? handleChampionClick(champion.name) : null}
                        disabled={!isAvailable || !isPlayerTurn || isProcessing}
                        className={`relative group transition-all duration-200 ${
                          isAvailable && isPlayerTurn
                            ? 'hover:scale-110 hover:z-10 cursor-pointer'
                            : 'cursor-not-allowed'
                        } ${
                          selectedChampion === champion.name
                            ? 'scale-110 z-20 ring-4 ring-yellow-400'
                            : ''
                        }`}
                      >
                        <div className={`relative rounded overflow-hidden ${
                          isBanned ? 'opacity-30 grayscale' : ''
                        } ${
                          isPickedBlue || isPickedRed ? 'opacity-50' : ''
                        }`}>
                          <Image
                            src={`/images/${champion.name}.png`}
                            alt={champion.name}
                            width={64}
                            height={64}
                            className="w-full h-auto"
                            onError={(e) => {
                              e.currentTarget.src = '/images/logo.png'
                            }}
                          />
                          
                          {/* Overlay for banned/picked */}
                          {isBanned && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                              <X className="w-8 h-8 text-red-600" />
                            </div>
                          )}
                          
                          {isPickedBlue && (
                            <div className="absolute inset-0 bg-blue-600/40 border-2 border-blue-500"></div>
                          )}
                          
                          {isPickedRed && (
                            <div className="absolute inset-0 bg-red-600/40 border-2 border-red-500"></div>
                          )}
                          
                          {/* Hover effect for available */}
                          {isAvailable && isPlayerTurn && (
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1">
                              <span className="text-white text-xs font-bold">{champion.name}</span>
                            </div>
                          )}

                          {/* Selected indicator */}
                          {selectedChampion === champion.name && (
                            <div className="absolute inset-0 bg-yellow-400/30 border-4 border-yellow-400 flex items-center justify-center">
                              <Check className="w-8 h-8 text-yellow-400 drop-shadow-lg" />
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Red Team */}
          <div className="col-span-3">
            <Card className={`transition-colors duration-300 ${
              theme === 'dark'
                ? 'bg-red-950/30 border-red-700'
                : 'bg-red-50 border-red-200'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-center mb-4">
                  <Shield className="w-5 h-5 mr-2 text-red-500" />
                  <div className="text-center">
                    <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-red-300' : 'text-red-800'}`}>
                      {red_team.is_player ? 'VOUS' : 'IA'} (Rouge)
                    </h3>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                      {red_team.name}
                    </p>
                  </div>
                </div>

                {/* Red Picks */}
                <div className="space-y-2">
                  {red_team.picks.map((pick: any, idx: number) => (
                    <div key={idx} className={`p-3 rounded-lg flex items-center space-x-3 ${
                      theme === 'dark' ? 'bg-slate-800/70' : 'bg-white/70'
                    }`}>
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                        theme === 'dark' ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {idx + 1}
                      </div>
                      <Image
                        src={`/images/${pick.champion}.png`}
                        alt={pick.champion}
                        width={40}
                        height={40}
                        className="rounded"
                        onError={(e) => {
                          e.currentTarget.src = '/images/logo.png'
                        }}
                      />
                      <div className="flex-1">
                        <div className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {pick.champion}
                        </div>
                      </div>
                    </div>
                  ))}
                  {[...Array(5 - red_team.picks.length)].map((_, idx) => (
                    <div key={`empty-${idx}`} className={`p-3 rounded-lg border-2 border-dashed ${
                      theme === 'dark' ? 'border-slate-700 bg-slate-900/30' : 'border-slate-300 bg-slate-100/50'
                    }`}>
                      <div className="w-10 h-10 bg-slate-700/30 rounded"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Draft Complete Message */}
        {is_complete && (
          <div className="mt-6">
            <Card className={`transition-colors duration-300 ${
              theme === 'dark'
                ? 'bg-green-900/20 border-green-700'
                : 'bg-green-50 border-green-200'
            }`}>
              <CardContent className="p-6 text-center">
                <Check className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <h3 className={`font-bold text-2xl mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Draft terminé !
                </h3>
                <p className={`mb-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  Les deux équipes ont complété leur composition
                </p>
                <div className={`text-sm mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  <p><span className="text-blue-400 font-medium">{blue_team?.name}</span> (Bleu) vs <span className="text-red-400 font-medium">{red_team?.name}</span> (Rouge)</p>
                </div>
                <Button onClick={() => router.push('/teams')}>
                  Retour aux équipes
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}


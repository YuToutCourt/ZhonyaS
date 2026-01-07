'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Download, AlertCircle, CheckCircle2, Loader2, Link2 } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

interface OpggPlayer {
  id: number
  name: string
  tag: string
  soloq: string
  flexq: string
  position: string
}

interface OpggImportProps {
  onPlayersImported: (players: OpggPlayer[]) => void
}

const POSITION_COLORS = {
  TOP: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  JUNGLE: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  MID: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  ADC: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  SUPPORT: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  SUB: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
}

export function OpggImport({ onPlayersImported }: OpggImportProps) {
  const [opggUrl, setOpggUrl] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importedPlayers, setImportedPlayers] = useState<OpggPlayer[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [success, setSuccess] = useState(false)
  const { theme } = useTheme()

  const handleImport = async () => {
    if (!opggUrl.trim()) return

    setIsImporting(true)
    setErrors([])
    setSuccess(false)
    setImportedPlayers([])

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('/api/import-opgg', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ opgg_url: opggUrl })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setImportedPlayers(data.players)
        setErrors(data.errors || [])
        setSuccess(true)
        onPlayersImported(data.players)
      } else {
        setErrors([data.error || 'Erreur lors de l\'import'])
      }
    } catch (error) {
      setErrors(['Erreur de connexion au serveur'])
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Card className={`transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-slate-800/30 border-slate-700' 
        : 'bg-slate-50 border-slate-200'
    }`}>
      <CardHeader>
        <CardTitle className={`text-lg flex items-center space-x-2 transition-colors duration-300 ${
          theme === 'dark' ? 'text-white' : 'text-slate-900'
        }`}>
          <Link2 className="w-5 h-5" />
          <span>Import rapide depuis OP.GG</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className={`text-sm transition-colors duration-300 ${
            theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
          }`}>
            Lien OP.GG Multi-Search
          </Label>
          <div className="flex items-center space-x-2">
            <Input
              value={opggUrl}
              onChange={(e) => setOpggUrl(e.target.value)}
              placeholder="https://op.gg/fr/lol/multisearch/euw?summoners=..."
              className={`flex-1 transition-colors duration-300 ${
                theme === 'dark'
                  ? 'bg-slate-800 border-slate-600 text-white placeholder:text-slate-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
              }`}
            />
            <Button
              onClick={handleImport}
              disabled={isImporting || !opggUrl.trim()}
              className={`transition-colors duration-300 ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Import...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Importer
                </>
              )}
            </Button>
          </div>
          <p className={`text-xs transition-colors duration-300 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
          }`}>
            💡 L'ordre des joueurs détermine leur position : 1er = TOP, 2ème = JUNGLE, 3ème = MID, 4ème = ADC, 5ème = SUPPORT
          </p>
        </div>

        {/* Succès */}
        {success && importedPlayers.length > 0 && (
          <Alert className={`transition-colors duration-300 ${
            theme === 'dark'
              ? 'bg-green-900/20 border-green-600/30 text-green-400'
              : 'bg-green-50 border-green-200 text-green-800'
          }`}>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              {importedPlayers.length} joueur(s) importé(s) avec succès !
            </AlertDescription>
          </Alert>
        )}

        {/* Erreurs */}
        {errors.length > 0 && (
          <Alert className={`transition-colors duration-300 ${
            theme === 'dark'
              ? 'bg-red-900/20 border-red-600/30 text-red-400'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {errors.map((error, idx) => (
                  <div key={idx}>• {error}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Joueurs importés */}
        {importedPlayers.length > 0 && (
          <div className="space-y-2">
            <h4 className={`text-sm font-medium transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Joueurs importés :
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {importedPlayers.map((player, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors duration-300 ${
                    theme === 'dark'
                      ? 'bg-slate-800/50 border-slate-700'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Badge className={POSITION_COLORS[player.position as keyof typeof POSITION_COLORS]}>
                      {player.position}
                    </Badge>
                    <div>
                      <p className={`font-medium transition-colors duration-300 ${
                        theme === 'dark' ? 'text-white' : 'text-slate-900'
                      }`}>
                        {player.name}#{player.tag}
                      </p>
                      <p className={`text-xs transition-colors duration-300 ${
                        theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        SoloQ: {player.soloq || 'N/A'} | Flex: {player.flexq || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <CheckCircle2 className={`w-5 h-5 transition-colors duration-300 ${
                    theme === 'dark' ? 'text-green-400' : 'text-green-600'
                  }`} />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}



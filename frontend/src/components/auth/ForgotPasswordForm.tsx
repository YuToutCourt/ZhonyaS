'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Loader2, CheckCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ForgotPasswordFormProps {
  onBack?: () => void
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack }) => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { theme } = useTheme()
  const { forgotPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setIsLoading(true)

    const result = await forgotPassword(email)
    
    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error || 'Erreur lors de l\'envoi de l\'email')
    }
    
    setIsLoading(false)
  }

  if (success) {
    return (
      <Card className={`w-full max-w-md mx-auto transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-slate-800/50 border-slate-700' 
          : 'bg-white border-slate-200'
      }`}>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h3 className={`text-xl font-semibold transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              Email envoyé !
            </h3>
            <p className={`transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Si cette adresse email est enregistrée, vous recevrez un email de réinitialisation dans quelques minutes.
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => {
                  setSuccess(false)
                  setEmail('')
                }}
                variant="outline"
                className="w-full"
              >
                Envoyer un autre email
              </Button>
              <Button
                onClick={onBack}
                className={`w-full transition-colors duration-300 ${
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Retour à la connexion
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`w-full max-w-md mx-auto transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-slate-800/50 border-slate-700' 
        : 'bg-white border-slate-200'
    }`}>
      <CardHeader className="text-center">
        <CardTitle className={`text-2xl font-bold transition-colors duration-300 ${
          theme === 'dark' ? 'text-white' : 'text-slate-900'
        }`}>
          Mot de passe oublié
        </CardTitle>
        <CardDescription className={`transition-colors duration-300 ${
          theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
        }`}>
          Entrez votre adresse email pour recevoir un lien de réinitialisation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert className="border-red-500 bg-red-50 dark:bg-red-900/20">
              <AlertDescription className="text-red-700 dark:text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className={`transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Adresse email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              className={`transition-colors duration-300 ${
                theme === 'dark'
                  ? 'bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400/20'
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className={`w-full transition-colors duration-300 ${
              theme === 'dark'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              'Envoyer le lien de réinitialisation'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button
            onClick={onBack}
            variant="ghost"
            className={`transition-colors duration-300 ${
              theme === 'dark' 
                ? 'text-slate-400 hover:text-slate-300' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la connexion
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}




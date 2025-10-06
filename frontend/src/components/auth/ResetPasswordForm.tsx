'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Eye, EyeOff, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

export const ResetPasswordForm: React.FC = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const { theme } = useTheme()
  const { resetPassword } = useAuth()
  const searchParams = useSearchParams()

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (!tokenParam) {
      setError('Token de réinitialisation manquant ou invalide')
    } else {
      setToken(tokenParam)
    }
  }, [searchParams])

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    
    return {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers
    }
  }

  const passwordValidation = validatePassword(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!token) {
      setError('Token de réinitialisation manquant')
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (!passwordValidation.isValid) {
      setError('Le mot de passe ne respecte pas les critères requis')
      return
    }

    setIsLoading(true)

    const result = await resetPassword(token, password)
    
    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error || 'Erreur lors de la réinitialisation')
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
              Mot de passe réinitialisé !
            </h3>
            <p className={`transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
            </p>
            <Button
              onClick={() => window.location.href = '/login'}
              className={`w-full transition-colors duration-300 ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Se connecter
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!token) {
    return (
      <Card className={`w-full max-w-md mx-auto transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-slate-800/50 border-slate-700' 
          : 'bg-white border-slate-200'
      }`}>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <XCircle className="mx-auto h-16 w-16 text-red-500" />
            <h3 className={`text-xl font-semibold transition-colors duration-300 ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              Token invalide
            </h3>
            <p className={`transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Le lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.
            </p>
            <Button
              onClick={() => window.location.href = '/forgot-password'}
              className={`w-full transition-colors duration-300 ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Demander un nouveau lien
            </Button>
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
          Nouveau mot de passe
        </CardTitle>
        <CardDescription className={`transition-colors duration-300 ${
          theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
        }`}>
          Créez un nouveau mot de passe sécurisé
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
            <Label htmlFor="password" className={`transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Nouveau mot de passe
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Créez un nouveau mot de passe"
                required
                className={`pr-10 transition-colors duration-300 ${
                  theme === 'dark'
                    ? 'bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400/20'
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-slate-400" />
                ) : (
                  <Eye className="h-4 w-4 text-slate-400" />
                )}
              </Button>
            </div>
            
            {/* Critères de validation du mot de passe */}
            <div className="space-y-1">
              <div className={`flex items-center space-x-2 text-xs transition-colors duration-300 ${
                passwordValidation.minLength ? 'text-green-500' : theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                  passwordValidation.minLength ? 'bg-green-500' : theme === 'dark' ? 'bg-slate-500' : 'bg-slate-300'
                }`} />
                <span>Au moins 8 caractères</span>
              </div>
              <div className={`flex items-center space-x-2 text-xs transition-colors duration-300 ${
                passwordValidation.hasUpperCase ? 'text-green-500' : theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                  passwordValidation.hasUpperCase ? 'bg-green-500' : theme === 'dark' ? 'bg-slate-500' : 'bg-slate-300'
                }`} />
                <span>Une majuscule</span>
              </div>
              <div className={`flex items-center space-x-2 text-xs transition-colors duration-300 ${
                passwordValidation.hasLowerCase ? 'text-green-500' : theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                  passwordValidation.hasLowerCase ? 'bg-green-500' : theme === 'dark' ? 'bg-slate-500' : 'bg-slate-300'
                }`} />
                <span>Une minuscule</span>
              </div>
              <div className={`flex items-center space-x-2 text-xs transition-colors duration-300 ${
                passwordValidation.hasNumbers ? 'text-green-500' : theme === 'dark' ? 'text-slate-500' : 'text-slate-500'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                  passwordValidation.hasNumbers ? 'bg-green-500' : theme === 'dark' ? 'bg-slate-500' : 'bg-slate-300'
                }`} />
                <span>Un chiffre</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className={`transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Confirmer le mot de passe
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmez votre nouveau mot de passe"
                required
                className={`pr-10 transition-colors duration-300 ${
                  theme === 'dark'
                    ? 'bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400/20'
                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-slate-400" />
                ) : (
                  <Eye className="h-4 w-4 text-slate-400" />
                )}
              </Button>
            </div>
            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500">Les mots de passe ne correspondent pas</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading || !passwordValidation.isValid || password !== confirmPassword}
            className={`w-full transition-colors duration-300 ${
              theme === 'dark'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Réinitialisation...
              </>
            ) : (
              'Réinitialiser le mot de passe'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}




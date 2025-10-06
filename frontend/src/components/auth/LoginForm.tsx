'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface LoginFormProps {
  onSuccess?: () => void
  onSwitchToRegister?: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { theme } = useTheme()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const result = await login(username, password)
    
    if (result.success) {
      // Attendre un peu pour s'assurer que le token est sauvegardé
      console.log('LoginForm - Login successful, waiting before redirect...')
      setTimeout(() => {
        onSuccess?.()
      }, 500)
    } else {
      setError(result.error || 'Erreur de connexion')
      setIsLoading(false)
    }
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
          Connexion
        </CardTitle>
        <CardDescription className={`transition-colors duration-300 ${
          theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
        }`}>
          Connectez-vous à votre compte ZhonyaS
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
            <Label htmlFor="username" className={`transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Nom d'utilisateur
            </Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Entrez votre nom d'utilisateur"
              required
              className={`transition-colors duration-300 ${
                theme === 'dark'
                  ? 'bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-400 focus:ring-blue-400/20'
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className={`transition-colors duration-300 ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Mot de passe
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
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
                Connexion...
              </>
            ) : (
              'Se connecter'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <Link
            href="/forgot-password"
            className={`text-sm transition-colors duration-300 hover:underline ${
              theme === 'dark' 
                ? 'text-blue-400 hover:text-blue-300' 
                : 'text-blue-600 hover:text-blue-500'
            }`}
          >
            Mot de passe oublié ?
          </Link>
          
          <div className={`text-sm transition-colors duration-300 ${
            theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
          }`}>
            Pas encore de compte ?{' '}
            <button
              onClick={onSwitchToRegister}
              className={`transition-colors duration-300 hover:underline ${
                theme === 'dark' 
                  ? 'text-blue-400 hover:text-blue-300' 
                  : 'text-blue-600 hover:text-blue-500'
              }`}
            >
              S'inscrire
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

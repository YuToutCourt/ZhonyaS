import { useState, useCallback, useRef } from 'react'

export interface DownloadProgress {
  type: 'progress' | 'completed' | 'error'
  progress: number
  status: string
  error?: string
  message?: string
}

export function useDownloadStream() {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const startDownload = useCallback(async (username: string, nbGames: number, onComplete?: () => void) => {
    try {
      setIsDownloading(true)
      setDownloadProgress(0)
      setError(null)

      console.log('Starting download with SSE for:', username)

      // Démarrer le téléchargement
      const response = await fetch('http://localhost:5001/api/download/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          nb_games: nbGames,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start download')
      }

      const data = await response.json()
      const sessionId = data.session_id
      console.log('Download started with session:', sessionId)

      // Fermer la connexion précédente si elle existe
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      // Écouter les mises à jour via Server-Sent Events
      const eventSource = new EventSource(`http://localhost:5001/api/download/stream/${sessionId}`)
      eventSourceRef.current = eventSource
      
      eventSource.onmessage = (event) => {
        try {
          const progressData: DownloadProgress = JSON.parse(event.data)
          console.log('SSE message received:', progressData)
          
          switch (progressData.type) {
            case 'progress':
              setDownloadProgress(progressData.progress)
              break
            case 'completed':
              setDownloadProgress(100)
              setIsDownloading(false)
              console.log('Download completed, refreshing data...')
              // Fermer la connexion immédiatement et appeler le callback
              if (eventSourceRef.current) {
                eventSourceRef.current.close()
                eventSourceRef.current = null
              }
              clearTimeout(timeout)
              if (onComplete) {
                onComplete()
              }
              break
            case 'error':
              // Ne pas définir l'erreur si c'est "Session not found" ou "Session already closed"
              if (progressData.error && 
                  (progressData.error.includes('Session not found') || 
                   progressData.error.includes('Session already closed'))) {
                console.log('Session error ignored:', progressData.error)
                setIsDownloading(false)
              } else {
                setError(progressData.error || 'Download failed')
                setIsDownloading(false)
              }
              // Fermer la connexion immédiatement
              if (eventSourceRef.current) {
                eventSourceRef.current.close()
                eventSourceRef.current = null
              }
              clearTimeout(timeout)
              break
          }
        } catch (parseError) {
          console.error('Error parsing SSE message:', parseError)
        }
      }

      eventSource.onerror = (error) => {
        console.log("Error but don't close the connection")
      }

      // Ajouter un timeout pour éviter les connexions infinies
      const timeout = setTimeout(() => {
        console.log('SSE timeout reached, closing connection')
        if (eventSourceRef.current) {
          eventSourceRef.current.close()
          eventSourceRef.current = null
        }
        setIsDownloading(false)
        // Si on a un callback et qu'on n'a pas encore terminé, l'appeler
        if (onComplete && downloadProgress < 100) {
          console.log('Timeout reached, calling onComplete callback')
          onComplete()
        }
      }, 30000) // 30 secondes de timeout

      // Nettoyer le timeout quand la connexion se ferme
      eventSource.addEventListener('close', () => {
        clearTimeout(timeout)
      })

      // Retourner une fonction de nettoyage
      return () => {
        clearTimeout(timeout)
        if (eventSourceRef.current) {
          eventSourceRef.current.close()
          eventSourceRef.current = null
        }
      }

    } catch (err) {
      console.error('Download error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsDownloading(false)
    }
  }, [])

  const stopDownload = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsDownloading(false)
    setError(null)
  }, [])

  return {
    isDownloading,
    downloadProgress,
    error,
    startDownload,
    stopDownload
  }
}

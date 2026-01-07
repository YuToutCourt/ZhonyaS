import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { API_URL } from '@/lib/config'

const SOCKET_URL = API_URL

export interface SocketEvents {
  progress: (data: { progress: number }) => void
  download_complete: (data: { username: string }) => void
  download_error: (data: { error: string }) => void
}

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    })

    newSocket.on('connect', () => {
      console.log('Connected to server')
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server')
      setIsConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error)
      setIsConnected(false)
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  const joinRoom = (sessionId: string) => {
    if (socket) {
      socket.emit('join', { session_id: sessionId })
    }
  }

  const on = <K extends keyof SocketEvents>(
    event: K,
    callback: SocketEvents[K]
  ) => {
    if (socket) {
      socket.on(event, callback)
    }
  }

  const off = <K extends keyof SocketEvents>(
    event: K,
    callback: SocketEvents[K]
  ) => {
    if (socket) {
      socket.off(event, callback)
    }
  }

  return {
    socket,
    isConnected,
    joinRoom,
    on,
    off
  }
}

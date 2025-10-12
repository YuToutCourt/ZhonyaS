import { API_URL } from './config'

const API_BASE_URL = API_URL

export interface Player {
  name: string
  tag: string
  soloq: string | null
  flexq: string | null
  global_kda: number
  global_kill: number
  global_death: number
  global_assists: number
  global_kp: number
  global_winrate: number
  nb_game: number
  nb_win: number
  nb_lose: number
  score_moyen: number
  role: string[]
}

export interface Champion {
  nom: string
  nombre_de_parties: number
  nombre_win: number
  nombre_lose: number
  winrate: number
  kill: number
  death: number
  assit: number
  dangerousness: number
  kda: number
  kill_participation: number
}

export interface SearchResponse {
  player: Player
  champions: Champion[]
  all_champions: any[]
}

export interface FilterRequest {
  username: string
  role?: string[]
  champion?: string[]
  match_types?: string[]
  start_date?: string
  end_date?: string
}

export interface DownloadRequest {
  username: string
  nb_games: number
  session_id: string
  startTime?: number  // Optional: epoch timestamp in seconds
  endTime?: number    // Optional: epoch timestamp in seconds
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('An unexpected error occurred')
    }
  }

  async searchPlayer(username: string): Promise<SearchResponse> {
    return this.request<SearchResponse>('/api/search', {
      method: 'POST',
      body: JSON.stringify({ username }),
    })
  }

  async filterGames(filterData: FilterRequest): Promise<SearchResponse> {
    return this.request<SearchResponse>('/api/filter', {
      method: 'POST',
      body: JSON.stringify(filterData),
    })
  }

  async downloadGames(downloadData: DownloadRequest): Promise<{ status: string; session_id: string }> {
    return this.request<{ status: string; session_id: string }>('/api/download', {
      method: 'POST',
      body: JSON.stringify(downloadData),
    })
  }

  async healthCheck(): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>('/api/health')
  }

  async analyzePlayerMatchup(matchupId: number, position: string, token: string): Promise<{
    analysis: string
    position: string
    player1: string
    player2: string
  }> {
    return this.request(`/api/matchups/${matchupId}/ai-analysis/player`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ position })
    })
  }

  async analyzeTeamDraft(matchupId: number, targetTeam: number, token: string): Promise<{
    analysis: string
    target_team: number
    target_team_name: string
  }> {
    return this.request(`/api/matchups/${matchupId}/ai-analysis/team`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ target_team: targetTeam })
    })
  }

  async startDraftSimulation(matchupId: number, playerSide: string, playerTeam: number, token: string): Promise<any> {
    return this.request(`/api/matchups/${matchupId}/draft/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ player_side: playerSide, player_team: playerTeam })
    })
  }

  async draftAction(sessionId: string, champion: string, token: string): Promise<any> {
    return this.request(`/api/draft/${sessionId}/action`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ champion })
    })
  }

  async getDraftState(sessionId: string, token: string): Promise<any> {
    return this.request(`/api/draft/${sessionId}/state`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  }

  async cancelDraft(sessionId: string, token: string): Promise<any> {
    return this.request(`/api/draft/${sessionId}/cancel`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  }

  async aiPlayTurn(sessionId: string, token: string): Promise<any> {
    return this.request(`/api/draft/${sessionId}/ai-play`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  }
}

export const apiClient = new ApiClient()
export default apiClient

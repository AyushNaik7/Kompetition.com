// API client for Django backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Competition {
  id: number;
  title: string;
  slug: string;
  description: string;
  start_time: string;
  end_time: string;
  registration_deadline?: string;
  is_active: boolean;
  max_participants: number;
  time_control: string;
  match_type: string;
  tournament_type: 'swiss' | 'knockout' | 'round_robin';
  participant_count?: number;
  is_registration_open?: boolean;
}

export interface Participant {
  id: number;
  competition: number;
  lichess_username: string;
  full_name: string;
  registered_at: string;
}

export interface Match {
  id: number;
  competition: number;
  player1: number;
  player2: number;
  player1_name?: string;
  player2_name?: string;
  round_number: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  result: string;
  winner: number | null;
  winner_name?: string;
  lichess_game_id: string;
  lichess_game_url: string;
  result_source: string;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  participant_id: number;
  participant_name: string;
  lichess_username: string;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  lichess_username?: string;
}

export interface AuthResponse {
  user: User;
  message: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private getCsrfToken(): string | null {
    if (typeof document === 'undefined') return null;
    const name = 'csrftoken';
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === name) return value;
    }
    return null;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const csrfToken = this.getCsrfToken();
    
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Include cookies for session auth
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken && { 'X-CSRFToken': csrfToken }),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Extract error message from various possible formats
      let errorMessage = `API Error: ${response.statusText}`;
      
      if (errorData.error) {
        errorMessage = errorData.error;
      } else if (errorData.detail) {
        errorMessage = errorData.detail;
      } else if (errorData.non_field_errors) {
        // Handle Django's non_field_errors (e.g., unique constraint violations)
        errorMessage = Array.isArray(errorData.non_field_errors) 
          ? errorData.non_field_errors[0] 
          : errorData.non_field_errors;
      } else if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
        // Try to extract first error from object (e.g., field validation errors)
        const firstKey = Object.keys(errorData)[0];
        const firstError = errorData[firstKey];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Competitions
  async getCompetitions(): Promise<Competition[]> {
    const response = await this.request<{ count: number; results: Competition[] }>('/api/chess/competitions/');
    // Handle both paginated and non-paginated responses
    return Array.isArray(response) ? response : response.results || [];
  }

  async getCompetition(slug: string): Promise<Competition> {
    return this.request<Competition>(`/api/chess/competitions/${slug}/`);
  }

  async getActiveCompetitions(): Promise<Competition[]> {
    const response = await this.request<{ count: number; results: Competition[] } | Competition[]>('/api/chess/competitions/active/');
    // Handle both paginated and non-paginated responses
    return Array.isArray(response) ? response : response.results || [];
  }

  async getCompetitionParticipants(id: number): Promise<Participant[]> {
    return this.request<Participant[]>(`/api/chess/competitions/${id}/participants/`);
  }

  async getCompetitionMatches(id: number): Promise<Match[]> {
    return this.request<Match[]>(`/api/chess/competitions/${id}/matches/`);
  }

  async getLeaderboard(id: number): Promise<LeaderboardEntry[]> {
    return this.request<LeaderboardEntry[]>(`/api/chess/competitions/${id}/leaderboard/`);
  }

  // Participants
  async registerParticipant(competitionId: number, data: { 
    lichess_username: string; 
    full_name: string;
    email: string;
    mobile_number: string;
  }): Promise<Participant> {
    return this.request<Participant>(`/api/chess/competitions/${competitionId}/register/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Matches
  async syncMatchResult(matchId: number, gameId: string, adminOverride?: boolean): Promise<{ message: string; result: string; winner: string; status: string }> {
    return this.request(`/api/chess/matches/${matchId}/sync_result/`, {
      method: 'POST',
      body: JSON.stringify({ 
        lichess_game_id: gameId,
        admin_override: adminOverride || false
      }),
    });
  }

  async createMatch(competitionId: number, data: {
    player1: number;
    player2: number;
    round_number: number;
    lichess_game_id?: string;
  }): Promise<Match> {
    return this.request(`/api/chess/competitions/${competitionId}/create_match/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMatch(matchId: number): Promise<Match> {
    return this.request(`/api/chess/matches/${matchId}/`);
  }

  async createLichessChallenge(matchId: number): Promise<{ message: string; challenge_url: string; challenge_id: string }> {
    return this.request(`/api/chess/matches/${matchId}/create_lichess_challenge/`, {
      method: 'POST',
    });
  }

  async updateCompetition(competitionId: number, data: Partial<Competition>): Promise<Competition> {
    return this.request(`/api/chess/competitions/${competitionId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async generateSwissPairings(competitionId: number): Promise<{ message: string; round_number: number; matches_created: number; bye_player: string | null }> {
    return this.request(`/api/chess/competitions/${competitionId}/generate_swiss_pairings/`, {
      method: 'POST',
    });
  }

  // Authentication
  async register(username: string, email: string, password: string, password2: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/chess/auth/register/', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, password2 }),
    });
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/chess/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async logout(): Promise<{ message: string }> {
    return this.request('/api/chess/auth/logout/', {
      method: 'POST',
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/api/chess/auth/me/');
  }

  async getMyMatches(username: string): Promise<Match[]> {
    return this.request<Match[]>(`/api/chess/my-matches/?username=${encodeURIComponent(username)}`);
  }
}

export const api = new ApiClient();

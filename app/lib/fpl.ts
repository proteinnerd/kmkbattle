// Types for FPL API responses
export interface LeagueStanding {
  entry: number;
  player_name: string;
  entry_name: string;
  total: number;
  rank: number;
}

export interface LeagueDetails {
  league: {
    id: number;
    name: string;
  };
  standings: {
    results: LeagueStanding[];
  };
}

export interface GameweekEntry {
  event: number;
  points: number;
  total_points: number;
  rank: number;
  rank_sort: number;
  overall_rank: number;
  bank: number;
  value: number;
  event_transfers: number;
  event_transfers_cost: number;
  points_on_bench: number;
}

export interface EntryHistory {
  current: GameweekEntry[];
  past: any[];
  chips: any[];
}

// Cache responses to avoid rate limiting
const cache = new Map<string, any>();

export async function fetchLeagueDetails(leagueId: number): Promise<LeagueDetails | null> {
  const cacheKey = `league_${leagueId}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  try {
    const response = await fetch(
      `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch league details: ${response.statusText}`);
    }

    const data = await response.json();
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching league details:', error);
    return null;
  }
}

export async function fetchEntryHistory(entryId: number): Promise<EntryHistory | null> {
  const cacheKey = `entry_${entryId}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  try {
    const response = await fetch(
      `https://fantasy.premierleague.com/api/entry/${entryId}/history/`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch entry history: ${response.statusText}`);
    }

    const data = await response.json();
    cache.set(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Error fetching entry history:', error);
    return null;
  }
} 
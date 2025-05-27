// FPL API endpoints
const FPL_API_BASE = process.env.NEXT_PUBLIC_FPL_PROXY_URL || 'http://localhost:3001/api';
import { safeFetch } from './api-utils';

// Cache for API responses to avoid unnecessary requests
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Error handling wrapper for fetch
async function fetchWithErrorHandling(url: string, options: RequestInit = {}) {
  const cacheKey = url;
  const cachedResponse = apiCache.get(cacheKey);
  
  // Return cached response if it exists and is still valid
  if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_DURATION) {
    console.log(`Using cached response for: ${url}`);
    return cachedResponse.data;
  }
  
  try {
    console.log(`Fetching: ${url}`);
    // Use our safer fetch implementation
    const data = await safeFetch(url, options);
    
    // Cache the response
    apiCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
    
    return data;
  } catch (error) {
    console.error('Error fetching from FPL API:', error);
    throw error;
  }
}

// Clear the cache
export function clearCache() {
  apiCache.clear();
  console.log('API cache cleared');
}

// Get general FPL information (bootstrap-static)
export async function getBootstrapStatic() {
  console.log('Fetching FPL bootstrap static data');
  try {
    const data = await fetchWithErrorHandling(`${FPL_API_BASE}/bootstrap-static`);
    console.log('Bootstrap data fetched successfully');
    return data;
  } catch (error) {
    console.error('Failed to fetch bootstrap static data:', error);
    throw new Error(`Failed to fetch FPL data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get player details by ID
export async function getPlayerDetails(playerId: number) {
  console.log(`Fetching player details for ID: ${playerId}`);
  return fetchWithErrorHandling(`${FPL_API_BASE}/element-summary/${playerId}/`);
}

// Get league details by ID
export async function getLeagueDetails(leagueId: number) {
  console.log(`Fetching league details for ID: ${leagueId}`);
  try {
    const data = await fetchWithErrorHandling(`${FPL_API_BASE}/leagues/${leagueId}`);
    
    // Validate the response structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid league data format: Response is not an object');
    }
    
    if (!data.league) {
      console.error('League data missing league property:', data);
      throw new Error('Invalid league data format: Missing league property');
    }
    
    if (!data.standings || !data.standings.results) {
      console.error('League data missing standings or results:', data);
      // Create a default standings structure if missing
      data.standings = data.standings || {};
      data.standings.results = data.standings.results || [];
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching league details for ID ${leagueId}:`, error);
    throw new Error(`Failed to fetch league details: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get league entries (all players in a league)
export async function getLeagueEntries(leagueId: number, page = 1) {
  console.log(`Fetching league entries for league ID: ${leagueId}, page: ${page}`);
  return fetchWithErrorHandling(`${FPL_API_BASE}/leagues/${leagueId}?page_standings=${page}`);
}

// Get team/user entry by ID
export async function getEntry(entryId: number) {
  console.log(`Fetching entry details for ID: ${entryId}`);
  return fetchWithErrorHandling(`${FPL_API_BASE}/entry/${entryId}/`);
}

// Get team/user history by ID
export async function getEntryHistory(entryId: number) {
  console.log(`Fetching entry history for ID: ${entryId}`);
  try {
    const data = await fetchWithErrorHandling(`${FPL_API_BASE}/entry/${entryId}/history`);
    
    // Validate the response structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid entry history data format');
    }
    
    if (!data.current || !Array.isArray(data.current)) {
      console.error('Entry history missing current array:', data);
      // Create a default current array if missing
      data.current = [];
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching entry history for ID ${entryId}:`, error);
    throw new Error(`Failed to fetch entry history: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get gameweek details
export async function getGameweek(gameweekId: number) {
  console.log(`Fetching gameweek details for ID: ${gameweekId}`);
  return fetchWithErrorHandling(`${FPL_API_BASE}/event/${gameweekId}/live/`);
}

// Get current gameweek
export async function getCurrentGameweek() {
  try {
    const bootstrap = await getBootstrapStatic();
    
    if (!bootstrap || !bootstrap.events || !Array.isArray(bootstrap.events)) {
      throw new Error('Invalid bootstrap data: Missing events array');
    }
    
    const currentGameweek = bootstrap.events.find((event: any) => event.is_current);
    
    // If no current gameweek found, return the first one
    if (!currentGameweek && bootstrap.events.length > 0) {
      return bootstrap.events[0];
    } else if (!currentGameweek) {
      throw new Error('No gameweeks found in bootstrap data');
    }
    
    return currentGameweek;
  } catch (error) {
    console.error('Error getting current gameweek:', error);
    // Return a default gameweek object as fallback
    return { id: 1, name: 'Gameweek 1', is_current: true };
  }
}

// Get picks for a specific entry in a gameweek
export async function getEntryPicks(entryId: number, gameweekId: number) {
  console.log(`Fetching picks for entry ID: ${entryId}, gameweek: ${gameweekId}`);
  return fetchWithErrorHandling(`${FPL_API_BASE}/entry/${entryId}/event/${gameweekId}/picks/`);
}

// Search for a player by name (client-side filtering of bootstrap data)
export async function searchPlayerByName(name: string) {
  console.log(`Searching for player with name: ${name}`);
  try {
    const data = await getBootstrapStatic();
    
    if (!data) {
      console.error('Bootstrap data is null or undefined');
      throw new Error('Failed to fetch player data: No data returned');
    }
    
    if (!data.elements || !Array.isArray(data.elements)) {
      console.error('Bootstrap data has no elements array:', data);
      throw new Error('Failed to fetch player data: Invalid data format');
    }
    
    console.log(`Found ${data.elements.length} players in total`);
    
    const searchTerm = name.toLowerCase();
    const matchedPlayers = data.elements.filter((player: any) => {
      if (!player || !player.first_name || !player.second_name) {
        return false;
      }
      const fullName = `${player.first_name} ${player.second_name}`.toLowerCase();
      return fullName.includes(searchTerm);
    });
    
    console.log(`Found ${matchedPlayers.length} players matching "${name}"`);
    return matchedPlayers;
  } catch (error) {
    console.error('Error in searchPlayerByName:', error);
    throw new Error(`Failed to search for player: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get all teams data
export async function getTeams() {
  const bootstrap = await getBootstrapStatic();
  return bootstrap.teams;
}

// Get team name by ID
export async function getTeamNameById(teamId: number) {
  const teams = await getTeams();
  const team = teams.find((t: any) => t.id === teamId);
  return team ? team.name : 'Unknown Team';
}

// Calculate gameweek losers for a league
export async function calculateGameweekLosers(leagueId: number, gameweekId: number) {
  try {
    // Get all entries in the league
    const leagueData = await getLeagueDetails(leagueId);
    
    if (!leagueData || !leagueData.standings || !leagueData.standings.results) {
      console.error('Invalid league data for calculating losers:', leagueData);
      return [];
    }
    
    const entries = leagueData.standings.results;
    
    if (!entries || entries.length === 0) {
      console.log(`No entries found in league ${leagueId}`);
      return [];
    }
    
    // Get points for each entry in the specified gameweek
    const entryPoints = await Promise.all(
      entries.map(async (entry: any) => {
        try {
          if (!entry || !entry.entry) {
            return {
              entry: 0,
              entryName: 'Unknown',
              playerName: 'Unknown',
              points: 0,
            };
          }
          
          const history = await getEntryHistory(entry.entry);
          const gameweekHistory = history.current.find((gw: any) => gw.event === gameweekId);
          
          return {
            entry: entry.entry,
            entryName: entry.entry_name || 'Unknown Team',
            playerName: entry.player_name || 'Unknown Player',
            points: gameweekHistory ? gameweekHistory.points : 0,
          };
        } catch (error) {
          console.error(`Error getting history for entry ${entry.entry}:`, error);
          return {
            entry: entry.entry,
            entryName: entry.entry_name || 'Unknown Team',
            playerName: entry.player_name || 'Unknown Player',
            points: 0,
          };
        }
      })
    );
    
    // Sort by points (ascending)
    entryPoints.sort((a, b) => a.points - b.points);
    
    // Find the minimum points
    const minPoints = entryPoints.length > 0 ? entryPoints[0].points : 0;
    
    // Return all entries with the minimum points (could be multiple in case of a tie)
    return entryPoints.filter(entry => entry.points === minPoints);
  } catch (error) {
    console.error(`Error calculating gameweek losers for league ${leagueId}:`, error);
    return [];
  }
} 
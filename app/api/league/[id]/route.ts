import { NextResponse } from 'next/server';
import { 
  getLeagueDetails, 
  getEntryHistory, 
  getCurrentGameweek, 
  calculateGameweekLosers 
} from '@/app/lib/fpl-api';
import { supabase } from '@/app/lib/supabase';

interface GameweekHistory {
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

type Punishment = {
  id: string;
  player_id: number;
  gameweek_id: number;
  league_id: number;
  distance_km: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  points?: number;
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const leagueId = parseInt(params.id);
    
    if (isNaN(leagueId)) {
      return NextResponse.json({ error: 'Invalid league ID' }, { status: 400 });
    }
    
    console.log(`Processing API request for league ID: ${leagueId}`);
    
    try {
      // Get league details from FPL API
      const leagueData = await getLeagueDetails(leagueId);
      
      if (!leagueData || !leagueData.league) {
        return NextResponse.json({ 
          error: 'League not found',
          details: 'The FPL API returned invalid league data'
        }, { status: 404 });
      }
      
      // Get current gameweek
      const currentGameweek = await getCurrentGameweek();
      
      // Calculate gameweek losers for tracking punishments
      const gameweekLosers = await calculateGameweekLosers(leagueId, currentGameweek.id);
      
      // Get gameweek history for all players
      const playerIds = leagueData.standings.results.map((entry: any) => entry.entry);
      const gameweekHistoryPromises = playerIds.map(async (playerId: number) => {
        const history = await getEntryHistory(playerId);
        return history?.current.map((gw: GameweekHistory) => ({
          entry: playerId,
          event: gw.event,
          points: gw.points
        })) || [];
      });
      const gameweekHistories = await Promise.all(gameweekHistoryPromises);
      const gameweekHistory = gameweekHistories.flat();
      
      // Check if this league exists in our database
      const { data: existingLeague } = await supabase
        .from('leagues')
        .select('*')
        .eq('fpl_league_id', leagueId)
        .single();
      
      // If the league doesn't exist, add it
      if (!existingLeague) {
        await supabase.from('leagues').insert({
          fpl_league_id: leagueId,
          name: leagueData.league.name
        });
      }
      
      // Get punishment data from our database
      let { data: punishments } = await (supabase
        .from('punishments')
        .select('*')
        .eq('league_id', leagueId) as any);

      // If no punishments exist, generate them for all gameweeks
      if (!punishments || punishments.length === 0) {
        const currentGw = currentGameweek.id;
        for (let gw = 1; gw <= currentGw; gw++) {
          await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/punishment`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ league_id: leagueId, gameweek_id: gw })
          });
        }
        // Fetch punishments again after generation
        const result = await supabase
          .from('punishments')
          .select('*')
          .eq('league_id', leagueId);
        punishments = result.data;
      }
      
      // Process standings to include punishment data
      const standings = leagueData.standings.results.map((entry: any) => {
        // Find punishments for this entry
        const entryPunishments = punishments?.filter(p => p.player_id === entry.entry) || [];
        
        return {
          ...entry,
          punishments: {
            total: entryPunishments.length,
            completed: entryPunishments.filter(p => p.is_completed).length,
            pending: entryPunishments.filter(p => !p.is_completed).length,
            distance_km: entryPunishments.reduce((sum, p) => sum + p.distance_km, 0)
          }
        };
      });
      
      return NextResponse.json({
        id: leagueId,
        name: leagueData.league.name,
        standings,
        currentGameweek: currentGameweek.id,
        gameweekLosers,
        punishments: punishments || [],
        gameweekHistory
      });
    } catch (apiError) {
      console.error(`API error for league ${leagueId}:`, apiError);
      
      // Return a more detailed error response
      return NextResponse.json({
        error: 'Failed to fetch league details from FPL API',
        details: apiError instanceof Error ? apiError.message : 'Unknown API error',
        leagueId
      }, { status: 502 });
    }
  } catch (error) {
    console.error('Error in league API route:', error);
    return NextResponse.json({
      error: 'Failed to process league request',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 
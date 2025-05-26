import { NextResponse } from 'next/server';
import { 
  getBootstrapStatic,
  getPlayerDetails, 
  getEntry,
  getEntryHistory,
  getLeagueDetails,
  getTeamNameById
} from '@/app/lib/fpl-api';
import { supabase } from '@/app/lib/supabase';

async function getPlayerPunishments(supabase: any, playerId: string): Promise<any[]> {
  const result = await supabase
    .from('punishments')
    .select('*')
    .eq('player_id', playerId);
  return result.data || [];
}

async function getOrCreateLeague(supabase: any, leagueId: number, leagueName: string): Promise<any> {
  const result = await supabase
    .from('leagues')
    .select('*')
    .eq('fpl_league_id', leagueId)
    .single();
  
  if (!result.data) {
    await supabase
      .from('leagues')
      .insert({
        fpl_league_id: leagueId,
        name: leagueName
      });
  }
  
  return result.data;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const playerId = parseInt(params.id);
    
    if (isNaN(playerId)) {
      return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 });
    }
    
    console.log(`Processing API request for player ID: ${playerId}`);
    
    // Get player details from FPL API
    const bootstrap = await getBootstrapStatic();
    const playerData = bootstrap.elements.find((p: any) => p.id === playerId);
    
    if (!playerData) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    
    // Get detailed player stats
    const playerDetails = await getPlayerDetails(playerId);
    
    // Try to get entry (team) data for this player
    // Note: In the real app, we would need to map FPL player IDs to entry IDs
    // This is just a placeholder since we can't directly get entry ID from player ID
    let entryData = null;
    let entryHistory = null;
    let leagues = [];
    
    try {
      // In a real app, we would get the entry ID from our database
      // For now, we'll use a mock entry ID for demonstration
      const mockEntryId = 1234567;
      entryData = await getEntry(mockEntryId);
      entryHistory = await getEntryHistory(mockEntryId);
      
      // Get leagues this player is part of
      if (entryData && entryData.leagues && entryData.leagues.classic) {
        leagues = await Promise.all(
          entryData.leagues.classic.map(async (league: any) => {
            // Check if league exists in our database and create if needed
            await getOrCreateLeague(supabase, league.id, league.name);
            
            return {
              id: league.id,
              name: league.name,
              entry_rank: league.entry_rank
            };
          })
        );
      }
    } catch (error) {
      console.error('Error fetching entry data:', error);
      // Continue without entry data
    }
    
    // Get punishment data from our database
    const punishments = await getPlayerPunishments(supabase, playerId.toString());
    
    // Get team name
    const teamName = await getTeamNameById(playerData.team);
    
    return NextResponse.json({
      id: playerId,
      first_name: playerData.first_name,
      second_name: playerData.second_name,
      full_name: `${playerData.first_name} ${playerData.second_name}`,
      team: teamName,
      team_id: playerData.team,
      position: playerData.element_type,
      price: playerData.now_cost / 10,
      selected_by_percent: playerData.selected_by_percent,
      total_points: playerData.total_points,
      form: playerData.form,
      leagues: leagues,
      history: playerDetails.history || [],
      fixtures: playerDetails.fixtures || [],
      punishments: {
        total: punishments?.length || 0,
        completed: punishments?.filter(p => p.is_completed).length || 0,
        pending: punishments?.filter(p => !p.is_completed).length || 0,
        distance_km: punishments?.reduce((sum, p) => sum + p.distance_km, 0) || 0,
        details: punishments || []
      }
    });
  } catch (error) {
    console.error('Error fetching player details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player details' }, 
      { status: 500 }
    );
  }
} 
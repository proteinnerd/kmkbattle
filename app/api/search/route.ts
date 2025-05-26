import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { searchPlayerByName, getLeagueDetails } from '@/app/lib/fpl-api';

async function getLeague(supabase: any, leagueId: number): Promise<any> {
  const result = await supabase
    .from('leagues')
    .select('*')
    .eq('fpl_league_id', leagueId)
    .single();
  return result.data;
}

async function createLeague(supabase: any, leagueId: number, name: string): Promise<any> {
  const result = await supabase
    .from('leagues')
    .insert({
      fpl_league_id: leagueId,
      name: name
    })
    .select();
  return result.data?.[0];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }
    
    console.log(`Processing search query: ${query}`);
    
    // Check if query is numeric (likely a league code)
    const isNumeric = /^\d+$/.test(query);
    
    if (isNumeric) {
      // Search for league by ID
      try {
        const leagueId = parseInt(query);
        const leagueData = await getLeagueDetails(leagueId);
        
        // Store league in database if it doesn't exist
        const existingLeague = await getLeague(supabase, leagueId);
        
        if (!existingLeague) {
          await createLeague(supabase, leagueId, leagueData.league.name);
        }
        
        return NextResponse.json({
          type: 'league',
          data: {
            id: leagueId,
            name: leagueData.league.name
          }
        });
      } catch (error) {
        console.error('Error searching for league:', error);
        return NextResponse.json({ 
          error: 'League not found',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 404 });
      }
    } else {
      // Search for player by name
      try {
        console.log(`Searching for player: "${query}"`);
        const players = await searchPlayerByName(query);
        
        if (!players || players.length === 0) {
          console.log(`No players found matching: "${query}"`);
          return NextResponse.json({ error: 'No players found' }, { status: 404 });
        }
        
        console.log(`Found ${players.length} players matching: "${query}"`);
        return NextResponse.json({
          type: 'players',
          data: players.map((player: any) => ({
            id: player.id,
            name: `${player.first_name} ${player.second_name}`,
            team: player.team
          }))
        });
      } catch (error) {
        console.error('Error searching for player:', error);
        return NextResponse.json({ 
          error: 'Error searching for player',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { calculateGameweekLosers, getLeagueDetails, getCurrentGameweek } from '@/app/lib/fpl-api';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { fetchLeagueDetails, fetchEntryHistory, LeagueDetails, EntryHistory } from '@/app/lib/fpl';
import { PostgrestError } from '@supabase/supabase-js';

// Add this helper function near the top of the file:
async function getPunishments(supabase: any, filters: { 
  leagueId?: number; 
  playerId?: number; 
  gameweekId?: number;
  isCompleted?: boolean;
} = {}): Promise<any[]> {
  let query = supabase.from('punishments').select();
  
  if (filters.leagueId) {
    query = query.eq('league_id', filters.leagueId);
  }
  if (filters.playerId) {
    query = query.eq('player_id', filters.playerId);
  }
  if (filters.gameweekId) {
    query = query.eq('gameweek_id', filters.gameweekId);
  }
  if (filters.isCompleted !== undefined) {
    query = query.eq('is_completed', filters.isCompleted);
  }
  
  const result = await query;
  return result.data || [];
}

// Add these helper functions near the top with getPunishments:
async function checkExistingPunishment(supabase: any, leagueId: number, playerId: number, gameweekId: number): Promise<any> {
  const result = await supabase
    .from('punishments')
    .select('*')
    .eq('league_id', leagueId)
    .eq('player_id', playerId)
    .eq('gameweek_id', gameweekId)
    .single();
  return result.data;
}

async function createPunishment(supabase: any, punishment: any): Promise<any> {
  const result = await supabase
    .from('punishments')
    .insert(punishment)
    .select();
  return result.data?.[0];
}

async function updatePunishment(supabase: any, id: string, updateData: any): Promise<any> {
  const result = await supabase
    .from('punishments')
    .update(updateData)
    .eq('id', id)
    .select();
  return result.data?.[0];
}

// Add this helper function near the top with the other helpers:
async function createPunishments(supabase: any, punishments: any[]): Promise<any[]> {
  const result = await supabase
    .from('punishments')
    .insert(punishments)
    .select();
  return result.data || [];
}

// GET: Get all punishments or filter by query params
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const leagueId = searchParams.get('league_id');
    const playerId = searchParams.get('player_id');
    const gameweekId = searchParams.get('gameweek_id');
    const isCompleted = searchParams.get('is_completed');
    
    // Start with base query
    let punishments = await getPunishments(supabase, {
      leagueId: leagueId ? parseInt(leagueId) : undefined,
      playerId: playerId ? parseInt(playerId) : undefined,
      gameweekId: gameweekId ? parseInt(gameweekId) : undefined,
      isCompleted: isCompleted !== null ? isCompleted === 'true' : undefined
    });
    
    return NextResponse.json(punishments);
  } catch (error) {
    console.error('Error fetching punishments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch punishments' }, 
      { status: 500 }
    );
  }
}

// POST: Create a new punishment
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { league_id, player_id, gameweek_id, distance_km = 1.0 } = body;
    
    if (!league_id || !player_id || !gameweek_id) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // Check if punishment already exists
    const existingPunishment = await checkExistingPunishment(supabase, league_id, player_id, gameweek_id);
    
    if (existingPunishment) {
      return NextResponse.json(
        { error: 'Punishment already exists', punishment: existingPunishment }, 
        { status: 409 }
      );
    }
    
    // Create new punishment
    const data = await createPunishment(supabase, {
      league_id,
      player_id,
      gameweek_id,
      distance_km,
      is_completed: false
    });
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating punishment:', error);
    return NextResponse.json(
      { error: 'Failed to create punishment' }, 
      { status: 500 }
    );
  }
}

// PUT: Update a punishment (mark as completed)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, is_completed } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing punishment ID' }, 
        { status: 400 }
      );
    }
    
    const updateData: any = {};
    if (typeof is_completed === 'boolean') {
      updateData.is_completed = is_completed;
      if (is_completed) {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }
    }
    
    const data = await updatePunishment(supabase, id, updateData);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating punishment:', error);
    return NextResponse.json(
      { error: 'Failed to update punishment' }, 
      { status: 500 }
    );
  }
}

interface GameweekScore {
  player_id: number;
  points: number;
  player_name: string;
  entry_name: string;
}

interface PunishmentResponse {
  id: string;
  player_id: number;
  gameweek_id: number;
  league_id: number;
  distance_km: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  player_name: string;
  entry_name: string;
  points: number;
  already_existed: boolean;
}

// POST: Auto-generate punishments for a league and gameweek
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { league_id, gameweek_id } = body;

    // Fetch league details
    const leagueDetails = await fetchLeagueDetails(league_id);
    if (!leagueDetails) {
      console.error(`League not found: ${league_id}`);
      return NextResponse.json({ error: 'League not found' }, { status: 404 });
    }

    // Get player IDs from league standings
    const playerIds = leagueDetails.standings.results.map(entry => entry.entry);
    console.log(`PATCH /api/punishment: league_id=${league_id}, gameweek_id=${gameweek_id}, player_count=${playerIds.length}`);
    if (!playerIds || playerIds.length === 0) {
      console.error(`No players found in league ${league_id}`);
      return NextResponse.json({ error: 'No players found in league' }, { status: 500 });
    }

    // Fetch entry history for all players
    const playerHistories = await Promise.all(
      playerIds.map(async (id) => {
        const history = await fetchEntryHistory(id);
        return { id, history };
      })
    );

    // Always process all players for the requested gameweek
    const gameweekScores: GameweekScore[] = playerIds.map((id) => {
      const playerHistory = playerHistories.find(ph => ph.id === id)?.history;
      let points = 0;
      if (playerHistory && Array.isArray(playerHistory.current)) {
        const gameweek = playerHistory.current.find(gw => gw.event === gameweek_id);
        if (gameweek) {
          points = gameweek.points || 0;
        }
      }
      return {
        player_id: id,
        points,
        player_name: leagueDetails.standings.results.find(r => r.entry === id)?.player_name || '',
        entry_name: leagueDetails.standings.results.find(r => r.entry === id)?.entry_name || ''
      };
    });

    // Log scores for this gameweek
    console.log(`GW${gameweek_id} scores:`, gameweekScores);

    // Find the highest scoring player(s)
    const maxPoints = Math.max(...gameweekScores.map(s => s.points));
    const topScorers = gameweekScores.filter(s => s.points === maxPoints);

    let punishedPlayers;
    if (topScorers.length === 1) {
      // Only one winner, exempt them from punishment
      punishedPlayers = gameweekScores.filter(s => s.player_id !== topScorers[0].player_id);
    } else {
      // Tie for first: NO ONE is exempt, everyone gets punished
      punishedPlayers = gameweekScores;
    }

    // Log punished players for this gameweek
    console.log(`GW${gameweek_id} punished:`, punishedPlayers);

    // Each punished player gets 1 km
    const distancePerPlayer = 1;

    // Create punishments for all punished players
    const punishments: PunishmentResponse[] = [];
    for (const punished of punishedPlayers) {
      // Check if punishment already exists
      const existingPunishment = await checkExistingPunishment(
        supabase,
        league_id,
        punished.player_id,
        gameweek_id
      );

      if (existingPunishment) {
        punishments.push({
          ...existingPunishment,
          player_name: punished.player_name,
          entry_name: punished.entry_name,
          points: punished.points,
          already_existed: true
        });
        continue;
      }

      // Create new punishment
      const newPunishment = await createPunishment(supabase, {
        league_id,
        player_id: punished.player_id,
        gameweek_id,
        distance_km: distancePerPlayer,
        is_completed: false
      });

      punishments.push({
        ...newPunishment,
        player_name: punished.player_name,
        entry_name: punished.entry_name,
        points: punished.points,
        already_existed: false
      });
    }

    return NextResponse.json({
      message: `Generated ${punishments.filter(p => !p.already_existed).length} new punishments`,
      punishments
    });
  } catch (error) {
    console.error('Error generating punishments:', error);
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}

// DELETE: Delete a punishment by ID
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing punishment ID' }, 
        { status: 400 }
      );
    }
    
    // Delete the punishment
    const { error } = await supabase
      .from('punishments')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting punishment:', error);
      return NextResponse.json(
        { error: 'Failed to delete punishment', details: error.message }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'Punishment deleted successfully' }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting punishment:', error);
    return NextResponse.json(
      { error: 'Failed to delete punishment', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 
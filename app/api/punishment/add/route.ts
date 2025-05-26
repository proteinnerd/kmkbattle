import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { league_id, player_id, gameweek_id, distance_km = 1.0, is_completed = false } = body;
    
    if (!league_id || !player_id || !gameweek_id) {
      return NextResponse.json(
        { error: 'Missing required fields: league_id, player_id, and gameweek_id are required' }, 
        { status: 400 }
      );
    }
    
    // Create new punishment
    const punishmentData = {
      league_id,
      player_id,
      gameweek_id,
      distance_km,
      is_completed
    };
    
    const { data, error } = await supabase
      .from('punishments')
      .insert(punishmentData);
    
    if (error) {
      console.error('Error creating punishment:', error);
      return NextResponse.json(
        { error: 'Failed to create punishment', details: error.message }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'Punishment created successfully', punishment: punishmentData }, 
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating punishment:', error);
    return NextResponse.json(
      { error: 'Failed to create punishment', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 
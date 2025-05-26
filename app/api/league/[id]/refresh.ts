import { NextResponse } from 'next/server';
import { getCurrentGameweek } from '@/app/lib/fpl-api';
import { supabase } from '@/app/lib/supabase';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const leagueId = parseInt(params.id);
    if (isNaN(leagueId)) {
      return NextResponse.json({ error: 'Invalid league ID' }, { status: 400 });
    }

    // Delete all punishments for this league
    await supabase.from('punishments').delete().eq('league_id', leagueId);

    // Get current gameweek
    const currentGameweek = await getCurrentGameweek();
    const currentGw = currentGameweek.id;

    // Regenerate punishments for all gameweeks
    for (let gw = 1; gw <= currentGw; gw++) {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/punishment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ league_id: leagueId, gameweek_id: gw })
      });
    }

    return NextResponse.json({ message: 'Punishments refreshed for league ' + leagueId });
  } catch (error) {
    console.error('Error refreshing punishments:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 
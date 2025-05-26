import { NextResponse } from 'next/server';

type AttemptResult = {
  method: string;
  status?: number;
  ok?: boolean;
  time?: string;
  hasData?: boolean;
  dataPreview?: {
    leagueName?: string;
    hasStandings: boolean;
    resultsCount: number;
  } | null;
  error?: string;
  success?: boolean;
};

type TestResults = {
  timestamp: string;
  leagueId: number;
  attempts: AttemptResult[];
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
    
    console.log(`Testing direct FPL API fetch for league ID: ${leagueId}`);
    
    // Direct fetch to FPL API
    const url = `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`;
    console.log(`Fetching from: ${url}`);
    
    // Try different fetch configurations
    const results: TestResults = {
      timestamp: new Date().toISOString(),
      leagueId,
      attempts: []
    };
    
    // Attempt 1: Basic fetch
    try {
      const start = Date.now();
      const response = await fetch(url);
      const time = Date.now() - start;
      
      const status = response.status;
      const ok = response.ok;
      let data = null;
      
      if (ok) {
        data = await response.json();
      }
      
      results.attempts.push({
        method: 'Basic fetch',
        status,
        ok,
        time: `${time}ms`,
        hasData: data !== null,
        dataPreview: data ? {
          leagueName: data.league?.name,
          hasStandings: !!data.standings,
          resultsCount: data.standings?.results?.length || 0
        } : null
      });
    } catch (error) {
      results.attempts.push({
        method: 'Basic fetch',
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    }
    
    // Attempt 2: Fetch with headers
    try {
      const start = Date.now();
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Fantasy-PL-Punishment-Tracker/1.0',
        },
        cache: 'no-store'
      });
      const time = Date.now() - start;
      
      const status = response.status;
      const ok = response.ok;
      let data = null;
      
      if (ok) {
        data = await response.json();
      }
      
      results.attempts.push({
        method: 'Fetch with headers',
        status,
        ok,
        time: `${time}ms`,
        hasData: data !== null,
        dataPreview: data ? {
          leagueName: data.league?.name,
          hasStandings: !!data.standings,
          resultsCount: data.standings?.results?.length || 0
        } : null
      });
    } catch (error) {
      results.attempts.push({
        method: 'Fetch with headers',
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    }
    
    // Attempt 3: Fetch with timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const start = Date.now();
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Fantasy-PL-Punishment-Tracker/1.0',
        },
        signal: controller.signal,
        cache: 'no-store'
      });
      const time = Date.now() - start;
      clearTimeout(timeoutId);
      
      const status = response.status;
      const ok = response.ok;
      let data = null;
      
      if (ok) {
        data = await response.json();
      }
      
      results.attempts.push({
        method: 'Fetch with timeout',
        status,
        ok,
        time: `${time}ms`,
        hasData: data !== null,
        dataPreview: data ? {
          leagueName: data.league?.name,
          hasStandings: !!data.standings,
          resultsCount: data.standings?.results?.length || 0
        } : null
      });
    } catch (error) {
      results.attempts.push({
        method: 'Fetch with timeout',
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in test-league API route:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 
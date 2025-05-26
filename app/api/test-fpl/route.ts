import { NextResponse } from 'next/server';
import { safeFetch } from '@/app/lib/api-utils';

export async function GET() {
  try {
    console.log('Testing direct FPL API connection');
    
    // Test direct fetch to FPL API
    const directFetchStart = Date.now();
    const directResult = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
      headers: {
        'User-Agent': 'Fantasy-PL-Punishment-Tracker/1.0',
      },
      cache: 'no-store',
    });
    const directFetchTime = Date.now() - directFetchStart;
    
    const directStatus = directResult.status;
    const directOk = directResult.ok;
    
    // Only parse the response if it's successful
    let directData = null;
    if (directOk) {
      directData = await directResult.json();
    }
    
    // Test with safeFetch utility
    let safeData = null;
    let safeFetchTime = 0;
    let safeError = null;
    
    try {
      const safeFetchStart = Date.now();
      safeData = await safeFetch('https://fantasy.premierleague.com/api/bootstrap-static/');
      safeFetchTime = Date.now() - safeFetchStart;
    } catch (error) {
      safeError = error instanceof Error ? error.message : 'Unknown error';
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      directFetch: {
        status: directStatus,
        ok: directOk,
        time: `${directFetchTime}ms`,
        hasData: directData !== null,
        dataPreview: directData ? {
          teams_count: directData.teams?.length || 0,
          elements_count: directData.elements?.length || 0,
          events_count: directData.events?.length || 0,
        } : null
      },
      safeFetch: {
        success: safeError === null,
        time: `${safeFetchTime}ms`,
        error: safeError,
        hasData: safeData !== null,
        dataPreview: safeData ? {
          teams_count: safeData.teams?.length || 0,
          elements_count: safeData.elements?.length || 0,
          events_count: safeData.events?.length || 0,
        } : null
      }
    });
  } catch (error) {
    console.error('Error in FPL API test:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 
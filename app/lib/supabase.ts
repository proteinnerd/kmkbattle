import { createClient } from '@supabase/supabase-js';

// These environment variables need to be set in .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Debug environment variables
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey ? 'Key exists (length: ' + supabaseAnonKey.length + ')' : 'No key');

// Create a mock client if credentials are not available
const createMockClient = () => {
  if (typeof window !== 'undefined') {
    console.error('⚠️ Supabase connection failed! Please check your .env.local file.');
    console.error('The application is using a mock database client. No data will be saved or retrieved.');
    console.error('Follow the setup instructions in setup-guide.md to configure Supabase properly.');
  } else {
    console.warn('Using mock Supabase client. Set up proper credentials in .env.local for production use.');
  }
  
  // Mock implementation of Supabase client
  const createQueryBuilder = () => {
    const conditions: Array<{ column: string; value: any }> = [];
    
    const createSelectBuilder = () => {
      const selectBuilder = {
        eq: (column: string, value: any) => {
          conditions.push({ column, value });
          return {
            ...selectBuilder,
            eq: (column: string, value: any) => {
              conditions.push({ column, value });
              return selectBuilder;
            }
          };
        },
        single: () => {
          const mockData: Record<string, any>[] = [{
            id: 'mock-id',
            player_id: conditions.find(c => c.column === 'player_id')?.value || 'mock-player',
            gameweek_id: conditions.find(c => c.column === 'gameweek_id')?.value || 'mock-gameweek',
            league_id: conditions.find(c => c.column === 'league_id')?.value || 'mock-league',
            distance_km: 1,
            is_completed: false,
            completed_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }];
          return Promise.resolve({ data: mockData.length > 0 ? mockData[0] : null, error: null });
        },
        then: <T>(callback: (value: { data: any[]; error: null }) => T) => {
          const mockData: Record<string, any>[] = [{
            id: 'mock-id',
            player_id: conditions.find(c => c.column === 'player_id')?.value || 'mock-player',
            gameweek_id: conditions.find(c => c.column === 'gameweek_id')?.value || 'mock-gameweek',
            league_id: conditions.find(c => c.column === 'league_id')?.value || 'mock-league',
            distance_km: 1,
            is_completed: false,
            completed_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }];
          return Promise.resolve({ data: mockData, error: null }).then(callback);
        }
      };
      return selectBuilder;
    };

    return {
      select: (columns: string = '*') => createSelectBuilder(),
      insert: (data: any) => ({
        select: () => Promise.resolve({ data: [data], error: null }),
        then: <T>(callback: (value: { data: any[]; error: null }) => T) => 
          Promise.resolve({ data: [data], error: null }).then(callback)
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: () => Promise.resolve({ data: [data], error: null }),
          then: <T>(callback: (value: { data: any[]; error: null }) => T) => 
            Promise.resolve({ data: [data], error: null }).then(callback)
        })
      }),
      delete: () => ({
        eq: (column: string, value: any) => Promise.resolve({ data: null, error: null }),
        match: (criteria: any) => Promise.resolve({ data: null, error: null }),
      }),
    };
  };
  
  return {
    from: (table: string) => createQueryBuilder(),
    auth: {
      signUp: () => Promise.resolve({ data: null, error: null }),
      signIn: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  };
};

// Check if Supabase credentials are valid
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return url.includes('supabase.co') || url.includes('supabase.in');
  } catch {
    return false;
  }
};

const isValidKey = (key: string) => {
  return key && key.length > 20 && !key.includes('your-anon-key');
};

// Create a single supabase client for the entire app
export const supabase = (isValidUrl(supabaseUrl) && isValidKey(supabaseAnonKey))
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();

// Type definitions for our database tables
export type Player = {
  id: string;
  fpl_id: number;
  first_name: string;
  last_name: string;
  team_name: string;
  created_at: string;
  updated_at: string;
};

export type League = {
  id: string;
  fpl_league_id: number;
  name: string;
  created_at: string;
  updated_at: string;
};

export type Gameweek = {
  id: string;
  fpl_gameweek_id: number;
  start_date: string;
  end_date: string;
  is_current: boolean;
  is_finished: boolean;
  created_at: string;
  updated_at: string;
};

export type PlayerGameweekScore = {
  id: string;
  player_id: string;
  gameweek_id: string;
  league_id: string;
  points: number;
  created_at: string;
  updated_at: string;
};

export type Punishment = {
  id: string;
  player_id: string;
  gameweek_id: string;
  league_id: string;
  distance_km: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}; 
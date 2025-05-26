'use client';

import { useState } from 'react';
import { supabase } from '@/app/lib/supabase';

export default function TestPunishmentButton({ leagueId }: { leagueId: number }) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message: string } | null>(null);

  const addTestPunishment = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      // Add a test punishment
      const testPunishment = {
        player_id: 2947,
        gameweek_id: 1,
        league_id: leagueId,
        distance_km: 1.0,
        is_completed: true
      };
      
      const { data, error } = await supabase
        .from('punishments')
        .insert(testPunishment);
      
      if (error) {
        setResult({ 
          success: false, 
          message: `Error: ${error.message}. Make sure you've set up Supabase correctly.` 
        });
      } else {
        setResult({ 
          success: true, 
          message: 'Test punishment added successfully! Refresh the page to see it.' 
        });
      }
    } catch (err) {
      setResult({ 
        success: false, 
        message: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={addTestPunishment}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Adding...' : 'Add Test Punishment Data'}
      </button>
      
      {result && (
        <div className={`mt-2 p-2 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {result.message}
        </div>
      )}
    </div>
  );
} 
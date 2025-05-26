'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ErrorDisplay from '@/app/components/ErrorDisplay';
import DebugData from '@/app/components/DebugData';
import dynamic from 'next/dynamic';

// Dynamically import the client component with no SSR
const TestPunishmentButton = dynamic(
  () => import('@/app/components/TestPunishmentButton'),
  { ssr: false }
);

interface LeagueDetails {
  id: number;
  name: string;
  standings: Array<{
    rank: number;
    entry_name: string;
    player_name: string;
    total: number;
    entry: number;
    punishments?: {
      total: number;
      completed: number;
      pending: number;
      distance_km: number;
    };
  }>;
  gameweekLosers?: Array<{
    entry: number;
    entryName: string;
    playerName: string;
    points: number;
  }>;
  currentGameweek?: number;
  punishments?: Array<{
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
  }>;
  gameweekHistory?: Array<{
    entry: number;
    event: number;
    points: number;
  }>;
}

// Group punishments by gameweek for the historical view
interface GameweekPunishment {
  gameweek: number;
  losers: Array<{
    playerName: string;
    entryName: string;
    entry: number;
    points: number;
    distance_km: number;
    is_completed: boolean;
    punishmentId: string;
  }>;
}

export default function LeaguePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const leagueId = params.id;
  
  const [leagueDetails, setLeagueDetails] = useState<LeagueDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{message: string, details?: string} | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [historicalPunishments, setHistoricalPunishments] = useState<GameweekPunishment[]>([]);
  const [totalKilometers, setTotalKilometers] = useState<number>(0);
  const [showAddPunishment, setShowAddPunishment] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  useEffect(() => {
    const fetchLeagueDetails = async () => {
      try {
        setIsLoading(true);
        console.log(`Fetching league details for ID: ${leagueId}`);
        
        const response = await fetch(`/api/league/${leagueId}`);
        const responseData = await response.json();
        
        if (!response.ok) {
          throw new Error(responseData.error || 'Failed to fetch league details');
        }
        
        const data = responseData as LeagueDetails;
        console.log('League data received:', data);
        setLeagueDetails(data);
        
        // Build a set of all gameweeks from punishments
        const allGameweeks = Array.from(new Set((data.punishments || []).map(p => p.gameweek_id)));
        allGameweeks.sort((a, b) => b - a); // Descending order

        // For each gameweek, show all participants
        const gameweekPunishments: GameweekPunishment[] = allGameweeks.map((gw) => {
          const losers = data.standings.map((player) => {
            // Find punishment for this player in this gameweek
            const punishment = (data.punishments || []).find(p => p.player_id === player.entry && p.gameweek_id === gw);
            // Find points for this player in this gameweek
            const points = (data.gameweekHistory || []).find(h => h.entry === player.entry && h.event === gw)?.points || 0;
            return {
              playerName: player.player_name,
              entryName: player.entry_name,
              entry: player.entry,
              points,
              distance_km: punishment ? punishment.distance_km : 0,
              is_completed: punishment ? punishment.is_completed : false,
              punishmentId: punishment ? punishment.id : ''
            };
          });
          return { gameweek: gw, losers };
        });
        setHistoricalPunishments(gameweekPunishments);
        
        // Calculate total kilometers
        if (data.punishments && Array.isArray(data.punishments)) {
          const total = data.punishments.reduce((sum: number, punishment: {
            distance_km: number;
            player_id: number;
          }) => {
            // Only count punishments for the current player
            const currentPlayer = data.standings[0]?.entry;
            if (punishment.player_id === currentPlayer) {
              return sum + (punishment.distance_km || 0);
            }
            return sum;
          }, 0);
          setTotalKilometers(total);
        }
      } catch (err) {
        console.error('Error fetching league details:', err);
        setError({
          message: err instanceof Error ? err.message : 'An error occurred',
          details: err instanceof Error && err.stack ? err.stack : undefined
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLeagueDetails();
  }, [leagueId]);

  const handleRetry = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Retrying league details for ID: ${leagueId}`);
      
      const response = await fetch(`/api/league/${leagueId}`);
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to fetch league details');
      }
      
      const data = responseData as LeagueDetails;
      setLeagueDetails(data);
      
      // Build a set of all gameweeks from punishments
      const allGameweeks = Array.from(new Set((data.punishments || []).map(p => p.gameweek_id)));
      allGameweeks.sort((a, b) => b - a); // Descending order

      // For each gameweek, show all participants
      const gameweekPunishments: GameweekPunishment[] = allGameweeks.map((gw) => {
        const losers = data.standings.map((player) => {
          // Find punishment for this player in this gameweek
          const punishment = (data.punishments || []).find(p => p.player_id === player.entry && p.gameweek_id === gw);
          // Find points for this player in this gameweek
          const points = (data.gameweekHistory || []).find(h => h.entry === player.entry && h.event === gw)?.points || 0;
          return {
            playerName: player.player_name,
            entryName: player.entry_name,
            entry: player.entry,
            points,
            distance_km: punishment ? punishment.distance_km : 0,
            is_completed: punishment ? punishment.is_completed : false,
            punishmentId: punishment ? punishment.id : ''
          };
        });
        return { gameweek: gw, losers };
      });
      setHistoricalPunishments(gameweekPunishments);
      
      // Calculate total kilometers
      if (data.punishments && Array.isArray(data.punishments)) {
        const total = data.punishments.reduce((sum: number, punishment: {
          distance_km: number;
          player_id: number;
        }) => {
          // Only count punishments for the current player
          const currentPlayer = data.standings[0]?.entry;
          if (punishment.player_id === currentPlayer) {
            return sum + (punishment.distance_km || 0);
          }
          return sum;
        }, 0);
        setTotalKilometers(total);
      }
    } catch (err) {
      console.error('Error fetching league details:', err);
      setError({
        message: err instanceof Error ? err.message : 'An error occurred',
        details: err instanceof Error && err.stack ? err.stack : undefined
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePunishmentAdded = () => {
    // Refetch league details to update the UI with new punishment data
    handleRetry();
  };

  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetch(`/api/league/${leagueId}/refresh`, { method: 'POST' });
      // Refetch league details after refresh
      await handleRetry();
    } catch (err) {
      alert('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading league details...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
          <h1 className="mb-4 text-xl font-bold text-red-600">League Error</h1>
          <ErrorDisplay 
            message={error.message}
            details={error.details}
            onRetry={handleRetry}
          />
        </div>
      </div>
    );
  }
  
  if (!leagueDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
          <h1 className="mb-4 text-xl font-bold text-red-600">No Data</h1>
          <p className="mb-6 text-gray-700">No league data was found for ID: {leagueId}</p>
          <Link 
            href="/"
            className="block w-full px-4 py-2 text-sm font-medium text-center text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-6xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Link 
            href="/"
            className="text-blue-600 hover:underline"
          >
            &larr; Back to Home
          </Link>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleForceRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isRefreshing ? 'Refreshing...' : 'Force Refresh Data'}
            </button>
            
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              {showDebug ? 'Hide Debug' : 'Show Debug'}
            </button>
          </div>
        </div>
        
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <h1 className="mb-2 text-3xl font-bold text-gray-800">
            {leagueDetails.name || `League: ${leagueId}`}
          </h1>
          <div className="mb-8 flex justify-between items-center">
            <p className="text-gray-600">
              Current Gameweek: {leagueDetails.currentGameweek || 'Unknown'}
            </p>
          </div>
          
          {showDebug && (
            <DebugData 
              data={leagueDetails} 
              title="League API Response" 
              initiallyExpanded={true} 
            />
          )}
          
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">League Standings</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Manager
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Distance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leagueDetails.standings && leagueDetails.standings.map((entry) => (
                    <tr key={entry.entry}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.rank}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{entry.entry_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{entry.player_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.total}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.punishments ? (
                          <span className="font-medium text-red-600">
                            {entry.punishments.distance_km.toFixed(1)} km
                          </span>
                        ) : (
                          <span>0 km</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  
                  {(!leagueDetails.standings || leagueDetails.standings.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No standings data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Current Gameweek Teams</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Manager
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Distance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leagueDetails.standings && leagueDetails.standings.map((entry) => {
                    // Find points for this player in the current gameweek
                    const gwPoints = leagueDetails.gameweekHistory?.find(
                      h => h.entry === entry.entry && h.event === leagueDetails.currentGameweek
                    )?.points ?? '-';
                    // Find if there's a punishment for this player in the current gameweek
                    const punishment = leagueDetails.punishments?.find(
                      p => p.player_id === entry.entry && 
                           p.gameweek_id === leagueDetails.currentGameweek
                    );
                    return (
                      <tr key={entry.entry}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{entry.entry_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{entry.player_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {gwPoints}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {punishment ? `${punishment.distance_km} km` : '0 km'}
                        </td>
                      </tr>
                    );
                  })}
                  {(!leagueDetails.standings || leagueDetails.standings.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                        No teams data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div>
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Historical Gameweek Losers</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gameweek
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Manager
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Distance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {historicalPunishments.map((gameweek) => (
                    gameweek.losers.map((loser, index) => (
                      <tr key={`${gameweek.gameweek}-${loser.entry}-${index}`}>
                        {index === 0 && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" rowSpan={gameweek.losers.length}>
                            GW {gameweek.gameweek}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{loser.entryName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{loser.playerName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {loser.points}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {loser.distance_km} km
                        </td>
                      </tr>
                    ))
                  ))}
                  
                  {historicalPunishments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No historical punishment data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {historicalPunishments.length === 0 && (
              <div>
                <div className="px-6 py-4 text-center text-sm text-gray-500">
                  No historical punishment data available
                </div>
                
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                  <h3 className="text-lg font-medium text-yellow-800">Missing Punishment Data?</h3>
                  <p className="mt-2 text-sm text-yellow-700">
                    If you're seeing this message, it means there's no punishment data in the database for this league.
                    This could be because:
                  </p>
                  <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                    <li>Your Supabase connection is not properly configured</li>
                    <li>The punishments table hasn't been created</li>
                    <li>There are no punishment records for this league</li>
                  </ul>
                  <p className="mt-2 text-sm text-yellow-700">
                    Check the setup guide for instructions on how to set up Supabase and create the necessary tables.
                  </p>
                  
                  <TestPunishmentButton leagueId={parseInt(leagueId)} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
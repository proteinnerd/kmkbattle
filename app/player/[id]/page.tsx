'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PlayerDetails {
  id: number;
  name: string;
  team: string;
  leagues: {
    id: number;
    name: string;
  }[];
}

export default function PlayerPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const playerId = params.id;
  
  const [playerDetails, setPlayerDetails] = useState<PlayerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchPlayerDetails = async () => {
      try {
        setIsLoading(true);
        console.log(`Fetching player details for ID: ${playerId}`);
        
        // This would be replaced with a real API call to your backend
        // which would then fetch from the FPL API and your Supabase database
        const response = await fetch(`/api/player/${playerId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch player details');
        }
        
        setPlayerDetails(data);
      } catch (err) {
        console.error('Error fetching player details:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlayerDetails();
  }, [playerId]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading player details...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
          <h1 className="mb-4 text-xl font-bold text-red-600">Error</h1>
          <p className="mb-6 text-gray-700">{error}</p>
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
  
  // Placeholder UI until we implement the actual API
  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-4xl mx-auto">
        <div className="mb-6">
          <Link 
            href="/"
            className="text-blue-600 hover:underline"
          >
            &larr; Back to Home
          </Link>
        </div>
        
        <div className="p-6 bg-white rounded-lg shadow-lg">
          <h1 className="mb-2 text-3xl font-bold text-gray-800">
            Player: {playerId}
          </h1>
          <p className="mb-8 text-gray-600">
            This is a placeholder for the player page. In the actual implementation, 
            this would show player details and their leagues.
          </p>
          
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Player Leagues</h2>
            <div className="overflow-hidden bg-white shadow sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {/* Placeholder data */}
                {[1, 2, 3].map((i) => (
                  <li key={i}>
                    <Link 
                      href={`/league/${1000 + i}`}
                      className="block hover:bg-gray-50"
                    >
                      <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-600">
                              Fantasy League {i}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {10 - i} players
                            </p>
                          </div>
                          <div>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div>
            <h2 className="mb-4 text-xl font-semibold text-gray-800">Punishment Summary</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 bg-white rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Total Punishments</h3>
                <p className="mt-2 text-3xl font-bold text-red-600">5 km</p>
              </div>
              <div className="p-4 bg-white rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Completed</h3>
                <p className="mt-2 text-3xl font-bold text-green-600">3 km</p>
              </div>
              <div className="p-4 bg-white rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900">Pending</h3>
                <p className="mt-2 text-3xl font-bold text-yellow-600">2 km</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
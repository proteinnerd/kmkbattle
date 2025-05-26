'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ErrorDisplay from '../components/ErrorDisplay';

interface Player {
  id: number;
  name: string;
  team: number;
}

function SearchResultsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q');
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{message: string, details?: string} | null>(null);
  
  useEffect(() => {
    if (!query) {
      router.push('/');
      return;
    }
    
    const fetchSearchResults = async () => {
      try {
        setIsLoading(true);
        console.log(`Fetching search results for: ${query}`);
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Search failed');
        }
        
        if (data.type === 'league') {
          // If it's a league, redirect directly
          router.push(`/league/${data.data.id}`);
        } else if (data.type === 'players') {
          setPlayers(data.data);
        }
      } catch (err) {
        console.error('Error fetching search results:', err);
        setError({
          message: err instanceof Error ? err.message : 'An error occurred',
          details: err instanceof Error && err.stack ? err.stack : undefined
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSearchResults();
  }, [query, router]);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    fetchSearchResults();
  };
  
  const fetchSearchResults = async () => {
    try {
      console.log(`Fetching search results for: ${query}`);
      const response = await fetch(`/api/search?q=${encodeURIComponent(query || '')}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }
      
      if (data.type === 'league') {
        // If it's a league, redirect directly
        router.push(`/league/${data.data.id}`);
      } else if (data.type === 'players') {
        setPlayers(data.data);
      }
    } catch (err) {
      console.error('Error fetching search results:', err);
      setError({
        message: err instanceof Error ? err.message : 'An error occurred',
        details: err instanceof Error && err.stack ? err.stack : undefined
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Searching...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
          <h1 className="mb-4 text-xl font-bold text-red-600">Search Error</h1>
          <ErrorDisplay 
            message={error.message}
            details={error.details}
            onRetry={handleRetry}
          />
        </div>
      </div>
    );
  }
  
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
          <h1 className="mb-2 text-2xl font-bold text-gray-800">
            Search Results for &quot;{query}&quot;
          </h1>
          <p className="mb-6 text-gray-600">
            Found {players.length} player{players.length !== 1 ? 's' : ''}
          </p>
          
          {players.length > 0 ? (
            <div className="overflow-hidden bg-white shadow sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {players.map((player) => (
                  <li key={player.id}>
                    <Link 
                      href={`/player/${player.id}`}
                      className="block hover:bg-gray-50"
                    >
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-blue-600 truncate">
                            {player.name}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Team {player.team}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-4 text-center bg-gray-50 rounded-md">
              <p className="text-gray-600">No players found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={<div>Loading search results...</div>}>
      <SearchResultsInner />
    </Suspense>
  );
} 
'use client';

import { useState } from 'react';
import Link from 'next/link';
import ErrorDisplay from '@/app/components/ErrorDisplay';

export default function DebugLeague() {
  const [leagueId, setLeagueId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<{message: string, details?: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState<string | null>(null);

  const handleFetchLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!leagueId.trim()) {
      setError({ message: 'Please enter a league ID' });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    setApiEndpoint(`/api/league/${encodeURIComponent(leagueId)}`);
    
    try {
      console.log(`Testing league API for ID: ${leagueId}`);
      const response = await fetch(`/api/league/${encodeURIComponent(leagueId)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || `API error: ${response.status}`);
      }
      
      setResult(data);
    } catch (err) {
      console.error('League API test error:', err);
      setError({
        message: err instanceof Error ? err.message : 'An error occurred',
        details: err instanceof Error && err.stack ? err.stack : undefined
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestDirectFetch = async () => {
    if (!leagueId.trim()) {
      setError({ message: 'Please enter a league ID' });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    setApiEndpoint(`/api/test-league/${encodeURIComponent(leagueId)}`);
    
    try {
      console.log(`Testing direct FPL API fetch for league ID: ${leagueId}`);
      const response = await fetch(`/api/test-league/${encodeURIComponent(leagueId)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || `API error: ${response.status}`);
      }
      
      setResult(data);
    } catch (err) {
      console.error('Direct FPL API test error:', err);
      setError({
        message: err instanceof Error ? err.message : 'An error occurred',
        details: err instanceof Error && err.stack ? err.stack : undefined
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (apiEndpoint && apiEndpoint.includes('test-league')) {
      handleTestDirectFetch();
    } else {
      handleFetchLeague(new Event('submit') as unknown as React.FormEvent);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">League API Debug Page</h1>
      
      <div className="mb-8">
        <form onSubmit={handleFetchLeague} className="flex gap-2 mb-4">
          <input
            type="text"
            value={leagueId}
            onChange={(e) => setLeagueId(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
            placeholder="Enter league ID (e.g. 4154)"
          />
          <button 
            type="submit" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Test League API'}
          </button>
        </form>
        
        <div className="flex gap-2">
          <button
            onClick={handleTestDirectFetch}
            className="px-4 py-2 bg-green-600 text-white rounded-md"
            disabled={isLoading}
          >
            Test Direct FPL API
          </button>
          
          <Link href="/" className="px-4 py-2 bg-gray-600 text-white rounded-md inline-block">
            Back to Home
          </Link>
          
          <Link href={`/league/${leagueId}`} className="px-4 py-2 bg-blue-500 text-white rounded-md inline-block">
            View League Page
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="mb-6">
          <ErrorDisplay 
            title="API Error"
            message={error.message}
            details={error.details}
            onRetry={handleRetry}
          />
        </div>
      )}
      
      {apiEndpoint && (
        <div className="mb-4 p-2 bg-gray-100 rounded">
          <p className="text-sm text-gray-700">
            <strong>Endpoint:</strong> {apiEndpoint}
          </p>
        </div>
      )}
      
      {result && (
        <div className="p-4 bg-gray-50 rounded-md">
          <h2 className="font-bold mb-2">Result</h2>
          <pre className="whitespace-pre-wrap overflow-auto max-h-96 bg-gray-100 p-4 rounded text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 
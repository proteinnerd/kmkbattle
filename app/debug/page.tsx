'use client';

import { useState } from 'react';

export default function DebugSearch() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('Please enter a search term');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log(`Searching for: ${query}`);
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }
      
      setResult(data);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectFplTest = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('Testing direct FPL API fetch');
      const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
      
      if (!response.ok) {
        throw new Error(`FPL API error: ${response.status}`);
      }
      
      const data = await response.json();
      setResult({
        message: 'Direct FPL API fetch successful',
        elements_count: data.elements?.length || 0,
        teams_count: data.teams?.length || 0,
        events_count: data.events?.length || 0
      });
    } catch (err) {
      console.error('Direct FPL API test error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Search Debug Page</h1>
      
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white"
            placeholder="Enter player name or league code"
          />
          <button 
            type="submit" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
            disabled={isLoading}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </form>
        
        <button
          onClick={handleDirectFplTest}
          className="px-4 py-2 bg-green-600 text-white rounded-md"
          disabled={isLoading}
        >
          Test Direct FPL API
        </button>
      </div>
      
      {error && (
        <div className="p-4 mb-4 bg-red-50 text-red-700 rounded-md">
          <h2 className="font-bold">Error</h2>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className="p-4 bg-gray-50 rounded-md">
          <h2 className="font-bold mb-2">Result</h2>
          <pre className="whitespace-pre-wrap overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 
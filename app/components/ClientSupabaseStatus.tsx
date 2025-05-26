'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';

export default function ClientSupabaseStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Try to query the database
        const { data, error } = await supabase
          .from('punishments')
          .select('*')
          .limit(1);
        
        if (error) {
          setStatus('error');
          setErrorMessage(error.message);
        } else {
          setStatus('connected');
        }
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    checkConnection();
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
      status === 'checking' ? 'bg-yellow-100' :
      status === 'connected' ? 'bg-green-100' : 'bg-red-100'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${
            status === 'checking' ? 'bg-yellow-500' :
            status === 'connected' ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="font-medium">
            {status === 'checking' ? 'Checking Supabase connection...' :
             status === 'connected' ? 'Connected to Supabase' : 'Supabase connection error'}
          </span>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="ml-4 text-gray-500 hover:text-gray-700"
        >
          &times;
        </button>
      </div>
      
      {status === 'error' && errorMessage && (
        <div className="mt-2 text-sm text-red-700">
          {errorMessage}
          <div className="mt-1">
            Please check your <code className="bg-red-50 px-1 rounded">.env.local</code> file and make sure you've set up Supabase correctly.
          </div>
        </div>
      )}
      
      {status === 'connected' && (
        <div className="mt-2 text-sm text-green-700">
          Supabase is properly configured! Data will be saved and retrieved correctly.
        </div>
      )}
    </div>
  );
} 
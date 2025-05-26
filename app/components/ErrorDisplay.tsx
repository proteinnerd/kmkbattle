'use client';

import Link from 'next/link';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  details?: string;
  onRetry?: () => void;
}

export default function ErrorDisplay({
  title = 'Error',
  message,
  details,
  onRetry
}: ErrorDisplayProps) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
      <h2 className="text-lg font-semibold text-red-700 mb-2">{title}</h2>
      <p className="text-red-600 mb-2">{message}</p>
      
      {details && (
        <details className="mt-2">
          <summary className="text-sm text-red-500 cursor-pointer">Show technical details</summary>
          <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto max-h-40 whitespace-pre-wrap">
            {details}
          </pre>
        </details>
      )}
      
      <div className="mt-4 flex gap-3">
        {onRetry && (
          <button 
            onClick={onRetry}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        )}
        
        <Link href="/" className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">
          Back to Home
        </Link>
      </div>
    </div>
  );
} 
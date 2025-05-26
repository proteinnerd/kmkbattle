'use client';

import { useState } from 'react';

interface DebugDataProps {
  data: any;
  title?: string;
  initiallyExpanded?: boolean;
}

export default function DebugData({
  data,
  title = 'Debug Data',
  initiallyExpanded = false
}: DebugDataProps) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  return (
    <div className="mt-4 p-2 border border-gray-300 rounded bg-gray-50">
      <div 
        className="flex justify-between items-center cursor-pointer p-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        <button className="text-xs text-blue-600">
          {isExpanded ? 'Hide' : 'Show'}
        </button>
      </div>
      
      {isExpanded && (
        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-96 whitespace-pre-wrap">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
} 
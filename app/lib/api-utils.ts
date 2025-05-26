/**
 * Utility functions for API handling
 */

/**
 * Safe fetch function with timeout and error handling
 */
export async function safeFetch(url: string, options: RequestInit = {}, timeoutMs = 10000) {
  // Create an abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options.headers,
        'User-Agent': 'Fantasy-PL-Punishment-Tracker/1.0',
      },
      // Prevent caching issues
      cache: 'no-store',
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms: ${url}`);
      }
      throw error;
    }
    
    throw new Error(`Unknown error during fetch: ${String(error)}`);
  }
}

/**
 * Parse API error responses
 */
export function parseApiError(error: unknown): { message: string, details?: string } {
  if (error instanceof Error) {
    return {
      message: error.message || 'An error occurred',
      details: error.stack
    };
  }
  
  if (typeof error === 'string') {
    return { message: error };
  }
  
  return { message: 'An unknown error occurred' };
}

/**
 * Helper to handle common API response patterns
 */
export async function handleApiResponse<T>(
  responsePromise: Promise<Response>
): Promise<T> {
  try {
    const response = await responsePromise;
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }
    
    return data as T;
  } catch (error) {
    console.error('API response error:', error);
    throw error;
  }
} 
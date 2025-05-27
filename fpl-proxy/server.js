const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for your Vercel app
app.use(cors({
  origin: ['https://kmkbattle.vercel.app', 'http://localhost:3000']
}));

// Cache for API responses
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to fetch with error handling
async function fetchWithErrorHandling(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'User-Agent': 'Fantasy-PL-Punishment-Tracker/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching from FPL API:', error);
    throw error;
  }
}

// Proxy endpoint for league details
app.get('/api/leagues/:leagueId', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const cacheKey = `league_${leagueId}`;
    
    // Check cache
    const cachedData = cache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      console.log(`Using cached response for league ${leagueId}`);
      return res.json(cachedData.data);
    }

    // Fetch from FPL API
    console.log(`Fetching league details for ID: ${leagueId}`);
    const data = await fetchWithErrorHandling(
      `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`
    );

    // Cache the response
    cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    res.json(data);
  } catch (error) {
    console.error(`Error proxying league request:`, error);
    res.status(502).json({
      error: 'Failed to fetch league details',
      details: error.message
    });
  }
});

// Proxy endpoint for bootstrap static data
app.get('/api/bootstrap-static', async (req, res) => {
  try {
    const cacheKey = 'bootstrap_static';
    
    // Check cache
    const cachedData = cache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      console.log('Using cached bootstrap static data');
      return res.json(cachedData.data);
    }

    // Fetch from FPL API
    console.log('Fetching bootstrap static data');
    const data = await fetchWithErrorHandling(
      'https://fantasy.premierleague.com/api/bootstrap-static/'
    );

    // Cache the response
    cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    res.json(data);
  } catch (error) {
    console.error('Error proxying bootstrap static request:', error);
    res.status(502).json({
      error: 'Failed to fetch bootstrap static data',
      details: error.message
    });
  }
});

// Proxy endpoint for entry history
app.get('/api/entry/:entryId/history', async (req, res) => {
  try {
    const { entryId } = req.params;
    const cacheKey = `entry_${entryId}_history`;
    
    // Check cache
    const cachedData = cache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      console.log(`Using cached entry history for ID: ${entryId}`);
      return res.json(cachedData.data);
    }

    // Fetch from FPL API
    console.log(`Fetching entry history for ID: ${entryId}`);
    const data = await fetchWithErrorHandling(
      `https://fantasy.premierleague.com/api/entry/${entryId}/history/`
    );

    // Cache the response
    cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    res.json(data);
  } catch (error) {
    console.error(`Error proxying entry history request:`, error);
    res.status(502).json({
      error: 'Failed to fetch entry history',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`FPL Proxy server running on port ${port}`);
}); 
# FPL API Proxy Server

A proxy server for the Fantasy Premier League API that handles CORS and caching.

## Features

- CORS support for specified origins
- Response caching (5 minutes)
- Error handling and logging
- Rate limiting protection

## Endpoints

- `GET /api/leagues/:leagueId` - Get league standings
- `GET /api/bootstrap-static` - Get static FPL data
- `GET /api/entry/:entryId/history` - Get entry history
- `GET /health` - Health check endpoint

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## Environment Variables

- `PORT` - Server port (default: 3001)
- `CORS_ORIGINS` - Comma-separated list of allowed origins 
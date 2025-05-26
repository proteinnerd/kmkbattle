# FPL Punishment Tracker Setup Guide

## Setting up Supabase

The application is currently using a mock Supabase client because the environment variables are not set up. To enable actual database functionality:

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. Once your project is created, go to Project Settings > API
4. Copy the "Project URL" and "anon public" key
5. Create a `.env.local` file in the root of your project with:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key
```

**Important**: After creating the `.env.local` file, you need to restart your Next.js development server for the changes to take effect.

## Setting up the Database Tables

Create the following tables in your Supabase dashboard:

### 1. `leagues` Table
- `id` (uuid, primary key)
- `fpl_league_id` (integer, not null)
- `name` (text, not null)
- `created_at` (timestamp with time zone, default: now())
- `updated_at` (timestamp with time zone, default: now())

### 2. `punishments` Table
- `id` (uuid, primary key)
- `player_id` (integer, not null) - FPL player ID
- `gameweek_id` (integer, not null) - FPL gameweek ID
- `league_id` (integer, not null) - FPL league ID
- `distance_km` (numeric, not null, default: 1.0)
- `is_completed` (boolean, not null, default: false)
- `completed_at` (timestamp with time zone, null)
- `created_at` (timestamp with time zone, default: now())
- `updated_at` (timestamp with time zone, default: now())

## SQL Commands for Table Creation

You can also create the tables using SQL in the Supabase SQL Editor:

```sql
-- Create leagues table
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fpl_league_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create punishments table
CREATE TABLE punishments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id INTEGER NOT NULL,
  gameweek_id INTEGER NOT NULL,
  league_id INTEGER NOT NULL,
  distance_km NUMERIC NOT NULL DEFAULT 1.0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Adding Test Punishment Data

To test the historical punishments feature, you can add test data directly in the Supabase dashboard:

1. Go to your Supabase project
2. Navigate to Table Editor > punishments
3. Click "Insert Row" and add test data:

Example data for league ID 1308389:
```json
{
  "player_id": 2947,
  "gameweek_id": 1,
  "league_id": 1308389,
  "distance_km": 1.0,
  "is_completed": true
}
```

```json
{
  "player_id": 5866599,
  "gameweek_id": 2,
  "league_id": 1308389,
  "distance_km": 1.0,
  "is_completed": false
}
```

## Using the Test Script

We've included a test script to verify your Supabase connection and add test data:

1. Make sure you have set up the `.env.local` file with your Supabase credentials
2. Run the test script:
   ```
   node test-supabase.js
   ```
3. If successful, you should see a confirmation message
4. Restart your Next.js server and check the league page

## Troubleshooting

If you still don't see the data:

1. Check the browser console for any errors
2. Look for the Supabase status indicator in the bottom-right corner of the page
3. Verify that the Supabase URL and anon key are correct in your `.env.local` file
4. Make sure the URL format is correct: `https://your-project-id.supabase.co`
5. Ensure the database tables are created with the correct structure
6. Check that the punishment records have the correct `player_id` values that match the FPL entry IDs in your league
7. Try running the test script to verify the connection and add test data

### Common Issues

1. **"No historical punishment data available"** - This means either:
   - Your Supabase connection is not working (mock client is being used)
   - The punishments table doesn't exist
   - There are no punishment records for the league you're viewing

2. **Supabase connection error** - Check your `.env.local` file and make sure:
   - The file is in the root directory of your project
   - The environment variable names are exactly as shown above
   - The URL and key values are correct and don't have extra spaces
   - You've restarted your Next.js server after creating/updating the file

3. **Table doesn't exist error** - Make sure you've created the tables as described above

4. **Permission errors** - Check your Supabase Row Level Security (RLS) settings:
   - For development, you can temporarily enable "Bypass RLS" in your project settings
   - For production, set up appropriate RLS policies 
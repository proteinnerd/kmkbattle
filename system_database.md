# Fantasy FPL Punishment Tracker Database Structure

## Overview
The Fantasy FPL Punishment Tracker uses Supabase (PostgreSQL) as its primary database. This document outlines the data models, relationships, and database design principles used throughout the application.

## Data Models

### players
```sql
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fpl_id INTEGER UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  team_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### leagues
```sql
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fpl_league_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### player_leagues
```sql
CREATE TABLE player_leagues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, league_id)
);
```

### gameweeks
```sql
CREATE TABLE gameweeks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fpl_gameweek_id INTEGER NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_current BOOLEAN DEFAULT FALSE,
  is_finished BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(fpl_gameweek_id)
);
```

### player_gameweek_scores
```sql
CREATE TABLE player_gameweek_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  gameweek_id UUID REFERENCES gameweeks(id) ON DELETE CASCADE,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, gameweek_id, league_id)
);
```

### punishments
```sql
CREATE TABLE punishments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  gameweek_id UUID REFERENCES gameweeks(id) ON DELETE CASCADE,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  distance_km DECIMAL(5,2) DEFAULT 1.0,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, gameweek_id, league_id)
);
```

### admins
```sql
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### league_admins
```sql
CREATE TABLE league_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(admin_id, league_id)
);
```

## Relationships

1. **Player to League** (Many-to-Many)
   - Players participate in multiple leagues through player_leagues
   - Leagues have multiple player participants

2. **Player to Gameweek Score** (One-to-Many)
   - Each player has multiple gameweek scores
   - Each gameweek score belongs to one player

3. **Player to Punishment** (One-to-Many)
   - Each player can have multiple punishments
   - Each punishment belongs to one player

4. **Admin to League** (Many-to-Many)
   - Admins can manage multiple leagues through league_admins
   - Leagues can have multiple admins

## Indexing Strategy

```sql
-- Player-related indexes
CREATE INDEX idx_players_fpl_id ON players(fpl_id);
CREATE INDEX idx_players_last_name ON players(last_name);

-- League-related indexes
CREATE INDEX idx_leagues_fpl_league_id ON leagues(fpl_league_id);
CREATE INDEX idx_player_leagues_player_id ON player_leagues(player_id);
CREATE INDEX idx_player_leagues_league_id ON player_leagues(league_id);

-- Gameweek-related indexes
CREATE INDEX idx_gameweeks_is_current ON gameweeks(is_current);
CREATE INDEX idx_player_gameweek_scores_player_id ON player_gameweek_scores(player_id);
CREATE INDEX idx_player_gameweek_scores_gameweek_id ON player_gameweek_scores(gameweek_id);
CREATE INDEX idx_player_gameweek_scores_league_id ON player_gameweek_scores(league_id);

-- Punishment-related indexes
CREATE INDEX idx_punishments_player_id ON punishments(player_id);
CREATE INDEX idx_punishments_gameweek_id ON punishments(gameweek_id);
CREATE INDEX idx_punishments_league_id ON punishments(league_id);
CREATE INDEX idx_punishments_is_completed ON punishments(is_completed);
```

## Data Access Patterns

### Common Queries
1. Search for player by name
```sql
SELECT * FROM players 
WHERE last_name ILIKE :search_term OR first_name ILIKE :search_term
LIMIT 10;
```

2. Get all leagues for a player
```sql
SELECT l.* 
FROM leagues l
JOIN player_leagues pl ON l.id = pl.league_id
WHERE pl.player_id = :player_id;
```

3. Get league standings
```sql
SELECT p.id, p.first_name, p.last_name, p.team_name, 
       SUM(pgs.points) as total_points,
       COUNT(pu.id) as total_punishments,
       SUM(CASE WHEN pu.is_completed THEN 1 ELSE 0 END) as completed_punishments
FROM players p
JOIN player_leagues pl ON p.id = pl.player_id
JOIN player_gameweek_scores pgs ON p.id = pgs.player_id AND pgs.league_id = pl.league_id
LEFT JOIN punishments pu ON p.id = pu.player_id AND pu.league_id = pl.league_id
WHERE pl.league_id = :league_id
GROUP BY p.id, p.first_name, p.last_name, p.team_name
ORDER BY total_points DESC;
```

4. Get gameweek losers for punishment assignment
```sql
WITH gameweek_scores AS (
  SELECT 
    pgs.league_id,
    pgs.gameweek_id,
    MIN(pgs.points) as min_points
  FROM player_gameweek_scores pgs
  WHERE pgs.gameweek_id = :gameweek_id
  GROUP BY pgs.league_id, pgs.gameweek_id
)
SELECT 
  p.id as player_id,
  p.first_name,
  p.last_name,
  p.team_name,
  pgs.points,
  pgs.league_id,
  pgs.gameweek_id
FROM player_gameweek_scores pgs
JOIN players p ON pgs.player_id = p.id
JOIN gameweek_scores gs ON pgs.league_id = gs.league_id AND pgs.gameweek_id = gs.gameweek_id
WHERE pgs.points = gs.min_points;
```

5. Get punishment status for a league
```sql
SELECT 
  p.first_name,
  p.last_name,
  g.fpl_gameweek_id,
  pu.distance_km,
  pu.is_completed,
  pu.completed_at
FROM punishments pu
JOIN players p ON pu.player_id = p.id
JOIN gameweeks g ON pu.gameweek_id = g.id
WHERE pu.league_id = :league_id
ORDER BY g.fpl_gameweek_id DESC, p.last_name ASC;
```

### Optimization Notes
- Use pagination for league history and player searches
- Implement caching for FPL API data
- Use appropriate indexes for common query patterns
- Consider materialized views for complex aggregations

## Data Validation and Integrity

- Schema validation through database constraints
- Application-level validation before database operations
- Foreign key constraints for referential integrity
- Triggers for automatically assigning punishments

## Database Migrations

When adding new migrations, document them here with the date, description, and changes made.

| Date | Description | Changes |
|------|-------------|---------|
| Initial | Database setup | Created all tables with relationships and indexes |

## Development Roadmap

### Phase 1: Project Setup and Basic Infrastructure
1. **Initialize Next.js project**
   - Create project with TypeScript support
   - Set up Tailwind CSS
   - Configure ESLint and Prettier

2. **Database Setup**
   - Set up Supabase project
   - Create initial database schema
   - Configure Row Level Security (RLS)

3. **FPL API Integration**
   - Create API wrapper for FPL endpoints
   - Implement data fetching and caching
   - Set up error handling

### Phase 2: Core Features Development
1. **Search Functionality**
   - Build search interface for player name and league code
   - Implement search results display
   - Create player profile page
   - Error handling and logging

2. **League Display**
   - Create league standings page
   - Implement gameweek breakdown
   - Build total points calculation
   - Error handling and logging

3. **Punishment Tracking**
   - Implement punishment assignment logic
   - Create punishment tracking display
   - Build punishment completion interface
   - Error handling and logging

### Phase 3: Data Management
1. **Data Synchronization**
   - Implement FPL data sync process
   - Create scheduled updates for gameweek data
   - Build data validation and error handling
   - Error handling and logging

2. **Admin Interface**
   - Create admin authentication
   - Build punishment management interface
   - Implement manual data correction tools
   - Error handling and logging

### Phase 4: User Experience Enhancement
1. **Data Visualization**
   - Implement charts for historical data
   - Create player comparison tools
   - Build league performance graphs
   - Error handling and logging

2. **UI/UX Refinement**
   - Responsive design improvements
   - Animations and transitions
   - Accessibility enhancements
   - Error handling and logging

### Phase 5: Testing and Deployment
1. **Testing**
   - Unit tests for core functionality
   - Integration tests for FPL API
   - End-to-end testing
   - Error handling tests

2. **Optimization**
   - Performance tuning
   - Database query optimization
   - Caching implementation
   - Error monitoring setup

3. **Deployment**
   - Production environment setup
   - CI/CD pipeline configuration
   - Monitoring and logging

### Recommended Libraries
- **Next.js**: Full-stack React framework
- **Tailwind CSS**: Utility-first CSS framework
- **Supabase JS**: Database and authentication
- **SWR or React Query**: Data fetching with caching
- **Recharts or Chart.js**: Data visualization
- **Zod**: Schema validation
- **Jest/React Testing Library**: Testing
- **date-fns**: Date manipulation
- **React Hook Form**: Form handling
- **Sentry**: Error monitoring and logging

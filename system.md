# Fantasy FPL Punishment Tracker System Overview

## IMPORTANT DEVELOPMENT GUIDELINES
- Always read system.md before writing any code
- After adding a major feature or completing a milestone, update system.md
- Document the entire database schema in system_database.md
- For new migrations, make sure to add them to system_database.md
- Always read the database migrations, structure, and models before touching anything
- Build incrementally, feature by feature, using small steps that AI can understand
- Create a Notion board to track all features and implement them one by one
- Always include error handling and console logging for every feature
- Use Supabase for authentication and database management

## Development Approach
1. Document what we're building completely before starting
2. Break down features into small, manageable tasks
3. Implement features one at a time with thorough testing
4. Ensure proper error handling and logging for all features
5. Update documentation after each significant addition

## Introduction
Fantasy FPL Punishment Tracker is a web application that tracks Fantasy Premier League (FPL) leagues with a focus on punishment tracking. The system allows users to search for players by name or league code, view league standings, and track weekly punishments (1km runs) for gameweek losers.

## Core Features
- Search functionality by player name or league code
- League standings display with total points
- Gameweek-by-gameweek breakdown
- Punishment tracking for gameweek losers
- Historical data visualization
- League comparison tools

## Technical Architecture
- Frontend: Next.js with React and TypeScript
- Styling: Tailwind CSS
- API: Next.js server-to-server API routes to FPL API
- Database: Supabase (PostgreSQL)
- Authentication: Supabase Auth (for admin features)
- Data Fetching: SWR or React Query

## User Flow
1. User visits homepage (no login required)
2. User searches for player name or league code
3. If searching by player name, user sees all leagues the player is in
4. If searching by league code, user is taken directly to that league
5. League page shows standings, gameweek results, and punishment tracking
6. Admin can mark punishments as completed

## Components
- Search system
- League display
- Player profile
- Gameweek results
- Punishment tracker
- Historical data charts
- Admin panel (for managing punishments)

## Future Enhancements
- Email notifications for new punishments
- Mobile application
- Social sharing features
- Custom punishment rules
- Integration with fitness tracking apps

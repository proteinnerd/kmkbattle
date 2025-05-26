// Simple script to test Supabase connection
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Get credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('=== Supabase Connection Test ===');
console.log(`URL defined: ${Boolean(supabaseUrl)}`);
console.log(`Key defined: ${Boolean(supabaseKey)}`);

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ ERROR: Supabase credentials are not defined in .env.local');
  console.log('\nFollow these steps to fix the issue:');
  console.log('1. Create a .env.local file in the root directory');
  console.log('2. Add the following lines to the file:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  console.log('3. Replace the placeholder values with your actual Supabase credentials');
  console.log('4. Restart your Next.js development server');
  process.exit(1);
}

// Check if the URL and key look valid
const urlValid = supabaseUrl.startsWith('https://') && supabaseUrl.includes('supabase.co');
const keyValid = supabaseKey.length > 20;

if (!urlValid) {
  console.error('\n❌ ERROR: Supabase URL does not look valid');
  console.log('The URL should start with "https://" and include "supabase.co"');
  console.log(`Current value: ${supabaseUrl}`);
  process.exit(1);
}

if (!keyValid) {
  console.error('\n❌ ERROR: Supabase anon key does not look valid');
  console.log('The key should be a long string (usually starts with "ey")');
  console.log(`Current value: ${supabaseKey}`);
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection by adding a test punishment
async function testConnection() {
  try {
    console.log('\nTesting connection to Supabase...');
    
    // Test query to check if tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('punishments')
      .select('*')
      .limit(1);
    
    if (tablesError) {
      console.error(`\n❌ ERROR: ${tablesError.message}`);
      
      if (tablesError.message.includes('does not exist')) {
        console.log('\nThe "punishments" table does not exist. Follow these steps:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Go to the SQL Editor');
        console.log('3. Run the following SQL commands:');
        console.log(`
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
        `);
      } else if (tablesError.message.includes('permission')) {
        console.log('\nYou have a permissions issue. Try enabling Row Level Security bypass:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Go to Authentication > Policies');
        console.log('3. Enable "Bypass RLS" for the service role');
      }
      
      return;
    }
    
    console.log('\n✅ Successfully connected to Supabase!');
    console.log('Tables exist and are accessible.');
    
    // Add a test punishment
    const testPunishment = {
      player_id: 2947,
      gameweek_id: 1,
      league_id: 1308389,
      distance_km: 1.0,
      is_completed: true
    };
    
    console.log('\nAdding test punishment data...');
    const { data, error } = await supabase
      .from('punishments')
      .insert(testPunishment);
    
    if (error) {
      console.error(`\n❌ ERROR: ${error.message}`);
      
      if (error.message.includes('permission')) {
        console.log('\nYou have a permissions issue. Try enabling Row Level Security bypass:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Go to Authentication > Policies');
        console.log('3. Enable "Bypass RLS" for the service role');
      }
    } else {
      console.log('\n✅ Successfully added test punishment!');
      console.log('Your historical punishments should now appear in the league page.');
      console.log('Restart your Next.js server and refresh the page to see the changes.');
    }
  } catch (err) {
    console.error('\n❌ Unexpected error:', err);
  }
}

testConnection(); 
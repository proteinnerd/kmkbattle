const { createClient } = require('@supabase/supabase-js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const LEAGUE_ID = 1308389;
const PLAYER_IDS = [2947, 5866599]; // Sondre, Thor Emil

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getEntryHistory(entryId) {
  const res = await fetch(`https://fantasy.premierleague.com/api/entry/${entryId}/history/`);
  if (!res.ok) throw new Error(`Failed to fetch entry history for ${entryId}`);
  const data = await res.json();
  return data.current.map(gw => ({ event: gw.event, points: gw.points }));
}

async function getPunishmentsFromDB() {
  const { data, error } = await supabase
    .from('punishments')
    .select('player_id,gameweek_id')
    .eq('league_id', LEAGUE_ID);
  if (error) throw error;
  return data;
}

function calculateExpectedPunishments(historyA, historyB, idA, idB) {
  const punishments = [];
  for (let i = 0; i < Math.max(historyA.length, historyB.length); i++) {
    const gwA = historyA[i];
    const gwB = historyB[i];
    if (!gwA || !gwB) continue;
    if (gwA.points < gwB.points) punishments.push({ player_id: idA, gameweek_id: gwA.event });
    else if (gwA.points > gwB.points) punishments.push({ player_id: idB, gameweek_id: gwB.event });
    else {
      // Tie: both get a punishment
      punishments.push({ player_id: idA, gameweek_id: gwA.event });
      punishments.push({ player_id: idB, gameweek_id: gwB.event });
    }
  }
  return punishments;
}

(async () => {
  try {
    console.log('Fetching entry histories...');
    const [historyA, historyB] = await Promise.all([
      getEntryHistory(PLAYER_IDS[0]),
      getEntryHistory(PLAYER_IDS[1]),
    ]);
    const expected = calculateExpectedPunishments(historyA, historyB, PLAYER_IDS[0], PLAYER_IDS[1]);
    const dbPunishments = await getPunishmentsFromDB();

    // Build sets for comparison
    const expectedSet = new Set(expected.map(p => `${p.player_id}-${p.gameweek_id}`));
    const dbSet = new Set(dbPunishments.map(p => `${p.player_id}-${p.gameweek_id}`));

    // Find missing and extra
    const missing = [...expectedSet].filter(x => !dbSet.has(x));
    const extra = [...dbSet].filter(x => !expectedSet.has(x));
    const correct = [...expectedSet].filter(x => dbSet.has(x));

    console.log('\n=== Punishment Verification Report ===');
    console.log(`Expected punishments: ${expected.length}`);
    console.log(`Database punishments: ${dbPunishments.length}`);
    console.log(`Correct punishments: ${correct.length}`);
    console.log(`Missing punishments: ${missing.length}`);
    if (missing.length) {
      console.log('  Missing:');
      missing.forEach(x => console.log('   ', x));
    }
    console.log(`Extra punishments: ${extra.length}`);
    if (extra.length) {
      console.log('  Extra:');
      extra.forEach(x => console.log('   ', x));
    }
    console.log('======================================\n');
  } catch (err) {
    console.error('Error verifying punishments:', err);
    process.exit(1);
  }
})(); 
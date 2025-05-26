const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Script to generate historical punishments for all gameweeks
async function generateHistoricalPunishments() {
  const LEAGUE_ID = 1308389; // Your league ID
  const CURRENT_GAMEWEEK = 38; // Current gameweek in the season
  const SERVER_PORT = 3000; // Default port
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 1000; // 1 second
  
  console.log('Generating historical punishments...');
  
  // Generate punishments for each gameweek
  for (let gameweek = 1; gameweek <= CURRENT_GAMEWEEK; gameweek++) {
    console.log(`Processing gameweek ${gameweek}...`);
    
    let retries = 0;
    let success = false;
    
    while (retries < MAX_RETRIES && !success) {
      try {
        const response = await fetch(`http://localhost:${SERVER_PORT}/api/punishment`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            league_id: LEAGUE_ID,
            gameweek_id: gameweek
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
        }
        
        const data = await response.json();
        console.log(`Gameweek ${gameweek} result:`, data);
        success = true;
        
        // Add a small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        retries++;
        if (error.code === 'ECONNREFUSED') {
          console.error(`Attempt ${retries}/${MAX_RETRIES}: Development server not responding on port ${SERVER_PORT}`);
          if (retries < MAX_RETRIES) {
            console.log(`Waiting ${RETRY_DELAY}ms before retrying...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          } else {
            console.error('Error: Development server is not running. Please start the server with npm run dev');
            process.exit(1);
          }
        } else {
          console.error(`Error processing gameweek ${gameweek} (Attempt ${retries}/${MAX_RETRIES}):`, error.message);
          if (retries < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          }
        }
      }
    }
    
    if (!success) {
      console.error(`Failed to process gameweek ${gameweek} after ${MAX_RETRIES} attempts`);
    }
  }
  
  console.log('Finished generating historical punishments!');
}

// Run the script
generateHistoricalPunishments().catch(console.error); 
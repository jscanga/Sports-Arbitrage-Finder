// app/api/odds/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventType = searchParams.get('eventType');
  const providedApiKey = searchParams.get('apiKey');
  
  const apiKey = providedApiKey || process.env.ODDS_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: 'No API key provided' }, { status: 400 });
  }

  try {
    // Get ALL available sports
    const sportsResponse = await fetch(
      `https://api.the-odds-api.com/v4/sports/?apiKey=${apiKey}`
    );
    
    if (!sportsResponse.ok) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }
    
    const allSports = await sportsResponse.json();
    
    const activeSports = allSports.filter((sport: any) => 
      sport.active === true && 
      !sport.key.includes('_future_') &&
      !sport.key.includes('outrights')
    );

    const sportKeys = activeSports.map((sport: any) => sport.key);
    
    console.log(`Fetching ${eventType || 'all'} events for ALL ${sportKeys.length} sports`);

    let allOdds = [];
    
    for (const sportKey of sportKeys) {
      try {
        const response = await fetch(
          `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`
        );
        
        if (response.ok) {
          let sportOdds = await response.json();
          
          if (sportOdds && sportOdds.length > 0) {
            if (eventType === 'live') {
              sportOdds = sportOdds.filter((game: any) => {
                const gameTime = new Date(game.commence_time);
                const now = new Date();
                return gameTime <= now;
              });
            } else if (eventType === 'pregame') {
              sportOdds = sportOdds.filter((game: any) => {
                const gameTime = new Date(game.commence_time);
                const now = new Date();
                return gameTime > now;
              });
            }
            
            if (sportOdds.length > 0) {
              console.log(`Found ${sportOdds.length} games for ${sportKey}`);
              allOdds = allOdds.concat(sportOdds);
            }
          }
        } else {
          console.log(`No data or error for ${sportKey}: ${response.status}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        console.log(`Error fetching ${sportKey}:`, error);
      }
    }
    
    console.log(`✅ Total games fetched: ${allOdds.length}`);
    return NextResponse.json(allOdds);
    
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch odds' }, { status: 500 });
  }
}
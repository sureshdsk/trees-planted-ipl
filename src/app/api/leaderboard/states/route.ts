import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

// Map of Indian states to their ISO codes
const STATE_CODES = {
  'Maharashtra': 'IN-MH',
  'Tamil Nadu': 'IN-TN',
  'Karnataka': 'IN-KA',
  'West Bengal': 'IN-WB',
  'Delhi': 'IN-DL',
  'Punjab': 'IN-PB',
  'Rajasthan': 'IN-RJ',
  'Telangana': 'IN-TG',
  'Uttar Pradesh': 'IN-UP',
  'Gujarat': 'IN-GJ',
  'Andhra Pradesh': 'IN-AP',
  'Assam': 'IN-AS',
  'Bihar': 'IN-BR',
  'Chhattisgarh': 'IN-CT',
  'Goa': 'IN-GA',
  'Haryana': 'IN-HR',
  'Himachal Pradesh': 'IN-HP',
  'Jharkhand': 'IN-JH',
  'Kerala': 'IN-KL',
  'Madhya Pradesh': 'IN-MP',
  'Manipur': 'IN-MN',
  'Meghalaya': 'IN-ML',
  'Mizoram': 'IN-MZ',
  'Nagaland': 'IN-NL',
  'Odisha': 'IN-OR',
  'Sikkim': 'IN-SK',
  'Tripura': 'IN-TR',
  'Uttarakhand': 'IN-UT',
  'Arunachal Pradesh': 'IN-AR',
  'Jammu and Kashmir': 'IN-JK'
};

// Map of team IDs to their states
const TEAM_STATES = {
  'MI': 'Maharashtra',
  'CSK': 'Tamil Nadu',
  'RCB': 'Karnataka',
  'KKR': 'West Bengal',
  'DC': 'Delhi',
  'PBKS': 'Punjab',
  'RR': 'Rajasthan',
  'SRH': 'Telangana',
  'LSG': 'Uttar Pradesh',
  'GT': 'Gujarat'
};

// Map team IDs from database to team codes
const DB_TEAM_MAPPING: Record<string, string> = {
  '13': 'CSK',
  '14': 'DC',
  '15': 'PBKS',
  '16': 'KKR',
  '17': 'MI',
  '18': 'RR',
  '19': 'SRH',
  '20': 'GT',
  '35': 'RCB', 
  '77': 'LSG'
};

// Type for state-based leaderboard entry
type StateLeaderboardEntry = {
  state: string;
  state_code: string;
  dot_balls: number;
  trees_planted: number;
  top_team_id: string;
  top_team_name: string;
};

/**
 * GET handler for fetching state-based leaderboard data
 * Returns data aggregated by state with the top team in each state
 */
export async function GET() {
  try {
    // Get the D1 database binding from the request context
    const { env } = getRequestContext()
    // @ts-expect-error - D1 binding is defined in wrangler but TypeScript doesn't recognize it
    const db = env.DB

    // Query to get team data from TreePlantingSummary and Teams tables
    const teamQuery = `
      SELECT 
        tps.team_id,
        t.team_name,
        tps.total_trees_planted
      FROM 
        TreePlantingSummary tps
      JOIN 
        Teams t ON tps.team_id = t.team_id
    `

    // Execute the query
    const { results: teamData } = await db.prepare(teamQuery).all()
    
    // Add dot balls calculation and map team IDs to codes
    const processedTeamData = teamData.map((entry: any) => ({
      ...entry,
      team_code: DB_TEAM_MAPPING[entry.team_id] || 'UNKNOWN',
      dot_balls: Math.round(entry.total_trees_planted / 18) // Calculate dot balls as total_trees_planted/18
    }))

    // Aggregate data by state
    const stateMap = new Map<string, StateLeaderboardEntry>()
    
    processedTeamData.forEach((team: any) => {
      const state = TEAM_STATES[team.team_code as keyof typeof TEAM_STATES]
      if (!state) return
      
      const stateCode = STATE_CODES[state as keyof typeof STATE_CODES]
      if (!stateCode) return
      
      // If state exists in map, update it if this team has more dot balls
      if (stateMap.has(state)) {
        const existingEntry = stateMap.get(state)!
        
        if (team.dot_balls > existingEntry.dot_balls) {
          stateMap.set(state, {
            state,
            state_code: stateCode,
            dot_balls: team.dot_balls,
            trees_planted: team.total_trees_planted,
            top_team_id: team.team_code,
            top_team_name: team.team_name
          })
        }
      } else {
        // Add new state entry
        stateMap.set(state, {
          state,
          state_code: stateCode,
          dot_balls: team.dot_balls,
          trees_planted: team.total_trees_planted,
          top_team_id: team.team_code,
          top_team_name: team.team_name
        })
      }
    })
    
    // Convert Map to Array for response
    const stateData = Array.from(stateMap.values())
    
    // Return the state-based leaderboard data as JSON
    return Response.json({
      success: true,
      data: stateData,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'max-age=60, s-maxage=60',
      }
    })
  } catch (error) {
    console.error('Error fetching state leaderboard data:', error)
    
    return Response.json({
      success: false,
      error: 'Failed to fetch state leaderboard data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500
    })
  }
} 
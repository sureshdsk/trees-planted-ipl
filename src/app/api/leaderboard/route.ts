import { getRequestContext } from '@cloudflare/next-on-pages'

export const runtime = 'edge'

// Type definition for database query results
type TeamLeaderboardData = {
  team_id: string;
  team_name: string;
  total_trees_planted: number;
  previous_position: number | null;
  position_change: number | null;
}

// Type definition with added current_position and dot_balls
type TeamLeaderboardEntry = TeamLeaderboardData & {
  current_position: number;
  dot_balls: number;
}

/**
 * GET handler for fetching leaderboard data
 * Returns the leaderboard sorted by total trees planted in descending order
 */
export async function GET() {
  try {
    // Get the D1 database binding from the request context
    const { env } = getRequestContext()
    // @ts-expect-error - D1 binding is defined in wrangler but TypeScript doesn't recognize it
    const db = env.DB

    // Query to join TreePlantingSummary and Teams tables
    const leaderboardQuery = `
      SELECT 
        tps.team_id,
        t.team_name,
        tps.total_trees_planted
      FROM 
        TreePlantingSummary tps
      JOIN 
        Teams t ON tps.team_id = t.team_id
      ORDER BY 
        tps.total_trees_planted DESC
    `

    // Execute the query
    const { results: leaderboardData } = await db.prepare(leaderboardQuery).all()
    
    // Add current position based on the sorted order and calculate dot balls
    const leaderboard = leaderboardData.map((entry: TeamLeaderboardData, index: number): TeamLeaderboardEntry => ({
      ...entry,
      current_position: index + 1,
      dot_balls: Math.round(entry.total_trees_planted / 18) // Calculate dot balls as total_trees_planted/18
    }))
    
    // Return the leaderboard data as JSON
    return Response.json({
      success: true,
      data: leaderboard,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'max-age=60, s-maxage=60',
      }
    })
  } catch (error) {
    console.error('Error fetching leaderboard data:', error)
    
    return Response.json({
      success: false,
      error: 'Failed to fetch leaderboard data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500
    })
  }
} 
'use client';

import { useEffect, useState } from 'react';
import { Chart } from 'react-google-charts';

// Define team locations with coordinates
const TEAM_LOCATIONS = {
  'MI': { name: 'Mumbai Indians', city: 'Mumbai', state: 'Maharashtra', lat: 19.076, lng: 72.8777 },
  'CSK': { name: 'Chennai Super Kings', city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  'RCB': { name: 'Royal Challengers Bangalore', city: 'Bangalore', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  'KKR': { name: 'Kolkata Knight Riders', city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  'DC': { name: 'Delhi Capitals', city: 'Delhi', state: 'Delhi', lat: 28.7041, lng: 77.1025 },
  'PBKS': { name: 'Punjab Kings', city: 'Mohali', state: 'Punjab', lat: 30.7046, lng: 76.7179 },
  'RR': { name: 'Rajasthan Royals', city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  'SRH': { name: 'Sunrisers Hyderabad', city: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
  'LSG': { name: 'Lucknow Super Giants', city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
  'GT': { name: 'Gujarat Titans', city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 }
};

// Map of Indian states to their ISO codes (needed for GeoChart)
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

type LeaderboardEntry = {
  team_id: string;
  team_name: string;
  total_trees_planted: number;
  current_position: number;
  dot_balls: number;
};

type LeaderboardResponse = {
  success: boolean;
  data: LeaderboardEntry[];
  timestamp: string;
  error?: string;
  message?: string;
};

type StateLeaderboardEntry = {
  state: string;
  state_code: string;
  dot_balls: number;
  trees_planted: number;
  top_team_id: string;
  top_team_name: string;
};

type StateLeaderboardResponse = {
  success: boolean;
  data: StateLeaderboardEntry[];
  timestamp: string;
  error?: string;
  message?: string;
};

export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [stateLeaderboardData, setStateLeaderboardData] = useState<StateLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredTeam, setHoveredTeam] = useState<LeaderboardEntry | null>(null);
  const [mapData, setMapData] = useState<any[]>([]);
  const [chartOptions, setChartOptions] = useState({});
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch team leaderboard data
        const teamResponse = await fetch('/api/leaderboard');
        const teamData: LeaderboardResponse = await teamResponse.json();
        
        if (!teamData.success) {
          throw new Error(teamData.error || 'Failed to fetch team leaderboard data');
        }
        
        setLeaderboardData(teamData.data);
        
        // Fetch state leaderboard data
        const stateResponse = await fetch('/api/leaderboard/states');
        const stateData: StateLeaderboardResponse = await stateResponse.json();
        
        if (!stateData.success) {
          throw new Error(stateData.error || 'Failed to fetch state leaderboard data');
        }
        
        setStateLeaderboardData(stateData.data);
      } catch (err) {
        setError('Error fetching leaderboard data: ' + (err instanceof Error ? err.message : String(err)));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Prepare GeoChart data whenever state leaderboard data changes
  useEffect(() => {
    if (stateLeaderboardData.length === 0) return;
    
    // Create data array for GeoChart - now including team name for tooltips
    const geoChartData = [
      ['State', 'Dot Balls', {role: 'tooltip', p: {html: true}}],
      ...stateLeaderboardData.map(state => [
        state.state_code,
        state.dot_balls,
        `<div style="padding:10px; background-color:white; border-radius:5px; border:1px solid #eaeaea; box-shadow:0 2px 5px rgba(0,0,0,0.1);">
          <div style="font-weight:bold; margin-bottom:5px; color:#2e7d32;">${state.state}</div>
          <div style="display:flex; margin-bottom:3px;">
            <span style="font-weight:bold; color:#333; min-width:70px;">Team:</span>
            <span style="color:#444;">${state.top_team_id}</span>
          </div>
          <div style="display:flex; margin-bottom:3px;">
            <span style="font-weight:bold; color:#333; min-width:70px;">Dot Balls:</span>
            <span style="color:#444;">${state.dot_balls.toLocaleString()}</span>
          </div>
          <div style="display:flex;">
            <span style="font-weight:bold; color:#333; min-width:70px;">Trees:</span>
            <span style="color:#444;">${state.trees_planted.toLocaleString()}</span>
          </div>
        </div>`
      ])
    ];
    
    setMapData(geoChartData);
    
    // Set GeoChart options with HTML tooltips enabled
    setChartOptions({
      region: 'IN',
      domain: 'IN',
      displayMode: 'regions',
      resolution: 'provinces',
      backgroundColor: '#f7f9fc',
      datalessRegionColor: '#f5f5f5',
      defaultColor: '#e0e0e0',
      colorAxis: {
        colors: ['#c8e6c9', '#81c784', '#4caf50', '#2e7d32', '#1b5e20'],
        minValue: 0
      },
      legend: {
        textStyle: {
          color: 'black',
          fontSize: 14,
          bold: true
        }
      },
      tooltip: {
        isHtml: true,
        showTitle: false
      },
      enableRegionInteractivity: true,
    });
    
  }, [stateLeaderboardData]);

  // Find a team by its ID from the leaderboard data
  const findTeamById = (teamId: string): LeaderboardEntry | undefined => {
    return leaderboardData.find(team => team.team_id === teamId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mb-4 mx-auto"></div>
          <h2 className="text-xl font-semibold text-green-800">Growing Forests...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-red-50 to-red-100">
        <div className="bg-white border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-2 text-center text-green-900">IPL 2025 Green Initiative</h1>
        <p className="text-xl text-center mb-8 text-green-700">Team Forest Visualization</p>
        
        <div className="mb-6 text-center">
          <div className="inline-flex items-center bg-white px-4 py-2 rounded-full shadow-md">
            <span className="mr-2">🌲</span>
            <p className="text-gray-600">State color intensity = Dot Balls </p>
            <span className="ml-2">🏏</span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-xl overflow-hidden p-4 mb-8">
          <div className="shadow-sm border border-gray-100 rounded-lg">
            {mapData.length > 0 && (
              <Chart
                chartType="GeoChart"
                width="100%"
                height="600px"
                data={mapData}
                options={chartOptions}
                chartEvents={[
                  {
                    eventName: 'select',
                    callback: ({ chartWrapper }) => {
                      if (!chartWrapper) return;
                      
                      const chart = chartWrapper.getChart();
                      const selection = chart.getSelection();
                      if (selection.length === 0) return;
                      
                      const selectedRow = selection[0].row;
                      const region = mapData[selectedRow + 1][0];
                      
                      // Find the state entry with this state code
                      const stateEntry = stateLeaderboardData.find(
                        state => state.state_code === region
                      );
                      
                      if (stateEntry) {
                        // Find the corresponding team in the teams leaderboard
                        const teamEntry = leaderboardData.find(
                          team => team.team_id === stateEntry.top_team_id
                        );
                        
                        if (teamEntry) {
                          setHoveredTeam(teamEntry);
                        }
                      }
                    },
                  },
                ]}
              />
            )}
          </div>
        </div>
        
        {hoveredTeam && (
          <div className="max-w-xl mx-auto bg-white p-4 rounded-lg shadow-md mb-8 border-2 border-green-300">
            <h3 className="font-bold text-lg text-green-800 border-b border-green-200 pb-1 mb-2">{hoveredTeam.team_name}</h3>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-600">Rank:</span>
              <span className="font-bold text-green-700">#{hoveredTeam.current_position}</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-600">Dot Balls:</span>
              <span className="font-bold text-green-700">{hoveredTeam.dot_balls.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Trees Planted:</span>
              <span className="font-bold text-green-700">{hoveredTeam.total_trees_planted.toLocaleString()}</span>
            </div>
          </div>
        )}
        
        <div className="flex justify-between mt-6 mb-10 max-w-xl mx-auto bg-white bg-opacity-80 p-3 rounded-lg shadow-md">
          <div className="legend-item flex items-center">
            <div className="w-5 h-5 rounded-full bg-green-300 mr-2"></div>
            <span>Fewer Dot Balls</span>
          </div>
          <div className="legend-item flex items-center">
            <div className="w-5 h-5 rounded-full bg-green-500 mr-2"></div>
            <span>Medium</span>
          </div>
          <div className="legend-item flex items-center">
            <div className="w-5 h-5 rounded-full bg-green-800 mr-2"></div>
            <span>More Dot Balls</span>
          </div>
        </div>
        
        <div className="mt-12 bg-white rounded-xl shadow-xl p-6 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-green-800">State Leaderboard</h2>
          <div className="overflow-x-auto mb-8">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-green-600 text-white">
                <tr>
                  <th className="py-3 px-4 text-left">State</th>
                  <th className="py-3 px-4 text-left">Top Team</th>
                  <th className="py-3 px-4 text-center">Team ID</th>
                  <th className="py-3 px-4 text-left">Dot Balls</th>
                  <th className="py-3 px-4 text-left">Trees Planted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stateLeaderboardData
                  .sort((a, b) => b.dot_balls - a.dot_balls)
                  .map((entry) => (
                    <tr 
                      key={entry.state_code} 
                      className="hover:bg-green-50 transition-colors cursor-pointer"
                      onClick={() => {
                        const teamEntry = leaderboardData.find(
                          team => team.team_id === entry.top_team_id
                        );
                        if (teamEntry) {
                          setHoveredTeam(teamEntry);
                        }
                      }}
                    >
                      <td className="py-3 px-4 font-medium">{entry.state}</td>
                      <td className="py-3 px-4">{entry.top_team_name}</td>
                      <td className="py-3 px-4 text-center font-bold bg-green-50">{entry.top_team_id}</td>
                      <td className="py-3 px-4">{entry.dot_balls.toLocaleString()}</td>
                      <td className="py-3 px-4">{entry.trees_planted.toLocaleString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          
          <h2 className="text-2xl font-bold mb-4 text-green-800">Team Leaderboard</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-green-600 text-white">
                <tr>
                  <th className="py-3 px-4 text-left">Position</th>
                  <th className="py-3 px-4 text-left">Team</th>
                  <th className="py-3 px-4 text-left">Dot Balls</th>
                  <th className="py-3 px-4 text-left">Trees Planted</th>
                  <th className="py-3 px-4 text-left">Home State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaderboardData.map((entry) => {
                  const location = TEAM_LOCATIONS[entry.team_id as keyof typeof TEAM_LOCATIONS];
                  return (
                    <tr 
                      key={entry.team_id} 
                      className="hover:bg-green-50 transition-colors cursor-pointer"
                      onClick={() => setHoveredTeam(entry)}
                    >
                      <td className="py-3 px-4 font-bold text-green-800">#{entry.current_position}</td>
                      <td className="py-3 px-4 font-medium">{entry.team_name}</td>
                      <td className="py-3 px-4">{entry.dot_balls.toLocaleString()}</td>
                      <td className="py-3 px-4">{entry.total_trees_planted.toLocaleString()}</td>
                      <td className="py-3 px-4">{location ? location.state : 'N/A'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 
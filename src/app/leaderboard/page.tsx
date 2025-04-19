'use client';

import { useEffect, useState } from 'react';

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

export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/leaderboard');
        const data: LeaderboardResponse = await response.json();
        
        if (data.success) {
          setLeaderboardData(data.data);
        } else {
          setError(data.error || 'Failed to fetch leaderboard data');
        }
      } catch (err) {
        setError('Error fetching leaderboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p><strong>Error:</strong> {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">IPL 2025 Tree Planting Leaderboard</h1>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-green-600 text-white">
            <tr>
              <th className="py-3 px-4 text-left">Position</th>
              <th className="py-3 px-4 text-left">Team</th>
              <th className="py-3 px-4 text-left">Dot Balls</th>
              <th className="py-3 px-4 text-left">Trees Planted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {leaderboardData.map((entry) => (
              <tr key={entry.team_id} className="hover:bg-gray-50">
                <td className="py-3 px-4">{entry.current_position}</td>
                <td className="py-3 px-4 font-medium">{entry.team_name}</td>
                <td className="py-3 px-4">{entry.dot_balls.toLocaleString()}</td>
                <td className="py-3 px-4">{entry.total_trees_planted.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
    </div>
  );
} 
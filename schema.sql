-- Matches table to store match information
CREATE TABLE Matches (
  match_id TEXT PRIMARY KEY,
  match_url TEXT NOT NULL,
  match_date DATETIME NOT NULL,
  timestamp DATETIME NOT NULL
);

-- Teams table to store team information
CREATE TABLE Teams (
  team_id TEXT PRIMARY KEY,
  team_name TEXT NOT NULL
);

-- Team match performance table
CREATE TABLE TeamMatchPerformance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  total_dot_balls_bowled INTEGER NOT NULL,
  total_trees_planted INTEGER NOT NULL,
  FOREIGN KEY (match_id) REFERENCES Matches(match_id),
  FOREIGN KEY (team_id) REFERENCES Teams(team_id),
  UNIQUE(match_id, team_id)
);

-- Players table to store player information
CREATE TABLE Players (
  player_id TEXT PRIMARY KEY,
  player_name TEXT NOT NULL,
  team_id TEXT NOT NULL,
  FOREIGN KEY (team_id) REFERENCES Teams(team_id)
);

-- Player match performance table
CREATE TABLE PlayerMatchPerformance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  dot_balls_bowled INTEGER NOT NULL DEFAULT 0,
  trees_planted INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (match_id) REFERENCES Matches(match_id),
  FOREIGN KEY (player_id) REFERENCES Players(player_id),
  FOREIGN KEY (team_id) REFERENCES Teams(team_id),
  UNIQUE(match_id, player_id)
);

-- Summary table for quick statistics with position tracking
CREATE TABLE TreePlantingSummary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id TEXT NOT NULL UNIQUE,
  total_trees_planted INTEGER NOT NULL DEFAULT 0,
  last_updated DATETIME NOT NULL,
  previous_position INTEGER,
  current_position INTEGER,
  position_change INTEGER,
  FOREIGN KEY (team_id) REFERENCES Teams(team_id)
);

-- Indexes for performance
CREATE INDEX idx_match_date ON Matches(match_date);
CREATE INDEX idx_team_performance ON TeamMatchPerformance(team_id, match_id);
CREATE INDEX idx_player_performance ON PlayerMatchPerformance(player_id, match_id);
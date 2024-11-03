import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Completed games with scores
const COMPLETED_GAMES = [
  { week: 2, team1: "South Carolina", team2: "Kentucky", team1Score: 6, team2Score: 37 },
  { week: 3, team1: "Georgia", team2: "Kentucky", team1Score: 13, team2Score: 12 },
  { week: 3, team1: "Texas A&M", team2: "Florida", team1Score: 23, team2Score: 20 },
  { week: 4, team1: "Arkansas", team2: "Auburn", team1Score: 17, team2Score: 24 },
  { week: 4, team1: "Florida", team2: "Mississippi State", team1Score: 45, team2Score: 28 },
  { week: 4, team1: "Vanderbilt", team2: "Missouri", team1Score: 27, team2Score: 30 },
  { week: 4, team1: "Tennessee", team2: "Oklahoma", team1Score: 25, team2Score: 15 },
  { week: 5, team1: "Arkansas", team2: "Texas A&M", team1Score: 20, team2Score: 26 },
  { week: 5, team1: "Georgia", team2: "Alabama", team1Score: 34, team2Score: 41 },
  { week: 5, team1: "Oklahoma", team2: "Auburn", team1Score: 17, team2Score: 20 },
  { week: 5, team1: "Kentucky", team2: "Ole Miss", team1Score: 13, team2Score: 52 },
  { week: 5, team1: "Mississippi State", team2: "Texas", team1Score: 10, team2Score: 52 },
  { week: 6, team1: "Tennessee", team2: "Arkansas", team1Score: 14, team2Score: 19 },
  { week: 6, team1: "Auburn", team2: "Georgia", team1Score: 24, team2Score: 27 },
  { week: 6, team1: "Ole Miss", team2: "South Carolina", team1Score: 34, team2Score: 17 },
  { week: 6, team1: "Missouri", team2: "Texas A&M", team1Score: 23, team2Score: 38 },
  { week: 6, team1: "Alabama", team2: "Vanderbilt", team1Score: 35, team2Score: 40 },
  { week: 7, team1: "South Carolina", team2: "Alabama", team1Score: 25, team2Score: 27 },
  { week: 7, team1: "Mississippi State", team2: "Georgia", team1Score: 10, team2Score: 34 },
  { week: 7, team1: "Vanderbilt", team2: "Kentucky", team1Score: 20, team2Score: 13 },
  { week: 7, team1: "Ole Miss", team2: "LSU", team1Score: 19, team2Score: 34 },
  { week: 7, team1: "Texas", team2: "Oklahoma", team1Score: 38, team2Score: 35 },
  { week: 7, team1: "Florida", team2: "Tennessee", team1Score: 17, team2Score: 23 },
  { week: 8, team1: "LSU", team2: "Arkansas", team1Score: 34, team2Score: 19 },
  { week: 8, team1: "Kentucky", team2: "Florida", team1Score: 20, team2Score: 48 },
  { week: 8, team1: "Texas A&M", team2: "Mississippi State", team1Score: 38, team2Score: 23 },
  { week: 8, team1: "Auburn", team2: "Missouri", team1Score: 24, team2Score: 17 },
  { week: 8, team1: "South Carolina", team2: "Oklahoma", team1Score: 35, team2Score: 9 },
  { week: 8, team1: "Alabama", team2: "Tennessee", team1Score: 17, team2Score: 24 },
  { week: 8, team1: "Georgia", team2: "Texas", team1Score: 30, team2Score: 15 },
  { week: 9, team1: "Missouri", team2: "Alabama", team1Score: 0, team2Score: 34 },
  { week: 9, team1: "Auburn", team2: "Kentucky", team1Score: 24, team2Score: 10 },
  { week: 9, team1: "Oklahoma", team2: "Ole Miss", team1Score: 14, team2Score: 26 },
  { week: 9, team1: "Arkansas", team2: "Mississippi State", team1Score: 58, team2Score: 25 },
  { week: 9, team1: "LSU", team2: "Texas A&M", team1Score: 23, team2Score: 38 }
];

// Remaining games
const REMAINING_GAMES = [
  { week: 10, team1: "Ole Miss", team2: "Arkansas", team1Score: null, team2Score: null },
  { week: 10, team1: "Vanderbilt", team2: "Auburn", team1Score: null, team2Score: null },
  { week: 10, team1: "Florida", team2: "Georgia", team1Score: null, team2Score: null },
  { week: 10, team1: "Texas A&M", team2: "South Carolina", team1Score: null, team2Score: null },
  { week: 10, team1: "Kentucky", team2: "Tennessee", team1Score: null, team2Score: null },
];

const SEC_TEAMS = [
  'Alabama', 'Arkansas', 'Auburn', 'Florida', 'Georgia', 'Kentucky',
  'LSU', 'Mississippi State', 'Missouri', 'Oklahoma', 'Ole Miss',
  'South Carolina', 'Tennessee', 'Texas', 'Texas A&M', 'Vanderbilt'
];

const calculateHeadToHead = (teamA, teamB, games) => {
  const matchups = games.filter(game => 
    (game.team1 === teamA && game.team2 === teamB) || 
    (game.team1 === teamB && game.team2 === teamA)
  );
  
  let aWins = 0, bWins = 0;
  matchups.forEach(game => {
    if (game.team1 === teamA) {
      if (game.team1Score > game.team2Score) aWins++;
      if (game.team1Score < game.team2Score) bWins++;
    } else {
      if (game.team2Score > game.team1Score) aWins++;
      if (game.team2Score < game.team1Score) bWins++;
    }
  });
  
  if (aWins > bWins) return teamA;
  if (bWins > aWins) return teamB;
  return null;
};

const calculateCommonOpponents = (teamA, teamB, games, standings) => {
  const getOpponents = (team) => {
    return games
      .filter(game => game.team1 === team || game.team2 === team)
      .map(game => game.team1 === team ? game.team2 : game.team1);
  };

  const aOpponents = new Set(getOpponents(teamA));
  const bOpponents = new Set(getOpponents(teamB));
  const commonOpponents = [...aOpponents].filter(x => bOpponents.has(x));

  let aRecord = 0, bRecord = 0;
  commonOpponents.forEach(opponent => {
    const aGames = games.filter(game => 
      (game.team1 === teamA && game.team2 === opponent) ||
      (game.team1 === opponent && game.team2 === teamA)
    );
    const bGames = games.filter(game => 
      (game.team1 === teamB && game.team2 === opponent) ||
      (game.team1 === opponent && game.team2 === teamB)
    );

    aGames.forEach(game => {
      if ((game.team1 === teamA && game.team1Score > game.team2Score) ||
          (game.team2 === teamA && game.team2Score > game.team1Score)) {
        aRecord++;
      }
    });

    bGames.forEach(game => {
      if ((game.team1 === teamB && game.team1Score > game.team2Score) ||
          (game.team2 === teamB && game.team2Score > game.team1Score)) {
        bRecord++;
      }
    });
  });

  if (aRecord > bRecord) return teamA;
  if (bRecord > aRecord) return teamB;
  return null;
};

const SECStandingsCalculator = () => {
  const [remainingGames, setRemainingGames] = useState(REMAINING_GAMES);
  
  const updateScore = (gameIndex, team, score) => {
    const newGames = [...remainingGames];
    newGames[gameIndex][`${team}Score`] = score === '' ? null : parseInt(score);
    setRemainingGames(newGames);
  };

  const calculateStandings = () => {
    // Combine completed and remaining games for calculations
    const allGames = [...COMPLETED_GAMES, ...remainingGames].filter(game => 
      game.team1Score !== null && game.team2Score !== null
    );

    const standings = SEC_TEAMS.map(team => {
      const games = allGames.filter(game => 
        game.team1 === team || game.team2 === team
      );

      const wins = games.filter(game => {
        if (game.team1 === team) return game.team1Score > game.team2Score;
        return game.team2Score > game.team1Score;
      }).length;

      const losses = games.filter(game => {
        if (game.team1 === team) return game.team1Score < game.team2Score;
        return game.team2Score < game.team1Score;
      }).length;

      return {
        team,
        wins,
        losses,
        winPct: games.length > 0 ? wins / games.length : 0,
        gamesPlayed: games.length
      };
    });

    const sortedStandings = [...standings].sort((a, b) => {
      if (b.winPct !== a.winPct) return b.winPct - a.winPct;
      if (b.wins !== a.wins) return b.wins - a.wins;
      
      const h2hWinner = calculateHeadToHead(a.team, b.team, allGames);
      if (h2hWinner) return h2hWinner === a.team ? -1 : 1;
      
      const commonWinner = calculateCommonOpponents(a.team, b.team, allGames, standings);
      if (commonWinner) return commonWinner === a.team ? -1 : 1;
      
      return 0;
    });

    return sortedStandings;
  };

  const standings = calculateStandings();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>2024 SEC Championship Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-2">Team</th>
                    <th className="text-right p-2">W</th>
                    <th className="text-right p-2">L</th>
                    <th className="text-right p-2">PCT</th>
                    <th className="text-right p-2">GP</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((team, index) => (
                    <tr key={team.team} className={`border-t ${index < 2 ? 'bg-green-50' : ''}`}>
                      <td className="p-2">{team.team}</td>
                      <td className="text-right p-2">{team.wins}</td>
                      <td className="text-right p-2">{team.losses}</td>
                      <td className="text-right p-2">
                        {team.winPct.toFixed(3)}
                      </td>
                      <td className="text-right p-2">{team.gamesPlayed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-2">Week</th>
                    <th className="text-left p-2">Team 1</th>
                    <th className="text-left p-2">Score</th>
                    <th className="text-left p-2">Team 2</th>
                    <th className="text-left p-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {remainingGames.sort((a, b) => a.week - b.week).map((game, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">Week {game.week}</td>
                      <td className="p-2">{game.team1}</td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={game.team1Score ?? ''}
                          onChange={(e) => updateScore(index, 'team1', e.target.value)}
                          className="w-20"
                        />
                      </td>
                      <td className="p-2">{game.team2}</td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={game.team2Score ?? ''}
                          onChange={(e) => updateScore(index, 'team2', e.target.value)}
                          className="w-20"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SECStandingsCalculator;

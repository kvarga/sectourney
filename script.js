/*
 * 2025 SEC Football Scenario Simulator
 *
 * This script reads a hard‑coded representation of the 2025 SEC conference schedule
 * (including completed game results as of 16 November 2025) and builds an
 * interactive interface for exploring how the remainder of the season could play out.
 * Users can select winners for the remaining games; standings update
 * immediately. When computing scenarios, the script enumerates every possible
 * permutation of the still‑pending games (respecting user picks) and counts
 * how often each team finishes in the top two positions once tiebreakers
 * (simplified to head‑to‑head results) are applied.
 */

// Schedule data generated from official sources on secsports.com and team pages.
// Each entry contains a date (for context), home/away teams, and if the
// game has been played: winner plus final scores. For games yet to be
// played as of 16 Nov 2025, winner and scores are null.
const scheduleData = [
  {date:'2025-09-06', homeTeam:'Tennessee', awayTeam:'Georgia', winner:'Georgia', homeScore:41, awayScore:44},
  {date:'2025-09-13', homeTeam:'Georgia', awayTeam:'Alabama', winner:'Alabama', homeScore:21, awayScore:24},
  {date:'2025-09-13', homeTeam:'Ole Miss', awayTeam:'Arkansas', winner:'Ole Miss', homeScore:41, awayScore:35},
  {date:'2025-09-13', homeTeam:'LSU', awayTeam:'Florida', winner:'LSU', homeScore:20, awayScore:10},
  {date:'2025-09-13', homeTeam:'South Carolina', awayTeam:'Vanderbilt', winner:'Vanderbilt', homeScore:7, awayScore:31},
  {date:'2025-09-13', homeTeam:'Oklahoma', awayTeam:'Auburn', winner:'Oklahoma', homeScore:24, awayScore:17},
  {date:'2025-09-20', homeTeam:'Alabama', awayTeam:'Vanderbilt', winner:'Alabama', homeScore:30, awayScore:14},
  {date:'2025-09-20', homeTeam:'Kentucky', awayTeam:'Ole Miss', winner:'Ole Miss', homeScore:23, awayScore:30},
  {date:'2025-09-20', homeTeam:'Georgia', awayTeam:'Kentucky', winner:'Georgia', homeScore:35, awayScore:14},
  {date:'2025-09-20', homeTeam:'Missouri', awayTeam:'Vanderbilt', winner:'Vanderbilt', homeScore:10, awayScore:17},
  {date:'2025-09-20', homeTeam:'Missouri', awayTeam:'South Carolina', winner:'Missouri', homeScore:29, awayScore:20},
  {date:'2025-09-20', homeTeam:'Florida', awayTeam:'Texas', winner:'Florida', homeScore:29, awayScore:21},
  {date:'2025-09-27', homeTeam:'Missouri', awayTeam:'Alabama', winner:'Alabama', homeScore:24, awayScore:27},
  {date:'2025-09-27', homeTeam:'Tennessee', awayTeam:'Arkansas', winner:'Tennessee', homeScore:34, awayScore:31},
  {date:'2025-09-27', homeTeam:'Auburn', awayTeam:'Georgia', winner:'Georgia', homeScore:10, awayScore:20},
  {date:'2025-09-27', homeTeam:'Texas A&M', awayTeam:'Auburn', winner:'Texas A&M', homeScore:16, awayScore:10},
  {date:'2025-09-27', homeTeam:'Texas A&M', awayTeam:'Mississippi State', winner:'Texas A&M', homeScore:31, awayScore:9},
  {date:'2025-09-27', homeTeam:'South Carolina', awayTeam:'Kentucky', winner:'South Carolina', homeScore:35, awayScore:13},
  {date:'2025-09-27', homeTeam:'Mississippi State', awayTeam:'Tennessee', winner:'Tennessee', homeScore:34, awayScore:41},
  {date:'2025-10-04', homeTeam:'Auburn', awayTeam:'Missouri', winner:'Missouri', homeScore:17, awayScore:23},
  {date:'2025-10-04', homeTeam:'Florida', awayTeam:'Mississippi State', winner:'Florida', homeScore:23, awayScore:21},
  {date:'2025-10-04', homeTeam:'Arkansas', awayTeam:'Texas A&M', winner:'Texas A&M', homeScore:42, awayScore:45},
  {date:'2025-10-04', homeTeam:'Ole Miss', awayTeam:'LSU', winner:'Ole Miss', homeScore:24, awayScore:19},
  {date:'2025-10-04', homeTeam:'Texas', awayTeam:'Oklahoma', winner:'Texas', homeScore:23, awayScore:6},
  {date:'2025-10-04', homeTeam:'Texas A&M', awayTeam:'Florida', winner:'Texas A&M', homeScore:34, awayScore:17},
  {date:'2025-10-11', homeTeam:'Alabama', awayTeam:'Tennessee', winner:'Alabama', homeScore:37, awayScore:20},
  {date:'2025-10-11', homeTeam:'Georgia', awayTeam:'Ole Miss', winner:'Georgia', homeScore:43, awayScore:35},
  {date:'2025-10-11', homeTeam:'Arkansas', awayTeam:'Auburn', winner:'Auburn', homeScore:24, awayScore:33},
  {date:'2025-10-11', homeTeam:'LSU', awayTeam:'South Carolina', winner:'LSU', homeScore:20, awayScore:10},
  {date:'2025-10-18', homeTeam:'Kentucky', awayTeam:'Texas', winner:'Texas', homeScore:13, awayScore:16},
  {date:'2025-10-18', homeTeam:'Auburn', awayTeam:'Kentucky', winner:'Kentucky', homeScore:3, awayScore:10},
  {date:'2025-10-18', homeTeam:'Mississippi State', awayTeam:'Texas', winner:'Texas', homeScore:38, awayScore:45},
  {date:'2025-10-18', homeTeam:'South Carolina', awayTeam:'Oklahoma', winner:'Oklahoma', homeScore:7, awayScore:26},
  {date:'2025-10-18', homeTeam:'Arkansas', awayTeam:'Mississippi State', winner:'Mississippi State', homeScore:35, awayScore:38},
  {date:'2025-10-25', homeTeam:'Georgia', awayTeam:'Florida', winner:'Georgia', homeScore:24, awayScore:20},
  {date:'2025-10-25', homeTeam:'South Carolina', awayTeam:'Alabama', winner:'Alabama', homeScore:22, awayScore:29},
  {date:'2025-10-25', homeTeam:'Oklahoma', awayTeam:'Ole Miss', winner:'Ole Miss', homeScore:26, awayScore:34},
  {date:'2025-10-25', homeTeam:'Kentucky', awayTeam:'Tennessee', winner:'Tennessee', homeScore:34, awayScore:56},
  {date:'2025-10-25', homeTeam:'LSU', awayTeam:'Texas A&M', winner:'Texas A&M', homeScore:25, awayScore:49},
  {date:'2025-11-01', homeTeam:'Vanderbilt', awayTeam:'Auburn', winner:'Vanderbilt', homeScore:45, awayScore:38},
  {date:'2025-11-01', homeTeam:'Mississippi State', awayTeam:'Georgia', winner:'Georgia', homeScore:21, awayScore:41},
  {date:'2025-11-01', homeTeam:'Ole Miss', awayTeam:'South Carolina', winner:'Ole Miss', homeScore:30, awayScore:14},
  {date:'2025-11-01', homeTeam:'Tennessee', awayTeam:'Oklahoma', winner:'Oklahoma', homeScore:27, awayScore:33},
  {date:'2025-11-01', homeTeam:'Alabama', awayTeam:'LSU', winner:'Alabama', homeScore:20, awayScore:9},
  {date:'2025-11-01', homeTeam:'Texas', awayTeam:'Vanderbilt', winner:'Texas', homeScore:34, awayScore:31},
  {date:'2025-11-08', homeTeam:'Kentucky', awayTeam:'Florida', winner:'Kentucky', homeScore:38, awayScore:7},
  {date:'2025-11-08', homeTeam:'Vanderbilt', awayTeam:'LSU', winner:'Vanderbilt', homeScore:31, awayScore:24},
  {date:'2025-11-08', homeTeam:'Missouri', awayTeam:'Texas A&M', winner:'Texas A&M', homeScore:17, awayScore:38},
  {date:'2025-11-08', homeTeam:'Alabama', awayTeam:'Oklahoma', winner:'Oklahoma', homeScore:21, awayScore:23},
  {date:'2025-11-15', homeTeam:'LSU', awayTeam:'Arkansas', winner:'LSU', homeScore:23, awayScore:22},
  {date:'2025-11-15', homeTeam:'Ole Miss', awayTeam:'Florida', winner:null, homeScore:null, awayScore:null},
  {date:'2025-11-15', homeTeam:'Georgia', awayTeam:'Texas', winner:null, homeScore:null, awayScore:null},
  {date:'2025-11-15', homeTeam:'Texas A&M', awayTeam:'South Carolina', winner:'Texas A&M', homeScore:31, awayScore:30},
  {date:'2025-11-22', homeTeam:'Missouri', awayTeam:'Mississippi State', winner:null, homeScore:null, awayScore:null},
  {date:'2025-11-22', homeTeam:'Florida', awayTeam:'Tennessee', winner:null, homeScore:null, awayScore:null},
  {date:'2025-11-22', homeTeam:'Texas', awayTeam:'Arkansas', winner:null, homeScore:null, awayScore:null},
  {date:'2025-11-22', homeTeam:'Vanderbilt', awayTeam:'Kentucky', winner:null, homeScore:null, awayScore:null},
  {date:'2025-11-22', homeTeam:'Oklahoma', awayTeam:'Missouri', winner:null, homeScore:null, awayScore:null},
  {date:'2025-11-27', homeTeam:'Mississippi State', awayTeam:'Ole Miss', winner:null, homeScore:null, awayScore:null},
  {date:'2025-11-28', homeTeam:'Texas', awayTeam:'Texas A&M', winner:null, homeScore:null, awayScore:null},
  {date:'2025-11-29', homeTeam:'Auburn', awayTeam:'Alabama', winner:null, homeScore:null, awayScore:null},
  {date:'2025-11-29', homeTeam:'Tennessee', awayTeam:'Vanderbilt', winner:null, homeScore:null, awayScore:null},
  {date:'2025-11-29', homeTeam:'Arkansas', awayTeam:'Missouri', winner:null, homeScore:null, awayScore:null},
  {date:'2025-11-29', homeTeam:'Oklahoma', awayTeam:'LSU', winner:null, homeScore:null, awayScore:null}
];

// Extract list of teams
const teamsSet = new Set();
scheduleData.forEach(g => {
  teamsSet.add(g.homeTeam);
  teamsSet.add(g.awayTeam);
});
const teams = Array.from(teamsSet).sort();

// Map for user selections. Each key is game index and value is either the selected winner
// (home or away team) or null if left as a toss‑up. A missing key also indicates a toss‑up.
const userPicks = {};

// Flag indicating whether completed games should be hidden. Default to true (hide).
let hideCompleted = true;

// Build the schedule table
function buildSchedule() {
  const container = document.getElementById('scheduleContainer');
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  ['Date','Away Team','Home Team','Result/Pick'].forEach(text => {
    const th = document.createElement('th');
    th.textContent = text;
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  scheduleData.forEach((game, idx) => {
    const tr = document.createElement('tr');
    tr.className = game.winner ? 'completed' : 'pending';
    tr.dataset.index = idx;
    // Date
    const tdDate = document.createElement('td');
    tdDate.textContent = game.date;
    tr.appendChild(tdDate);
    // Away team
    const tdAway = document.createElement('td');
    tdAway.textContent = game.awayTeam;
    tr.appendChild(tdAway);
    // Home team
    const tdHome = document.createElement('td');
    tdHome.textContent = game.homeTeam;
    tr.appendChild(tdHome);
    // Result/Pick
    const tdRes = document.createElement('td');
    if (game.winner) {
      const spanAway = document.createElement('span');
      spanAway.textContent = `${game.awayTeam} (${game.awayScore})`;
      const spanHome = document.createElement('span');
      spanHome.textContent = `${game.homeTeam} (${game.homeScore})`;
      if (game.winner === game.awayTeam) {
        spanAway.classList.add('winner');
      } else {
        spanHome.classList.add('winner');
      }
      tdRes.appendChild(spanAway);
      tdRes.appendChild(document.createTextNode(' @ '));
      tdRes.appendChild(spanHome);
    } else {
      const pickGroup = document.createElement('div');
      pickGroup.style.display = 'flex';
      pickGroup.style.justifyContent = 'center';
      // Helper to create a pill label with radio and span
      function createPill(teamLabel, value, defaultChecked) {
        const label = document.createElement('label');
        label.className = 'pill';
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = `game-${idx}`;
        input.value = value;
        if (defaultChecked) input.checked = true;
        input.addEventListener('change', () => {
          if (value) {
            userPicks[idx] = value;
          } else {
            delete userPicks[idx];
          }
          updateStandings();
        });
        const span = document.createElement('span');
        span.textContent = teamLabel;
        label.appendChild(input);
        label.appendChild(span);
        return label;
      }
      const pillAway = createPill(game.awayTeam, game.awayTeam, false);
      const pillToss = createPill('Toss‑up', '', true);
      const pillHome = createPill(game.homeTeam, game.homeTeam, false);
      pickGroup.appendChild(pillAway);
      pickGroup.appendChild(pillToss);
      pickGroup.appendChild(pillHome);
      tdRes.appendChild(pickGroup);
    }
    tr.appendChild(tdRes);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.innerHTML = '';
  container.appendChild(table);
  // Apply completed visibility rules
  updateScheduleVisibility();
}

// Compute standings from schedule and picks
function computeStandings() {
  const record = {};
  teams.forEach(team => {
    record[team] = {wins: 0, losses: 0};
  });
  scheduleData.forEach((game, idx) => {
    let winner = game.winner;
    if (!winner && userPicks.hasOwnProperty(idx)) {
      winner = userPicks[idx];
    }
    if (winner) {
      const loser = (winner === game.homeTeam ? game.awayTeam : game.homeTeam);
      record[winner].wins++;
      record[loser].losses++;
    }
  });
  const order = teams.slice().sort((a, b) => {
    const pctA = record[a].wins / (record[a].wins + record[a].losses || 1);
    const pctB = record[b].wins / (record[b].wins + record[b].losses || 1);
    if (pctA !== pctB) return pctB - pctA;
    // head‑to‑head tiebreaker for two teams
    const tiedTeams = [a, b];
    const h2hA = headToHeadWinPct(a, tiedTeams);
    const h2hB = headToHeadWinPct(b, tiedTeams);
    if (h2hA !== h2hB) return h2hB - h2hA;
    return a.localeCompare(b);
  });
  return {record, order};
}

// Compute number of unpicked games for each team (games without final result and without a user pick)
function computeUnpickedCounts() {
  const counts = {};
  teams.forEach(t => {
    counts[t] = 0;
  });
  scheduleData.forEach((game, idx) => {
    // Only consider games without an official winner
    if (!game.winner) {
      const pick = userPicks.hasOwnProperty(idx) ? userPicks[idx] : null;
      if (!pick) {
        // Toss‑up/unpicked game; increment both teams
        counts[game.homeTeam]++;
        counts[game.awayTeam]++;
      }
    }
  });
  return counts;
}

// Update visibility of completed games based on hideCompleted flag
function updateScheduleVisibility() {
  const rows = document.querySelectorAll('#scheduleContainer tr.completed');
  rows.forEach(row => {
    row.style.display = hideCompleted ? 'none' : '';
  });
  // Update button text
  const toggleBtn = document.getElementById('toggleCompleted');
  if (toggleBtn) {
    toggleBtn.textContent = hideCompleted ? 'Show Completed Games' : 'Hide Completed Games';
  }
}

// Highlight schedule rows based on whether the user has selected a pick
function updateScheduleHighlights() {
  const rows = document.querySelectorAll('#scheduleContainer tr');
  rows.forEach(row => {
    const idx = row.dataset.index;
    if (idx === undefined) return;
    if (userPicks.hasOwnProperty(idx)) {
      row.classList.add('selected');
    } else {
      row.classList.remove('selected');
    }
  });
}
// Compute head‑to‑head win percentage for a team among specified tied teams
function headToHeadWinPct(team, tiedTeams) {
  let wins = 0;
  let games = 0;
  scheduleData.forEach((game, idx) => {
    const winner = game.winner || userPicks[idx];
    if (!winner) return;
    const {homeTeam, awayTeam} = game;
    if (tiedTeams.includes(homeTeam) && tiedTeams.includes(awayTeam)) {
      games++;
      if (winner === team) wins++;
    }
  });
  return games ? wins / games : 0;
}

// Display standings
function updateStandings() {
  // Compute current record and order
  const {record, order} = computeStandings();
  // Compute unpicked counts
  const unpicked = computeUnpickedCounts();
  // Compute scenario counts and total permutations
  const {counts: champCounts, total: totalPerms} = computeScenarioCounts();
  // Build standings table with extra columns
  const container = document.getElementById('standingsContainer');
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  ['Rank','Team','Wins','Losses','Unpicked','Top2 %'].forEach(txt => {
    const th = document.createElement('th');
    th.textContent = txt;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  order.forEach((team, index) => {
    const tr = document.createElement('tr');
    // Determine class based on championship probability
    const first = champCounts[team].first;
    const second = champCounts[team].second;
    const pct = totalPerms > 0 ? ((first + second) / totalPerms) * 100 : 0;
    if (pct === 100) {
      tr.classList.add('certain');
    } else if (pct === 0) {
      tr.classList.add('noChance');
    }
    const rankCell = document.createElement('td');
    rankCell.textContent = index + 1;
    tr.appendChild(rankCell);
    const teamCell = document.createElement('td');
    teamCell.textContent = team;
    tr.appendChild(teamCell);
    const winsCell = document.createElement('td');
    winsCell.textContent = record[team].wins;
    tr.appendChild(winsCell);
    const lossesCell = document.createElement('td');
    lossesCell.textContent = record[team].losses;
    tr.appendChild(lossesCell);
    const unpickedCell = document.createElement('td');
    unpickedCell.textContent = unpicked[team];
    tr.appendChild(unpickedCell);
    const pctCell = document.createElement('td');
    pctCell.textContent = pct.toFixed(1) + '%';
    tr.appendChild(pctCell);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.innerHTML = '';
  container.appendChild(table);
  // Update scenario summary text with total permutations
  const scenarioContainer = document.getElementById('scenariosContainer');
  scenarioContainer.innerHTML = '';
  const p = document.createElement('p');
  p.textContent = `Total permutations considered: ${totalPerms}`;
  scenarioContainer.appendChild(p);

  // Update row highlights for schedule based on current picks
  updateScheduleHighlights();
}

// Compute scenario counts for championship positions
function computeScenarioCounts() {
  const remaining = [];
  scheduleData.forEach((game, idx) => {
    if (!game.winner && !userPicks.hasOwnProperty(idx)) {
      remaining.push(idx);
    }
  });
  const counts = {};
  teams.forEach(t => {
    counts[t] = {first: 0, second: 0};
  });
  const recurse = (i) => {
    if (i === remaining.length) {
      const {order} = computeStandings();
      const first = order[0];
      const second = order[1];
      counts[first].first++;
      counts[second].second++;
      return;
    }
    const idx = remaining[i];
    const game = scheduleData[idx];
    // away team wins
    userPicks[idx] = game.awayTeam;
    recurse(i + 1);
    // home team wins
    userPicks[idx] = game.homeTeam;
    recurse(i + 1);
    delete userPicks[idx];
  };
  recurse(0);
  return {counts, total: Math.pow(2, remaining.length)};
}

// Display scenario counts
function displayScenarioCounts() {
  const {counts, total} = computeScenarioCounts();
  const container = document.getElementById('scenariosContainer');
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  ['Team','#1 Finishes','#2 Finishes'].forEach(txt => {
    const th = document.createElement('th');
    th.textContent = txt;
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  const sortedTeams = teams.slice().sort((a, b) => {
    const ca = counts[a].first + counts[a].second;
    const cb = counts[b].first + counts[b].second;
    return cb - ca;
  });
  sortedTeams.forEach(team => {
    const tr = document.createElement('tr');
    const tdTeam = document.createElement('td');
    tdTeam.textContent = team;
    tr.appendChild(tdTeam);
    const tdFirst = document.createElement('td');
    tdFirst.textContent = counts[team].first;
    tr.appendChild(tdFirst);
    const tdSecond = document.createElement('td');
    tdSecond.textContent = counts[team].second;
    tr.appendChild(tdSecond);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.innerHTML = '';
  const p = document.createElement('p');
  p.textContent = `Total permutations considered: ${total}`;
  container.appendChild(p);
  container.appendChild(table);
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  buildSchedule();
  updateStandings();
  // Wire up toggle for completed games
  const toggleBtn = document.getElementById('toggleCompleted');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      hideCompleted = !hideCompleted;
      updateScheduleVisibility();
    });
  }
  // Wire up reset picks button
  const resetBtn = document.getElementById('resetPicks');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      // Clear all user picks and reset radio buttons to toss‑up
      for (const key in userPicks) {
        if (Object.prototype.hasOwnProperty.call(userPicks, key)) {
          delete userPicks[key];
        }
      }
      // Reset all radio inputs to toss‑up
      const radios = document.querySelectorAll('#scheduleContainer input[type="radio"]');
      radios.forEach(radio => {
        if (radio.value === '') {
          radio.checked = true;
        } else {
          radio.checked = false;
        }
      });
      updateStandings();
    });
  }
});

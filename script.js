/*
 * 2025 SEC Football Scenario Simulator (Standalone JS)
 *
 * This script powers a client‑side dashboard that lets users explore how the
 * remainder of the 2025 SEC football season could play out. It fetches a
 * schedule and results from an external JSON file (sec_2025_schedule.json),
 * renders the remaining games as clickable cards, updates conference
 * standings in real time as the user selects winners, and computes how
 * frequently each team finishes in the top two of the final standings across
 * all permutations of the unplayed games. The standings table highlights
 * teams locked into or out of the championship game.
 */

// Global state
let scheduleData = [];
// Fallback schedule data used if fetching sec_2025_schedule.json via fetch
// fails (e.g. when opening the page from the file system where browsers
// restrict file:// fetch requests). This array mirrors the contents of
// sec_2025_schedule.json and will be used as a last resort.
const fallbackScheduleData = [
  {"date":"2025-09-06","homeTeam":"Tennessee","awayTeam":"Georgia","winner":"Georgia","homeScore":41,"awayScore":44},
  {"date":"2025-09-13","homeTeam":"Georgia","awayTeam":"Alabama","winner":"Alabama","homeScore":21,"awayScore":24},
  {"date":"2025-09-13","homeTeam":"Ole Miss","awayTeam":"Arkansas","winner":"Ole Miss","homeScore":41,"awayScore":35},
  {"date":"2025-09-13","homeTeam":"LSU","awayTeam":"Florida","winner":"LSU","homeScore":20,"awayScore":10},
  {"date":"2025-09-13","homeTeam":"South Carolina","awayTeam":"Vanderbilt","winner":"Vanderbilt","homeScore":7,"awayScore":31},
  {"date":"2025-09-13","homeTeam":"Oklahoma","awayTeam":"Auburn","winner":"Oklahoma","homeScore":24,"awayScore":17},
  {"date":"2025-09-20","homeTeam":"Alabama","awayTeam":"Vanderbilt","winner":"Alabama","homeScore":30,"awayScore":14},
  {"date":"2025-09-20","homeTeam":"Kentucky","awayTeam":"Ole Miss","winner":"Ole Miss","homeScore":23,"awayScore":30},
  {"date":"2025-09-20","homeTeam":"Georgia","awayTeam":"Kentucky","winner":"Georgia","homeScore":35,"awayScore":14},
  {"date":"2025-09-20","homeTeam":"Missouri","awayTeam":"Vanderbilt","winner":"Vanderbilt","homeScore":10,"awayScore":17},
  {"date":"2025-09-20","homeTeam":"Missouri","awayTeam":"South Carolina","winner":"Missouri","homeScore":29,"awayScore":20},
  {"date":"2025-09-20","homeTeam":"Florida","awayTeam":"Texas","winner":"Florida","homeScore":29,"awayScore":21},
  {"date":"2025-09-27","homeTeam":"Missouri","awayTeam":"Alabama","winner":"Alabama","homeScore":24,"awayScore":27},
  {"date":"2025-09-27","homeTeam":"Tennessee","awayTeam":"Arkansas","winner":"Tennessee","homeScore":34,"awayScore":31},
  {"date":"2025-09-27","homeTeam":"Auburn","awayTeam":"Georgia","winner":"Georgia","homeScore":10,"awayScore":20},
  {"date":"2025-09-27","homeTeam":"Texas A&M","awayTeam":"Auburn","winner":"Texas A&M","homeScore":16,"awayScore":10},
  {"date":"2025-09-27","homeTeam":"Texas A&M","awayTeam":"Mississippi State","winner":"Texas A&M","homeScore":31,"awayScore":9},
  {"date":"2025-09-27","homeTeam":"South Carolina","awayTeam":"Kentucky","winner":"South Carolina","homeScore":35,"awayScore":13},
  {"date":"2025-09-27","homeTeam":"Mississippi State","awayTeam":"Tennessee","winner":"Tennessee","homeScore":34,"awayScore":41},
  {"date":"2025-10-04","homeTeam":"Auburn","awayTeam":"Missouri","winner":"Missouri","homeScore":17,"awayScore":23},
  {"date":"2025-10-04","homeTeam":"Florida","awayTeam":"Mississippi State","winner":"Florida","homeScore":23,"awayScore":21},
  {"date":"2025-10-04","homeTeam":"Arkansas","awayTeam":"Texas A&M","winner":"Texas A&M","homeScore":42,"awayScore":45},
  {"date":"2025-10-04","homeTeam":"Ole Miss","awayTeam":"LSU","winner":"Ole Miss","homeScore":24,"awayScore":19},
  {"date":"2025-10-04","homeTeam":"Texas","awayTeam":"Oklahoma","winner":"Texas","homeScore":23,"awayScore":6},
  {"date":"2025-10-04","homeTeam":"Texas A&M","awayTeam":"Florida","winner":"Texas A&M","homeScore":34,"awayScore":17},
  {"date":"2025-10-11","homeTeam":"Alabama","awayTeam":"Tennessee","winner":"Alabama","homeScore":37,"awayScore":20},
  {"date":"2025-10-11","homeTeam":"Georgia","awayTeam":"Ole Miss","winner":"Georgia","homeScore":43,"awayScore":35},
  {"date":"2025-10-11","homeTeam":"Arkansas","awayTeam":"Auburn","winner":"Auburn","homeScore":24,"awayScore":33},
  {"date":"2025-10-11","homeTeam":"LSU","awayTeam":"South Carolina","winner":"LSU","homeScore":20,"awayScore":10},
  {"date":"2025-10-18","homeTeam":"Kentucky","awayTeam":"Texas","winner":"Texas","homeScore":13,"awayScore":16},
  {"date":"2025-10-18","homeTeam":"Auburn","awayTeam":"Kentucky","winner":"Kentucky","homeScore":3,"awayScore":10},
  {"date":"2025-10-18","homeTeam":"Mississippi State","awayTeam":"Texas","winner":"Texas","homeScore":38,"awayScore":45},
  {"date":"2025-10-18","homeTeam":"South Carolina","awayTeam":"Oklahoma","winner":"Oklahoma","homeScore":7,"awayScore":26},
  {"date":"2025-10-18","homeTeam":"Arkansas","awayTeam":"Mississippi State","winner":"Mississippi State","homeScore":35,"awayScore":38},
  {"date":"2025-10-25","homeTeam":"Georgia","awayTeam":"Florida","winner":"Georgia","homeScore":24,"awayScore":20},
  {"date":"2025-10-25","homeTeam":"South Carolina","awayTeam":"Alabama","winner":"Alabama","homeScore":22,"awayScore":29},
  {"date":"2025-10-25","homeTeam":"Oklahoma","awayTeam":"Ole Miss","winner":"Ole Miss","homeScore":26,"awayScore":34},
  {"date":"2025-10-25","homeTeam":"Kentucky","awayTeam":"Tennessee","winner":"Tennessee","homeScore":34,"awayScore":56},
  {"date":"2025-10-25","homeTeam":"LSU","awayTeam":"Texas A&M","winner":"Texas A&M","homeScore":25,"awayScore":49},
  {"date":"2025-11-01","homeTeam":"Vanderbilt","awayTeam":"Auburn","winner":"Vanderbilt","homeScore":45,"awayScore":38},
  {"date":"2025-11-01","homeTeam":"Mississippi State","awayTeam":"Georgia","winner":"Georgia","homeScore":21,"awayScore":41},
  {"date":"2025-11-01","homeTeam":"Ole Miss","awayTeam":"South Carolina","winner":"Ole Miss","homeScore":30,"awayScore":14},
  {"date":"2025-11-01","homeTeam":"Tennessee","awayTeam":"Oklahoma","winner":"Oklahoma","homeScore":27,"awayScore":33},
  {"date":"2025-11-01","homeTeam":"Alabama","awayTeam":"LSU","winner":"Alabama","homeScore":20,"awayScore":9},
  {"date":"2025-11-01","homeTeam":"Texas","awayTeam":"Vanderbilt","winner":"Texas","homeScore":34,"awayScore":31},
  {"date":"2025-11-08","homeTeam":"Kentucky","awayTeam":"Florida","winner":"Kentucky","homeScore":38,"awayScore":7},
  {"date":"2025-11-08","homeTeam":"Vanderbilt","awayTeam":"LSU","winner":"Vanderbilt","homeScore":31,"awayScore":24},
  {"date":"2025-11-08","homeTeam":"Missouri","awayTeam":"Texas A&M","winner":"Texas A&M","homeScore":17,"awayScore":38},
  {"date":"2025-11-08","homeTeam":"Alabama","awayTeam":"Oklahoma","winner":"Oklahoma","homeScore":21,"awayScore":23},
  {"date":"2025-11-15","homeTeam":"LSU","awayTeam":"Arkansas","winner":"LSU","homeScore":23,"awayScore":22},
  {"date":"2025-11-15","homeTeam":"Ole Miss","awayTeam":"Florida","winner":null,"homeScore":null,"awayScore":null},
  {"date":"2025-11-15","homeTeam":"Georgia","awayTeam":"Texas","winner":null,"homeScore":null,"awayScore":null},
  {"date":"2025-11-15","homeTeam":"Texas A&M","awayTeam":"South Carolina","winner":"Texas A&M","homeScore":31,"awayScore":30},
  {"date":"2025-11-22","homeTeam":"Missouri","awayTeam":"Mississippi State","winner":null,"homeScore":null,"awayScore":null},
  {"date":"2025-11-22","homeTeam":"Florida","awayTeam":"Tennessee","winner":null,"homeScore":null,"awayScore":null},
  {"date":"2025-11-22","homeTeam":"Texas","awayTeam":"Arkansas","winner":null,"homeScore":null,"awayScore":null},
  {"date":"2025-11-22","homeTeam":"Vanderbilt","awayTeam":"Kentucky","winner":null,"homeScore":null,"awayScore":null},
  {"date":"2025-11-22","homeTeam":"Oklahoma","awayTeam":"Missouri","winner":null,"homeScore":null,"awayScore":null},
  {"date":"2025-11-27","homeTeam":"Mississippi State","awayTeam":"Ole Miss","winner":null,"homeScore":null,"awayScore":null},
  {"date":"2025-11-28","homeTeam":"Texas","awayTeam":"Texas A&M","winner":null,"homeScore":null,"awayScore":null},
  {"date":"2025-11-29","homeTeam":"Auburn","awayTeam":"Alabama","winner":null,"homeScore":null,"awayScore":null},
  {"date":"2025-11-29","homeTeam":"Tennessee","awayTeam":"Vanderbilt","winner":null,"homeScore":null,"awayScore":null},
  {"date":"2025-11-29","homeTeam":"Arkansas","awayTeam":"Missouri","winner":null,"homeScore":null,"awayScore":null},
  {"date":"2025-11-29","homeTeam":"Oklahoma","awayTeam":"LSU","winner":null,"homeScore":null,"awayScore":null}
];

// Install a global error handler to surface uncaught exceptions to the user.
if (typeof window !== 'undefined') {
  window.onerror = function(message, source, lineno, colno, error) {
    showError('JS Error: ' + message + ' at ' + lineno + ':' + colno);
  };
}
let teams = [];
const userPicks = {};
let hideCompleted = true;

// Entry point once DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  init();
});

/**
 * Initialize the application by loading the schedule, building the UI and
 * wiring up controls.
 */
async function init() {
  try {
    // Load schedule data from the JSON file
    let dataLoaded = false;
    try {
      const response = await fetch('sec_2025_schedule.json');
      if (!response.ok) throw new Error('non-200 response');
      scheduleData = await response.json();
      dataLoaded = true;
    } catch (fetchErr) {
      console.warn('Unable to fetch schedule JSON, falling back to embedded data.', fetchErr);
      scheduleData = fallbackScheduleData.slice();
    }
    // Extract unique list of teams
    const teamsSet = new Set();
    scheduleData.forEach(game => {
      teamsSet.add(game.homeTeam);
      teamsSet.add(game.awayTeam);
    });
    teams = Array.from(teamsSet).sort();
    // Build schedule UI and standings
    buildSchedule();
    updateStandings();
    // Hook up control buttons
    const toggleBtn = document.getElementById('toggleCompleted');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        hideCompleted = !hideCompleted;
        updateScheduleVisibility();
      });
    }
    const resetBtn = document.getElementById('resetPicks');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        // Remove all user picks
        Object.keys(userPicks).forEach(key => delete userPicks[key]);
        // Reset all radio inputs to the toss‑up option
        const radios = document.querySelectorAll('#scheduleContainer input[type="radio"]');
        radios.forEach(radio => {
          radio.checked = (radio.value === '');
        });
        updateStandings();
      });
    }
  } catch (err) {
    console.error(err);
    showError(err.message);
  }
}

/**
 * Display a brief error message at the top of the page.
 * @param {string} msg Error text
 */
function showError(msg) {
  const div = document.createElement('div');
  div.style.backgroundColor = '#8b0000';
  div.style.color = '#ffffff';
  div.style.padding = '0.5rem';
  div.style.marginBottom = '0.5rem';
  div.textContent = 'Error: ' + msg;
  document.body.prepend(div);
}

/**
 * Build the schedule section by creating a card for each game. Completed games
 * show final scores and winners; pending games provide pill-style radio
 * buttons for selecting a winner or leaving the game as a toss-up. The
 * schedule grid is responsive and will wrap cards as space allows.
 */
function buildSchedule() {
  const container = document.getElementById('scheduleContainer');
  if (!container) return;
  container.innerHTML = '';
  const frag = document.createDocumentFragment();
  scheduleData.forEach((game, idx) => {
    const card = document.createElement('div');
    card.classList.add('game-card');
    card.classList.add(game.winner ? 'completed' : 'pending');
    card.dataset.index = idx;
    // Left side: date and matchup text
    const info = document.createElement('div');
    info.className = 'game-info';
    info.textContent = `${game.date}: ${game.awayTeam} @ ${game.homeTeam}`;
    card.appendChild(info);
    // Right side: pick controls or result display
    const pickArea = document.createElement('div');
    pickArea.className = 'pick-area';
    if (game.winner) {
      // Completed game: show away and home team with scores and highlight winner
      const awaySpan = document.createElement('span');
      awaySpan.textContent = `${game.awayTeam} (${game.awayScore})`;
      const separator = document.createElement('span');
      separator.textContent = ' @ ';
      const homeSpan = document.createElement('span');
      homeSpan.textContent = `${game.homeTeam} (${game.homeScore})`;
      if (game.winner === game.awayTeam) {
        awaySpan.classList.add('winner');
      } else {
        homeSpan.classList.add('winner');
      }
      pickArea.appendChild(awaySpan);
      pickArea.appendChild(separator);
      pickArea.appendChild(homeSpan);
    } else {
      // Pending game: create radio pill controls
      function createPill(labelText, value, defaultChecked) {
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
        span.textContent = labelText;
        label.appendChild(input);
        label.appendChild(span);
        return label;
      }
      // Order: away team, toss-up, home team
      pickArea.appendChild(createPill(game.awayTeam, game.awayTeam, false));
      pickArea.appendChild(createPill('Toss-up', '', true));
      pickArea.appendChild(createPill(game.homeTeam, game.homeTeam, false));
    }
    card.appendChild(pickArea);
    frag.appendChild(card);
  });
  container.appendChild(frag);
  updateScheduleVisibility();
}

/**
 * Compute each team's record based on official results and current user picks.
 * @returns {{record: Object, order: string[]}} Record map keyed by team and
 *          sorted team order by winning percentage and tiebreakers.
 */
function computeStandings() {
  const record = {};
  teams.forEach(team => {
    record[team] = {wins: 0, losses: 0};
  });
  scheduleData.forEach((game, idx) => {
    let winner = game.winner;
    if (!winner && Object.prototype.hasOwnProperty.call(userPicks, idx)) {
      winner = userPicks[idx];
    }
    if (winner) {
      const loser = (winner === game.homeTeam ? game.awayTeam : game.homeTeam);
      record[winner].wins++;
      record[loser].losses++;
    }
  });
  // Sorting order by winning percentage, head-to-head, then alphabetical
  const order = teams.slice().sort((a, b) => {
    const pctA = record[a].wins / (record[a].wins + record[a].losses || 1);
    const pctB = record[b].wins / (record[b].wins + record[b].losses || 1);
    if (pctA !== pctB) return pctB - pctA;
    // Simplified head-to-head tiebreaker for just these two teams
    const tiedTeams = [a, b];
    const h2hA = headToHeadWinPct(a, tiedTeams);
    const h2hB = headToHeadWinPct(b, tiedTeams);
    if (h2hA !== h2hB) return h2hB - h2hA;
    return a.localeCompare(b);
  });
  return {record, order};
}

/**
 * Compute how many unpicked (toss-up) games remain for each team.
 * @returns {Object<string, number>} Map of team to number of unpicked games
 */
function computeUnpickedCounts() {
  const counts = {};
  teams.forEach(team => counts[team] = 0);
  scheduleData.forEach((game, idx) => {
    if (!game.winner) {
      const pick = Object.prototype.hasOwnProperty.call(userPicks, idx) ? userPicks[idx] : null;
      if (!pick) {
        counts[game.homeTeam]++;
        counts[game.awayTeam]++;
      }
    }
  });
  return counts;
}

/**
 * Compute head-to-head win percentage for a team among tied teams.
 * Only considers games that have a final result or a user pick.
 * @param {string} team The team whose head-to-head percentage to compute
 * @param {string[]} tiedTeams Array of tied team names
 * @returns {number} Win percentage in head-to-head games
 */
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

/**
 * Compute the number of permutations of remaining games and count how many
 * times each team finishes first or second in those permutations.
 * @returns {{counts: Object<string,{first:number,second:number}>, total: number}}
 */
function computeScenarioCounts() {
  const remaining = [];
  scheduleData.forEach((game, idx) => {
    if (!game.winner && !Object.prototype.hasOwnProperty.call(userPicks, idx)) {
      remaining.push(idx);
    }
  });
  const counts = {};
  teams.forEach(t => {
    counts[t] = {first: 0, second: 0};
  });
  const totalPerms = Math.pow(2, remaining.length);
  // Use a recursive enumeration to assign winners for each remaining game
  function recurse(i) {
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
    // Pick away team as winner
    userPicks[idx] = game.awayTeam;
    recurse(i + 1);
    // Pick home team as winner
    userPicks[idx] = game.homeTeam;
    recurse(i + 1);
    // Clean up
    delete userPicks[idx];
  }
  recurse(0);
  return {counts, total: totalPerms};
}

/**
 * Update the standings table and scenario summary. Also highlight schedule
 * cards based on user picks.
 */
function updateStandings() {
  const {record, order} = computeStandings();
  const unpicked = computeUnpickedCounts();
  const {counts: champCounts, total: totalPerms} = computeScenarioCounts();
  // Build standings table
  const container = document.getElementById('standingsContainer');
  if (!container) return;
  container.innerHTML = '';
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
    // Determine highlight class based on championship probability
    const firstCount = champCounts[team].first;
    const secondCount = champCounts[team].second;
    const pct = totalPerms > 0 ? ((firstCount + secondCount) / totalPerms) * 100 : 0;
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
  container.appendChild(table);
  // Update scenario summary text
  const summaryDiv = document.getElementById('scenarioSummary');
  if (summaryDiv) {
    summaryDiv.textContent = `Total permutations considered: ${totalPerms}`;
  }
  // Highlight schedule cards based on picks
  updateScheduleHighlights();
}

/**
 * Toggle visibility of completed games based on hideCompleted flag.
 */
function updateScheduleVisibility() {
  const cards = document.querySelectorAll('#scheduleContainer .game-card.completed');
  cards.forEach(card => {
    card.style.display = hideCompleted ? 'none' : '';
  });
  // Update button text
  const toggleBtn = document.getElementById('toggleCompleted');
  if (toggleBtn) {
    toggleBtn.textContent = hideCompleted ? 'Show Completed Games' : 'Hide Completed Games';
  }
}

/**
 * Highlight schedule cards when a user pick exists. Cards for unpicked or
 * completed games remain at default background color.
 */
function updateScheduleHighlights() {
  const cards = document.querySelectorAll('#scheduleContainer .game-card');
  cards.forEach(card => {
    const idx = parseInt(card.dataset.index, 10);
    if (Object.prototype.hasOwnProperty.call(userPicks, idx)) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });
}
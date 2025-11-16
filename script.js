/*
 * 2025 SEC Football Scenario Simulator (Standalone JS)
 *
 * Tiebreakers for teams with the same conference record:
 *  A. Head-to-head competition among the tied teams
 *  B. Record versus all common Conference opponents among the tied teams
 *  C. Record against highest placed common Conference opponent in the
 *     Conference standings – simplified here to a fixed priority list:
 *       Texas A&M, Ole Miss, Georgia, Alabama, Texas
 *  D. Cumulative Conference winning percentage of all Conference opponents
 *     among the tied teams
 */

// Global state
let scheduleData = [];

// Fallback schedule data used if fetching sec_2025_schedule.json via fetch
// fails (e.g. when opening from file:// where fetch is blocked).
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

// Global error handler
if (typeof window !== 'undefined') {
  window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global error handler:', message, 'at', lineno + ':' + colno, 'source:', source, 'error:', error);
    showError('JS Error: ' + message + ' at ' + lineno + ':' + colno);
  };
}

let teams = [];
const userPicks = {};
let hideCompleted = true;

// Entry point
window.addEventListener('DOMContentLoaded', () => {
  init();
});

/**
 * Initialize app: load schedule, build UI, wire controls.
 */
async function init() {
  try {
    console.log('Initializing SEC Scenario Simulator...');
    console.log('Attempting to load schedule from sec_2025_schedule.json...');

    let dataLoaded = false;

    try {
      const response = await fetch('sec_2025_schedule.json');
      if (!response.ok) {
        console.error('Failed to load sec_2025_schedule.json. HTTP status:', response.status, response.statusText);
        throw new Error('non-200 response');
      }
      scheduleData = await response.json();
      dataLoaded = true;
      console.log('Loaded schedule from sec_2025_schedule.json. Games:', scheduleData.length);
    } catch (fetchErr) {
      console.warn('Unable to fetch schedule JSON, falling back to embedded data.', fetchErr);
      console.log('Using embedded fallback schedule data. Games:', fallbackScheduleData.length);
      scheduleData = fallbackScheduleData.slice();
    }

    if (!dataLoaded) {
      console.log('Schedule source: embedded fallback JSON.');
    } else {
      console.log('Schedule source: external sec_2025_schedule.json file.');
    }

    // Extract unique list of teams
    const teamsSet = new Set();
    scheduleData.forEach(game => {
      teamsSet.add(game.homeTeam);
      teamsSet.add(game.awayTeam);
    });
    teams = Array.from(teamsSet).sort();

    buildSchedule();
    updateStandings();

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
        Object.keys(userPicks).forEach(key => delete userPicks[key]);
        const radios = document.querySelectorAll('#scheduleContainer input[type="radio"]');
        radios.forEach(radio => {
          radio.checked = (radio.value === '');
        });
        console.log('User picks reset to Toss-up for all remaining games.');
        updateStandings();
      });
    }
  } catch (err) {
    console.error('Fatal error during init:', err);
    showError(err.message);
  }
}

/**
 * Show error banner at top.
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
 * Helper: iterate all games with resolved winner (official or user pick).
 */
function forEachResolvedGame(cb) {
  scheduleData.forEach((game, idx) => {
    const winner = game.winner || userPicks[idx];
    cb(game, idx, winner);
  });
}

/**
 * Build the schedule table.
 */
function buildSchedule() {
  const container = document.getElementById('scheduleContainer');
  if (!container) return;

  container.innerHTML = '';

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['Date','Matchup','Result/Pick'].forEach(label => {
    const th = document.createElement('th');
    th.textContent = label;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  scheduleData.forEach((game, idx) => {
    const row = document.createElement('tr');
    row.dataset.index = idx;
    if (game.winner) {
      row.classList.add('completed');
    }

    const dateCell = document.createElement('td');
    dateCell.textContent = game.date;
    row.appendChild(dateCell);

    const matchupCell = document.createElement('td');
    matchupCell.textContent = `${game.awayTeam} @ ${game.homeTeam}`;
    row.appendChild(matchupCell);

    const pickCell = document.createElement('td');

    if (game.winner) {
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

      pickCell.appendChild(awaySpan);
      pickCell.appendChild(separator);
      pickCell.appendChild(homeSpan);
    } else {
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
          console.log(`User pick for game ${idx}:`, value || 'Toss-up');
          updateStandings();
        });

        const span = document.createElement('span');
        span.textContent = labelText;

        label.appendChild(input);
        label.appendChild(span);
        return label;
      }

      pickCell.appendChild(createPill(game.awayTeam, game.awayTeam, false));
      pickCell.appendChild(createPill('Toss-up', '', true));
      pickCell.appendChild(createPill(game.homeTeam, game.homeTeam, false));
    }

    row.appendChild(pickCell);
    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  container.appendChild(table);
  updateScheduleVisibility();
}

/**
 * Compute records from results + picks.
 */
function computeStandings() {
  const record = {};
  teams.forEach(team => {
    record[team] = {wins: 0, losses: 0, pct: 0};
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

  teams.forEach(team => {
    const r = record[team];
    const games = r.wins + r.losses;
    r.pct = games ? r.wins / games : 0;
  });

  const order = teams.slice().sort((a, b) => compareTeamsWithTiebreakers(a, b, record));
  return {record, order};
}

/**
 * Compute how many unpicked (toss-up) games remain for each team.
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
 * Head-to-head win% among a group of tied teams (rule A).
 */
function headToHeadWinPct(team, tiedTeams) {
  let wins = 0;
  let games = 0;

  forEachResolvedGame((game, idx, winner) => {
    const {homeTeam, awayTeam} = game;
    if (!winner) return;
    if (tiedTeams.includes(homeTeam) && tiedTeams.includes(awayTeam)) {
      if (homeTeam === team || awayTeam === team) {
        games++;
        if (winner === team) wins++;
      }
    }
  });

  return games ? wins / games : 0;
}

/**
 * Common opponents across all tied teams (rule B).
 */
function getCommonOpponents(tiedTeams) {
  const oppMap = {};
  tiedTeams.forEach(t => oppMap[t] = new Set());

  scheduleData.forEach((game) => {
    const {homeTeam, awayTeam} = game;
    if (tiedTeams.includes(homeTeam)) {
      oppMap[homeTeam].add(awayTeam);
    }
    if (tiedTeams.includes(awayTeam)) {
      oppMap[awayTeam].add(homeTeam);
    }
  });

  let common = null;
  tiedTeams.forEach(team => {
    const set = oppMap[team];
    if (common === null) {
      common = new Set([...set]);
    } else {
      common = new Set([...common].filter(x => set.has(x)));
    }
  });

  return common ? Array.from(common) : [];
}

/**
 * Win% vs a list of opponents.
 */
function recordVsOpponentList(team, opponents) {
  let wins = 0;
  let games = 0;

  const oppSet = new Set(opponents);

  forEachResolvedGame((game, idx, winner) => {
    if (!winner) return;
    const {homeTeam, awayTeam} = game;

    if (homeTeam === team && oppSet.has(awayTeam)) {
      games++;
      if (winner === team) wins++;
    } else if (awayTeam === team && oppSet.has(homeTeam)) {
      games++;
      if (winner === team) wins++;
    }
  });

  return games ? wins / games : 0;
}

/**
 * Rule C: record vs highest-priority opponent among a fixed list.
 * Priority list is the “best-placed common conference opponents” approximation.
 */
function recordVsPriorityOpp(team, priorityList) {
  for (const opp of priorityList) {
    const pct = recordVsOpponentList(team, [opp]);
    if (pct > 0 || pct < 0) { // any games played (pct != 0 OR 0 with losses)
      // We can't distinguish 0 with no games from 0 with all losses here,
      // but that's acceptable for our simplified rule.
      return pct;
    }
  }
  return 0;
}

/**
 * Rule D: cumulative opponents' conference win% for this team.
 */
function cumulativeOppWinPct(team, record) {
  const oppSet = new Set();

  scheduleData.forEach((game, idx) => {
    const {homeTeam, awayTeam} = game;
    if (homeTeam === team) oppSet.add(awayTeam);
    if (awayTeam === team) oppSet.add(homeTeam);
  });

  let totalPct = 0;
  let count = 0;

  oppSet.forEach(opp => {
    const r = record[opp];
    if (!r) return;
    const games = r.wins + r.losses;
    const pct = games ? r.wins / games : 0;
    totalPct += pct;
    count++;
  });

  return count ? totalPct / count : 0;
}

/**
 * Comparator that applies A–D tiebreakers for teams with the same record.
 */
function compareTeamsWithTiebreakers(a, b, record) {
  const pctA = record[a].pct;
  const pctB = record[b].pct;

  if (pctA !== pctB) return pctB - pctA;

  // Teams tied on win%: build the tied group at this pct
  const tiedTeams = teams.filter(t => record[t].pct === pctA);
  if (tiedTeams.length <= 1) {
    return a.localeCompare(b);
  }

  // A. Head-to-head among tied teams
  const h2hA = headToHeadWinPct(a, tiedTeams);
  const h2hB = headToHeadWinPct(b, tiedTeams);
  if (h2hA !== h2hB) return h2hB - h2hA;

  // B. Record vs all common conference opponents among tied teams
  const commonOpps = getCommonOpponents(tiedTeams);
  if (commonOpps.length > 0) {
    const commonA = recordVsOpponentList(a, commonOpps);
    const commonB = recordVsOpponentList(b, commonOpps);
    if (commonA !== commonB) return commonB - commonA;
  }

  // C. Record vs highest-placed common conference opponent
  const priorityOrder = ['Texas A&M', 'Ole Miss', 'Georgia', 'Alabama', 'Texas'];
  const priA = recordVsPriorityOpp(a, priorityOrder);
  const priB = recordVsPriorityOpp(b, priorityOrder);
  if (priA !== priB) return priB - priA;

  // D. Cumulative opponents’ win%
  const sosA = cumulativeOppWinPct(a, record);
  const sosB = cumulativeOppWinPct(b, record);
  if (sosA !== sosB) return sosB - sosA;

  // Final fallback: alphabetical
  return a.localeCompare(b);
}

/**
 * Enumerate permutations of remaining games and count top-2 finishes.
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

    userPicks[idx] = game.awayTeam;
    recurse(i + 1);

    userPicks[idx] = game.homeTeam;
    recurse(i + 1);

    delete userPicks[idx];
  }

  recurse(0);
  return {counts, total: totalPerms};
}

/**
 * Update standings table + scenario summary.
 */
function updateStandings() {
  const {record, order} = computeStandings();
  const unpicked = computeUnpickedCounts();
  const {counts: champCounts, total: totalPerms} = computeScenarioCounts();

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

  const summaryDiv = document.getElementById('scenarioSummary');
  if (summaryDiv) {
    summaryDiv.textContent = `Total permutations considered: ${totalPerms}`;
  }

  updateScheduleHighlights();
}

/**
 * Hide/show completed games.
 */
function updateScheduleVisibility() {
  const rows = document.querySelectorAll('#scheduleContainer table tbody tr.completed');
  rows.forEach(row => {
    if (hideCompleted) {
      row.classList.add('hidden');
    } else {
      row.classList.remove('hidden');
    }
  });

  const toggleBtn = document.getElementById('toggleCompleted');
  if (toggleBtn) {
    toggleBtn.textContent = hideCompleted ? 'Show Completed Games' : 'Hide Completed Games';
  }
}

/**
 * Highlight picked games.
 */
function updateScheduleHighlights() {
  const rows = document.querySelectorAll('#scheduleContainer table tbody tr');
  rows.forEach(row => {
    const idx = parseInt(row.dataset.index, 10);
    if (Object.prototype.hasOwnProperty.call(userPicks, idx)) {
      row.classList.add('selected');
    } else {
      row.classList.remove('selected');
    }
  });
}

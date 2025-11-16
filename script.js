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
    // Attempt to load schedule data from the JSON file
    try {
      const response = await fetch('sec_2025_schedule.json');
      if (!response.ok) {
        throw new Error('Could not load sec_2025_schedule.json (HTTP error)');
      }
      scheduleData = await response.json();
    } catch (fetchErr) {
      console.error('Error loading schedule JSON:', fetchErr);
      showError('Failed to load sec_2025_schedule.json. The simulator cannot run.');
      return; // abort initialization on failure
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
  // Clear existing content
  container.innerHTML = '';
  // Create a table element to host the schedule
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
    // Date cell
    const dateCell = document.createElement('td');
    dateCell.textContent = game.date;
    row.appendChild(dateCell);
    // Matchup cell
    const matchupCell = document.createElement('td');
    matchupCell.textContent = `${game.awayTeam} @ ${game.homeTeam}`;
    row.appendChild(matchupCell);
    // Result/Pick cell
    const pickCell = document.createElement('td');
    if (game.winner) {
      // Completed game: show final result with winner highlighted
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
      // Pending game: create pill radio buttons for away, toss-up, home
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
      // Append away, toss-up, home pills
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
 * Compute the record and tiebreaker order for all teams under current user picks.
 * Implements SEC multi‑team tiebreakers: head‑to‑head, common opponents,
 * record versus highest placed conference opponents (missing counts as 1.0),
 * and cumulative opponents’ win percentage.
 * @returns {{record:Object<string,{wins:number,losses:number,pct:number}>, order:string[]}}
 */
function computeStandings() {
  // Build record with wins/losses and winning percentage
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
  // compute win percentage
  teams.forEach(team => {
    const w = record[team].wins;
    const l = record[team].losses;
    record[team].pct = (w + l) > 0 ? w / (w + l) : 0;
  });
  // Determine sorted order by multi‑team tiebreakers
  const uniquePcts = Array.from(new Set(teams.map(t => record[t].pct))).sort((a,b) => b - a);
  const finalOrder = [];
  uniquePcts.forEach(pct => {
    // Collect teams with this win pct
    const tiedGroup = teams.filter(t => record[t].pct === pct);
    if (tiedGroup.length === 1) {
      finalOrder.push(tiedGroup[0]);
    } else {
      const resolved = resolveGroup(tiedGroup, record);
      finalOrder.push(...resolved);
    }
  });
  return {record, order: finalOrder};
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

/* --------------------------------------------------------------------
 * Advanced tiebreaker helpers
 *
 * The SEC uses a series of multi‑team tiebreakers when conference
 * records are equal. The order is:
 *   A. Head‑to‑head sweep (only applies if one team beats all others in
 *      the tied group or, if two teams are tied, if one has a head‑to‑head
 *      win over the other). If no team has beaten every other team in
 *      the group, the head‑to‑head tiebreaker is skipped.
 *   B. Record versus all common conference opponents among the tied
 *      teams. If there are no common opponents or all records are equal,
 *      proceed to the next criterion.
 *   C. Record against the highest placed conference opponents in order
 *      of the standings. A missing game against a given opponent is
 *      treated as a perfect (1.0) winning percentage, so a team is not
 *      penalized for not playing a particular opponent. The first
 *      opponent that splits the tie is used. If still tied, continue
 *      down the standings.
 *   D. Cumulative conference opponents’ winning percentage. Higher
 *      average opponent win percentage ranks higher.
 *   E. Alphabetical order as a last resort.
 *
 * resolveGroup() applies these tiebreakers recursively to produce
 * a total ordering for any tied group.
 */

/**
 * Determine if head‑to‑head can break the tie. For groups of more than
 * two teams, this criterion only applies if one team has beaten every
 * other team in the group and has played them all. For groups of two
 * teams, the team that won the head‑to‑head matchup (if played) is
 * ranked higher. Returns an array of winners and losers or null if
 * head‑to‑head does not resolve the tie.
 *
 * @param {string[]} group Array of tied team names
 * @param {Object} record Conference record map
 * @returns {[string[], string[]] | null}
 */
function headToHeadRule(group, record) {
  const n = group.length;
  // Track head‑to‑head wins and games among the group
  const winsCount = {};
  const gamesCount = {};
  group.forEach(t => {
    winsCount[t] = 0;
    gamesCount[t] = 0;
  });
  scheduleData.forEach((game, idx) => {
    const winner = game.winner || userPicks[idx];
    if (!winner) return;
    const {homeTeam, awayTeam} = game;
    if (group.includes(homeTeam) && group.includes(awayTeam)) {
      // increment game counts for both participants
      gamesCount[homeTeam]++;
      gamesCount[awayTeam]++;
      // tally win for the winner
      winsCount[winner]++;
    }
  });
  if (n === 2) {
    // Two‑team tie: whichever team won head‑to‑head (if played) is ranked higher
    const t1 = group[0];
    const t2 = group[1];
    if (winsCount[t1] > winsCount[t2]) {
      return [[t1], [t2]];
    }
    if (winsCount[t2] > winsCount[t1]) {
      return [[t2], [t1]];
    }
    return null;
  }
  // Multi‑team tie: only break if a team swept the others
  const sweepers = [];
  group.forEach(t => {
    if (gamesCount[t] === n - 1 && winsCount[t] === n - 1) {
      sweepers.push(t);
    }
  });
  if (sweepers.length > 0) {
    const winners = sweepers.slice();
    const losers = group.filter(t => !winners.includes(t));
    return [winners, losers];
  }
  return null;
}

/**
 * Identify the set of opponents that are common to all teams in the group.
 * @param {string[]} group Array of tied team names
 * @returns {Set<string>} Set of opponent team names
 */
function commonOpponents(group) {
  if (group.length === 0) return new Set();
  const oppSets = [];
  group.forEach(team => {
    const opps = new Set();
    scheduleData.forEach(game => {
      if (game.homeTeam === team) opps.add(game.awayTeam);
      if (game.awayTeam === team) opps.add(game.homeTeam);
    });
    oppSets.push(opps);
  });
  // Intersect all opponent sets
  let common = new Set(oppSets[0]);
  for (let i = 1; i < oppSets.length; i++) {
    const next = oppSets[i];
    common = new Set([...common].filter(x => next.has(x)));
  }
  return common;
}

/**
 * Compute winning percentage for a team against a list of opponents. If no
 * games were played against the provided opponents, returns null.
 * @param {string} team Team name
 * @param {Set<string>} oppSet Set of opponent team names
 * @returns {number|null}
 */
function recordVsOpponents(team, oppSet) {
  let wins = 0;
  let games = 0;
  scheduleData.forEach((game, idx) => {
    const winner = game.winner || userPicks[idx];
    if (!winner) return;
    const ht = game.homeTeam;
    const at = game.awayTeam;
    if (ht === team && oppSet.has(at)) {
      games++;
      if (winner === team) wins++;
    } else if (at === team && oppSet.has(ht)) {
      games++;
      if (winner === team) wins++;
    }
  });
  return games > 0 ? (wins / games) : null;
}

/**
 * Dynamic rule C: compare tied teams based on record against the highest
 * placed conference opponents. The list of opponents is determined by
 * sorting all teams not in the group by win percentage in descending order
 * (and then alphabetically for stability). For each candidate opponent,
 * teams that did not play that opponent are credited with a 1.0 winning
 * percentage. The first opponent that produces a split among the tied
 * teams is used to break the tie.
 * @param {string[]} group Array of tied team names
 * @param {Object} record Conference record map
 * @returns {[string[], string[]] | null}
 */
function dynamicRuleC(group, record) {
  // Build list of opponents sorted by win pct and then alphabetically
  const opps = teams.filter(t => !group.includes(t));
  opps.sort((a, b) => {
    const pctDiff = record[b].pct - record[a].pct;
    if (pctDiff !== 0) return pctDiff;
    return a.localeCompare(b);
  });
  // Iterate through opponents to attempt to split the tie
  for (let i = 0; i < opps.length; i++) {
    const opp = opps[i];
    // Compute each tied team's winning percentage vs this opponent
    const values = {};
    group.forEach(t => {
      let wins = 0;
      let games = 0;
      scheduleData.forEach((game, idx) => {
        const winner = game.winner || userPicks[idx];
        if (!winner) return;
        if ((game.homeTeam === t && game.awayTeam === opp) || (game.awayTeam === t && game.homeTeam === opp)) {
          games++;
          if (winner === t) wins++;
        }
      });
      if (games > 0) {
        values[t] = wins / games;
      } else {
        // No game against this opponent counts as a perfect record
        values[t] = 1.0;
      }
    });
    const best = Math.max(...Object.values(values));
    const bestTeams = group.filter(t => values[t] === best);
    if (bestTeams.length > 0 && bestTeams.length < group.length) {
      const others = group.filter(t => !bestTeams.includes(t));
      return [bestTeams, others];
    }
  }
  return null;
}

/**
 * Rule D: cumulative conference opponents win percentage. Teams with higher
 * average opponent win percentage are favored.
 * @param {string[]} group Tied team names
 * @param {Object} record Conference record map
 * @returns {[string[], string[]] | null}
 */
function cumulativeRuleD(group, record) {
  const values = {};
  group.forEach(team => {
    let total = 0;
    let count = 0;
    scheduleData.forEach(game => {
      if (game.homeTeam === team) {
        const opp = game.awayTeam;
        const oppGames = record[opp].wins + record[opp].losses;
        const oppPct = oppGames > 0 ? (record[opp].wins / oppGames) : 0;
        total += oppPct;
        count++;
      } else if (game.awayTeam === team) {
        const opp = game.homeTeam;
        const oppGames = record[opp].wins + record[opp].losses;
        const oppPct = oppGames > 0 ? (record[opp].wins / oppGames) : 0;
        total += oppPct;
        count++;
      }
    });
    values[team] = count > 0 ? (total / count) : null;
  });
  // Determine best value
  const best = Math.max(...Object.values(values));
  const bestTeams = group.filter(t => values[t] === best);
  if (bestTeams.length > 0 && bestTeams.length < group.length) {
    const others = group.filter(t => !bestTeams.includes(t));
    return [bestTeams, others];
  }
  return null;
}

/**
 * Resolve a tied group of teams by applying SEC multi‑team tiebreakers
 * recursively. Returns a list of teams ordered from highest to lowest.
 * @param {string[]} group Array of tied team names
 * @param {Object} record Conference record map
 * @returns {string[]} Ordered list of teams
 */
function resolveGroup(group, record) {
  if (group.length <= 1) {
    return group.slice();
  }
  // A. Head‑to‑head sweep or two‑team head‑to‑head
  const hh = headToHeadRule(group, record);
  if (hh) {
    const [winners, losers] = hh;
    return resolveGroup(winners, record).concat(resolveGroup(losers, record));
  }
  // B. Record vs common opponents
  const common = commonOpponents(group);
  if (common.size > 0) {
    const values = {};
    let hasData = false;
    group.forEach(team => {
      const v = recordVsOpponents(team, common);
      values[team] = v;
      if (v !== null) hasData = true;
    });
    if (hasData) {
      const best = Math.max(...Object.values(values).filter(v => v !== null));
      const bestTeams = group.filter(t => values[t] === best);
      if (bestTeams.length > 0 && bestTeams.length < group.length) {
        const others = group.filter(t => !bestTeams.includes(t));
        return resolveGroup(bestTeams, record).concat(resolveGroup(others, record));
      }
    }
  }
  // D. Cumulative opponents win percentage (applied before rule C)
  // This rule considers each tied team's opponents' win percentage and
  // favors teams with a tougher schedule. Applying it before rule C
  // aligns the tiebreaker order with external calculators where
  // cumulative strength of schedule is used ahead of the highest-placed
  // opponent comparison.
  const dResult = cumulativeRuleD(group, record);
  if (dResult) {
    const [winners, losers] = dResult;
    return resolveGroup(winners, record).concat(resolveGroup(losers, record));
  }
  // C. Record vs highest placed opponents (missing = 1.0)
  // We move this after cumulative strength of schedule to match the
  // SEC tiebreaker ordering used by reference calculators. A missing
  // game counts as a perfect record. The first opponent that splits
  // the tie determines the ordering.
  const cResult = dynamicRuleC(group, record);
  if (cResult) {
    const [winners, losers] = cResult;
    return resolveGroup(winners, record).concat(resolveGroup(losers, record));
  }
  // E. Final fallback: alphabetical order
  return group.slice().sort();
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
  // Hide or show completed game rows
  const rows = document.querySelectorAll('#scheduleContainer table tbody tr.completed');
  rows.forEach(row => {
    if (hideCompleted) {
      row.classList.add('hidden');
    } else {
      row.classList.remove('hidden');
    }
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
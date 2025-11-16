/*
 * 2025 SEC Football Scenario Simulator (Standalone JS)
 *
 * Tiebreakers for teams with the same conference record:
 *  A. Head-to-head competition among the tied teams
 *  B. Record versus all common Conference opponents among the tied teams
 *  D. Cumulative Conference winning percentage of all Conference opponents
 *     among the tied teams
 *  C. Record against highest (best) placed common Conference opponent in the
 *     Conference standings – simplified here to a fixed priority list:
 *       Texas A&M, Ole Miss, Georgia, Alabama, Texas
 *
 * Note: For a tied group, we apply A→B→D→C to the whole group and
 * recursively break it into subgroups. That means in your TAMU/UGA/OM/Bama
 * scenario, rule D splits off Georgia from the 7–1 group, then rule C
 * breaks Ole Miss vs Alabama via Texas (#5) just like the reference site.
 */

// Global state
let scheduleData = [];

// Global error handler
if (typeof window !== "undefined") {
  window.onerror = function (message, source, lineno, colno, error) {
    console.error("Global error handler:", message, "at", lineno + ":" + colno, "source:", source, "error:", error);
    showError("JS Error: " + message + " at " + lineno + ":" + colno);
  };
}

let teams = [];
const userPicks = {};
let hideCompleted = true;

// Entry point
window.addEventListener("DOMContentLoaded", () => {
  init();
});

async function init() {
  console.log("Initializing SEC Scenario Simulator...");
  console.log("Attempting to load schedule from sec_2025_schedule.json...");

  try {
    const response = await fetch("sec_2025_schedule.json");

    if (!response.ok) {
      console.error(
        "Failed to load sec_2025_schedule.json. HTTP status:",
        response.status,
        response.statusText
      );
      showError("Could not load sec_2025_schedule.json (HTTP error). The simulator cannot run.");

      return; // STOP — do not continue building schedule
    }

    scheduleData = await response.json();
    console.log("Loaded schedule from sec_2025_schedule.json. Games:", scheduleData.length);

  } catch (err) {
    console.error("Error loading schedule JSON:", err);
    showError("Failed to load sec_2025_schedule.json. The simulator cannot run.");
    return; // STOP setup
  }

  // Extract unique list of teams
  const teamsSet = new Set();
  scheduleData.forEach((game) => {
    teamsSet.add(game.homeTeam);
    teamsSet.add(game.awayTeam);
  });
  teams = Array.from(teamsSet).sort();

  // Build UI
  buildSchedule();
  updateStandings();

  // Wire up buttons
  const toggleBtn = document.getElementById("toggleCompleted");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      hideCompleted = !hideCompleted;
      updateScheduleVisibility();
    });
  }

  const resetBtn = document.getElementById("resetPicks");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      Object.keys(userPicks).forEach((key) => delete userPicks[key]);
      const radios = document.querySelectorAll("#scheduleContainer input[type='radio']");
      radios.forEach((radio) => {
        radio.checked = radio.value === "";
      });
      console.log("User picks reset to Toss-up for all remaining games.");
      updateStandings();
    });
  }
}


/**
 * Show error banner at top.
 */
function showError(msg) {
  const div = document.createElement("div");
  div.style.backgroundColor = "#8b0000";
  div.style.color = "#ffffff";
  div.style.padding = "0.5rem";
  div.style.marginBottom = "0.5rem";
  div.textContent = "Error: " + msg;
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
  const container = document.getElementById("scheduleContainer");
  if (!container) return;

  container.innerHTML = "";

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  ["Date", "Matchup", "Result/Pick"].forEach((label) => {
    const th = document.createElement("th");
    th.textContent = label;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  scheduleData.forEach((game, idx) => {
    const row = document.createElement("tr");
    row.dataset.index = idx;
    if (game.winner) {
      row.classList.add("completed");
    }

    const dateCell = document.createElement("td");
    dateCell.textContent = game.date;
    row.appendChild(dateCell);

    const matchupCell = document.createElement("td");
    matchupCell.textContent = `${game.awayTeam} @ ${game.homeTeam}`;
    row.appendChild(matchupCell);

    const pickCell = document.createElement("td");

    if (game.winner) {
      const awaySpan = document.createElement("span");
      awaySpan.textContent = `${game.awayTeam} (${game.awayScore})`;
      const separator = document.createElement("span");
      separator.textContent = " @ ";
      const homeSpan = document.createElement("span");
      homeSpan.textContent = `${game.homeTeam} (${game.homeScore})`;

      if (game.winner === game.awayTeam) {
        awaySpan.classList.add("winner");
      } else {
        homeSpan.classList.add("winner");
      }

      pickCell.appendChild(awaySpan);
      pickCell.appendChild(separator);
      pickCell.appendChild(homeSpan);
    } else {
      function createPill(labelText, value, defaultChecked) {
        const label = document.createElement("label");
        label.className = "pill";

        const input = document.createElement("input");
        input.type = "radio";
        input.name = `game-${idx}`;
        input.value = value;
        if (defaultChecked) input.checked = true;

        input.addEventListener("change", () => {
          if (value) {
            userPicks[idx] = value;
          } else {
            delete userPicks[idx];
          }
          console.log(`User pick for game ${idx}:`, value || "Toss-up");
          updateStandings();
        });

        const span = document.createElement("span");
        span.textContent = labelText;

        label.appendChild(input);
        label.appendChild(span);
        return label;
      }

      pickCell.appendChild(createPill(game.awayTeam, game.awayTeam, false));
      pickCell.appendChild(createPill("Toss-up", "", true));
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
  teams.forEach((team) => {
    record[team] = { wins: 0, losses: 0, pct: 0 };
  });

  scheduleData.forEach((game, idx) => {
    let winner = game.winner;
    if (!winner && Object.prototype.hasOwnProperty.call(userPicks, idx)) {
      winner = userPicks[idx];
    }

    if (winner) {
      const loser = winner === game.homeTeam ? game.awayTeam : game.homeTeam;
      record[winner].wins++;
      record[loser].losses++;
    }
  });

  teams.forEach((team) => {
    const r = record[team];
    const games = r.wins + r.losses;
    r.pct = games ? r.wins / games : 0;
  });

  const order = rankTeamsByPctAndTiebreakers(record);
  return { record, order };
}

/**
 * Rank all teams by pct, then apply group tiebreakers recursively.
 */
function rankTeamsByPctAndTiebreakers(record) {
  const pctMap = {};
  teams.forEach((team) => {
    const pct = record[team].pct;
    if (!pctMap[pct]) pctMap[pct] = [];
    pctMap[pct].push(team);
  });

  const uniquePcts = Object.keys(pctMap)
    .map(parseFloat)
    .sort((a, b) => b - a);

  const ordered = [];
  uniquePcts.forEach((pct) => {
    const group = pctMap[pct];
    if (group.length === 1) {
      ordered.push(group[0]);
    } else {
      const resolved = resolveTieGroup(group, record);
      ordered.push(...resolved);
    }
  });

  return ordered;
}

/**
 * Resolve a tie within a group of teams that all have the same pct.
 * Applies A→B→D→C; at each step, if some subset clearly has the best
 * metric, recursively rank that subset above the others.
 */
function resolveTieGroup(group, record) {
  if (group.length <= 1) return group.slice();

  const separateBy = (metricFn, skipIfNoData = true) => {
    const metrics = {};
    let best = -Infinity;
    let hasData = false;

    group.forEach((team) => {
      const v = metricFn(team, group);
      metrics[team] = v;
      if (v !== null && v !== undefined && !Number.isNaN(v)) {
        hasData = true;
        if (v > best) best = v;
      }
    });

    if (skipIfNoData && !hasData) return null;

    const bestTeams = group.filter((t) => metrics[t] === best);
    if (bestTeams.length > 0 && bestTeams.length < group.length) {
      const others = group.filter((t) => metrics[t] !== best);
      return resolveTieGroup(bestTeams, record).concat(resolveTieGroup(others, record));
    }

    return null;
  };

  // A. Head-to-head within the tied group
  let res = separateBy((team, tiedTeams) => headToHeadWinPct(team, tiedTeams));
  if (res) return res;

  // B. Record vs common opponents among the tied group
  const commonOpps = getCommonOpponents(group);
  if (commonOpps.length > 0) {
    res = separateBy((team) => recordVsOpponentList(team, commonOpps));
    if (res) return res;
  }

  // D. Cumulative opponents’ conference win%
  res = separateBy((team) => cumulativeOppWinPct(team, record));
  if (res) return res;

  // C. Record vs highest-placed common opponent – approximate via priority list
  const priorityOrder = ["Texas A&M", "Ole Miss", "Georgia", "Alabama", "Texas"];
  res = separateBy((team) => recordVsPriorityOpp(team, priorityOrder));
  if (res) return res;

  // Final fallback: alphabetical
  return group.slice().sort((a, b) => a.localeCompare(b));
}

/**
 * Compute how many unpicked (toss-up) games remain for each team.
 */
function computeUnpickedCounts() {
  const counts = {};
  teams.forEach((team) => (counts[team] = 0));

  scheduleData.forEach((game, idx) => {
    if (!game.winner) {
      const pick = Object.prototype.hasOwnProperty.call(userPicks, idx)
        ? userPicks[idx]
        : null;
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
    const { homeTeam, awayTeam } = game;
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
  tiedTeams.forEach((t) => (oppMap[t] = new Set()));

  scheduleData.forEach((game) => {
    const { homeTeam, awayTeam } = game;
    if (tiedTeams.includes(homeTeam)) {
      oppMap[homeTeam].add(awayTeam);
    }
    if (tiedTeams.includes(awayTeam)) {
      oppMap[awayTeam].add(homeTeam);
    }
  });

  let common = null;
  tiedTeams.forEach((team) => {
    const set = oppMap[team];
    if (common === null) {
      common = new Set([...set]);
    } else {
      common = new Set([...common].filter((x) => set.has(x)));
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
    const { homeTeam, awayTeam } = game;

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
    // If they've played that opponent at least once, use that pct.
    // (0 with games played is meaningful; 0 with no games won't happen here.)
    if (!Number.isNaN(pct)) {
      // We still need a way to distinguish "no games" from "0 with games";
      // the implementation of recordVsOpponentList only returns 0 if
      // games > 0, so this is fine.
      if (pct !== 0 || pct === 0) {
        const gamesPlayed = hasPlayedOpponent(team, opp);
        if (gamesPlayed) return pct;
      }
    }
  }
  return 0;
}

/**
 * Helper to see if team has played a given opponent.
 */
function hasPlayedOpponent(team, opp) {
  let played = false;
  forEachResolvedGame((game) => {
    const { homeTeam, awayTeam } = game;
    if (
      (homeTeam === team && awayTeam === opp) ||
      (awayTeam === team && homeTeam === opp)
    ) {
      played = true;
    }
  });
  return played;
}

/**
 * Rule D: cumulative opponents' conference win% for this team.
 */
function cumulativeOppWinPct(team, record) {
  const oppSet = new Set();

  scheduleData.forEach((game) => {
    const { homeTeam, awayTeam } = game;
    if (homeTeam === team) oppSet.add(awayTeam);
    if (awayTeam === team) oppSet.add(homeTeam);
  });

  let totalPct = 0;
  let count = 0;

  oppSet.forEach((opp) => {
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
  teams.forEach((t) => {
    counts[t] = { first: 0, second: 0 };
  });

  const totalPerms = Math.pow(2, remaining.length);

  function recurse(i) {
    if (i === remaining.length) {
      const { order } = computeStandings();
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
  return { counts, total: totalPerms };
}

/**
 * Update standings table + scenario summary.
 */
function updateStandings() {
  const { record, order } = computeStandings();
  const unpicked = computeUnpickedCounts();
  const { counts: champCounts, total: totalPerms } = computeScenarioCounts();

  const container = document.getElementById("standingsContainer");
  if (!container) return;
  container.innerHTML = "";

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["Rank", "Team", "Wins", "Losses", "Unpicked", "Top2 %"].forEach((txt) => {
    const th = document.createElement("th");
    th.textContent = txt;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  order.forEach((team, index) => {
    const tr = document.createElement("tr");

    const firstCount = champCounts[team].first;
    const secondCount = champCounts[team].second;
    const pct = totalPerms > 0 ? ((firstCount + secondCount) / totalPerms) * 100 : 0;

    if (pct === 100) {
      tr.classList.add("certain");
    } else if (pct === 0) {
      tr.classList.add("noChance");
    }

    const rankCell = document.createElement("td");
    rankCell.textContent = index + 1;
    tr.appendChild(rankCell);

    const teamCell = document.createElement("td");
    teamCell.textContent = team;
    tr.appendChild(teamCell);

    const winsCell = document.createElement("td");
    winsCell.textContent = record[team].wins;
    tr.appendChild(winsCell);

    const lossesCell = document.createElement("td");
    lossesCell.textContent = record[team].losses;
    tr.appendChild(lossesCell);

    const unpickedCell = document.createElement("td");
    unpickedCell.textContent = unpicked[team];
    tr.appendChild(unpickedCell);

    const pctCell = document.createElement("td");
    pctCell.textContent = pct.toFixed(1) + "%";
    tr.appendChild(pctCell);

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);

  const summaryDiv = document.getElementById("scenarioSummary");
  if (summaryDiv) {
    summaryDiv.textContent = `Total permutations considered: ${totalPerms}`;
  }

  updateScheduleHighlights();
}

/**
 * Hide/show completed games.
 */
function updateScheduleVisibility() {
  const rows = document.querySelectorAll("#scheduleContainer table tbody tr.completed");
  rows.forEach((row) => {
    if (hideCompleted) {
      row.classList.add("hidden");
    } else {
      row.classList.remove("hidden");
    }
  });

  const toggleBtn = document.getElementById("toggleCompleted");
  if (toggleBtn) {
    toggleBtn.textContent = hideCompleted ? "Show Completed Games" : "Hide Completed Games";
  }
}

/**
 * Highlight picked games.
 */
function updateScheduleHighlights() {
  const rows = document.querySelectorAll("#scheduleContainer table tbody tr");
  rows.forEach((row) => {
    const idx = parseInt(row.dataset.index, 10);
    if (Object.prototype.hasOwnProperty.call(userPicks, idx)) {
      row.classList.add("selected");
    } else {
      row.classList.remove("selected");
    }
  });
}

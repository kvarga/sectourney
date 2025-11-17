# SEC Football Scenario Simulator

This repository contains a **static web application** that simulates possible scenarios for the 2025 SEC football season.  The tool lets you pick winners for the remaining games, automatically updates conference standings in real time, and calculates each team’s probability of finishing in the top two based on the **official SEC tie‑breaker rules**.  It is designed to run entirely in the browser and requires no server‑side code.

## Features

- **Interactive schedule**:  All remaining games are listed by date.  For each unplayed game you can click on the away team, home team, or choose “Toss‑up.”  Completed games (with final scores) are shown in grey by default and can be toggled on/off.
- **Real‑time standings**:  As you make picks, the standings table updates immediately with wins, losses, remaining unpicked games and each team’s top‑two percentage.
- **Accurate tie‑breakers**:  The simulator follows the SEC’s official procedure for breaking ties: (A) head‑to‑head record among the tied teams, (B) record versus all common conference opponents, (C) record versus the highest‑placed common conference opponent moving down the standings, and (D) cumulative opponents’ conference winning percentage:contentReference[oaicite:0]{index=0}.  This ensures multi‑team ties are resolved correctly, including tricky three‑way ties.
- **Scenario enumeration**:  For any unpicked games left as “Toss‑up,” the simulator enumerates all possible outcomes to determine each team’s chance of finishing in the top two.

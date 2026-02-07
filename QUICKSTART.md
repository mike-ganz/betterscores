# Courtside - Quick Start

## Run Locally (Full Features)

```bash
npm install
vercel dev
```

Opens at **http://localhost:3000** with live scores, odds, and player props.

**First time setup:**
```bash
npm i -g vercel    # Install Vercel CLI
vercel login       # Authenticate
vercel link        # Link to your Vercel project
```

## Run Locally (Frontend Only)

```bash
npm run dev
```

Opens at **http://localhost:5173**. Everything works except player props (requires the serverless function).

## What You'll See

### Home Page (Scores)
- Date picker at top (7 days back/forward)
- NBA and NCAAM game cards with live odds (spread, ML, O/U)
- Click any game card to expand it:
  - Full Vegas lines with implied probability
  - Data-driven insights (pregame, live, or postgame)
  - **Player props** from FanDuel (NBA only) — points, rebounds, assists, 3PM with over/under lines
  - Leading scorers with foul trouble alerts (live games)

### Standings
- NBA: Eastern/Western conference standings
- NCAAM: AP Top 25 + conference standings filter

### Team & Player Pages
- Click team logos for roster/stats
- Click player names for season averages

## Key Files

- **ESPN API client:** `src/utils/api-client.js`
- **FanDuel client:** `src/utils/fd-client.js`
- **Odds fallback/enrichment:** `src/utils/mock-odds.js`
- **Serverless proxy:** `api/dk-props.js`
- **Game card modal:** `src/components/scores/GameCardExpanded.jsx`
- **Player props UI:** `src/components/scores/PlayerPropsSection.jsx`

## Deploy

Push to `main` — Vercel auto-deploys via GitHub integration.

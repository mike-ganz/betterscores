# Courtside - Basketball Scores, Odds & Player Props

A personal basketball tracking app featuring live NBA and NCAAM scores, real-time Vegas odds, and player prop lines from FanDuel. Dark, immersive "Arena" aesthetic. Deployed on Vercel.

## Features

### Scoreboard
- **Live Scores:** Real-time NBA and NCAAM with 10s polling
- **Date Navigation:** Browse games 7 days back to 7 days forward
- **Game Cards:** Team logos, scores, records, live status badges, and odds at a glance
- **Expanded Game Modal:** Click any game for full details — odds, insights, leading scorers, and player props

### Live Odds (ESPN)
- **Spread, Moneyline, Over/Under** from ESPN's core odds API
- **Implied Probability** visualized with progress bars
- **Line Movement** tracking (opening vs current lines)
- **Live Updates** — odds refresh every 10s during games
- Fallback to calculated mock odds when ESPN data is unavailable

### Player Props (FanDuel)
- **Points, Rebounds, Assists, 3-Pointers Made** over/under lines
- **Player headshots** and team logos from FanDuel
- Fetched on-demand when you expand a game card (NBA only)
- Proxied through a Vercel serverless function to avoid CORS/bot issues
- 90s client-side cache + 60s server-side cache

### Data Insights
- **Pregame:** ESPN win predictor, season series, Vegas line summary
- **Live:** Scoring pace vs O/U projection, active runs, foul trouble
- **Postgame:** Spread coverage, O/U result, top performer

### Other
- **Standings:** NBA East/West conferences, NCAAM AP Top 25 + conference standings
- **Team Pages:** Roster, record, team stats
- **Player Pages:** Season averages in bento box layout
- **Parlay Builder:** Select bets across games, calculate parlay payouts

## Tech Stack

- **Framework:** React 19 + Vite 7
- **Styling:** Tailwind CSS 3
- **Animations:** Framer Motion
- **Icons:** lucide-react
- **Routing:** react-router-dom 7
- **APIs:** ESPN (scores, odds, stats), FanDuel (player props)
- **Deployment:** Vercel (SPA + serverless functions)

## Project Structure

```
├── api/
│   └── dk-props.js              # Vercel serverless proxy for FanDuel API
├── src/
│   ├── components/
│   │   ├── layout/              # Navigation, PageWrapper
│   │   ├── scores/
│   │   │   ├── GameCard.jsx           # Compact game card with odds
│   │   │   ├── GameCardExpanded.jsx   # Full modal with odds, insights, player props
│   │   │   ├── PlayerPropsSection.jsx # Player prop lines UI
│   │   │   ├── LiveGameHero.jsx       # Featured live game display
│   │   │   ├── MomentumSparkline.jsx  # Score momentum visualization
│   │   │   └── ParlayBuilder.jsx      # Parlay selection & payout calc
│   │   ├── standings/           # Conference filter, standings table
│   │   ├── player/              # Stat cards (bento box)
│   │   └── ui/                  # Badge, Button, CommandPalette, Skeleton
│   ├── hooks/
│   │   ├── useBasketballData.js # Scoreboard, standings, player stats hooks
│   │   ├── usePlayerProps.js    # FanDuel player props hook
│   │   └── useGameOdds.js       # (legacy, unused)
│   ├── pages/
│   │   ├── Home.jsx             # Main scoreboard
│   │   ├── Standings.jsx        # Standings & rankings
│   │   ├── TeamPage.jsx         # Team details
│   │   └── PlayerDetail.jsx     # Player stats
│   └── utils/
│       ├── api-client.js        # ESPN API wrapper (espnAPI)
│       ├── fd-client.js         # FanDuel API client (fdAPI)
│       ├── mock-odds.js         # Odds enrichment & fallback generator
│       ├── game-insights.js     # Context-driven game insights
│       ├── game-importance.js   # Game importance scoring
│       └── team-colors.js       # NBA team color definitions
├── vercel.json                  # Vercel routing config
├── vite.config.js
└── package.json
```

## API Architecture

### ESPN (Direct from browser — no proxy needed)
- **Scoreboard:** `site.api.espn.com/apis/site/v2/sports/basketball/{league}/scoreboard`
- **Core Odds:** `sports.core.api.espn.com/v2/.../events/{id}/competitions/{id}/odds`
- **Player Stats:** `sports.core.api.espn.com/v2/.../athletes/{id}/statistics/0`
- **Game Summary:** `site.api.espn.com/apis/site/v2/sports/basketball/{league}/summary?event={id}`

### FanDuel (Proxied through Vercel serverless function)
- **Events:** `sbapi.mi.sportsbook.fanduel.com/api/content-managed-page?page=CUSTOM&customPageId=nba`
- **Player Props:** `sbapi.mi.sportsbook.fanduel.com/api/event-page?eventId={id}&tab={tab}`
- Tabs: `player-points`, `player-rebounds`, `player-assists`, `player-threes`
- Proxied via `/api/dk-props` serverless function (named for historical reasons)

**Why a proxy?** FanDuel's API doesn't send CORS headers, so browsers block direct requests. The serverless function makes the request server-side and forwards the response. DraftKings was the original target but blocks non-browser requests via Akamai CDN; FanDuel has no bot protection.

## Getting Started

### Prerequisites
- Node.js 20+
- Vercel CLI (`npm i -g vercel`)

### Installation

```bash
git clone <repo-url>
cd betterscores
npm install
```

### Development (full features including player props)

```bash
vercel dev
```

This starts both the Vite dev server (React app with HMR) and the serverless functions locally. Opens at `http://localhost:3000`.

**First time?** You'll need to run `vercel login` and `vercel link` to connect your local directory to the Vercel project.

### Development (frontend only, no player props)

```bash
npm run dev
```

Opens at `http://localhost:5173`. Player props won't load since the serverless function isn't running, but everything else works.

### Build & Deploy

```bash
npm run build
```

Pushes to `main` auto-deploy via Vercel's GitHub integration.

## Sportsbook API Notes

- **DraftKings** blocks all non-browser requests (Akamai TLS fingerprinting). Even with perfect User-Agent headers, curl/Node.js `fetch` get 403'd.
- **FanDuel** has no bot protection. Their `sbapi.mi.sportsbook.fanduel.com` API returns clean JSON with player headshots, team logos, odds, and line data.
- **ESPN** provides game-level odds (spread/ML/O/U) but has no player prop endpoints.
- **The Odds API** (`the-odds-api.com`) is a viable paid alternative with 500 free credits/month if FanDuel's API ever gets locked down.

## License

Built as a personal project. ESPN and FanDuel data used via their public-facing APIs.

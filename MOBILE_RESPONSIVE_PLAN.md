# Mobile Responsiveness Fix Plan

## Overview
Comprehensive plan to fix 40 mobile responsiveness issues across the Courtside app.
Organized into 3 phases by severity. Phases 1-2 executed immediately, Phase 3 saved for later.

---

## Phase 1: Critical Fixes (Layout Breaks / Overflow)

### 1.1 — Fix global font-size inflation
**File:** `src/index.css`
- Change `html { font-size: 120% }` to only apply on `md+` screens
- Mobile gets 100% base, desktop keeps 120%
- This single change deflates all rem-based padding/margins/fonts on mobile

### 1.2 — Build mobile navigation with hamburger menu
**File:** `src/components/layout/Navigation.jsx`
- Add a hamburger icon (`Menu` from lucide) visible only on `sm:hidden`
- Hide the center filter bar and nav links on small screens (`hidden sm:flex`)
- Create a slide-down mobile menu panel (toggled by hamburger) containing:
  - Nav links (Scores, Standings, Bets) stacked vertically
  - League toggles (NBA / NCAAM) as a row
  - Date quick-selects (Yesterday / Today / Tomorrow) as a row
  - Calendar button
- Reduce nav container padding: `px-4 sm:px-6`

### 1.3 — Fix double padding (PageWrapper + page content)
**Files:** `src/components/layout/PageWrapper.jsx`, `src/pages/Home.jsx`, `src/pages/Bets.jsx`
- PageWrapper: Change `px-6 py-8` → `px-4 sm:px-6 py-6 sm:py-8`
- Home.jsx: Remove the inner `<div className="max-w-6xl mx-auto px-4 py-8">` wrapper
  - Keep `max-w-6xl mx-auto` but drop `px-4 py-8`
- Bets.jsx: Remove the inner `<div className="max-w-4xl mx-auto px-4 py-8 relative">` wrapper
  - Keep `max-w-4xl mx-auto relative` but drop `px-4 py-8`

### 1.4 — Redesign BestBetRow for mobile
**File:** `src/components/bets/BestBetsSection.jsx`
- BestBetRow: Switch from single-row flex to a stacked layout on mobile:
  - Top row: signal dot + headshot + player name + game info (full width)
  - Bottom row: prop label, line, odds, strength (wrapped in a responsive flex)
- Reduce `gap-5` → `gap-2 sm:gap-5` on the right-side container
- Reduce `min-w-[54px]` → `min-w-0 sm:min-w-[54px]`
- Reduce `min-w-[80px]` → `min-w-0 sm:min-w-[80px]`
- BreakdownPopover: Change `w-72` → `w-[calc(100vw-2rem)] sm:w-72`
  - Position: `right-0` → `right-0 sm:right-0` with `-left-4 sm:left-auto` on mobile
- BestBetsSection container: `p-5` → `p-3 sm:p-5`

### 1.5 — Make ParlayBuilder responsive
**File:** `src/components/scores/ParlayBuilder.jsx`
- Change `fixed bottom-6 right-6 max-w-xs` → `fixed bottom-4 right-3 sm:bottom-6 sm:right-6 left-3 sm:left-auto sm:max-w-xs`
- This makes it full-width on mobile (with small margins) and positioned right on desktop

### 1.6 — Fix BetsGameCard team layout
**File:** `src/components/bets/BetsGameCard.jsx`
- Reduce `gap-6` → `gap-2 sm:gap-6` between teams
- Reduce `px-5 py-4` → `px-3 py-3 sm:px-5 sm:py-4`
- Team logos: `w-8 h-8` → `w-6 h-6 sm:w-8 sm:h-8`
- Score text: `text-lg` → `text-base sm:text-lg`
- Status gap: `gap-3` → `gap-2 sm:gap-3`

### 1.7 — Fix calendar popup on mobile
**File:** `src/components/layout/Navigation.jsx`
- Change inline style grid from `40px` columns to responsive: `clamp(32px, 8vw, 40px)`
- Add `max-width: calc(100vw - 2rem)` to prevent viewport overflow
- Change cell dimensions from fixed `40px × 48px` to responsive
- Position: add a left-edge guard so it doesn't clip off-screen

---

## Phase 2: Major Fixes (Significant UX Degradation)

### 2.1 — Responsive font sizes across all pages
**Files:** Multiple
- GameCard score: `text-3xl` → `text-2xl sm:text-3xl`
- PlayerDetail name: `text-4xl` → `text-2xl sm:text-3xl md:text-4xl`
- TeamPage name: `text-3xl` → `text-xl sm:text-2xl md:text-3xl`
- PageWrapper title: `text-2xl` → `text-xl sm:text-2xl`
- StatCard hero: `text-5xl` → `text-3xl sm:text-4xl md:text-5xl`
- StatCard standard: `text-3xl` → `text-2xl sm:text-3xl`

### 2.2 — Fix PlayerDetail padding
**File:** `src/pages/PlayerDetail.jsx`
- Player header: `p-8 mb-8` → `p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8`
- Stat grid: `gap-5 mb-10` → `gap-3 sm:gap-4 md:gap-5 mb-6 sm:mb-8 md:mb-10`
- Hero card headshot: `w-32 h-32` → `w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32`

### 2.3 — Fix TeamPage header layout
**File:** `src/pages/TeamPage.jsx`
- Header flex: add `flex-col sm:flex-row` + `text-center sm:text-left`
- Logo: `w-16 h-16` → `w-12 h-12 sm:w-16 sm:h-16`
- Stat grid: `gap-4` → `gap-2 sm:gap-3 md:gap-4`
- Stat card padding: `p-4` → `p-3 sm:p-4`
- Stat values: `text-2xl` → `text-xl sm:text-2xl`

### 2.4 — Fix PlayerPropsSection row layout
**File:** `src/components/scores/PlayerPropsSection.jsx`
- Row padding: `px-3` → `px-2 sm:px-3`
- Right side gap: `gap-4` → `gap-2 sm:gap-4`
- Odds min-width: `min-w-[44px]` → `min-w-[36px] sm:min-w-[44px]`
- Player name font: `text-sm` → `text-xs sm:text-sm`
- Container: `p-5` → `p-3 sm:p-5`

### 2.5 — Fix GameCardExpanded modal for mobile
**File:** `src/components/scores/GameCardExpanded.jsx`
- Moneyline grid: `grid-cols-2` → `grid-cols-1 sm:grid-cols-2`
- Line movement grid: `grid-cols-2` → `grid-cols-1 sm:grid-cols-2`
- Content spacing: `space-y-6` → `space-y-4 sm:space-y-6`
- Vegas lines container: `p-5 space-y-5` → `p-3 sm:p-5 space-y-3 sm:space-y-5`

### 2.6 — Fix StandingsTable for mobile
**File:** `src/components/standings/StandingsTable.jsx`
- Table cell padding: `px-4 py-3` → `px-2 py-2 sm:px-4 sm:py-3`
- Hide low-priority columns on mobile: PCT and GB get `hidden sm:table-cell`

### 2.7 — Fix Bets page refresh button touch target
**File:** `src/pages/Bets.jsx`
- Increase padding: `p-2` → `p-2.5 sm:p-2`
- Increase icon: `size={16}` → `size={18}`
- Adjust position: `top-8 right-4` → `top-6 right-2 sm:top-8 sm:right-4`

### 2.8 — Fix GameCard for mobile
**File:** `src/components/scores/GameCard.jsx`
- Card padding: `p-6` → `p-4 sm:p-6`
- Team logo: `w-11 h-11` → `w-9 h-9 sm:w-11 sm:h-11`
- Score text: `text-3xl` → `text-2xl sm:text-3xl`
- Odds grid gap: `gap-3` → `gap-2 sm:gap-3`
- Top margin separator: `mt-5 pt-4` → `mt-4 pt-3 sm:mt-5 sm:pt-4`
- Hover scale: `hover:scale-105` → `sm:hover:scale-105`
- Add touch feedback: `active:scale-[0.98]`

---

## Phase 3: Polish (Aesthetic Refinements) — DEFERRED

### 3.1 — Reduce section spacing on mobile
**Files:** `src/pages/Home.jsx`, `src/pages/Bets.jsx`
- `space-y-12` → `space-y-6 sm:space-y-8 md:space-y-12`
- Section heading `mb-6` → `mb-4 sm:mb-6`

### 3.2 — Make MomentumSparkline visible on mobile
**File:** `src/components/scores/MomentumSparkline.jsx`
- Change `opacity-0 group-hover:opacity-100` → `opacity-60 sm:opacity-0 sm:group-hover:opacity-100`
- This makes it always visible (dimmed) on mobile, hover-reveal on desktop

### 3.3 — Add touch feedback to GameCard
**File:** `src/components/scores/GameCard.jsx`
- Add `active:scale-[0.98] active:opacity-90` for touch press feedback

### 3.4 — Responsive section heading letter-spacing
**Files:** `src/pages/Home.jsx`, `src/pages/Bets.jsx`
- `tracking-[0.2em]` → `tracking-wider sm:tracking-[0.2em]`

### 3.5 — Tighten BestBetsSection header
**File:** `src/components/bets/BestBetsSection.jsx`
- Header: `mb-4` → `mb-2 sm:mb-4` where applicable
- `tracking-widest` → `tracking-wide sm:tracking-widest`

### 3.6 — GameCardExpanded insight row tightening
**File:** `src/components/scores/GameCardExpanded.jsx`
- Insight rows: `gap-3 px-4 py-2.5` → `gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-2.5`
- Label width: `w-24` → `w-20 sm:w-24`

### 3.7 — StatCard responsive padding
**File:** `src/components/player/StatCard.jsx`
- Hero: `p-6` → `p-4 sm:p-6`
- Standard: `p-5` → `p-3 sm:p-5`
- Compact: `p-4` → `p-3 sm:p-4`

### 3.8 — CommandPalette viewport safety
**File:** `src/components/ui/CommandPalette.jsx`
- Add `w-[calc(100vw-2rem)]` alongside `max-w-lg` for small screen safety

### 3.9 — PlayerDetail game-logs placeholder
**File:** `src/pages/PlayerDetail.jsx`
- `p-10` → `p-6 sm:p-10`

### 3.10 — TeamPage roster table mobile
**File:** `src/pages/TeamPage.jsx`
- Table cell padding: `px-4 py-3` → `px-2 py-2 sm:px-4 sm:py-3`
- Hide College column on mobile: `hidden sm:table-cell`
- Player headshot in table: `w-10 h-10` → `w-8 h-8 sm:w-10 sm:h-10`

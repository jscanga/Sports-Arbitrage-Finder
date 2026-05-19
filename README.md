# Sports Arbitrage Finder

**A real-time sports odds aggregator and arbitrage detection tool built with Next.js.**

This project allows users to connect their **Odds API** key, fetch real-time sports odds, and identify arbitrage opportunities, or situations where placing bets on both outcomes guarantees a profit. The website includes a calculator to determine optimal bet amounts and expected ROI.

---

## Live Demo
Check out the live version [on Vercel](https://sports-arbitrage-finder.vercel.app/dashboard)

## Screenshots

**Dashboard Overview**  
![](https://i.imgur.com/slEDOV8.png)

**Arbitrage Calculator Modal**  
![](https://i.imgur.com/VQNOKmM.png)

---

## Features

- Fetch live and pre-game odds from multiple sports and bookmakers
- Identify arbitrage opportunities with guaranteed profit
- View detailed odds, bookmakers, implied probabilities, and arbitrage percentages
- Interactive arbitrage calculator to simulate bet distribution and ROI
- Filter and sort opportunities by sport, profit, live/pre-game status
- Responsive and modern UI built with Tailwind CSS

---

## Tech Stack

- **Frontend:** Next.js (React + TypeScript)
- **Styling:** Tailwind CSS
- **State Management:** React hooks
- **API Integration:** Odds API for real-time sports data
- **Utilities:** Arbitrage calculations including ROI, guaranteed payouts, and implied probabilities

---

## How It Works

1. **API Key Setup**  
   Users provide their Odds API key via the `ApiKeyManager` component. Keys are saved in `localStorage` for persistence.

2. **Fetching Odds**  
   The app fetches odds via a custom Next.js API route. Odds can be filtered by event type (`all`, `live`, `pregame`).

3. **Arbitrage Detection**  
   For each game:

   - Identify the best odds for home and away teams across all bookmakers
   - Convert American odds to implied probabilities
   - Detect arbitrage opportunities where the sum of implied probabilities is less than 1 (guaranteed profit)

4. **Profit Calculation**

   - Calculate optimal bet distribution
   - Display guaranteed payout, profit, and ROI

5. **Filtering & Sorting**
   - Filter by live/pre-game status
   - Sort by profit, sport, or start time

---

## Usage

1. Clone the repository:

```bash
git clone https://github.com/yourusername/arbitrage-finder.git
cd arbitrage-finder
```

2. Install Dependencies:

```bash
npm install
```

3. Run Development Server

```bash
npm run dev
```

4. Open website at localhost:3000/dashboard

5. Enter your Odds API key and click Scan to fetch opportunities

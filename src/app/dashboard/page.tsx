// app/dashboard/page.tsx
'use client';
import { useState, useEffect } from 'react';
import ApiKeyManager from '@/components/ApiKeyManager';

interface OddsData {
  id: string;
  sport_key: string;
  sport_title: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers: {
    key: string;
    title: string;
    markets: {
      key: string;
      outcomes: {
        name: string;
        price: number;
      }[];
    }[];
  }[];
}

export default function ArbitrageFinder() {
  const [odds, setOdds] = useState<OddsData[]>([]);
  const [arbOpportunities, setArbOpportunities] = useState<any[]>([]);
  const [debug, setDebug] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'live' | 'pregame'>('all');
  const [sortBy, setSortBy] = useState<'profit' | 'sport' | 'time'>('profit');
  const [selectedArb, setSelectedArb] = useState<any>(null);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [betAmount, setBetAmount] = useState('100');
  const [sportFilter, setSportFilter] = useState<string>('all'); 
  const [scanType, setScanType] = useState<'all' | 'live' | 'pregame'>('all');
  const [apiKey, setApiKey] = useState<string>('');
  
  // Load API key on component mount
  useEffect(() => {
    const savedKey = localStorage.getItem('ODDS_API_KEY');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  // Calculate how much to bet on the other side
  const calculateOtherSideBet = (betAmount: number, arb: any) => {
    const homePayout = calculatePayout(betAmount, arb.homeOdds);
    const otherSideBet = homePayout / (arb.awayOdds > 0 ? (arb.awayOdds / 100) + 1 : (100 / Math.abs(arb.awayOdds)) + 1);
    return otherSideBet;
  };

  // Calculate payout for a bet
  const calculatePayout = (betAmount: number, odds: number) => {
    if (odds > 0) {
      return betAmount * (odds / 100) + betAmount;
    } else {
      return betAmount * (100 / Math.abs(odds)) + betAmount;
    }
  };

  // Calculate guaranteed payout (the lower of the two possible payouts)
  const calculateGuaranteedPayout = (betAmount: number, arb: any) => {
    const otherSideBet = calculateOtherSideBet(betAmount, arb);
    const homePayout = calculatePayout(betAmount, arb.homeOdds);
    const awayPayout = calculatePayout(otherSideBet, arb.awayOdds);
    return Math.min(homePayout, awayPayout);
  };

  // Calculate profit
  const calculateProfit = (betAmount: number, arb: any) => {
    const totalStake = betAmount + calculateOtherSideBet(betAmount, arb);
    const guaranteedPayout = calculateGuaranteedPayout(betAmount, arb);
    return guaranteedPayout - totalStake;
  };

  // Calculate ROI
  const calculateROI = (betAmount: number, arb: any) => {
    const profit = calculateProfit(betAmount, arb);
    const totalStake = betAmount + calculateOtherSideBet(betAmount, arb);
    return (profit / totalStake) * 100;
  };

const fetchOdds = async () => {
  // Check if API key is available
  if (!apiKey) {
    setDebug('❌ Error: No API key configured. Click the API Key button to set one.');
    return;
  }

  try {
    setDebug('Fetching odds...');
    
    // Build API URL with event type parameter
    let apiUrl = '/api/odds';
    const params = new URLSearchParams();
    
    if (scanType !== 'all') {
      params.append('eventType', scanType);
    }
    
    // Pass the API key to the backend
    params.append('apiKey', apiKey);
    
    if (params.toString()) {
      apiUrl += `?${params.toString()}`;
    }
    
    const res = await fetch(apiUrl);
    
    if (!res.ok) {
      // Try to parse error as JSON, but fall back to text if it fails
      let errorMessage = `HTTP error! status: ${res.status}`;
      try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // If JSON parsing fails, try to get text instead
        try {
          const errorText = await res.text();
          if (errorText) errorMessage = errorText;
        } catch {
          // If all else fails, use the status text
          errorMessage = res.statusText || errorMessage;
        }
      }
      throw new Error(errorMessage);
    }
    
    const data = await res.json();
    setOdds(data);
    console.log('Raw data sample:', data.slice(0, 3));
console.log('Sports found:', [...new Set(data.map((game: OddsData) => game.sport_title))]);
    setDebug(`✅ Fetched ${data.length} ${scanType !== 'all' ? scanType : ''} games`);
    findArbitrage(data);
  } catch (error: any) {
    console.error('Failed to fetch odds:', error);
    setDebug(`❌ Error: ${error.message}`);
  }
};

  const handleApiKeyUpdate = (newKey: string) => {
    setApiKey(newKey);
    setDebug('✅ API key updated successfully!');
  };

  const americanToImpliedProb = (odds: number): number => {
    if (odds > 0) {
      return 100 / (odds + 100);
    } else {
      return Math.abs(odds) / (Math.abs(odds) + 100);
    }
  };

  const isGameLive = (commenceTime: string) => {
    const gameTime = new Date(commenceTime);
    const now = new Date();
    return gameTime <= now;
  };

const findArbitrage = (oddsData: OddsData[]) => {
  const opportunities = [];
  let gamesChecked = 0;
  let arbsFound = 0;
  let sportsChecked = new Set();
  let bookmakersChecked = new Set();

  for (const game of oddsData) {
    gamesChecked++;
    sportsChecked.add(game.sport_title);
    const homeTeam = game.home_team;
    const awayTeam = game.away_team;
    const isLive = isGameLive(game.commence_time);
    
    let bestHomeOdds = { price: -Infinity, bookmaker: '' };
    let bestAwayOdds = { price: -Infinity, bookmaker: '' };

    // Find best odds across ALL bookmakers for this game
    for (const bookmaker of game.bookmakers) {
      bookmakersChecked.add(bookmaker.title);
      const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
      if (!h2hMarket || h2hMarket.outcomes.length !== 2) continue;

      const homeOutcome = h2hMarket.outcomes.find(o => o.name === homeTeam);
      const awayOutcome = h2hMarket.outcomes.find(o => o.name === awayTeam);

      if (homeOutcome && homeOutcome.price > bestHomeOdds.price) {
        bestHomeOdds = { price: homeOutcome.price, bookmaker: bookmaker.title };
      }
      if (awayOutcome && awayOutcome.price > bestAwayOdds.price) {
        bestAwayOdds = { price: awayOutcome.price, bookmaker: bookmaker.title };
      }
    }

    if (bestHomeOdds.price !== -Infinity && bestAwayOdds.price !== -Infinity) {
      const homeProb = americanToImpliedProb(bestHomeOdds.price);
      const awayProb = americanToImpliedProb(bestAwayOdds.price);
      const totalProb = homeProb + awayProb;
      const arbPercent = (totalProb * 100);
      const profit = ((1 - totalProb) * 100);

      // Show any profit
      if (totalProb < 0.999999 && profit > 0.001) {
        arbsFound++;
        opportunities.push({
          game: `${homeTeam} vs ${awayTeam}`,
          sport: game.sport_title,
          commenceTime: game.commence_time,
          isLive,
          homeBookmaker: bestHomeOdds.bookmaker,
          awayBookmaker: bestAwayOdds.bookmaker,
          homeOdds: bestHomeOdds.price,
          awayOdds: bestAwayOdds.price,
          homeProb: (homeProb * 100).toFixed(3),
          awayProb: (awayProb * 100).toFixed(3),
          arbPercent: arbPercent.toFixed(3),
          profit: profit.toFixed(3)
        });
      }
    }
  }

  console.log('📊 DEBUG - Sports checked:', Array.from(sportsChecked));
  console.log('📊 DEBUG - Bookmakers checked:', Array.from(bookmakersChecked));
  console.log('📊 DEBUG - Games with bookmakers:', gamesChecked);
  
  setArbOpportunities(opportunities);
  setDebug(prev => prev + ` | Checked ${gamesChecked} games across ${sportsChecked.size} sports, ${bookmakersChecked.size} bookmakers, found ${arbsFound} opportunities`);
};

  const filteredAndSortedOpportunities = arbOpportunities
    .filter(arb => {
      if (filter === 'live') return arb.isLive;
      if (filter === 'pregame') return !arb.isLive;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'profit') return parseFloat(b.profit) - parseFloat(a.profit);
      if (sortBy === 'sport') return a.sport.localeCompare(b.sport);
      if (sortBy === 'time') return new Date(a.commenceTime).getTime() - new Date(b.commenceTime).getTime();
      return 0;
    });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-linear-to-bl from-emerald-900 to-black-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Calculator Modal */}
        {calculatorOpen && selectedArb && (
          <div className="fixed inset-0 bg-neutral-900/90 flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-b from-neutral-900 to-black rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-white">Arbitrage Calculator</h3>
                  <button 
                    onClick={() => setCalculatorOpen(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2">{selectedArb.game}</p>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{selectedArb.homeBookmaker}: {selectedArb.homeOdds > 0 ? '+' : ''}{selectedArb.homeOdds}</span>
                    <span className="text-gray-300">{selectedArb.awayBookmaker}: {selectedArb.awayOdds > 0 ? '+' : ''}{selectedArb.awayOdds}</span>
                  </div>
                </div>

                {/* Bet on Team A Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Bet on {selectedArb.game.split(' vs ')[0]} ($)
                  </label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="100"
                  />
                </div>

                {betAmount && !isNaN(parseFloat(betAmount)) && (
                  <div className="bg-emerald-900/15 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold text-white mb-3">Optimal Bet Distribution:</h4>
                    <div className="space-y-3">
                      {/* Team A Bet (user input) */}
                      <div className="flex justify-between items-center p-2 bg-blue-500/30 rounded">
                        <div>
                          <span className="font-medium text-blue-300">{selectedArb.game.split(' vs ')[0]}</span>
                          <div className="text-xs text-gray-300">{selectedArb.homeBookmaker}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-white">${parseFloat(betAmount).toFixed(2)}</div>
                          <div className="text-xs text-blue-200">
                            To win: ${calculatePayout(parseFloat(betAmount), selectedArb.homeOdds).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Team B Bet (calculated) */}
                      <div className="flex justify-between items-center p-2 bg-red-500/30 rounded">
                        <div>
                          <span className="font-medium text-red-300">{selectedArb.game.split(' vs ')[1]}</span>
                          <div className="text-xs text-gray-300">{selectedArb.awayBookmaker}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-white">${calculateOtherSideBet(parseFloat(betAmount), selectedArb).toFixed(2)}</div>
                          <div className="text-xs text-red-200">
                            To win: ${calculatePayout(calculateOtherSideBet(parseFloat(betAmount), selectedArb), selectedArb.awayOdds).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Profit Summary */}
                      <div className="border-t border-neutral-700 pt-3 mt-2 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Total Stake:</span>
                          <span className="font-medium text-white">${(parseFloat(betAmount) + calculateOtherSideBet(parseFloat(betAmount), selectedArb)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">Guaranteed Payout:</span>
                          <span className="font-medium text-white">${calculateGuaranteedPayout(parseFloat(betAmount), selectedArb).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-400 font-semibold text-lg">
                          <span>Guaranteed Profit:</span>
                          <span>${calculateProfit(parseFloat(betAmount), selectedArb).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-400 text-sm">
                          <span>ROI:</span>
                          <span>{calculateROI(parseFloat(betAmount), selectedArb).toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setCalculatorOpen(false)}
                  className="w-full bg-emerald-800 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-tr from-neutral-900 to-black rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">Arbitrage Finder</h1>
            <div className="flex gap-4 items-center">
              {/* API Key Status & Manager */}
              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                apiKey ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/50 text-red-300'
              }`}>
                {apiKey ? '✅ API Key Set' : '❌ No API Key'}
              </div>
              
              <ApiKeyManager currentKey={apiKey} onKeyUpdate={handleApiKeyUpdate} />
              
              {/* SCAN TYPE FILTER */}
              <select 
                value={scanType}
                onChange={(e) => setScanType(e.target.value as any)}
                className="px-4 py-2 bg-neutral-800 border border-neutral-700 text-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">All Events</option>
                <option value="pregame">Pre-game Only</option>
                <option value="live">Live Only</option>
              </select>
              
              <button 
                onClick={fetchOdds}
                disabled={!apiKey}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 shadow-md"
              >
                🔄 Scan {scanType === 'all' ? 'All' : scanType === 'live' ? 'Live' : 'Pre-game'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
              <div className="text-gray-300 text-sm font-semibold">Games Found</div>
              <div className="text-2xl font-bold text-white">{odds.length}</div>
            </div>
            <div className="bg-emerald-900/30 p-4 rounded-lg border border-emerald-800/50">
              <div className="text-gray-300 text-sm font-semibold">Arb Opportunities</div>
              <div className="text-2xl font-bold text-white">{arbOpportunities.length}</div>
            </div>
            <div className="bg-purple-900/30 p-4 rounded-lg border border-purple-800/50">
              <div className="text-gray-300 text-sm font-semibold">Best Profit</div>
              <div className="text-2xl font-bold text-white">
                {arbOpportunities.length > 0 ? `${Math.max(...arbOpportunities.map(a => parseFloat(a.profit))).toFixed(2)}%` : '0%'}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-400 mb-2">Display Filter</label>
              <div className="flex space-x-2">
                {['all', 'live', 'pregame'].map((filterType) => (
                  <button
                    key={filterType}
                    onClick={() => setFilter(filterType as any)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      filter === filterType
                        ? 'bg-emerald-700 text-white shadow-md'
                        : 'bg-neutral-800 text-gray-400 hover:bg-neutral-700 hover:text-white'
                    }`}
                  >
                    {filterType === 'all' ? 'All Games' : filterType === 'live' ? '🔴 Live' : '⏰ Pre-game'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Filters displayed results only</p>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-400 mb-2">Sort By</label>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 text-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="profit">Highest Profit</option>
                <option value="sport">Sport</option>
                <option value="time">Start Time</option>
              </select>
            </div>
          </div>

          {debug && (
            <div className="bg-neutral-800 p-3 rounded-lg text-sm text-gray-300 mb-4">
              {debug}
            </div>
          )}
        </div>

        {filteredAndSortedOpportunities.length > 0 ? (
          <div className="grid gap-4">
            {filteredAndSortedOpportunities.map((arb, index) => (
              <div key={index} className="bg-gradient-to-r from-neutral-900 to-black rounded-xl shadow-md border-l-4 border-emerald-500 hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          arb.isLive ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {arb.isLive ? '🔴 LIVE' : '⏰ PRE-GAME'}
                        </span>
                        <span className="bg-neutral-800 text-gray-300 px-2 py-1 rounded-full text-xs font-semibold">
                          {arb.sport}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white">{arb.game}</h3>
                      <p className="text-gray-400 text-sm mt-1">
                        Starts: {formatDate(arb.commenceTime)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-400">{arb.profit}%</div>
                      <div className="text-sm text-gray-400">Guaranteed Profit</div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800/50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-white">{arb.game.split(' vs ')[0]}</span>
                        <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm">
                          {arb.homeOdds > 0 ? '+' : ''}{arb.homeOdds}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">📊 {arb.homeBookmaker}</span>
                        <span className="text-gray-400">{arb.homeProb}% implied</span>
                      </div>
                    </div>

                    <div className="bg-red-900/30 p-4 rounded-lg border border-red-800/50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-white">{arb.game.split(' vs ')[1]}</span>
                        <span className="bg-red-600 text-white px-2 py-1 rounded text-sm">
                          {arb.awayOdds > 0 ? '+' : ''}{arb.awayOdds}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">📊 {arb.awayBookmaker}</span>
                        <span className="text-gray-400">{arb.awayProb}% implied</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-400">
                      Arbitrage Percentage: <strong className="text-white">{arb.arbPercent}%</strong>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedArb(arb);
                        setCalculatorOpen(true);
                        setBetAmount('100');
                      }}
                      className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-emerald-500 hover:to-blue-500 transition-all duration-200 shadow-md"
                    >
                      Calculate Profit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-b from-neutral-900 to-black rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Arbitrage Opportunities Found</h3>
            <p className="text-gray-500">Click the scan button to search for guaranteed profit opportunities.</p>
          </div>
        )}
      </div>
    </div>
  );
}
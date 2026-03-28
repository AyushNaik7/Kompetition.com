'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, Match } from '@/lib/api';
import Navbar from '@/components/Navbar';

export default function MyMatchesPage() {
  const [username, setUsername] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const data = await api.getMyMatches(username);
      setMatches(data);
      setSearched(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-4xl mx-auto px-5 py-10">
        <h1 className="text-4xl font-black text-white mb-3">🎮 My Matches</h1>
        <p className="text-gray-400 mb-8">View all your matches across competitions</p>

        <div className="bg-[#1a1a1a]/60 border border-white/10 rounded-2xl p-8 mb-8">
          <h3 className="text-xl font-semibold text-white mb-6 text-center">Enter Your Lichess Username</h3>
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your Lichess username..."
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-[#ff6b35] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#ff8555] transition-all disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-8 text-center">
            <p className="text-red-400">⚠️ {error}</p>
          </div>
        )}

        {searched && !loading && matches.length === 0 && !error && (
          <div className="text-center py-20 bg-[#1a1a1a]/40 border border-white/10 rounded-2xl">
            <div className="text-6xl mb-4 opacity-30">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Matches Found</h3>
            <p className="text-gray-400">No participant found with username "{username}"</p>
          </div>
        )}

        {matches.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">Matches for {username}</h2>
            {matches.map(match => (
              <div key={match.id} className="bg-[#1a1a1a]/60 border border-white/10 p-6 rounded-2xl">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {match.player1_name} vs {match.player2_name}
                    </h3>
                    <p className="text-sm text-gray-400">Round {match.round_number}</p>
                  </div>
                  <div>
                    {match.status === 'completed' && (
                      <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">
                        ✓ Completed
                      </span>
                    )}
                    {match.status === 'active' && (
                      <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold">
                        ⚡ Active
                      </span>
                    )}
                    {match.status === 'pending' && (
                      <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold">
                        ⏳ Pending
                      </span>
                    )}
                  </div>
                </div>
                
                {match.status === 'completed' && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-sm text-gray-400">
                      Result: <span className="text-white font-semibold">{match.result}</span>
                      {match.winner && <span> - Winner: <span className="text-[#ff6b35] font-semibold">{match.winner_name}</span></span>}
                    </p>
                  </div>
                )}
                
                {match.lichess_game_url && (
                  <div className="mt-3">
                    <a 
                      href={match.lichess_game_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#ff6b35] text-sm hover:underline"
                    >
                      View on Lichess →
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

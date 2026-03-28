'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { api, Competition, LeaderboardEntry } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function Home() {
  const [activeCompetitions, setActiveCompetitions] = useState<Competition[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const comps = await api.getActiveCompetitions();
      setActiveCompetitions(Array.isArray(comps) ? comps : []);
      
      // Get top players from first active competition
      if (Array.isArray(comps) && comps.length > 0) {
        try {
          const leaderboard = await api.getLeaderboard(comps[0].id);
          setTopPlayers(Array.isArray(leaderboard) ? leaderboard.slice(0, 3) : []);
        } catch (err) {
          console.error('Failed to load leaderboard:', err);
          setTopPlayers([]);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setActiveCompetitions([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompetitions = Array.isArray(activeCompetitions) ? activeCompetitions.filter(comp => {
    const matchesSearch = comp.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      selectedFilter === 'all' ||
      (selectedFilter === 'blitz' && comp.time_control.includes('3+')) ||
      (selectedFilter === 'rapid' && (comp.time_control.includes('10+') || comp.time_control.includes('15+'))) ||
      (selectedFilter === 'classical' && comp.time_control.includes('30+'));
    
    return matchesSearch && matchesFilter;
  }) : [];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-5 py-16">
        <div className="text-center mb-10">
          <h1 className="text-6xl font-black mb-4 text-white leading-tight">
            Compete in Chess Tournaments<br/>
            <span className="bg-gradient-to-r from-[#ff6b35] to-[#ff8555] bg-clip-text text-transparent">
              Worldwide
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-10">
            Join tournaments, track your progress, and compete with players globally
          </p>

          {/* Create Tournament Button */}
          <div className="mb-8">
            <Link 
              href="/competitions/create"
              className="inline-block bg-[#ff6b35] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#ff8555] transition-all shadow-lg shadow-[#ff6b35]/30"
            >
              + Create Your Tournament
            </Link>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search competitions by name..."
                className="w-full px-6 py-4 bg-[#1a1a1a]/60 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20 transition-all"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                🔍
              </div>
            </div>
          </div>

          {/* Filter Tags */}
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
                selectedFilter === 'all'
                  ? 'bg-[#ff6b35] text-white shadow-lg shadow-[#ff6b35]/30'
                  : 'bg-white/10 text-gray-400 hover:bg-white/15'
              }`}
            >
              All Tournaments
            </button>
            <button
              onClick={() => setSelectedFilter('blitz')}
              className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
                selectedFilter === 'blitz'
                  ? 'bg-[#ff6b35] text-white shadow-lg shadow-[#ff6b35]/30'
                  : 'bg-white/10 text-gray-400 hover:bg-white/15'
              }`}
            >
              ⚡ Blitz
            </button>
            <button
              onClick={() => setSelectedFilter('rapid')}
              className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
                selectedFilter === 'rapid'
                  ? 'bg-[#ff6b35] text-white shadow-lg shadow-[#ff6b35]/30'
                  : 'bg-white/10 text-gray-400 hover:bg-white/15'
              }`}
            >
              🚀 Rapid
            </button>
            <button
              onClick={() => setSelectedFilter('classical')}
              className={`px-5 py-2 rounded-full font-semibold text-sm transition-all ${
                selectedFilter === 'classical'
                  ? 'bg-[#ff6b35] text-white shadow-lg shadow-[#ff6b35]/30'
                  : 'bg-white/10 text-gray-400 hover:bg-white/15'
              }`}
            >
              ♟️ Classical
            </button>
          </div>
        </div>
      </div>

      {/* Active Competitions Section */}
      <div className="max-w-6xl mx-auto px-5 py-10">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black text-white">⚡ Active Competitions</h2>
          <Link href="/competitions" className="text-[#ff6b35] font-semibold hover:underline text-sm">
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="text-2xl text-gray-400">Loading competitions...</div>
          </div>
        ) : filteredCompetitions.length === 0 ? (
          <div className="text-center py-20 bg-[#1a1a1a]/40 border border-white/10 rounded-2xl">
            <div className="text-6xl mb-4 opacity-30">🏆</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Active Competitions</h3>
            <p className="text-gray-400">Check back later or browse all tournaments</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {filteredCompetitions.map(comp => (
              <CompetitionCard key={comp.id} competition={comp} />
            ))}
          </div>
        )}
      </div>

      {/* Leaderboard Preview Section */}
      {topPlayers.length > 0 && (
        <div className="max-w-6xl mx-auto px-5 py-16">
          <h2 className="text-3xl font-black text-white mb-8 text-center">🏆 Top Players</h2>
          
          <div className="grid grid-cols-3 gap-6">
            {topPlayers.map((player, index) => (
              <div
                key={player.participant_id}
                className={`bg-[#1a1a1a]/60 border rounded-2xl p-8 text-center transition-all hover:-translate-y-1 ${
                  index === 0
                    ? 'border-yellow-500/50 shadow-lg shadow-yellow-500/20'
                    : index === 1
                    ? 'border-gray-400/50 shadow-lg shadow-gray-400/20'
                    : 'border-orange-600/50 shadow-lg shadow-orange-600/20'
                }`}
              >
                <div className="text-5xl mb-4">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </div>
                <div className="text-4xl font-black text-white mb-2">#{player.rank}</div>
                <h3 className="text-xl font-bold text-white mb-1">{player.participant_name}</h3>
                <p className="text-sm text-gray-400 mb-4">@{player.lichess_username}</p>
                
                <div className="flex justify-center gap-6 text-sm">
                  <div>
                    <div className="text-2xl font-bold text-[#ff6b35]">{player.points}</div>
                    <div className="text-xs text-gray-400">Points</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">{player.wins}</div>
                    <div className="text-xs text-gray-400">Wins</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-400">{player.matches_played}</div>
                    <div className="text-xs text-gray-400">Played</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="text-center py-20 mb-16">
        {user ? (
          <>
            <h2 className="text-4xl font-bold mb-4 text-white">Welcome back, {user.username}! 👋</h2>
            <p className="text-gray-400 mb-8 text-lg">Jump into a tournament and start competing</p>
            <div className="flex gap-5 justify-center">
              <Link 
                href="/competitions" 
                className="bg-[#ff6b35] text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-[#ff8555] transition-all hover:-translate-y-1 shadow-xl shadow-[#ff6b35]/30"
              >
                Browse Tournaments
              </Link>
              <Link 
                href="/my-matches" 
                className="bg-white/10 text-white px-10 py-4 rounded-lg font-bold text-lg border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all hover:-translate-y-1"
              >
                My Matches
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-4xl font-bold mb-8 text-white">Ready to Compete?</h2>
            <div className="flex gap-5 justify-center">
              <Link 
                href="/register" 
                className="bg-[#ff6b35] text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-[#ff8555] transition-all hover:-translate-y-1 shadow-xl shadow-[#ff6b35]/30"
              >
                Create Account
              </Link>
              <Link 
                href="/competitions" 
                className="bg-white/10 text-white px-10 py-4 rounded-lg font-bold text-lg border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all hover:-translate-y-1"
              >
                Browse Tournaments
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CompetitionCard({ competition }: { competition: Competition }) {
  const startDate = new Date(competition.start_time);
  const endDate = new Date(competition.end_time);
  const now = new Date();
  
  const isLive = startDate <= now && endDate >= now;
  const isUpcoming = startDate > now;
  const isEnded = endDate < now;

  return (
    <div className="bg-[#1a1a1a]/60 border border-white/10 rounded-2xl p-6 hover:border-[#ff6b35]/50 hover:bg-[#1a1a1a]/80 transition-all hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-white mb-2">{competition.title}</h3>
          <p className="text-gray-400 text-sm mb-4">{competition.description}</p>
          
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">⏱️</span>
              <span className="text-white font-semibold">{competition.time_control}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">🎮</span>
              <span className="text-white font-semibold">1v1</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">👥</span>
              <span className="text-white font-semibold">
                {competition.participant_count || 0}/{competition.max_participants}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          {isLive && (
            <span className="bg-green-500/20 text-green-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase">
              ⚡ Live
            </span>
          )}
          {isUpcoming && (
            <span className="bg-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase">
              📅 Upcoming
            </span>
          )}
          {isEnded && (
            <span className="bg-gray-500/20 text-gray-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase">
              ✓ Ended
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-white/10">
        <div className="text-sm text-gray-400">
          <div>Start: {startDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          <div>End: {endDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        
        <Link
          href={`/competitions/${competition.slug}`}
          className="bg-[#ff6b35] text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-[#ff8555] transition-all hover:-translate-y-0.5 shadow-lg shadow-[#ff6b35]/30"
        >
          Register
        </Link>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { api, Match } from '@/lib/api';

export default function PublicMatchDetailPage() {
  const params = useParams();
  const matchId = parseInt(params.id as string);

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatch();
  }, [matchId]);

  const loadMatch = async () => {
    try {
      const matchData = await api.getMatch(matchId);
      setMatch(matchData);
    } catch (err) {
      console.error('Failed to load match:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Pending', icon: '⏳' },
      active: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Game in Progress', icon: '⚡' },
      completed: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Completed', icon: '✓' },
      cancelled: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Cancelled', icon: '✗' }
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-2xl text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-5 py-20 text-center">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-10">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-3">Match Not Found</h2>
            <Link href="/competitions" className="text-[#ff6b35] hover:underline">
              ← Back to Competitions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(match.status);

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-4xl mx-auto px-5 py-10">
        <div className="mb-8">
          <Link href="/competitions" className="text-[#ff6b35] hover:underline text-sm mb-4 inline-block">
            ← Back to Competitions
          </Link>
          <div className="text-center">
            <h1 className="text-5xl font-black text-white mb-4">
              {match.player1_name}
              <span className="text-[#ff6b35] mx-4">vs</span>
              {match.player2_name}
            </h1>
            <div className={`inline-block ${statusBadge.bg} ${statusBadge.text} px-6 py-3 rounded-full text-lg font-bold flex items-center gap-2`}>
              <span>{statusBadge.icon}</span>
              {statusBadge.label}
            </div>
          </div>
        </div>

        {/* Status Message */}
        {match.status === 'pending' && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-8 mb-6 text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h3 className="text-2xl font-bold text-white mb-2">Match Scheduled</h3>
            <p className="text-gray-400">This match hasn't started yet. Check back later!</p>
          </div>
        )}

        {match.status === 'active' && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-8 mb-6 text-center">
            <div className="text-6xl mb-4 animate-pulse">⚡</div>
            <h3 className="text-2xl font-bold text-white mb-2">Game in Progress</h3>
            <p className="text-gray-400">The match is currently being played on Lichess</p>
            {match.lichess_game_url && (
              <a
                href={match.lichess_game_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 bg-[#ff6b35] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#ff8555] transition-all"
              >
                Watch Live on Lichess →
              </a>
            )}
          </div>
        )}

        {/* Match Details */}
        <div className="bg-[#1a1a1a]/60 border border-white/10 rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6">Match Details</h2>
          
          <div className="space-y-4">
            {/* Round */}
            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-gray-400">Round</span>
              <span className="text-white font-semibold">Round {match.round_number}</span>
            </div>

            {/* Result */}
            {match.status === 'completed' && (
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-gray-400">Result</span>
                <span className="text-2xl font-bold text-[#ff6b35]">{match.result}</span>
              </div>
            )}

            {/* Winner */}
            {match.winner && (
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-gray-400">Winner</span>
                <span className="text-xl font-bold text-green-400">🏆 {match.winner_name}</span>
              </div>
            )}

            {/* Created */}
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-400">Created</span>
              <span className="text-white">{new Date(match.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Play on Lichess Button - Prominent */}
        {(match.status === 'pending' || match.status === 'active') && match.lichess_game_id && (
          <a
            href={match.lichess_game_url || `https://lichess.org/${match.lichess_game_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-gradient-to-r from-[#ff6b35] to-[#ff8555] text-white py-5 rounded-xl font-bold text-2xl hover:shadow-lg hover:shadow-[#ff6b35]/50 transition-all text-center mb-6"
          >
            🎮 Play on Lichess →
          </a>
        )}

        {/* View on Lichess Button (for completed games) */}
        {match.status === 'completed' && match.lichess_game_url && (
          <a
            href={match.lichess_game_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-[#ff6b35] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#ff8555] transition-all text-center shadow-lg shadow-[#ff6b35]/30"
          >
            View Game on Lichess →
          </a>
        )}

        {!match.lichess_game_id && match.status === 'pending' && (
          <div className="text-center py-8 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <p className="text-yellow-400 font-semibold mb-2">⏳ Waiting for game to be created</p>
            <p className="text-gray-400 text-sm">Game link will be available once the match starts on Lichess</p>
          </div>
        )}
      </div>
    </div>
  );
}

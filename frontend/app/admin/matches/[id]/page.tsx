'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { api, Match } from '@/lib/api';

export default function AdminMatchDetailPage() {
  const params = useParams();
  const matchId = parseInt(params.id as string);

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [creatingChallenge, setCreatingChallenge] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const handleSyncResult = async () => {
    if (!match || !match.lichess_game_id) {
      showToast('error', 'No Lichess Game ID provided');
      return;
    }

    setSyncing(true);

    try {
      const result = await api.syncMatchResult(matchId, match.lichess_game_id);
      showToast('success', result.message || 'Result synced successfully');
      
      // Reload match data
      await loadMatch();
    } catch (err: any) {
      console.error('Failed to sync result:', err);
      showToast('error', err.message || 'Failed to sync result');
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateChallenge = async () => {
    if (!match) return;

    setCreatingChallenge(true);

    try {
      const result = await api.createLichessChallenge(matchId);
      showToast('success', 'Challenge created! Opening Lichess...');
      
      // Open challenge URL in new tab
      window.open(result.challenge_url, '_blank');
      
      // Reload match data
      await loadMatch();
    } catch (err: any) {
      console.error('Failed to create challenge:', err);
      showToast('error', err.message || 'Failed to create challenge');
    } finally {
      setCreatingChallenge(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: '⏳' },
      active: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: '⚡' },
      completed: { bg: 'bg-green-500/20', text: 'text-green-400', icon: '✓' },
      cancelled: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: '✗' }
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
  const isCompleted = match.status === 'completed';

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`${toast.type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-red-500/20 border-red-500/30 text-red-400'} border rounded-xl p-4 shadow-lg`}>
            <p className="font-semibold">{toast.type === 'success' ? '✅' : '⚠️'} {toast.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-5 py-10">
        <div className="mb-8">
          <Link href={`/admin/competitions/${match.competition}/matches`} className="text-[#ff6b35] hover:underline text-sm mb-4 inline-block">
            ← Back to Match List
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-black text-white mb-3">Match Details</h1>
              <p className="text-gray-400">Round {match.round_number}</p>
            </div>
            <div className={`${statusBadge.bg} ${statusBadge.text} px-4 py-2 rounded-full text-sm font-bold uppercase flex items-center gap-2`}>
              <span>{statusBadge.icon}</span>
              {match.status}
              {isCompleted && <span className="ml-2">🔒</span>}
            </div>
          </div>
        </div>

        {/* Match Info Card */}
        <div className="bg-[#1a1a1a]/60 border border-white/10 rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6">Match Information</h2>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Player 1 */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Player 1</div>
              <div className="text-xl font-bold text-white">{match.player1_name}</div>
            </div>

            {/* Player 2 */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Player 2</div>
              <div className="text-xl font-bold text-white">{match.player2_name}</div>
            </div>

            {/* Round Number */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Round Number</div>
              <div className="text-xl font-bold text-white">{match.round_number}</div>
            </div>

            {/* Result */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Result</div>
              <div className="text-xl font-bold text-[#ff6b35]">
                {match.result !== '*' ? match.result : 'Not played yet'}
              </div>
            </div>

            {/* Winner */}
            {match.winner && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 col-span-2">
                <div className="text-sm text-gray-400 mb-1">Winner</div>
                <div className="text-xl font-bold text-green-400">🏆 {match.winner_name}</div>
              </div>
            )}

            {/* Result Source */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Result Source</div>
              <div className="text-lg font-semibold text-white capitalize">{match.result_source}</div>
            </div>

            {/* Lichess Game ID */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Lichess Game ID</div>
              <div className="text-lg font-mono text-white">
                {match.lichess_game_id || 'Not set'}
              </div>
            </div>

            {/* Lichess Game URL */}
            {match.lichess_game_url && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 col-span-2">
                <div className="text-sm text-gray-400 mb-1">Lichess Game URL</div>
                <a 
                  href={match.lichess_game_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#ff6b35] hover:underline break-all"
                >
                  {match.lichess_game_url}
                </a>
              </div>
            )}

            {/* Started At */}
            {match.started_at && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Started At</div>
                <div className="text-lg text-white">
                  {new Date(match.started_at).toLocaleString()}
                </div>
              </div>
            )}

            {/* Finished At */}
            {match.finished_at && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Finished At</div>
                <div className="text-lg text-white">
                  {new Date(match.finished_at).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {/* Play on Lichess Button - Prominent */}
          {(match.status === 'pending' || match.status === 'active') && match.lichess_game_id && (
            <a
              href={match.lichess_game_url || `https://lichess.org/${match.lichess_game_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-gradient-to-r from-[#ff6b35] to-[#ff8555] text-white py-4 rounded-xl font-bold text-xl hover:shadow-lg hover:shadow-[#ff6b35]/50 transition-all text-center"
            >
              🎮 Play on Lichess →
            </a>
          )}

          {/* Challenge Creation Section */}
          {!match.lichess_game_id && match.status === 'pending' && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-3">🎮 Create Lichess Challenge</h3>
              <p className="text-gray-300 text-sm mb-4">
                Create an official challenge on Lichess. This will send a challenge notification to {match.player2_name} on Lichess.
              </p>
              <button
                onClick={handleCreateChallenge}
                disabled={creatingChallenge}
                className="w-full bg-[#ff6b35] text-white py-3 rounded-lg font-bold hover:bg-[#ff8555] transition-all disabled:opacity-50"
              >
                {creatingChallenge ? '⚙️ Creating Challenge...' : '🎮 Create Challenge on Lichess'}
              </button>
              <p className="text-xs text-gray-500 mt-3">
                Note: Challenge will be created from the tournament organizer's account (Ayush0_0)
              </p>
            </div>
          )}
          
          <div className="flex gap-4">
            {match.lichess_game_url && match.status === 'completed' && (
              <a
                href={match.lichess_game_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-white/10 text-white py-3 rounded-lg font-bold hover:bg-white/15 transition-all text-center"
              >
                View Game on Lichess →
              </a>
            )}
            
            <button
              onClick={handleSyncResult}
              disabled={!match.lichess_game_id || syncing}
              className="flex-1 bg-[#ff6b35] text-white py-3 rounded-lg font-bold hover:bg-[#ff8555] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncing ? 'Syncing...' : isCompleted ? '🔒 Sync Result (Locked)' : 'Sync Result from Lichess'}
            </button>
          </div>
        </div>

        {isCompleted && (
          <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-400 text-sm">
              ⚠️ This match is completed and locked. Contact admin to override and re-sync results.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

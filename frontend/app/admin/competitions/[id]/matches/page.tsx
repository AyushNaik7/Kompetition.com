'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { api, Competition, Match } from '@/lib/api';

export default function AdminMatchListPage() {
  const params = useParams();
  const competitionId = parseInt(params.id as string);

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingMatchId, setSyncingMatchId] = useState<number | null>(null);
  const [generatingPairings, setGeneratingPairings] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [competitionId]);

  const loadData = async () => {
    try {
      const [compData, matchesData] = await Promise.all([
        api.getCompetition(competitionId.toString()),
        api.getCompetitionMatches(competitionId)
      ]);
      
      setCompetition(compData);
      setMatches(Array.isArray(matchesData) ? matchesData : []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncResult = async (matchId: number, lichessGameId: string) => {
    if (!lichessGameId) {
      showToast('error', 'No Lichess Game ID provided');
      return;
    }

    setSyncingMatchId(matchId);

    try {
      const result = await api.syncMatchResult(matchId, lichessGameId);
      showToast('success', result.message || 'Result synced successfully');
      
      // Reload matches to show updated data
      const matchesData = await api.getCompetitionMatches(competitionId);
      setMatches(Array.isArray(matchesData) ? matchesData : []);
    } catch (err: any) {
      console.error('Failed to sync result:', err);
      showToast('error', err.message || 'Failed to sync result');
    } finally {
      setSyncingMatchId(null);
    }
  };

  const handleGenerateSwissPairings = async () => {
    if (!confirm('Generate Swiss pairings for the next round? This will create matches automatically based on current standings.')) {
      return;
    }

    setGeneratingPairings(true);

    try {
      const result = await api.generateSwissPairings(competitionId);
      showToast('success', `${result.message}${result.bye_player ? ` (Bye: ${result.bye_player})` : ''}`);
      
      // Reload matches
      const matchesData = await api.getCompetitionMatches(competitionId);
      setMatches(Array.isArray(matchesData) ? matchesData : []);
    } catch (err: any) {
      console.error('Failed to generate pairings:', err);
      showToast('error', err.message || 'Failed to generate pairings');
    } finally {
      setGeneratingPairings(false);
    }
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      active: 'bg-blue-500/20 text-blue-400',
      completed: 'bg-green-500/20 text-green-400',
      cancelled: 'bg-gray-500/20 text-gray-400'
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

  if (!competition) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-5 py-20 text-center">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-10">
            <h2 className="text-2xl font-bold text-white mb-3">Competition Not Found</h2>
            <Link href="/competitions" className="text-[#ff6b35] hover:underline">
              ← Back to Competitions
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

      <div className="max-w-7xl mx-auto px-5 py-10">
        <div className="mb-8">
          <Link href={`/competitions/${competition.slug}`} className="text-[#ff6b35] hover:underline text-sm mb-4 inline-block">
            ← Back to Competition
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-black text-white mb-3">Match Management</h1>
              <p className="text-gray-400">{competition.title}</p>
            </div>
            <div className="flex gap-3">
              {competition.tournament_type === 'swiss' && (
                <button
                  onClick={handleGenerateSwissPairings}
                  disabled={generatingPairings}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-600 transition-all disabled:opacity-50"
                >
                  {generatingPairings ? '⚙️ Generating...' : '🎲 Generate Swiss Pairings'}
                </button>
              )}
              <Link
                href={`/admin/competitions/${competitionId}/pair`}
                className="bg-[#ff6b35] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#ff8555] transition-all"
              >
                + Create Match
              </Link>
            </div>
          </div>
        </div>

        {matches.length === 0 ? (
          <div className="text-center py-20 bg-[#1a1a1a]/40 border border-white/10 rounded-2xl">
            <div className="text-6xl mb-4 opacity-30">🎮</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Matches Yet</h3>
            <p className="text-gray-400 mb-6">Create the first match pairing</p>
            <Link
              href={`/admin/competitions/${competitionId}/pair`}
              className="inline-block bg-[#ff6b35] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#ff8555] transition-all"
            >
              Create Match
            </Link>
          </div>
        ) : (
          <div className="bg-[#1a1a1a]/60 border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-400">Round</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-400">Match</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-400">Game ID</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-400">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-400">Result</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {matches.map(match => (
                  <tr key={match.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-white font-semibold">
                      Round {match.round_number}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/matches/${match.id}`} className="text-white hover:text-[#ff6b35] transition-colors">
                        {match.player1_name} vs {match.player2_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-mono text-sm">
                      {match.lichess_game_id || '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`${getStatusBadge(match.status)} px-3 py-1 rounded-full text-xs font-bold uppercase`}>
                        {match.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-white font-semibold">
                      {match.result !== '*' ? match.result : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleSyncResult(match.id, match.lichess_game_id)}
                        disabled={!match.lichess_game_id || syncingMatchId === match.id}
                        className="bg-[#ff6b35] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#ff8555] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {syncingMatchId === match.id ? 'Syncing...' : 'Sync Result'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { api, Competition, Participant } from '@/lib/api';

export default function AdminMatchPairingPage() {
  const params = useParams();
  const router = useRouter();
  const competitionId = parseInt(params.id as string);

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [roundNumber, setRoundNumber] = useState(1);
  const [lichessGameId, setLichessGameId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [competitionId]);

  const loadData = async () => {
    try {
      const [compData, partsData] = await Promise.all([
        api.getCompetition(competitionId.toString()),
        api.getCompetitionParticipants(competitionId)
      ]);
      
      setCompetition(compData);
      setParticipants(Array.isArray(partsData) ? partsData : []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load competition data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Frontend validation: Prevent self-pairing
    if (player1 === player2) {
      setError('A player cannot be paired against themselves');
      return;
    }

    if (!player1 || !player2) {
      setError('Please select both players');
      return;
    }

    setSubmitting(true);

    try {
      await api.createMatch(competitionId, {
        player1: parseInt(player1),
        player2: parseInt(player2),
        round_number: roundNumber,
        lichess_game_id: lichessGameId || undefined
      });

      // Redirect to match list
      router.push(`/admin/competitions/${competitionId}/matches`);
    } catch (err: any) {
      console.error('Failed to create match:', err);
      setError(err.message || 'Failed to create match');
    } finally {
      setSubmitting(false);
    }
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

      <div className="max-w-3xl mx-auto px-5 py-10">
        <div className="mb-8">
          <Link href={`/admin/competitions/${competitionId}/matches`} className="text-[#ff6b35] hover:underline text-sm mb-4 inline-block">
            ← Back to Match List
          </Link>
          <h1 className="text-4xl font-black text-white mb-3">Create Match Pairing</h1>
          <p className="text-gray-400">{competition.title}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-red-400">⚠️ {error}</p>
          </div>
        )}

        {participants.length < 2 ? (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 text-center">
            <p className="text-yellow-400 mb-4">⚠️ Not enough participants to create a match</p>
            <p className="text-gray-400 text-sm">At least 2 participants are required</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-[#1a1a1a]/60 border border-white/10 rounded-2xl p-8 space-y-6">
            {/* Player 1 */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                Player 1 *
              </label>
              <select
                value={player1}
                onChange={(e) => setPlayer1(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20"
                required
              >
                <option value="">Select Player 1</option>
                {participants.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} (@{p.lichess_username})
                  </option>
                ))}
              </select>
            </div>

            {/* Player 2 */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                Player 2 *
              </label>
              <select
                value={player2}
                onChange={(e) => setPlayer2(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20"
                required
              >
                <option value="">Select Player 2</option>
                {participants.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} (@{p.lichess_username})
                  </option>
                ))}
              </select>
            </div>

            {/* Round Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                Round Number *
              </label>
              <input
                type="number"
                value={roundNumber}
                onChange={(e) => setRoundNumber(parseInt(e.target.value))}
                min="1"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20"
                required
              />
            </div>

            {/* Lichess Game ID */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                Lichess Game ID (Optional)
              </label>
              <input
                type="text"
                value={lichessGameId}
                onChange={(e) => setLichessGameId(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20"
                placeholder="e.g., abc123xyz"
              />
              <p className="text-xs text-gray-400 mt-2">
                Create a game on{' '}
                <a
                  href="https://lichess.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#ff6b35] hover:underline font-semibold"
                >
                  lichess.org
                </a>
                {' '}first, then paste the game ID here
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Leave empty if game hasn't been played yet
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Link
                href={`/admin/competitions/${competitionId}/matches`}
                className="flex-1 bg-white/10 text-white py-3 rounded-lg font-bold hover:bg-white/15 transition-all text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-[#ff6b35] text-white py-3 rounded-lg font-bold hover:bg-[#ff8555] transition-all disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Match'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

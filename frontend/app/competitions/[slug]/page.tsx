'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { api, Competition, Participant, Match, LeaderboardEntry } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function CompetitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params.slug as string;

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'leaderboard'>('overview');

  // Registration form state
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [lichessUsername, setLichessUsername] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Auto-fill user data when opening registration form
  useEffect(() => {
    if (showRegisterForm && user) {
      setFullName(user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username);
      setEmail(user.email || '');
      setLichessUsername(user.lichess_username || '');
    }
  }, [showRegisterForm, user]);

  // Sync state
  const [syncingMatchId, setSyncingMatchId] = useState<number | null>(null);
  const [syncToast, setSyncToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadCompetitionData();
  }, [slug]);

  useEffect(() => {
    // Ensure CSRF cookie is set
    fetch('http://localhost:8000/api/chess/competitions/', {
      credentials: 'include',
    }).catch(() => {});
  }, []);

  const loadCompetitionData = async () => {
    try {
      const competitions = await api.getCompetitions();
      const competitionsArray = Array.isArray(competitions) ? competitions : [];
      const comp = competitionsArray.find(c => c.slug === slug);
      
      if (!comp) {
        setError('Competition not found');
        setLoading(false);
        return;
      }

      setCompetition(comp);
      
      const [participantsData, matchesData, leaderboardData] = await Promise.all([
        api.getCompetitionParticipants(comp.id),
        api.getCompetitionMatches(comp.id),
        api.getLeaderboard(comp.id)
      ]);

      setParticipants(Array.isArray(participantsData) ? participantsData : []);
      setMatches(Array.isArray(matchesData) ? matchesData : []);
      setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : []);
      setError(null);
    } catch (error) {
      console.error('Failed to load competition:', error);
      setError('Failed to load competition data');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError('');

    if (!competition) return;

    try {
      await api.registerParticipant(competition.id, {
        full_name: fullName,
        email: email,
        mobile_number: mobileNumber,
        lichess_username: lichessUsername
      });
      
      setRegisterSuccess(true);
      setShowRegisterForm(false);
      
      // Clear form
      setFullName('');
      setEmail('');
      setMobileNumber('');
      setLichessUsername('');
      
      // Reload data
      await loadCompetitionData();
      
      setTimeout(() => setRegisterSuccess(false), 5000);
    } catch (err: any) {
      console.error('Registration error:', err);
      // Extract meaningful error message
      let errorMsg = 'Registration failed';
      if (err.message) {
        if (err.message.includes('unique') || err.message.includes('already')) {
          errorMsg = 'This email is already registered for this competition';
        } else if (err.message.includes('must make a unique set')) {
          errorMsg = 'This email is already registered for this competition';
        } else {
          errorMsg = err.message;
        }
      }
      setRegisterError(errorMsg);
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleSyncResult = async (matchId: number, lichessGameId: string) => {
    if (!lichessGameId) {
      showSyncToast('error', 'No Lichess Game ID provided');
      return;
    }

    setSyncingMatchId(matchId);

    try {
      const result = await api.syncMatchResult(matchId, lichessGameId);
      showSyncToast('success', result.message || 'Result synced successfully');
      
      // Reload matches and leaderboard
      if (competition) {
        const [matchesData, leaderboardData] = await Promise.all([
          api.getCompetitionMatches(competition.id),
          api.getLeaderboard(competition.id)
        ]);
        setMatches(Array.isArray(matchesData) ? matchesData : []);
        setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : []);
      }
    } catch (err: any) {
      console.error('Failed to sync result:', err);
      showSyncToast('error', err.message || 'Failed to sync result');
    } finally {
      setSyncingMatchId(null);
    }
  };

  const showSyncToast = (type: 'success' | 'error', message: string) => {
    setSyncToast({ type, message });
    setTimeout(() => setSyncToast(null), 5000);
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

  if (error || !competition) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-5 py-20 text-center">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-10">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-3">Competition Not Found</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <Link href="/competitions" className="bg-[#ff6b35] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#ff8555] transition-all inline-block">
              ← Back to Competitions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const startDate = new Date(competition.start_time);
  const endDate = new Date(competition.end_time);
  const now = new Date();
  const isLive = startDate <= now && endDate >= now;
  const isUpcoming = startDate > now;
  const isEnded = endDate < now;
  const canRegister = competition.is_registration_open && (competition.participant_count || 0) < competition.max_participants;

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Sync Toast Notification */}
      {syncToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`${syncToast.type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-red-500/20 border-red-500/30 text-red-400'} border rounded-xl p-4 shadow-lg`}>
            <p className="font-semibold">{syncToast.type === 'success' ? '✅' : '⚠️'} {syncToast.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-5 py-10">
        {/* Header */}
        <div className="mb-8">
          <Link href="/competitions" className="text-[#ff6b35] hover:underline text-sm mb-4 inline-block">
            ← Back to Competitions
          </Link>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-black text-white mb-3">{competition.title}</h1>
              <p className="text-gray-400 text-lg mb-4">{competition.description}</p>
              
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
                  <span className="text-gray-500">🏆</span>
                  <span className="text-white font-semibold capitalize">{competition.tournament_type}</span>
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
              {/* Edit Button (Admin Only) */}
              {user && (
                <Link
                  href={`/competitions/${slug}/edit`}
                  className="bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-white/15 transition-all"
                >
                  ✏️ Edit
                </Link>
              )}
              
              {isLive && (
                <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-bold uppercase">
                  ⚡ Live
                </span>
              )}
              {isUpcoming && (
                <span className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-full text-sm font-bold uppercase">
                  📅 Upcoming
                </span>
              )}
              {isEnded && (
                <span className="bg-gray-500/20 text-gray-400 px-4 py-2 rounded-full text-sm font-bold uppercase">
                  ✓ Ended
                </span>
              )}
              
              {canRegister && (
                <button
                  onClick={() => setShowRegisterForm(true)}
                  className="bg-[#ff6b35] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#ff8555] transition-all shadow-lg shadow-[#ff6b35]/30"
                >
                  Register Now
                </button>
              )}
            </div>
          </div>

          {/* Timeline Information */}
          <div className="mt-6 space-y-3">
            {/* Registration Timeline */}
            {competition.registration_deadline && (
              <div className="bg-[#ff6b35]/10 border border-[#ff6b35]/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[#ff6b35] font-bold">📝 Registration Deadline</span>
                </div>
                <div className="text-white font-semibold">
                  {new Date(competition.registration_deadline).toLocaleString('en-US', { 
                    dateStyle: 'full', 
                    timeStyle: 'short' 
                  })}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(competition.registration_deadline) > now 
                    ? `Registration closes in ${Math.ceil((new Date(competition.registration_deadline).getTime() - now.getTime()) / (1000 * 60 * 60))} hours`
                    : 'Registration closed'}
                </div>
              </div>
            )}
            
            {/* Event Timeline */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-white font-bold">🏆 Event Schedule</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Start</div>
                  <div className="text-white font-semibold">
                    {startDate.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">End</div>
                  <div className="text-white font-semibold">
                    {endDate.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Registration Success Message */}
        {registerSuccess && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
            <p className="text-green-400 font-semibold">✅ Registration successful! You're now registered for this competition.</p>
          </div>
        )}

        {/* Registration Form Modal */}
        {showRegisterForm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] border border-white/20 rounded-2xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-white mb-6">Register for Tournament</h2>
              
              {registerError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                  <p className="text-red-400 text-sm">⚠️ {registerError}</p>
                </div>
              )}

              <form onSubmit={handleRegister}>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20"
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20"
                    placeholder="+1234567890"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    Lichess Username
                  </label>
                  <input
                    type="text"
                    value={lichessUsername}
                    onChange={(e) => setLichessUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20"
                    placeholder="Your Lichess username"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Don't have one? <a href="https://lichess.org/signup" target="_blank" className="text-[#ff6b35] hover:underline">Create on Lichess.org</a>
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowRegisterForm(false)}
                    className="flex-1 bg-white/10 text-white py-3 rounded-lg font-bold hover:bg-white/15 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={registerLoading}
                    className="flex-1 bg-[#ff6b35] text-white py-3 rounded-lg font-bold hover:bg-[#ff8555] transition-all disabled:opacity-50"
                  >
                    {registerLoading ? 'Registering...' : 'Register'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-white/10">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'overview'
                ? 'text-[#ff6b35] border-b-2 border-[#ff6b35]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'matches'
                ? 'text-[#ff6b35] border-b-2 border-[#ff6b35]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Matches ({matches.length})
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'leaderboard'
                ? 'text-[#ff6b35] border-b-2 border-[#ff6b35]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Leaderboard ({leaderboard.length})
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-[#1a1a1a]/60 border border-white/10 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Participants ({participants.length})</h2>
              
              {participants.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  No participants yet. Be the first to register!
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {participants.map(participant => (
                    <div key={participant.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <h3 className="font-semibold text-white">{participant.full_name}</h3>
                      <p className="text-sm text-gray-400">@{participant.lichess_username}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Registered: {new Date(participant.registered_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <div className="space-y-4">
            {/* Admin Link */}
            {user && (
              <div className="flex justify-end mb-4">
                <Link
                  href={`/admin/competitions/${competition.id}/matches`}
                  className="bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-white/15 transition-all"
                >
                  ⚙️ Manage Matches
                </Link>
              </div>
            )}
            
            {matches.length === 0 ? (
              <div className="text-center py-20 bg-[#1a1a1a]/40 border border-white/10 rounded-2xl">
                <div className="text-6xl mb-4 opacity-30">🎮</div>
                <h3 className="text-xl font-semibold text-white mb-2">No Matches Yet</h3>
                <p className="text-gray-400">Matches will appear once the tournament starts</p>
              </div>
            ) : (
              matches.map(match => (
                <div key={match.id} className="bg-[#1a1a1a]/60 border border-white/10 rounded-2xl p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {match.player1_name} vs {match.player2_name}
                      </h3>
                      <p className="text-sm text-gray-400">Round {match.round_number}</p>
                    </div>
                    <div className="flex items-center gap-3">
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
                      
                      {/* Sync Result Button */}
                      {match.lichess_game_id && (
                        <button
                          onClick={() => handleSyncResult(match.id, match.lichess_game_id)}
                          disabled={syncingMatchId === match.id}
                          className="bg-[#ff6b35] text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-[#ff8555] transition-all disabled:opacity-50"
                        >
                          {syncingMatchId === match.id ? 'Syncing...' : 'Sync Result'}
                        </button>
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
              ))
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="bg-[#1a1a1a]/60 border border-white/10 rounded-2xl overflow-hidden">
            {leaderboard.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                No leaderboard data yet. Complete some matches to see rankings!
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-400">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-400">Player</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-400">Played</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-400">Wins</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-400">Draws</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-400">Losses</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-gray-400">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => (
                    <tr key={entry.participant_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {index === 0 && <span className="text-2xl">🥇</span>}
                          {index === 1 && <span className="text-2xl">🥈</span>}
                          {index === 2 && <span className="text-2xl">🥉</span>}
                          <span className="text-white font-bold text-lg">#{entry.rank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{entry.participant_name}</div>
                        <div className="text-sm text-gray-400">@{entry.lichess_username}</div>
                      </td>
                      <td className="px-6 py-4 text-center text-white font-semibold">{entry.matches_played}</td>
                      <td className="px-6 py-4 text-center text-green-400 font-semibold">{entry.wins}</td>
                      <td className="px-6 py-4 text-center text-gray-400 font-semibold">{entry.draws}</td>
                      <td className="px-6 py-4 text-center text-red-400 font-semibold">{entry.losses}</td>
                      <td className="px-6 py-4 text-center text-[#ff6b35] font-bold text-lg">{entry.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

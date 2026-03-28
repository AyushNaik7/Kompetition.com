'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Competition } from '@/lib/api';
import Navbar from '@/components/Navbar';

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');

  useEffect(() => {
    loadCompetitions();
  }, []);

  const loadCompetitions = async () => {
    try {
      const data = await api.getCompetitions();
      setCompetitions(Array.isArray(data) ? data : []);
      setError(null);
    } catch (error) {
      console.error('Failed to load competitions:', error);
      setError('Failed to connect to backend. Make sure Django is running on http://localhost:8000');
      setCompetitions([]);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  
  const activeCompetitions = Array.isArray(competitions) ? competitions.filter(c => 
    c.is_active && new Date(c.start_time) <= now && new Date(c.end_time) >= now
  ) : [];
  
  const upcomingCompetitions = Array.isArray(competitions) ? competitions.filter(c => 
    new Date(c.start_time) > now
  ) : [];
  
  const completedCompetitions = Array.isArray(competitions) ? competitions.filter(c => 
    new Date(c.end_time) < now
  ) : [];

  const filteredCompetitions = 
    filter === 'active' ? activeCompetitions :
    filter === 'upcoming' ? upcomingCompetitions :
    filter === 'completed' ? completedCompetitions :
    competitions;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Navbar />
        
        <div className="max-w-4xl mx-auto px-5 py-20 text-center">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-10">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-3">Backend Connection Failed</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <div className="bg-black/40 border border-white/10 rounded-lg p-4 text-left">
              <p className="text-sm text-gray-300 font-mono">
                # Start Django backend:<br/>
                python manage.py runserver
              </p>
            </div>
            <button 
              onClick={loadCompetitions}
              className="mt-6 bg-[#ff6b35] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#ff8555] transition-all"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-5 py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-black text-white">🏆 Tournaments</h1>
          <div className="flex gap-3">
            <Link 
              href="/competitions/create"
              className="bg-[#ff6b35] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#ff8555] transition-all flex items-center gap-2"
            >
              <span>+</span> Create Tournament
            </Link>
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${filter === 'all' ? 'bg-[#ff6b35] text-white' : 'bg-white/10 text-gray-400 hover:bg-white/15'}`}>
              All
            </button>
            <button onClick={() => setFilter('active')} className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${filter === 'active' ? 'bg-[#ff6b35] text-white' : 'bg-white/10 text-gray-400 hover:bg-white/15'}`}>
              Active
            </button>
            <button onClick={() => setFilter('upcoming')} className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${filter === 'upcoming' ? 'bg-[#ff6b35] text-white' : 'bg-white/10 text-gray-400 hover:bg-white/15'}`}>
              Upcoming
            </button>
            <button onClick={() => setFilter('completed')} className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${filter === 'completed' ? 'bg-[#ff6b35] text-white' : 'bg-white/10 text-gray-400 hover:bg-white/15'}`}>
              Completed
            </button>
          </div>
        </div>

        {filter === 'all' && (
          <>
            {activeCompetitions.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-4">⚡ Active Now</h2>
                <div className="grid gap-4">
                  {activeCompetitions.map(comp => (
                    <CompetitionCard key={comp.id} competition={comp} />
                  ))}
                </div>
              </div>
            )}

            {upcomingCompetitions.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-4">📅 Coming Soon</h2>
                <div className="grid gap-4">
                  {upcomingCompetitions.map(comp => (
                    <CompetitionCard key={comp.id} competition={comp} />
                  ))}
                </div>
              </div>
            )}

            {completedCompetitions.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-4">✓ Completed</h2>
                <div className="grid gap-4">
                  {completedCompetitions.map(comp => (
                    <CompetitionCard key={comp.id} competition={comp} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {filter !== 'all' && (
          <div className="grid gap-4">
            {filteredCompetitions.map(comp => (
              <CompetitionCard key={comp.id} competition={comp} />
            ))}
          </div>
        )}

        {filteredCompetitions.length === 0 && (
          <div className="text-center py-20 bg-[#1a1a1a]/40 border border-white/10 rounded-2xl">
            <div className="text-6xl mb-4 opacity-30">🏆</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Tournaments Found</h3>
            <p className="text-gray-400">Check back later for new competitions</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CompetitionCard({ competition }: { competition: Competition }) {
  const startDate = new Date(competition.start_time);
  const endDate = new Date(competition.end_time);
  const now = new Date();
  
  const isActive = competition.is_active && startDate <= now && endDate >= now;
  const isUpcoming = startDate > now;
  
  return (
    <Link href={`/competitions/${competition.slug}`}>
      <div className="bg-[#1a1a1a]/60 border border-white/10 p-6 rounded-2xl hover:border-[#ff6b35]/50 hover:bg-[#1a1a1a]/80 transition-all hover:-translate-y-1 cursor-pointer">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{competition.title}</h3>
            <p className="text-gray-400 text-sm">{competition.description}</p>
          </div>
          <div>
            {isActive && (
              <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold uppercase">
                ⚡ Live
              </span>
            )}
            {isUpcoming && (
              <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase">
                📅 Soon
              </span>
            )}
            {!isActive && !isUpcoming && (
              <span className="bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full text-xs font-bold uppercase">
                ✓ Done
              </span>
            )}
          </div>
        </div>
        
        <div className="flex gap-6 text-sm text-gray-400 mt-4">
          <div>
            <span className="font-semibold text-white">{competition.participant_count || 0}</span> / {competition.max_participants} players
          </div>
          <div>
            <span className="font-semibold text-white">{competition.tournament_type}</span> format
          </div>
          <div>
            {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>
    </Link>
  );
}

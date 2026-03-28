'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { api, Competition } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function EditCompetitionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params.slug as string;
  
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tournamentType, setTournamentType] = useState('swiss');
  const [timeControl, setTimeControl] = useState('3+2');
  const [maxParticipants, setMaxParticipants] = useState(16);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [regDeadlineDate, setRegDeadlineDate] = useState('');
  const [regDeadlineTime, setRegDeadlineTime] = useState('');
  const [durationHours, setDurationHours] = useState(4);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCompetition();
  }, [slug]);

  const loadCompetition = async () => {
    try {
      const competitions = await api.getCompetitions();
      const comp = Array.isArray(competitions) 
        ? competitions.find(c => c.slug === slug)
        : null;
      
      if (!comp) {
        setError('Competition not found');
        setLoading(false);
        return;
      }

      setCompetition(comp);
      
      // Pre-populate form fields
      setTitle(comp.title);
      setDescription(comp.description);
      setTournamentType(comp.tournament_type);
      setTimeControl(comp.time_control);
      setMaxParticipants(comp.max_participants);
      setIsActive(comp.is_active);
      
      // Parse start date/time
      const startDateTime = new Date(comp.start_time);
      setStartDate(startDateTime.toISOString().split('T')[0]);
      setStartTime(startDateTime.toTimeString().slice(0, 5));
      
      // Parse registration deadline if exists
      if (comp.registration_deadline) {
        const regDeadlineDateTime = new Date(comp.registration_deadline);
        setRegDeadlineDate(regDeadlineDateTime.toISOString().split('T')[0]);
        setRegDeadlineTime(regDeadlineDateTime.toTimeString().slice(0, 5));
      }
      
      // Calculate duration
      const endDateTime = new Date(comp.end_time);
      const duration = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60));
      setDurationHours(duration);
      
    } catch (err) {
      console.error('Failed to load competition:', err);
      setError('Failed to load competition');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Combine date and time
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + durationHours * 60 * 60 * 1000);

      // Handle registration deadline (optional)
      let registrationDeadline = null;
      if (regDeadlineDate && regDeadlineTime) {
        const regDeadlineDateTime = new Date(`${regDeadlineDate}T${regDeadlineTime}`);
        if (!isNaN(regDeadlineDateTime.getTime())) {
          registrationDeadline = regDeadlineDateTime.toISOString();
        }
      }

      await api.updateCompetition(competition!.id, {
        title,
        description,
        tournament_type: tournamentType as any,
        time_control: timeControl,
        max_participants: maxParticipants,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        registration_deadline: registrationDeadline,
        is_active: isActive,
      });

      router.push(`/competitions/${slug}`);
    } catch (err: any) {
      console.error('Update competition error:', err);
      setError(err.message || 'Failed to update competition');
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
          <Link href={`/competitions/${slug}`} className="text-[#ff6b35] hover:underline text-sm mb-4 inline-block">
            ← Back to Competition
          </Link>
          <h1 className="text-4xl font-black text-white mb-3">Edit Competition</h1>
          <p className="text-gray-400">{competition.title}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-red-400">⚠️ {error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[#1a1a1a]/60 border border-white/10 rounded-2xl p-8 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              Competition Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20 min-h-[100px]"
              required
            />
          </div>

          {/* Tournament Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              Tournament Type *
            </label>
            <select
              value={tournamentType}
              onChange={(e) => setTournamentType(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20"
            >
              <option value="swiss">Swiss System</option>
              <option value="knockout">Knockout</option>
              <option value="round_robin">Round Robin</option>
            </select>
          </div>

          {/* Time Control */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              Time Control *
            </label>
            <select
              value={timeControl}
              onChange={(e) => setTimeControl(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20"
            >
              <option value="1+0">Bullet (1+0)</option>
              <option value="3+0">Blitz (3+0)</option>
              <option value="3+2">Blitz (3+2)</option>
              <option value="5+3">Blitz (5+3)</option>
              <option value="10+0">Rapid (10+0)</option>
              <option value="10+5">Rapid (10+5)</option>
              <option value="15+10">Rapid (15+10)</option>
              <option value="30+0">Classical (30+0)</option>
            </select>
          </div>

          {/* Max Participants */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              Max Participants *
            </label>
            <input
              type="number"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
              min="2"
              max="100"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20"
              required
            />
          </div>

          {/* Start Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20"
                required
              />
            </div>
          </div>

          {/* Registration Deadline (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              Registration Deadline (Optional)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                value={regDeadlineDate}
                onChange={(e) => setRegDeadlineDate(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20"
              />
              <input
                type="time"
                value={regDeadlineTime}
                onChange={(e) => setRegDeadlineTime(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              If not set, registration closes when the event starts
            </p>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              Duration (hours) *
            </label>
            <input
              type="number"
              value={durationHours}
              onChange={(e) => setDurationHours(parseInt(e.target.value))}
              min="1"
              max="168"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20"
              required
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-5 h-5 rounded border-white/10 bg-white/5 text-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20"
            />
            <label htmlFor="isActive" className="text-white font-semibold">
              Competition is Active
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Link
              href={`/competitions/${slug}`}
              className="flex-1 bg-white/10 text-white py-3 rounded-lg font-bold hover:bg-white/15 transition-all text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-[#ff6b35] text-white py-3 rounded-lg font-bold hover:bg-[#ff8555] transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

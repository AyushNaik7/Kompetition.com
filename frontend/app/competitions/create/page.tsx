'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/lib/auth';

export default function CreateCompetitionPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tournamentType, setTournamentType] = useState('swiss');
  const [timeControl, setTimeControl] = useState('3+2');
  const [maxParticipants, setMaxParticipants] = useState(16);
  
  // Set default date/time to now
  const now = new Date();
  const defaultDate = now.toISOString().split('T')[0];
  const defaultTime = now.toTimeString().slice(0, 5);
  
  const [startDate, setStartDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState(defaultTime);
  const [regDeadlineDate, setRegDeadlineDate] = useState('');
  const [regDeadlineTime, setRegDeadlineTime] = useState('');
  const [durationHours, setDurationHours] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch CSRF token on mount
  useEffect(() => {
    // Make a GET request to ensure CSRF cookie is set
    fetch('http://localhost:8000/api/chess/competitions/', {
      credentials: 'include',
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate date and time are provided
      if (!startDate || !startTime) {
        setError('Please provide both start date and time');
        setLoading(false);
        return;
      }

      // Combine date and time
      const startDateTime = new Date(`${startDate}T${startTime}`);
      
      // Validate the date is valid
      if (isNaN(startDateTime.getTime())) {
        setError('Invalid date or time provided');
        setLoading(false);
        return;
      }

      const endDateTime = new Date(startDateTime.getTime() + durationHours * 60 * 60 * 1000);

      // Handle registration deadline (optional)
      let registrationDeadline = null;
      if (regDeadlineDate && regDeadlineTime) {
        const regDeadlineDateTime = new Date(`${regDeadlineDate}T${regDeadlineTime}`);
        if (!isNaN(regDeadlineDateTime.getTime())) {
          registrationDeadline = regDeadlineDateTime.toISOString();
        }
      }

      // Generate slug from title
      let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      // Add timestamp to ensure uniqueness
      const timestamp = Date.now().toString().slice(-6);
      slug = `${slug}-${timestamp}`;

      // Get CSRF token
      const getCsrfToken = () => {
        const name = 'csrftoken';
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
          const [key, value] = cookie.trim().split('=');
          if (key === name) return value;
        }
        return null;
      };

      const csrfToken = getCsrfToken();

      const response = await fetch('http://localhost:8000/api/chess/competitions/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
        },
        body: JSON.stringify({
          title,
          slug,
          description,
          tournament_type: tournamentType,
          time_control: timeControl,
          max_participants: maxParticipants,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          registration_deadline: registrationDeadline,
          is_active: true,
          match_type: '1v1'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('Error response:', errorData);
        
        // Extract error message from various possible formats
        let errorMessage = 'Failed to create competition';
        
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.slug) {
          errorMessage = `Slug error: ${Array.isArray(errorData.slug) ? errorData.slug[0] : errorData.slug}`;
        } else if (typeof errorData === 'object') {
          // Try to extract first error from object
          const firstKey = Object.keys(errorData)[0];
          if (firstKey) {
            const firstError = errorData[firstKey];
            errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          }
        }
        
        throw new Error(errorMessage);
      }

      const competition = await response.json();
      router.push(`/competitions/${competition.slug}`);
    } catch (err: any) {
      console.error('Create competition error:', err);
      setError(err.message || 'Failed to create competition');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-3xl mx-auto px-5 py-10">
        <div className="mb-8">
          <Link href="/competitions" className="text-[#ff6b35] hover:underline text-sm mb-4 inline-block">
            ← Back to Competitions
          </Link>
          <h1 className="text-4xl font-black text-white mb-3">Create Competition</h1>
          <p className="text-gray-400">Set up a new chess tournament</p>
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
              placeholder="e.g., Saturday Blitz Championship"
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
              placeholder="Describe your tournament..."
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
            <p className="text-xs text-gray-500 mt-1">
              How long the competition will run
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Link
              href="/competitions"
              className="flex-1 bg-white/10 text-white py-3 rounded-lg font-bold hover:bg-white/15 transition-all text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#ff6b35] text-white py-3 rounded-lg font-bold hover:bg-[#ff8555] transition-all disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Competition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await register(username, email, password, confirmPassword);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Logo */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2">
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-[#ff6b35] w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
            K
          </div>
          <span className="text-2xl font-extrabold text-white">Kompetitions</span>
        </Link>
      </div>

      {/* Register Card */}
      <div className="w-full max-w-md">
        <div className="bg-[#1a1a1a]/60 border border-white/10 rounded-2xl p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-gray-400">Join Kompetitions to track your chess matches</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-red-400 text-sm font-semibold">⚠️ {error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label htmlFor="username" className="block text-sm font-semibold text-gray-200 mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20 transition-all"
                placeholder="Choose a username"
                required
              />
            </div>

            <div className="mb-5">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-200 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20 transition-all"
                placeholder="your@email.com"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Used for password recovery</p>
            </div>

            <div className="mb-5">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-200 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20 transition-all"
                placeholder="Create a password"
                required
                minLength={8}
              />
            </div>

            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-200 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20 transition-all"
                placeholder="Confirm your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff6b35] text-white py-3 rounded-lg font-bold hover:bg-[#ff8555] transition-all hover:-translate-y-0.5 shadow-lg shadow-[#ff6b35]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-[#ff6b35] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

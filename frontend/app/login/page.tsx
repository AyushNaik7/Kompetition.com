'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(username, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Invalid username or password');
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

      {/* Login Card */}
      <div className="w-full max-w-md">
        <div className="bg-[#1a1a1a]/60 border border-white/10 rounded-2xl p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-400">Sign in to your account</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-red-400 text-sm font-semibold">⚠️ {error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="username" className="block text-sm font-semibold text-gray-200 mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20 transition-all"
                placeholder="Enter your username"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-200 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#ff6b35] focus:ring-2 focus:ring-[#ff6b35]/20 transition-all"
                placeholder="Enter your password"
                required
              />
              <div className="text-right mt-2">
                <Link href="/password-reset" className="text-xs text-gray-400 hover:text-[#ff6b35] transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#ff6b35] text-white py-3 rounded-lg font-bold hover:bg-[#ff8555] transition-all hover:-translate-y-0.5 shadow-lg shadow-[#ff6b35]/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link href="/register" className="text-[#ff6b35] font-semibold hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

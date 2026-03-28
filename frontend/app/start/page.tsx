import Link from 'next/link';

export default function StartPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-white to-[#ff6b35] bg-clip-text text-transparent">
            Welcome to Kompetitions
          </h1>
          <p className="text-xl text-gray-400">Organize and compete in chess tournaments with Lichess integration</p>
        </div>

        <div className="grid grid-cols-2 gap-10">
          {/* Player Card */}
          <Link href="/login?role=player">
            <div className="bg-[#1a1a1a]/60 border-2 border-white/10 rounded-2xl p-12 text-center hover:border-[#ff6b35] hover:bg-[#1a1a1a]/80 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#ff6b35]/20 cursor-pointer">
              <div className="text-7xl mb-6">👤</div>
              <h2 className="text-3xl font-bold text-white mb-4">Player</h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Join competitions, track your matches, and compete with other players
              </p>
              <div className="bg-[#ff6b35] text-white py-4 rounded-lg font-bold text-lg hover:bg-[#ff8555] transition-all">
                Enter as Player
              </div>
              <div className="mt-4">
                <Link href="/register" className="text-[#ff6b35] text-sm font-semibold hover:underline">
                  Don't have an account? Register
                </Link>
              </div>
            </div>
          </Link>

          {/* Admin Card */}
          <Link href="/login?role=admin">
            <div className="bg-[#1a1a1a]/60 border-2 border-white/10 rounded-2xl p-12 text-center hover:border-purple-600 hover:bg-[#1a1a1a]/80 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-600/20 cursor-pointer">
              <div className="text-7xl mb-6">👨‍💼</div>
              <h2 className="text-3xl font-bold text-white mb-4">Administrator</h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Manage competitions, create matches, and oversee tournament operations
              </p>
              <div className="bg-purple-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-purple-700 transition-all">
                Enter as Admin
              </div>
              <div className="mt-4">
                <a href="http://localhost:8000/admin/" className="text-purple-400 text-sm font-semibold hover:underline">
                  Django Admin Panel →
                </a>
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-10 text-white">Platform Features</h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-[#1a1a1a]/40 border border-white/10 p-6 rounded-xl text-center">
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="text-lg font-semibold text-[#ff6b35] mb-2">Tournament Management</h3>
              <p className="text-gray-400 text-sm">Swiss, Knockout, and Round-Robin formats</p>
            </div>
            
            <div className="bg-[#1a1a1a]/40 border border-white/10 p-6 rounded-xl text-center">
              <div className="text-4xl mb-3">♟️</div>
              <h3 className="text-lg font-semibold text-[#ff6b35] mb-2">Lichess Integration</h3>
              <p className="text-gray-400 text-sm">Sync results directly from Lichess.org</p>
            </div>
            
            <div className="bg-[#1a1a1a]/40 border border-white/10 p-6 rounded-xl text-center">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-lg font-semibold text-[#ff6b35] mb-2">Live Leaderboards</h3>
              <p className="text-gray-400 text-sm">Real-time rankings and statistics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

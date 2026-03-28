import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function HelpPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-4xl mx-auto px-5 py-10">
        <div className="bg-gradient-to-br from-[#0d1b0d]/80 to-[#1a1a1a]/90 border border-[#ff6b35]/20 rounded-2xl p-10 mb-10 text-center">
          <h1 className="text-4xl font-black text-white mb-4">♟️ Lichess Integration Guide</h1>
          <p className="text-gray-300 text-lg">Learn how to sync chess game results from Lichess automatically</p>
        </div>

        <div className="bg-[#1a1a1a]/60 border border-white/10 rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            🎮 How It Works
          </h2>
          <p className="text-gray-400 leading-relaxed">
            Our platform integrates with Lichess.org to automatically fetch game results. 
            When you play a game on Lichess, you can sync the result to your tournament match 
            using the game ID. The system will automatically determine the winner and update 
            the leaderboard.
          </p>
        </div>

        <div className="bg-[#1a1a1a]/60 border border-white/10 rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            📋 Step-by-Step Guide
          </h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-[#ff6b35] rounded-full flex items-center justify-center text-white font-bold">1</div>
              <div>
                <h3 className="font-semibold text-white mb-1">Play Your Game on Lichess</h3>
                <p className="text-gray-400 text-sm">Go to <a href="https://lichess.org" target="_blank" className="text-[#ff6b35] hover:underline">lichess.org</a> and play your chess game. Make sure to complete the game.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-[#ff6b35] rounded-full flex items-center justify-center text-white font-bold">2</div>
              <div>
                <h3 className="font-semibold text-white mb-1">Get the Game ID</h3>
                <p className="text-gray-400 text-sm">After the game, copy the game ID from the URL. For example, if the URL is <code className="bg-white/5 px-2 py-1 rounded">https://lichess.org/dKbV8Oba</code>, the game ID is <code className="bg-white/5 px-2 py-1 rounded">dKbV8Oba</code></p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-[#ff6b35] rounded-full flex items-center justify-center text-white font-bold">3</div>
              <div>
                <h3 className="font-semibold text-white mb-1">Sync Result</h3>
                <p className="text-gray-400 text-sm">Navigate to your tournament match page and enter the game ID to sync the result automatically.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1a1a]/60 border border-white/10 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">🧪 Test with Sample Games</h2>
          <p className="text-gray-400 mb-6">Use these real Lichess game IDs to test the integration:</p>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#1a1a1a]/40 border border-white/10 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">⚪</div>
              <div className="font-mono font-bold text-[#ff6b35] text-lg mb-1">dKbV8Oba</div>
              <div className="text-xs text-gray-400">White Wins (1-0)</div>
            </div>
            
            <div className="bg-[#1a1a1a]/40 border border-white/10 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">⚫</div>
              <div className="font-mono font-bold text-[#ff6b35] text-lg mb-1">q7ZvsdUF</div>
              <div className="text-xs text-gray-400">Black Wins (0-1)</div>
            </div>
            
            <div className="bg-[#1a1a1a]/40 border border-white/10 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">🤝</div>
              <div className="font-mono font-bold text-[#ff6b35] text-lg mb-1">GpYhZPz3</div>
              <div className="text-xs text-gray-400">Draw (½-½)</div>
            </div>
          </div>
        </div>

        <div className="text-center mt-10">
          <Link href="/competitions" className="bg-[#ff6b35] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#ff8555] transition-all inline-block">
            ← Back to Tournaments
          </Link>
        </div>
      </div>
    </div>
  );
}

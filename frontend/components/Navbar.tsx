'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="bg-[#1a1a1a]/95 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-10 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-[#ff6b35] w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            K
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-extrabold text-white text-base">Kompetitions</span>
            <span className="text-[10px] text-gray-400 font-medium">Skill Competition Platform</span>
          </div>
        </Link>
        
        <div className="flex items-center gap-8">
          <Link href="/" className="text-gray-400 hover:text-[#ff6b35] transition-colors font-medium text-sm">
            Home
          </Link>
          <Link href="/my-matches" className="text-gray-400 hover:text-[#ff6b35] transition-colors font-medium text-sm">
            My Matches
          </Link>
          <Link href="/help" className="text-gray-400 hover:text-[#ff6b35] transition-colors font-medium text-sm">
            Help
          </Link>
          
          {user ? (
            <>
              <span className="text-gray-400 text-sm">
                👤 {user.username}
              </span>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-[#ff6b35] transition-colors font-medium text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-400 hover:text-[#ff6b35] transition-colors font-medium text-sm">
                Login
              </Link>
              <Link href="/register" className="text-gray-400 hover:text-[#ff6b35] transition-colors font-medium text-sm">
                Register
              </Link>
            </>
          )}
          
          <Link 
            href="/competitions" 
            className="bg-[#ff6b35] text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-[#ff8555] transition-all hover:-translate-y-0.5 shadow-lg shadow-[#ff6b35]/30"
          >
            Explore
          </Link>
        </div>
      </div>
    </nav>
  );
}

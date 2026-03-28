import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Kompetitions - Chess Tournament Platform",
  description: "Organize and compete in chess tournaments with Lichess integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-b from-[#1a1a1a] to-[#0d1b0d] text-gray-200 relative" suppressHydrationWarning>
        {/* Chessboard background */}
        <div 
          className="fixed inset-0 opacity-30 pointer-events-none z-0"
          style={{
            backgroundImage: `
              linear-gradient(45deg, rgba(255, 255, 255, 0.03) 25%, transparent 25%),
              linear-gradient(-45deg, rgba(255, 255, 255, 0.03) 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, rgba(255, 255, 255, 0.03) 75%),
              linear-gradient(-45deg, transparent 75%, rgba(255, 255, 255, 0.03) 75%)
            `,
            backgroundSize: '100px 100px',
            backgroundPosition: '0 0, 0 50px, 50px -50px, -50px 0px'
          }}
        />
        <div className="relative z-10">
          <AuthProvider>
            {children}
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}

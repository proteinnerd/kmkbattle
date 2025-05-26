import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import SupabaseStatus from './components/SupabaseStatus';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FPL Punishment Tracker',
  description: 'Track punishments for Fantasy Premier League gameweek losers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen">
          {children}
        </main>
        <SupabaseStatus />
      </body>
    </html>
  );
} 
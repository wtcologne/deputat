import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';

import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Lehr-Bereitschaftsplaner',
  description: 'Verfügbarkeiten und Einsatzplanung für das Institutsteam.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-gradient-to-br from-slate-100 via-white to-sky-100 text-slate-800 antialiased`}
      >
        <div className="relative flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 border-b border-white/30 bg-white/60 px-6 py-6 shadow-sm backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
                  Lehr-Bereitschaftsplaner
                </h1>
                <p className="text-sm text-slate-500">
                  Übersicht und Koordination der Lehrbereitschaft
                </p>
              </div>
              <nav className="flex gap-3 text-sm font-medium text-slate-600">
                <Link
                  href="/plan"
                  className="rounded-xl bg-white/70 px-3 py-2 shadow-sm transition hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2"
                >
                  Wochenplan
                </Link>
                <Link
                  href="/me"
                  className="rounded-xl bg-white/70 px-3 py-2 shadow-sm transition hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2"
                >
                  Meine Verfügbarkeit
                </Link>
              </nav>
            </div>
          </header>

          <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10 md:px-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

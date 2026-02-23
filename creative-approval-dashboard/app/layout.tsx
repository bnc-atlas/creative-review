import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Creative Approval Dashboard',
  description: 'Internal dashboard for reviewing creative assets',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <header className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">
              Creative Approval Dashboard
            </h1>
            <div className="text-xs text-slate-400">V1 · Internal use only</div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}

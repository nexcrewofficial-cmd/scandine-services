import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Scan & Dine | Waiter & Floor Staff',
  description: 'Live floor map, bi-directional cart mirroring, and bill printing.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-zinc-950 text-zinc-100 pb-12">
        <Toaster position="top-right" />
        <main className="max-w-md mx-auto min-h-screen bg-zinc-900 border-x border-zinc-800 shadow-2xl relative flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}

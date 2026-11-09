import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Scan & Dine | Frictionless Dining Experience',
  description: 'Instant scan-to-order, live table cart, and real-time kitchen tracking.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-zinc-50 text-zinc-900 pb-16">
        <Toaster position="top-center" />
        <main className="max-w-md mx-auto min-h-screen bg-white shadow-xl relative flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}

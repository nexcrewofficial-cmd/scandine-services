import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Receipt,
  Boxes,
  Printer,
  Tag,
  QrCode,
  Settings,
  Sparkles,
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Scan & Dine | Venue Admin Portal',
  description: 'Enterprise Menu CMS, Orders, Financial Ledger, and QR Management.',
};

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Menu CMS', href: '/menu', icon: UtensilsCrossed },
  { name: 'QR Table Generator', href: '/qr', icon: QrCode },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 flex">
        <Toaster position="top-right" />

        {/* Desktop Sidebar */}
        <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between p-5 min-h-screen sticky top-0">
          <div>
            <div className="flex items-center space-x-2.5 pb-6 border-b border-slate-100">
              <div className="h-9 w-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black">
                S&D
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 tracking-tight">Scan & Dine</h2>
                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                  Venue Admin
                </span>
              </div>
            </div>

            <nav className="mt-6 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/20">
            <div className="flex items-center space-x-2 text-orange-600 font-bold text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Full Ecosystem Tier</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Scan, Waiter, and KDS active.</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-8 overflow-y-auto min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}

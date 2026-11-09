'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, RefreshCw, Printer } from 'lucide-react';
import toast from 'react-hot-toast';

interface TableState {
  number: string;
  status: 'EMPTY' | 'BROWSING' | 'COOKING' | 'READY' | 'UNPAID';
  orderCount?: number;
  total?: number;
}

export default function FloorMapPage() {
  const [tables, setTables] = useState<TableState[]>([
    { number: '1', status: 'EMPTY' },
    { number: '2', status: 'BROWSING' },
    { number: '3', status: 'COOKING', orderCount: 3, total: 42.5 },
    { number: '4', status: 'READY', orderCount: 2, total: 35.0 },
    { number: '5', status: 'UNPAID', orderCount: 4, total: 58.0 },
    { number: '6', status: 'EMPTY' },
    { number: '7', status: 'COOKING', orderCount: 1, total: 18.5 },
    { number: '8', status: 'EMPTY' },
  ]);

  const getStatusColor = (status: TableState['status']) => {
    switch (status) {
      case 'EMPTY':
        return 'border-zinc-800 bg-zinc-900/50 text-zinc-500';
      case 'BROWSING':
        return 'border-purple-500/40 bg-purple-950/20 text-purple-400 shadow-purple-500/10';
      case 'COOKING':
        return 'border-amber-500/40 bg-amber-950/20 text-amber-400 shadow-amber-500/10';
      case 'READY':
        return 'border-emerald-500/60 bg-emerald-950/30 text-emerald-300 animate-pulse shadow-emerald-500/20';
      case 'UNPAID':
        return 'border-rose-500 bg-rose-950/40 text-rose-300 shadow-rose-500/20';
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-lg font-black text-white tracking-tight">Live Floor Map</h1>
          <p className="text-xs text-zinc-400">Cafe Mode • 8 Active Tables</p>
        </div>
        <button
          onClick={() => toast.success('Floor refreshed')}
          className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 py-3 border-b border-zinc-800/60 text-[10px] font-bold">
        <span className="flex items-center space-x-1 text-zinc-500">
          <span className="h-2 w-2 rounded-full bg-zinc-600" /> <span>Empty</span>
        </span>
        <span className="flex items-center space-x-1 text-purple-400">
          <span className="h-2 w-2 rounded-full bg-purple-500" /> <span>Browsing</span>
        </span>
        <span className="flex items-center space-x-1 text-amber-400">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> <span>Cooking</span>
        </span>
        <span className="flex items-center space-x-1 text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> <span>Ready</span>
        </span>
        <span className="flex items-center space-x-1 text-rose-400">
          <span className="h-2 w-2 rounded-full bg-rose-500" /> <span>Unpaid</span>
        </span>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 gap-3.5 pt-4">
        {tables.map((t) => (
          <Link key={t.number} href={`/tables/${t.number}`}>
            <div
              className={`p-4 rounded-2xl border-2 transition shadow-lg cursor-pointer flex flex-col justify-between h-32 ${getStatusColor(
                t.status
              )}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl font-black text-white">Table {t.number}</span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10">
                  {t.status}
                </span>
              </div>

              {t.total ? (
                <div className="flex items-end justify-between pt-2 border-t border-white/10">
                  <span className="text-xs opacity-75">{t.orderCount} items</span>
                  <span className="text-sm font-black text-white">${t.total.toFixed(2)}</span>
                </div>
              ) : (
                <span className="text-xs opacity-50">No active session</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

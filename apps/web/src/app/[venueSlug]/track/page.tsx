'use client';

import { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock, ChefHat, Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getSocket } from '../../../lib/socket';
import { Card, StatusBadge } from '@scan-and-dine/ui-components';

export default function OrderTrackPage({ params }: { params: Promise<{ venueSlug: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || 'mock_order';
  const table = searchParams.get('table') || '5';

  const [status, setStatus] = useState<string>('SENT_TO_KITCHEN');

  useEffect(() => {
    const socket = getSocket();
    socket.emit('join_order', orderId);

    socket.on('order_status_update', (data: any) => {
      if (data.status) {
        setStatus(data.status);
      }
    });

    return () => {
      socket.off('order_status_update');
    };
  }, [orderId]);

  const stages = [
    { key: 'SENT_TO_KITCHEN', label: 'Order Sent', desc: 'Received by kitchen station', icon: Clock },
    { key: 'PREPARING', label: 'Preparing', desc: 'Chef is cooking your meal', icon: ChefHat },
    { key: 'READY', label: 'Ready for Pickup', desc: 'Plated and ready to be served', icon: Sparkles },
    { key: 'SERVED', label: 'Served', desc: 'Enjoy your food!', icon: CheckCircle2 },
  ];

  const currentIdx = stages.findIndex((s) => s.key === status);

  return (
    <div className="flex-1 flex flex-col p-4">
      <div className="flex items-center space-x-3 pb-4 border-b border-zinc-100">
        <Link href={`/${resolvedParams.venueSlug}?table=${table}`} className="p-2 -ml-2 rounded-lg text-zinc-600 hover:bg-zinc-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-black text-zinc-900 tracking-tight">Live Order Tracking</h1>
      </div>

      <div className="my-6 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Status</span>
        <div className="mt-2">
          <StatusBadge status={status} />
        </div>
        <p className="mt-3 text-xs text-zinc-500">Table #{table} • Live WebSocket Feed</p>
      </div>

      {/* Progress Timeline */}
      <Card className="p-6 space-y-6 rounded-2xl border-zinc-200">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isDone = idx <= currentIdx;
          const isCurrent = idx === currentIdx;

          return (
            <div key={stage.key} className="flex items-start space-x-4">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                  isCurrent
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : isDone
                    ? 'bg-emerald-500 text-white'
                    : 'bg-zinc-100 text-zinc-400'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h4 className={`text-sm font-bold ${isDone ? 'text-zinc-900' : 'text-zinc-400'}`}>
                  {stage.label}
                </h4>
                <p className="text-xs text-zinc-500">{stage.desc}</p>
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

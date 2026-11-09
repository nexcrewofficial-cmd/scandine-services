'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer, CheckCircle, Banknote, ShieldAlert } from 'lucide-react';
import { Button, Card, StatusBadge } from '@scan-and-dine/ui-components';
import toast from 'react-hot-toast';

export default function TableDetailPage({ params }: { params: Promise<{ tableNumber: string }> }) {
  const resolvedParams = use(params);
  const [status, setStatus] = useState<string>('READY');

  const items = [
    { name: 'Truffle Mushroom Pizza', qty: 2, price: 37.0, status: 'READY' },
    { name: 'Spicy Pepperoni & Hot Honey', qty: 1, price: 17.0, status: 'READY' },
    { name: 'San Pellegrino Sparkling', qty: 1, price: 4.5, status: 'SERVED' },
  ];

  const total = 58.5;

  const handlePrintBill = () => {
    toast.success(`Remote bill print command sent to bar printer for Table #${resolvedParams.tableNumber}!`);
  };

  const handleMarkServed = () => {
    setStatus('SERVED');
    toast.success('Food marked as served to guests.');
  };

  const handleCollectCash = () => {
    setStatus('PAID');
    toast.success('Cash collected! Table balance settled.');
  };

  return (
    <div className="flex-1 flex flex-col p-4 justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center space-x-3">
            <Link href="/tables" className="p-2 -ml-2 rounded-lg text-zinc-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-black text-white">Table #{resolvedParams.tableNumber}</h1>
              <p className="text-xs text-zinc-400">Live Shared Cart Session</p>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Mirrored Cart Items */}
        <div className="mt-4 space-y-2.5">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-zinc-800/60 border border-zinc-800 flex items-center justify-between"
            >
              <div>
                <h4 className="text-sm font-bold text-white">{item.name}</h4>
                <span className="text-xs text-zinc-400">Qty: {item.qty}</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm font-black text-white">${item.price.toFixed(2)}</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                  {item.status}
                </span>
              </div>
            </div>
          ))}

          <Card className="mt-6 p-4 rounded-2xl bg-zinc-800/40 border-zinc-800 flex justify-between items-center">
            <span className="text-sm font-bold text-zinc-400">Total Unpaid Balance</span>
            <span className="text-xl font-black text-orange-400">${total.toFixed(2)}</span>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-6">
        <Button
          variant="primary"
          className="w-full py-3.5 flex items-center justify-center space-x-2 shadow-lg shadow-orange-500/20"
          onClick={handleMarkServed}
        >
          <CheckCircle className="h-4 w-4" />
          <span>Mark All Food Served</span>
        </Button>

        <div className="grid grid-cols-2 gap-2.5">
          <Button
            variant="secondary"
            className="w-full py-3 flex items-center justify-center space-x-2"
            onClick={handlePrintBill}
          >
            <Printer className="h-4 w-4" />
            <span>Print Bill</span>
          </Button>

          <Button
            variant="secondary"
            className="w-full py-3 flex items-center justify-center space-x-2 text-emerald-400 hover:text-emerald-300"
            onClick={handleCollectCash}
          >
            <Banknote className="h-4 w-4" />
            <span>Collect Cash</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

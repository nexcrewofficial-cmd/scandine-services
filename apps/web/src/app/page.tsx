import Link from 'next/link';
import { QrCode, UtensilsCrossed, Sparkles } from 'lucide-react';
import { Button } from '@scan-and-dine/ui-components';

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="h-16 w-16 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-6">
        <UtensilsCrossed className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
        Scan & Dine
      </h1>
      <p className="mt-2 text-sm text-zinc-500 max-w-xs">
        Point your phone camera at the QR code on your table to browse the menu and order instantly.
      </p>

      <div className="my-8 p-6 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 flex flex-col items-center">
        <QrCode className="h-24 w-24 text-zinc-400 stroke-1" />
        <span className="mt-3 text-xs font-semibold text-zinc-400 uppercase tracking-widest">
          Awaiting QR Code Scan
        </span>
      </div>

      <Link href="/pizza-palace" className="w-full">
        <Button variant="primary" className="w-full py-3.5 text-base shadow-lg shadow-orange-500/20">
          <Sparkles className="h-4 w-4 mr-2" />
          Preview Demo Restaurant
        </Button>
      </Link>
    </div>
  );
}

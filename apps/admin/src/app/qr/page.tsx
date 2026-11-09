'use client';

import { useState } from 'react';
import { QrCode, Printer, Download } from 'lucide-react';
import { Button, Card, Input } from '@scan-and-dine/ui-components';
import toast from 'react-hot-toast';

export default function QRGeneratorPage() {
  const [tableCount, setTableCount] = useState<number>(10);
  const venueSlug = 'pizza-palace';

  const handleExport = () => {
    toast.success(`Generated batch high-resolution print PDF for ${tableCount} tables!`);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">QR Code Infrastructure</h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated batch generation of unique table URLs and print-ready stand acrylics.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1.5" />
          Export All as Print PDF
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm col-span-1 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Configure Batch</h3>
          <Input
            label="Total Dining Tables"
            type="number"
            value={tableCount}
            onChange={(e) => setTableCount(Number(e.target.value) || 1)}
          />
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500">
            QR URL Format:
            <code className="block mt-1 p-2 bg-slate-100 rounded text-[11px] font-mono text-slate-800">
              https://scandine.app/{venueSlug}?table=X
            </code>
          </div>
        </Card>

        {/* QR Preview Grid */}
        <div className="col-span-2 grid grid-cols-3 gap-4">
          {Array.from({ length: Math.min(tableCount, 6) }).map((_, idx) => {
            const tableNum = idx + 1;
            return (
              <Card
                key={tableNum}
                className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center text-center space-y-3"
              >
                <span className="text-xs font-black uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                  Table #{tableNum}
                </span>
                <div className="h-28 w-28 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-800">
                  <QrCode className="h-20 w-20" />
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  ?table={tableNum}
                </span>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

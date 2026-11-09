'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Delete, LogIn } from 'lucide-react';
import { Button } from '@scan-and-dine/ui-components';
import toast from 'react-hot-toast';

export default function WaiterLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState<string>('');

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        // Authenticate PIN
        toast.success('Staff PIN verified! Clocked in.');
        router.push('/tables');
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6">
      <div className="text-center pt-8">
        <div className="h-14 w-14 rounded-2xl bg-orange-500/20 text-orange-500 flex items-center justify-center mx-auto mb-4">
          <KeyRound className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-black text-white tracking-tight">Staff PIN Login</h1>
        <p className="mt-1 text-xs text-zinc-400">Enter your 4-digit code to access floor map</p>

        {/* PIN Indicators */}
        <div className="flex justify-center space-x-3 my-8">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`h-4 w-4 rounded-full border-2 transition-all ${
                pin.length > idx
                  ? 'bg-orange-500 border-orange-500 scale-110 shadow-lg shadow-orange-500/50'
                  : 'border-zinc-700 bg-zinc-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Numeric Keypad */}
      <div className="grid grid-cols-3 gap-3 pb-8 max-w-xs mx-auto w-full">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            onClick={() => handleDigit(digit)}
            className="h-16 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 text-xl font-bold text-white transition flex items-center justify-center shadow-sm"
          >
            {digit}
          </button>
        ))}
        <div />
        <button
          onClick={() => handleDigit('0')}
          className="h-16 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700 active:scale-95 text-xl font-bold text-white transition flex items-center justify-center shadow-sm"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="h-16 rounded-2xl bg-zinc-800/40 hover:bg-zinc-700/60 active:scale-95 text-zinc-400 hover:text-white transition flex items-center justify-center"
        >
          <Delete className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}

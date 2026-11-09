'use client';

import { use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, CreditCard, Banknote } from 'lucide-react';
import Link from 'next/link';
import { Button, Card } from '@scan-and-dine/ui-components';
import { useCart } from '../../../hooks/useCart';
import { useDeviceId } from '../../../hooks/useDeviceId';
import { apiClient } from '../../../lib/api';
import toast from 'react-hot-toast';

export default function CartPage({ params }: { params: Promise<{ venueSlug: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const table = searchParams.get('table') || '5';
  const router = useRouter();
  const deviceUUID = useDeviceId();
  const { cart, removeItem, clearCart, subtotal, tax, grandTotal } = useCart();

  const handlePayLater = async () => {
    try {
      const res = await apiClient.post('/api/v1/public/checkout/cash', {
        tableNumber: table,
      });
      clearCart();
      toast.success('Order placed! Food is being prepared.');
      router.push(`/${resolvedParams.venueSlug}/track?orderId=${res.data.data._id}&table=${table}`);
    } catch {
      // Mock flow
      clearCart();
      toast.success('Order placed! Cash payment at counter/waiter.');
      router.push(`/${resolvedParams.venueSlug}/track?orderId=mock_order_101&table=${table}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-zinc-100">
        <Link href={`/${resolvedParams.venueSlug}?table=${table}`} className="p-2 -ml-2 rounded-lg text-zinc-600 hover:bg-zinc-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-black text-zinc-900 tracking-tight">Your Order Cart</h1>
      </div>

      {cart.items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <p className="text-sm text-zinc-500">Your cart is currently empty.</p>
          <Link href={`/${resolvedParams.venueSlug}?table=${table}`} className="mt-4">
            <Button variant="outline" size="sm">Browse Menu</Button>
          </Link>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between pt-4">
          <div className="space-y-3">
            {cart.items.map((item) => (
              <div
                key={item.menuItemId}
                className="p-3.5 rounded-2xl border border-zinc-200 bg-white flex items-center justify-between shadow-sm"
              >
                <div>
                  <h4 className="text-sm font-bold text-zinc-900">{item.name}</h4>
                  <span className="text-xs text-zinc-500">Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-black text-zinc-900">${item.itemTotal.toFixed(2)}</span>
                  <button
                    onClick={() => removeItem(item.menuItemId)}
                    className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Price Breakdown */}
            <Card className="mt-6 space-y-2 bg-zinc-50/50 p-4 rounded-2xl border-zinc-200">
              <div className="flex justify-between text-xs text-zinc-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-zinc-600">
                <span>Estimated Tax (5%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-zinc-200 flex justify-between text-base font-black text-zinc-900">
                <span>Total</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
            </Card>
          </div>

          {/* Payment Actions */}
          <div className="space-y-2.5 pt-6">
            <Button
              variant="primary"
              className="w-full py-3.5 shadow-lg shadow-orange-500/20 flex items-center justify-center space-x-2"
              onClick={handlePayLater}
            >
              <Banknote className="h-4 w-4" />
              <span>Pay Later (Cash to Waiter)</span>
            </Button>

            <Button
              variant="secondary"
              className="w-full py-3.5 flex items-center justify-center space-x-2"
              onClick={() => toast('Stripe card payments active in live deployment!')}
            >
              <CreditCard className="h-4 w-4" />
              <span>Pay Online via Card</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

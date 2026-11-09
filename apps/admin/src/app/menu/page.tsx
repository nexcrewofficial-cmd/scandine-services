'use client';

import { useState } from 'react';
import { Plus, Sparkles, Check, X } from 'lucide-react';
import { Button, Card } from '@scan-and-dine/ui-components';
import toast from 'react-hot-toast';

export default function MenuManagementPage() {
  const [items, setItems] = useState([
    {
      id: '1',
      name: 'Truffle Mushroom Pizza',
      category: 'Pizzas',
      price: 18.5,
      station: 'GRILL',
      isAvailable: true,
    },
    {
      id: '2',
      name: 'Spicy Pepperoni & Hot Honey',
      category: 'Pizzas',
      price: 17.0,
      station: 'GRILL',
      isAvailable: true,
    },
    {
      id: '3',
      name: 'San Pellegrino Sparkling',
      category: 'Drinks',
      price: 4.5,
      station: 'BAR',
      isAvailable: true,
    },
    {
      id: '4',
      name: 'Tiramisu Classico',
      category: 'Desserts',
      price: 8.5,
      station: 'DESSERT',
      isAvailable: false,
    },
  ]);

  const toggleStock = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const next = !item.isAvailable;
          toast.success(
            next
              ? `${item.name} marked available on all phones`
              : `${item.name} 86-ed (hidden from customer phones)`
          );
          return { ...item, isAvailable: next };
        }
        return item;
      })
    );
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Menu Catalog & CMS</h1>
          <p className="text-xs text-slate-500 mt-1">Configure pricing, modifier limits, and instant 86-ing.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => toast('New Item modal ready in production!')}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Menu Item
        </Button>
      </div>

      <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
              <th className="pb-3">Name</th>
              <th className="pb-3">Category</th>
              <th className="pb-3">Price</th>
              <th className="pb-3">Station Route</th>
              <th className="pb-3">Availability (86-ing)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {items.map((i) => (
              <tr key={i.id} className="hover:bg-slate-50/50 transition">
                <td className="py-3.5 font-bold text-slate-900">{i.name}</td>
                <td className="py-3.5 text-slate-500">{i.category}</td>
                <td className="py-3.5 font-black text-slate-900">${i.price.toFixed(2)}</td>
                <td className="py-3.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                    {i.station}
                  </span>
                </td>
                <td className="py-3.5">
                  <button
                    onClick={() => toggleStock(i.id)}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                      i.isAvailable
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                    }`}
                  >
                    {i.isAvailable ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    <span>{i.isAvailable ? 'In Stock' : '86-ed (Out of Stock)'}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

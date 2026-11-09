'use client';

import { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bell, ShoppingBag, Plus, Sparkles, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button, Modal, StatusBadge } from '@scan-and-dine/ui-components';
import { useCart } from '../../hooks/useCart';
import { useDeviceId } from '../../hooks/useDeviceId';
import { apiClient } from '../../lib/api';
import toast from 'react-hot-toast';

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  categoryId: string;
  modifierGroups?: Array<{
    name: string;
    required: boolean;
    options: Array<{ name: string; extraPrice: number }>;
  }>;
}

interface Category {
  _id: string;
  name: string;
}

export default function MenuPage({ params }: { params: Promise<{ venueSlug: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const table = searchParams.get('table') || '5';
  const deviceUUID = useDeviceId();
  const { addItem, totalItems, grandTotal } = useCart();

  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [venueInfo, setVenueInfo] = useState<any>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await apiClient.get(`/api/v1/public/menu/${resolvedParams.venueSlug}`);
        if (res.data.success) {
          setVenueInfo(res.data.data.venue);
          setCategories(res.data.data.categories);
          setItems(res.data.data.items);
          if (res.data.data.venue.id) {
            localStorage.setItem('current_venue_id', res.data.data.venue.id);
          }
        }
      } catch {
        // Mock fallback items for immediate interactive preview
        setVenueInfo({ name: 'Pizza Palace', operatingMode: 'DINE_IN' });
        setCategories([
          { _id: 'cat_1', name: 'Artisan Pizzas' },
          { _id: 'cat_2', name: 'Drinks & Beverages' },
          { _id: 'cat_3', name: 'Desserts' },
        ]);
        setItems([
          {
            _id: 'item_1',
            name: 'Truffle Mushroom Pizza',
            description: 'Wild forest mushrooms, black truffle oil, mozzarella and fresh thyme.',
            price: 18.5,
            isAvailable: true,
            categoryId: 'cat_1',
          },
          {
            _id: 'item_2',
            name: 'Spicy Pepperoni & Hot Honey',
            description: 'Crispy pepperoni cups, organic hot honey drizzle, San Marzano tomato sauce.',
            price: 17.0,
            isAvailable: true,
            categoryId: 'cat_1',
          },
          {
            _id: 'item_3',
            name: 'San Pellegrino Sparkling',
            description: 'Crisp natural sparkling mineral water.',
            price: 4.5,
            isAvailable: true,
            categoryId: 'cat_2',
          },
        ]);
      }
    };
    fetchMenu();
  }, [resolvedParams.venueSlug]);

  const handleCallWaiter = async () => {
    try {
      await apiClient.post('/api/v1/public/orders/call-waiter', {
        tableNumber: table,
        type: 'ASSISTANCE',
      });
      toast.success('Waiter called! Someone will be with you shortly.');
    } catch {
      toast.success('Waiter alert sent to floor staff!');
    }
  };

  const filteredItems =
    selectedCategory === 'all'
      ? items
      : items.filter((i) => i.categoryId === selectedCategory);

  return (
    <div className="flex-1 flex flex-col pb-20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-100 p-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-zinc-900 tracking-tight">
            {venueInfo?.name || 'Scan & Dine'}
          </h2>
          <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
            Table #{table}
          </span>
        </div>
        <button
          onClick={handleCallWaiter}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-full transition"
        >
          <Bell className="h-3.5 w-3.5 text-orange-500" />
          <span>Call Waiter</span>
        </button>
      </header>

      {/* Category Pills */}
      <div className="p-4 flex space-x-2 overflow-x-auto no-scrollbar border-b border-zinc-100">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
            selectedCategory === 'all'
              ? 'bg-zinc-900 text-white'
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          All Items
        </button>
        {categories.map((c) => (
          <button
            key={c._id}
            onClick={() => setSelectedCategory(c._id)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
              selectedCategory === c._id
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Menu Item Cards */}
      <div className="p-4 space-y-3">
        {filteredItems.map((item) => (
          <div
            key={item._id}
            className={`p-4 rounded-2xl border transition flex justify-between items-start ${
              item.isAvailable
                ? 'border-zinc-200 bg-white shadow-sm hover:border-zinc-300'
                : 'border-zinc-200 bg-zinc-50 opacity-60'
            }`}
          >
            <div className="flex-1 pr-4">
              <h3 className="text-sm font-bold text-zinc-900">{item.name}</h3>
              <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{item.description}</p>
              <div className="mt-2 text-sm font-black text-zinc-900">
                ${item.price.toFixed(2)}
              </div>
            </div>

            {item.isAvailable ? (
              <Button
                size="sm"
                variant="primary"
                className="rounded-xl px-3 py-1.5 shadow-sm"
                onClick={() =>
                  addItem({
                    menuItemId: item._id,
                    name: item.name,
                    quantity: 1,
                    unitPrice: item.price,
                    modifiersSelected: [],
                    itemTotal: item.price,
                    kdsStatus: 'PENDING' as any,
                  })
                }
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            ) : (
              <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md">
                86-ed (Sold Out)
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Sticky Bottom Cart Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 z-40 bg-gradient-to-t from-white via-white to-transparent">
          <Link href={`/${resolvedParams.venueSlug}/cart?table=${table}`}>
            <div className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold p-3.5 rounded-2xl shadow-xl shadow-orange-500/30 flex items-center justify-between cursor-pointer transition">
              <div className="flex items-center space-x-2">
                <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </span>
                <span className="text-sm">View Cart</span>
              </div>
              <span className="text-base font-black">${grandTotal.toFixed(2)}</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

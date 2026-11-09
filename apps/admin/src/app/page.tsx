import { DollarSign, ShoppingBag, Users, TrendingUp } from 'lucide-react';
import { Card } from '@scan-and-dine/ui-components';

export default function AdminDashboardPage() {
  const metrics = [
    { title: "Today's Gross Sales", value: '$1,482.50', change: '+18.2%', icon: DollarSign },
    { title: 'Total Orders Today', value: '74', change: '+12.5%', icon: ShoppingBag },
    { title: 'Active Dining Tables', value: '6 / 20', change: 'Cafe Mode', icon: Users },
    { title: 'Average Ticket Size', value: '$20.03', change: '+4.1%', icon: TrendingUp },
  ];

  const recentOrders = [
    { id: '#402', table: 'Table 5', amount: '$42.50', status: 'READY', time: '2m ago' },
    { id: '#401', table: 'Table 2', amount: '$18.00', status: 'COOKING', time: '6m ago' },
    { id: '#400', table: 'Takeaway', amount: '$35.50', status: 'SERVED', time: '14m ago' },
    { id: '#399', table: 'Table 7', amount: '$58.00', status: 'PAID', time: '22m ago' },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Venue Overview</h1>
        <p className="text-xs text-slate-500 mt-1">Live restaurant operational metrics and financial stream.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-5">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.title} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold">{m.title}</span>
                <div className="h-8 w-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-slate-900">{m.value}</span>
                <span className="ml-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {m.change}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Live Order Feed */}
      <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Recent Live Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3">Order #</th>
                <th className="pb-3">Destination</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {recentOrders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5 font-bold text-slate-900">{o.id}</td>
                  <td className="py-3.5 text-slate-600">{o.table}</td>
                  <td className="py-3.5 font-black text-slate-900">{o.amount}</td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-600">
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-400">{o.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

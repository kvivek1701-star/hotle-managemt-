import React from 'react';
import { useHotel } from '../context/HotelContext';
import {
  LayoutDashboard,
  BedDouble,
  CalendarDays,
  CalendarCheck2,
  CreditCard,
  BarChart3,
  ShieldAlert,
  Sparkles,
  ClipboardList,
  Receipt,
  Users,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'rooms'
  | 'desk'
  | 'bookings'
  | 'calendar'
  | 'payments'
  | 'bills'
  | 'reports'
  | 'admin';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onSwitchToHRMS?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, onSwitchToHRMS }) => {
  const { currentUser, filteredRooms, filteredBookings, filteredSavedBills } = useHotel();

  // Badge numbers
  const cleaningCount = filteredRooms.filter(r => r.currentStatus === 'cleaning').length;
  const pendingPaymentCount = filteredBookings.filter(
    b => b.status !== 'cancelled' && b.remainingBalance > 0
  ).length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayArrivals = filteredBookings.filter(
    b => b.checkInDate === todayStr && b.status === 'reserved'
  ).length;

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Owner Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'desk' as ActiveTab,
      label: 'Front Desk / Check-In',
      icon: CalendarCheck2,
      badge: todayArrivals > 0 ? `${todayArrivals} Arriving` : null,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    },
    {
      id: 'rooms' as ActiveTab,
      label: 'Room Management',
      icon: BedDouble,
      badge: cleaningCount > 0 ? `${cleaningCount} Clean` : null,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    },
    {
      id: 'bookings' as ActiveTab,
      label: 'All Bookings',
      icon: ClipboardList,
      badge: null,
    },
    {
      id: 'calendar' as ActiveTab,
      label: 'Availability Calendar',
      icon: CalendarDays,
      badge: null,
    },
    {
      id: 'payments' as ActiveTab,
      label: 'Payments & Ledger',
      icon: CreditCard,
      badge: pendingPaymentCount > 0 ? `${pendingPaymentCount} Due` : null,
      badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    },
    {
      id: 'bills' as ActiveTab,
      label: 'Bills & Invoices',
      icon: Receipt,
      badge: filteredSavedBills.length > 0 ? `${filteredSavedBills.length} Saved` : null,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Reports & Accounting',
      icon: BarChart3,
      badge: null,
    },
  ];

  // Admin section
  if (currentUser.role === 'super_admin') {
    navItems.push({
      id: 'admin' as ActiveTab,
      label: 'Admin Control Center',
      icon: ShieldAlert,
      badge: 'Super Admin',
      badgeColor: 'bg-amber-500 text-slate-950 font-bold',
    });
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 shrink-0 flex flex-col justify-between py-4">
      <div className="space-y-1 px-3">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Hotel Management
        </p>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    item.badgeColor || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Housekeeping quick indicator */}
      <div className="px-4 pt-3 border-t border-slate-800/80 space-y-2">
        {onSwitchToHRMS && (
          <button
            onClick={onSwitchToHRMS}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold transition-all shadow-sm group"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Workforce HRMS</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-black">
              Suite
            </span>
          </button>
        )}

        <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Housekeeping
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
              cleaningCount > 0 ? 'text-amber-400 bg-amber-400/10' : 'text-emerald-400'
            }`}>
              {cleaningCount} in cleaning
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Checkout automatically marks rooms for cleaning. Ready rooms can be released instantly.
          </p>
        </div>
      </div>
    </aside>
  );
};

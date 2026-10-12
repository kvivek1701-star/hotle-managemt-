import React from 'react';
import { useHotel } from '../context/HotelContext';
import { Booking } from '../types/hotel';
import { ActiveTab } from './Sidebar';
import {
  Bed,
  CheckCircle2,
  Calendar,
  IndianRupee,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  Wrench,
  Users,
  LogOut,
  LogIn,
  Eye,
  CreditCard,
  ChevronRight,
  ExternalLink,
  Receipt,
} from 'lucide-react';

export interface NavigationOptions {
  roomStatus?: string;
  deskTab?: 'checkin' | 'checkout' | 'housekeeping';
  paymentStatus?: string;
  reportTimeframe?: 'today' | 'week' | 'month' | 'all';
  bookingStatus?: string;
}

interface DashboardViewProps {
  onOpenNewBooking: () => void;
  onOpenCheckIn: (booking: Booking) => void;
  onOpenCheckOut: (booking: Booking) => void;
  onViewInvoice: (booking: Booking) => void;
  onEditBooking?: (booking: Booking) => void;
  onNavigateToTab: (tab: ActiveTab, options?: NavigationOptions) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewBooking,
  onOpenCheckIn,
  onOpenCheckOut,
  onViewInvoice,
  onEditBooking,
  onNavigateToTab,
}) => {
  const {
    filteredRooms,
    filteredBookings,
    activeHotel,
    selectedHotelId,
    markRoomCleaned,
    checkInGuest,
  } = useHotel();

  const todayStr = new Date().toISOString().split('T')[0];
  const currency = activeHotel?.currency || '₹';

  // Room status counts
  const totalRooms = filteredRooms.length;
  const availableRooms = filteredRooms.filter(r => r.currentStatus === 'available').length;
  const bookedRooms = filteredRooms.filter(r => r.currentStatus === 'booked').length;
  const occupiedRooms = filteredRooms.filter(r => r.currentStatus === 'occupied').length;
  const cleaningRooms = filteredRooms.filter(r => r.currentStatus === 'cleaning').length;
  const maintenanceRooms = filteredRooms.filter(r => r.currentStatus === 'maintenance').length;

  const occupancyRate = totalRooms > 0 ? Math.round(((occupiedRooms + bookedRooms) / totalRooms) * 100) : 0;

  // Bookings analytics
  const todayCheckIns = filteredBookings.filter(
    b => b.checkInDate === todayStr && b.status !== 'cancelled'
  );
  const pendingCheckInsToday = todayCheckIns.filter(b => b.status === 'reserved');

  const todayCheckOuts = filteredBookings.filter(
    b => b.checkOutDate === todayStr && b.status !== 'cancelled'
  );
  const pendingCheckOutsToday = todayCheckOuts.filter(b => b.status === 'checked_in');

  const upcomingBookings = filteredBookings.filter(
    b => b.checkInDate > todayStr && b.status === 'reserved'
  );

  // Financial calculations
  const totalMoneyReceived = filteredBookings.reduce((sum, b) => {
    return sum + b.totalAmountReceived;
  }, 0);

  const totalPendingBalances = filteredBookings.reduce((sum, b) => {
    if (b.status === 'cancelled') return sum;
    return sum + b.remainingBalance;
  }, 0);

  // Today's collections
  const todayCollections = filteredBookings.reduce((sum, b) => {
    const todayPayments = b.payments.filter(p => p.date.startsWith(todayStr));
    return sum + todayPayments.reduce((s, p) => s + p.amount, 0);
  }, 0);

  // Current month revenue
  const currentMonthPrefix = todayStr.substring(0, 7);
  const monthlyRevenue = filteredBookings.reduce((sum, b) => {
    const monthPayments = b.payments.filter(p => p.date.startsWith(currentMonthPrefix));
    return sum + monthPayments.reduce((s, p) => s + p.amount, 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/80 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Real-time Operations
            </span>
            <span className="text-xs text-slate-400">
              Today: {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {selectedHotelId === 'all' ? 'All Properties Overview' : activeHotel?.name}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Live monitor of rooms occupancy, today's front-desk arrivals and departures, payment receipts, and housekeeping workflows. Click any card below to navigate directly to its dedicated page.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigateToTab('bills')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-all flex items-center gap-1.5 shadow-sm group"
            title="View saved bills and folio invoices"
          >
            <Receipt className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Bills & Invoices</span>
          </button>
          <button
            onClick={() => onNavigateToTab('desk', { deskTab: 'checkin' })}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-all flex items-center gap-1.5 shadow-sm group"
          >
            <LogIn className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Front Desk Arrivals</span>
          </button>
          <button
            onClick={onOpenNewBooking}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4 stroke-[2.5]" />
            <span>Create Reservation</span>
          </button>
        </div>
      </div>

      {/* Row 1: Room Inventory & Occupancy KPI Cards (Interactive clickable cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Rooms -> Navigates to Room Management */}
        <div
          onClick={() => onNavigateToTab('rooms', { roomStatus: 'all' })}
          className="bg-slate-800/80 hover:bg-slate-800 p-4 rounded-xl border border-slate-700/80 hover:border-amber-500/70 hover:shadow-lg hover:shadow-amber-500/5 cursor-pointer transition-all group flex flex-col justify-between"
          title="Click to view all rooms in Room Management"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium group-hover:text-amber-400 transition-colors">Total Rooms</span>
              <Bed className="w-4 h-4 text-slate-300 group-hover:text-amber-400 transition-colors" />
            </div>
            <p className="text-2xl font-black text-white">{totalRooms}</p>
          </div>

          <div className="mt-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Occupancy</span>
              <span className="font-bold text-amber-400">{occupancyRate}%</span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
            <span className="text-[10px] text-amber-400/80 group-hover:text-amber-300 font-semibold flex items-center gap-0.5 mt-2">
              View all rooms <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Available Rooms -> Navigates to Room Management with Available filter */}
        <div
          onClick={() => onNavigateToTab('rooms', { roomStatus: 'available' })}
          className="bg-slate-800/80 hover:bg-slate-800 p-4 rounded-xl border border-slate-700/80 hover:border-emerald-500/70 hover:shadow-lg hover:shadow-emerald-500/5 cursor-pointer transition-all group flex flex-col justify-between"
          title="Click to view available rooms in Room Management"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium group-hover:text-emerald-400 transition-colors">Available</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-2xl font-black text-emerald-400">{availableRooms}</p>
            <p className="text-[11px] text-slate-400 mt-1">Ready for check-in</p>
          </div>

          <span className="text-[10px] text-emerald-400/80 group-hover:text-emerald-300 font-semibold flex items-center gap-0.5 mt-2">
            Filter available <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>

        {/* Occupied Rooms -> Navigates to Front Desk (Checkout / In-house tab) */}
        <div
          onClick={() => onNavigateToTab('desk', { deskTab: 'checkout' })}
          className="bg-slate-800/80 hover:bg-slate-800 p-4 rounded-xl border border-slate-700/80 hover:border-indigo-500/70 hover:shadow-lg hover:shadow-indigo-500/5 cursor-pointer transition-all group flex flex-col justify-between"
          title="Click to view currently occupied rooms at Front Desk"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium group-hover:text-indigo-400 transition-colors">Occupied</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-black text-indigo-400">{occupiedRooms}</p>
            <p className="text-[11px] text-slate-400 mt-1">Staying guests</p>
          </div>

          <span className="text-[10px] text-indigo-400/80 group-hover:text-indigo-300 font-semibold flex items-center gap-0.5 mt-2">
            In-house desk <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>

        {/* Booked / Reserved -> Navigates to All Bookings with Reserved filter */}
        <div
          onClick={() => onNavigateToTab('bookings', { bookingStatus: 'reserved' })}
          className="bg-slate-800/80 hover:bg-slate-800 p-4 rounded-xl border border-slate-700/80 hover:border-blue-500/70 hover:shadow-lg hover:shadow-blue-500/5 cursor-pointer transition-all group flex flex-col justify-between"
          title="Click to view all reserved bookings"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium group-hover:text-blue-400 transition-colors">Reserved</span>
              <Calendar className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-black text-blue-400">{bookedRooms}</p>
            <p className="text-[11px] text-slate-400 mt-1">Upcoming stays</p>
          </div>

          <span className="text-[10px] text-blue-400/80 group-hover:text-blue-300 font-semibold flex items-center gap-0.5 mt-2">
            View reservations <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>

        {/* Under Cleaning -> Navigates to Front Desk Housekeeping Queue */}
        <div
          onClick={() => onNavigateToTab('desk', { deskTab: 'housekeeping' })}
          className="bg-slate-800/80 hover:bg-slate-800 p-4 rounded-xl border border-slate-700/80 hover:border-amber-500/70 hover:shadow-lg hover:shadow-amber-500/5 cursor-pointer transition-all group flex flex-col justify-between"
          title="Click to view rooms under cleaning in Housekeeping"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium group-hover:text-amber-400 transition-colors">Under Cleaning</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-amber-400">{cleaningRooms}</p>
            <p className="text-[11px] text-slate-400 mt-1">Housekeeping queue</p>
          </div>

          <span className="text-[10px] text-amber-400/80 group-hover:text-amber-300 font-semibold flex items-center gap-0.5 mt-2">
            Housekeeping desk <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>

        {/* Maintenance -> Navigates to Room Management with Maintenance filter */}
        <div
          onClick={() => onNavigateToTab('rooms', { roomStatus: 'maintenance' })}
          className="bg-slate-800/80 hover:bg-slate-800 p-4 rounded-xl border border-slate-700/80 hover:border-rose-500/70 hover:shadow-lg hover:shadow-rose-500/5 cursor-pointer transition-all group flex flex-col justify-between"
          title="Click to view rooms under maintenance"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium group-hover:text-rose-400 transition-colors">Maintenance</span>
              <Wrench className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl font-black text-rose-400">{maintenanceRooms}</p>
            <p className="text-[11px] text-slate-400 mt-1">Out of service</p>
          </div>

          <span className="text-[10px] text-rose-400/80 group-hover:text-rose-300 font-semibold flex items-center gap-0.5 mt-2">
            Maintenance list <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* Row 2: Financial Performance Cards (Interactive clickable cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Collection -> Navigates to Reports with 'today' timeframe */}
        <div
          onClick={() => onNavigateToTab('reports', { reportTimeframe: 'today' })}
          className="bg-slate-800/80 hover:bg-slate-800 p-5 rounded-2xl border border-slate-700/80 hover:border-emerald-500/70 hover:shadow-lg hover:shadow-emerald-500/5 cursor-pointer transition-all group flex flex-col justify-between"
          title="Click to view today's collections in Reports & Accounting"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium group-hover:text-emerald-400 transition-colors">Today's Collections</span>
              <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
                <IndianRupee className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-extrabold text-white">
              {currency}{todayCollections.toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 mt-1">Cash, UPI, Card received today</p>
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-3">
            Open daily report <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Monthly Revenue -> Navigates to Reports with 'month' timeframe */}
        <div
          onClick={() => onNavigateToTab('reports', { reportTimeframe: 'month' })}
          className="bg-slate-800/80 hover:bg-slate-800 p-5 rounded-2xl border border-slate-700/80 hover:border-amber-500/70 hover:shadow-lg hover:shadow-amber-500/5 cursor-pointer transition-all group flex flex-col justify-between"
          title="Click to view monthly revenue in Reports & Accounting"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium group-hover:text-amber-400 transition-colors">Monthly Revenue</span>
              <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-extrabold text-amber-400">
              {currency}{monthlyRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 mt-1">Current calendar month intake</p>
          </div>
          <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1 mt-3">
            Open monthly accounting <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Total Money Received -> Navigates to Payments & Ledger */}
        <div
          onClick={() => onNavigateToTab('payments', { paymentStatus: 'all' })}
          className="bg-slate-800/80 hover:bg-slate-800 p-5 rounded-2xl border border-slate-700/80 hover:border-blue-500/70 hover:shadow-lg hover:shadow-blue-500/5 cursor-pointer transition-all group flex flex-col justify-between"
          title="Click to view all payments in Payments & Ledger"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium group-hover:text-blue-400 transition-colors">Total Money Received</span>
              <span className="p-2 bg-blue-500/10 text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                <CreditCard className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-extrabold text-white">
              {currency}{totalMoneyReceived.toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 mt-1">All verified payments ledger</p>
          </div>
          <span className="text-[11px] text-blue-400 font-semibold flex items-center gap-1 mt-3">
            Open payments ledger <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Total Pending Due -> Navigates to Payments & Ledger filtered by pending */}
        <div
          onClick={() => onNavigateToTab('payments', { paymentStatus: 'payment_pending' })}
          className="bg-slate-800/80 hover:bg-slate-800 p-5 rounded-2xl border border-slate-700/80 hover:border-rose-500/70 hover:shadow-lg hover:shadow-rose-500/5 cursor-pointer transition-all group flex flex-col justify-between"
          title="Click to view pending due accounts in Payments & Ledger"
        >
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium group-hover:text-rose-400 transition-colors">Total Pending Due</span>
              <span className="p-2 bg-rose-500/10 text-rose-400 rounded-xl group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-extrabold text-rose-400">
              {currency}{totalPendingBalances.toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 mt-1">Pending collection at checkout</p>
          </div>
          <span className="text-[11px] text-rose-400 font-semibold flex items-center gap-1 mt-3">
            Manage due folios <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* Row 3: Today's Action Hub - Check-ins, Check-outs, and Housekeeping */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Check-ins */}
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/80 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onNavigateToTab('desk', { deskTab: 'checkin' })}
              className="flex items-center gap-2 text-left group hover:text-emerald-400 transition-colors"
            >
              <LogIn className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="font-bold text-white text-sm group-hover:text-emerald-400 flex items-center gap-1">
                  Today's Check-ins ({todayCheckIns.length})
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" />
                </h3>
                <span className="text-[11px] text-slate-400">Click to open Arrivals Desk</span>
              </div>
            </button>

            <button
              onClick={() => onNavigateToTab('desk', { deskTab: 'checkin' })}
              className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold hover:bg-emerald-500/25 transition-all"
            >
              {pendingCheckInsToday.length} Pending Arrival
            </button>
          </div>

          {todayCheckIns.length === 0 ? (
            <div className="p-6 bg-slate-900/40 rounded-xl border border-slate-800 text-center">
              <p className="text-xs text-slate-400 italic">No check-ins scheduled for today.</p>
              <button
                onClick={onOpenNewBooking}
                className="mt-2 text-xs text-amber-400 hover:text-amber-300 font-semibold underline"
              >
                + Book a Walk-in Guest
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {todayCheckIns.map(booking => {
                const room = filteredRooms.find(r => r.id === booking.roomId);
                const isCheckedIn = booking.status === 'checked_in';

                return (
                  <div
                    key={booking.id}
                    className="p-3 bg-slate-900/80 hover:bg-slate-900 rounded-xl border border-slate-700/70 hover:border-slate-500 flex items-center justify-between gap-3 text-xs transition-all group"
                  >
                    <div
                      onClick={() => onViewInvoice(booking)}
                      className="cursor-pointer flex-1"
                      title="Click to view customer details & invoice"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors">
                          {booking.customer.fullName}
                        </span>
                        <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                          Room {room?.roomNumber || 'N/A'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {booking.customer.mobileNumber} • {booking.nights} nights • Due: {currency}{booking.remainingBalance.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isCheckedIn ? (
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-1 rounded-lg flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> In-House
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            checkInGuest(booking.id);
                          }}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm"
                        >
                          <LogIn className="w-3.5 h-3.5 stroke-[2.5]" /> Check-In
                        </button>
                      )}
                      <button
                        onClick={() => onViewInvoice(booking)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
                        title="View Folio / Bill"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Today's Check-outs */}
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/80 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onNavigateToTab('desk', { deskTab: 'checkout' })}
              className="flex items-center gap-2 text-left group hover:text-amber-400 transition-colors"
            >
              <LogOut className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="font-bold text-white text-sm group-hover:text-amber-400 flex items-center gap-1">
                  Today's Check-outs ({todayCheckOuts.length})
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400" />
                </h3>
                <span className="text-[11px] text-slate-400">Click to open Departures Desk</span>
              </div>
            </button>

            <button
              onClick={() => onNavigateToTab('desk', { deskTab: 'checkout' })}
              className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold hover:bg-amber-500/25 transition-all"
            >
              {pendingCheckOutsToday.length} Pending Departure
            </button>
          </div>

          {todayCheckOuts.length === 0 ? (
            <div className="p-6 bg-slate-900/40 rounded-xl border border-slate-800 text-center">
              <p className="text-xs text-slate-400 italic">No check-outs scheduled for today.</p>
              <button
                onClick={() => onNavigateToTab('desk', { deskTab: 'checkout' })}
                className="mt-2 text-xs text-amber-400 hover:text-amber-300 font-semibold underline"
              >
                View all in-house guests
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {todayCheckOuts.map(booking => {
                const room = filteredRooms.find(r => r.id === booking.roomId);
                const isCheckedOut = booking.status === 'checked_out';

                return (
                  <div
                    key={booking.id}
                    className="p-3 bg-slate-900/80 hover:bg-slate-900 rounded-xl border border-slate-700/70 hover:border-slate-500 flex items-center justify-between gap-3 text-xs transition-all group"
                  >
                    <div
                      onClick={() => onViewInvoice(booking)}
                      className="cursor-pointer flex-1"
                      title="Click to view customer details & invoice"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors">
                          {booking.customer.fullName}
                        </span>
                        <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                          Room {room?.roomNumber || 'N/A'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Balance Due:{' '}
                        <span className={`font-bold ${booking.remainingBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {currency}{booking.remainingBalance.toLocaleString()}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isCheckedOut ? (
                        <span className="text-[11px] font-bold text-slate-400 bg-slate-800 border border-slate-700 px-2 py-1 rounded-lg">
                          Departed
                        </span>
                      ) : (
                        <button
                          onClick={() => onOpenCheckOut(booking)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm"
                        >
                          <LogOut className="w-3.5 h-3.5 stroke-[2.5]" /> Check-Out
                        </button>
                      )}
                      <button
                        onClick={() => onViewInvoice(booking)}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
                        title="View Folio / Bill"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Housekeeping Ready Queue (Clickable) */}
      {cleaningRooms > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <button
              onClick={() => onNavigateToTab('desk', { deskTab: 'housekeeping' })}
              className="flex items-center gap-2 text-left group hover:text-amber-300 transition-colors"
            >
              <Sparkles className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              <div>
                <h4 className="font-bold text-white text-sm group-hover:text-amber-300 flex items-center gap-1">
                  Housekeeping Action: {cleaningRooms} Rooms Awaiting Sanitization & Inspection
                  <ChevronRight className="w-4 h-4 text-amber-400" />
                </h4>
                <span className="text-xs text-amber-400/90 font-medium">
                  Click to open dedicated Housekeeping Queue or mark rooms ready directly below
                </span>
              </div>
            </button>

            <button
              onClick={() => onNavigateToTab('desk', { deskTab: 'housekeeping' })}
              className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold rounded-lg self-start sm:self-center transition-all flex items-center gap-1"
            >
              <span>Manage Cleaning Desk</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {filteredRooms
              .filter(r => r.currentStatus === 'cleaning')
              .map(room => (
                <div
                  key={room.id}
                  className="bg-slate-900/90 hover:bg-slate-900 border border-amber-500/40 p-3 rounded-xl flex items-center justify-between text-xs transition-all group"
                >
                  <div
                    onClick={() => onNavigateToTab('rooms', { roomStatus: 'cleaning' })}
                    className="cursor-pointer"
                    title="Click to view room details in Room Management"
                  >
                    <span className="font-bold text-white group-hover:text-amber-400 transition-colors">
                      Room {room.roomNumber}
                    </span>
                    <span className="text-[10px] text-amber-400 block capitalize">
                      Floor {room.floor} • {room.roomType}
                    </span>
                    {room.notes && (
                      <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{room.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => markRoomCleaned(room.id)}
                    className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center gap-1 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Row 5: Upcoming Bookings Preview (Clickable table rows) */}
      <div className="bg-slate-800/60 rounded-2xl border border-slate-700/80 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-white text-sm">Upcoming Bookings & Advance Reservations</h3>
          </div>
          <button
            onClick={() => onNavigateToTab('bookings')}
            className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
          >
            <span>View All Bookings</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-900/40 rounded-xl">
            <p className="text-xs italic">No upcoming reservations recorded yet.</p>
            <button
              onClick={onOpenNewBooking}
              className="mt-2 text-xs text-amber-400 hover:text-amber-300 font-bold underline"
            >
              + Create New Reservation
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 font-semibold bg-slate-900/60">
                  <th className="py-2.5 px-3">Guest Name</th>
                  <th className="py-2.5 px-3">Room</th>
                  <th className="py-2.5 px-3">Arrival Date</th>
                  <th className="py-2.5 px-3">Departure</th>
                  <th className="py-2.5 px-3 text-right">Tariff</th>
                  <th className="py-2.5 px-3 text-right">Advance Paid</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {upcomingBookings.slice(0, 5).map(b => {
                  const room = filteredRooms.find(r => r.id === b.roomId);
                  return (
                    <tr
                      key={b.id}
                      onClick={() => onViewInvoice(b)}
                      className="hover:bg-slate-800/80 transition-colors cursor-pointer group"
                      title="Click to view booking invoice & details"
                    >
                      <td className="py-2.5 px-3 font-semibold text-white group-hover:text-amber-400 transition-colors">
                        {b.customer.fullName}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        Room {room?.roomNumber || 'N/A'} ({room?.roomType})
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{b.checkInDate}</td>
                      <td className="py-2.5 px-3 text-slate-300">{b.checkOutDate}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-200">
                        {currency}{b.finalPayableAmount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                        {currency}{b.totalAmountReceived.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          {b.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => onViewInvoice(b)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Folio
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

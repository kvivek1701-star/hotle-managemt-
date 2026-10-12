import React, { useState, useMemo } from 'react';
import { Booking, Room, PaymentMethod, SavedBill } from '../types/hotel';
import { useHotel } from '../context/HotelContext';
import {
  LogIn,
  LogOut,
  CalendarCheck2,
  Sparkles,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Clock,
  Search,
  ArrowLeft,
  Home,
  X,
  Save,
  IndianRupee,
  Printer,
  Download,
  Share2,
} from 'lucide-react';

interface CheckInOutDeskViewProps {
  onViewInvoice: (booking: Booking) => void;
  onViewSavedBill?: (bill: SavedBill) => void;
  onOpenNewBooking: () => void;
  onNavigateHome?: () => void;
  initialSubTab?: 'checkin' | 'checkout' | 'housekeeping';
}

export const CheckInOutDeskView: React.FC<CheckInOutDeskViewProps> = ({
  onViewInvoice,
  onViewSavedBill,
  onOpenNewBooking,
  onNavigateHome,
  initialSubTab = 'checkin',
}) => {
  const {
    filteredBookings,
    filteredRooms,
    checkInGuest,
    checkOutGuest,
    markRoomCleaned,
    activeHotel,
    saveBill,
    notify,
  } = useHotel();

  const [activeSubTab, setActiveSubTab] = useState<'checkin' | 'checkout' | 'housekeeping'>(initialSubTab);

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [searchTerm, setSearchTerm] = useState('');

  // Settle at checkout modal state
  const [checkoutTarget, setCheckoutTarget] = useState<Booking | null>(null);
  const [settlementAmount, setSettlementAmount] = useState<number>(0);
  const [settlementMethod, setSettlementMethod] = useState<PaymentMethod>('cash');
  const [settlementRef, setSettlementRef] = useState<string>('');
  const [checkoutNotes, setCheckoutNotes] = useState<string>('');
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [completedCheckoutBill, setCompletedCheckoutBill] = useState<SavedBill | null>(null);
  const [completedGuestName, setCompletedGuestName] = useState<string>('');
  const [completedRoomNumber, setCompletedRoomNumber] = useState<string>('');

  const todayStr = new Date().toISOString().split('T')[0];
  const currency = activeHotel?.currency || '₹';

  // Reserved bookings awaiting check-in
  const arrivalsList = filteredBookings.filter(b => b.status === 'reserved');

  // Currently occupied bookings awaiting check-out
  const inHouseList = filteredBookings.filter(b => b.status === 'checked_in');

  // Cleaning rooms
  const cleaningRoomsList = filteredRooms.filter(r => r.currentStatus === 'cleaning');

  // Filtered arrivals
  const displayArrivals = arrivalsList.filter(b => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const room = filteredRooms.find(r => r.id === b.roomId);
    return (
      b.customer.fullName.toLowerCase().includes(term) ||
      b.customer.mobileNumber.toLowerCase().includes(term) ||
      (room && room.roomNumber.toLowerCase().includes(term))
    );
  });

  // Filtered in-house
  const displayInHouse = inHouseList.filter(b => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const room = filteredRooms.find(r => r.id === b.roomId);
    return (
      b.customer.fullName.toLowerCase().includes(term) ||
      b.customer.mobileNumber.toLowerCase().includes(term) ||
      (room && room.roomNumber.toLowerCase().includes(term))
    );
  });

  const handleStartCheckout = (booking: Booking) => {
    setCheckoutTarget(booking);
    setSettlementAmount(booking.remainingBalance > 0 ? booking.remainingBalance : 0);
    setSettlementMethod('cash');
    setSettlementRef(`CO-${Date.now().toString().slice(-6)}`);
    setCheckoutNotes('');
    setCheckoutError(null);
  };

  const handleConfirmCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutTarget) return;

    if (isSubmittingCheckout) return; // Prevent duplicate transactions

    setCheckoutError(null);

    // Validate settlement amount
    if (settlementAmount < 0) {
      setCheckoutError('Settlement amount cannot be negative.');
      return;
    }

    if (settlementAmount > checkoutTarget.remainingBalance) {
      setCheckoutError(`Settlement amount exceeds remaining balance of ${currency}${checkoutTarget.remainingBalance.toLocaleString()}.`);
      return;
    }

    if (settlementAmount > 0 && !settlementRef.trim()) {
      setCheckoutError('Please provide a payment receipt or reference number.');
      return;
    }

    setIsSubmittingCheckout(true);

    try {
      const room = filteredRooms.find(r => r.id === checkoutTarget.roomId);
      const guestName = checkoutTarget.customer.fullName;
      const roomNum = room?.roomNumber || 'Room';

      const result = checkOutGuest(
        checkoutTarget.id,
        settlementAmount > 0
          ? {
              amount: Number(settlementAmount),
              method: settlementMethod,
              referenceNo: settlementRef.trim(),
              notes: checkoutNotes.trim() || 'Settlement payment collected at checkout',
            }
          : undefined
      );

      if (!result.success) {
        setCheckoutError(result.error || 'Failed to process checkout. Please try again.');
        setIsSubmittingCheckout(false);
        return;
      }

      // Successful checkout
      setCompletedGuestName(guestName);
      setCompletedRoomNumber(roomNum);
      if (result.savedBill) {
        setCompletedCheckoutBill(result.savedBill);
      }

      setCheckoutTarget(null);
      setIsSubmittingCheckout(false);
    } catch (err: any) {
      setCheckoutError(err.message || 'An unexpected error occurred during checkout.');
      setIsSubmittingCheckout(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {onNavigateHome && (
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-400 mb-2 px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors"
              title="Return to Main Dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
          )}
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarCheck2 className="w-5 h-5 text-amber-500" />
            Front Desk Express Check-In & Check-Out
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational desk for guest arrivals, room handover, instant balance settlement, and automated housekeeping handoff.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewBooking}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
          >
            New Walk-In / Reservation
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/80 p-2 rounded-2xl border border-slate-700/80">
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setActiveSubTab('checkin')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'checkin'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <LogIn className="w-4 h-4 stroke-[2.5]" />
            <span>Arrivals & Check-In ({arrivalsList.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('checkout')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'checkout'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <LogOut className="w-4 h-4 stroke-[2.5]" />
            <span>Departures & Check-Out ({inHouseList.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('housekeeping')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'housekeeping'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
            <span>Cleaning Queue ({cleaningRoomsList.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search guest name or room..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Tab 1: Check-in Desk */}
      {activeSubTab === 'checkin' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {displayArrivals.length} reservations awaiting customer arrival. Checking in automatically sets the room to <strong className="text-indigo-400">Occupied</strong>.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayArrivals.map(booking => {
              const room = filteredRooms.find(r => r.id === booking.roomId);
              const isTodayArrival = booking.checkInDate === todayStr;

              return (
                <div
                  key={booking.id}
                  className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-5 space-y-4 hover:border-slate-600 transition-all flex flex-col justify-between text-xs"
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">
                            {booking.customer.fullName}
                          </h3>
                          {isTodayArrival && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              Arriving Today
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 mt-0.5">
                          Phone: <span className="text-slate-200 font-medium">{booking.customer.mobileNumber}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-900 font-extrabold text-amber-400 text-sm border border-slate-700 block">
                          Room {room?.roomNumber || 'N/A'}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase capitalize">
                          {room?.roomType} • {room?.isAC ? 'AC' : 'Non-AC'}
                        </span>
                      </div>
                    </div>

                    {/* ID Proof Box */}
                    <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/60 space-y-1 mb-3">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-semibold text-slate-200">
                          {booking.customer.idProofType.replace('_', ' ').toUpperCase()}:
                        </span>
                        <span className="font-mono text-white">{booking.customer.idProofNumber}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Guests: {booking.guestsCount.adults} Adults, {booking.guestsCount.children} Children
                        {booking.extraBeds > 0 && ` (${booking.extraBeds} Extra Beds)`}
                      </p>
                    </div>

                    {/* Stay timing */}
                    <div className="grid grid-cols-2 gap-2 text-slate-300">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Scheduled Check-in</span>
                        <span className="font-bold text-white">{booking.checkInDate}</span> at {booking.checkInTime}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Scheduled Check-out</span>
                        <span className="font-bold text-white">{booking.checkOutDate}</span> at {booking.checkOutTime}
                      </div>
                    </div>

                    {/* Financial summary */}
                    <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Total Tariff</span>
                        <span className="font-bold text-slate-200">{currency}{booking.finalPayableAmount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Advance Received</span>
                        <span className="font-bold text-emerald-400">{currency}{booking.totalAmountReceived.toLocaleString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase block">Remaining Balance</span>
                        <span className={`font-extrabold ${booking.remainingBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {currency}{booking.remainingBalance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onViewInvoice(booking)}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-700 text-amber-400 hover:text-white rounded-xl font-semibold transition-all flex items-center gap-1.5 border border-slate-700 shadow-sm"
                      title="Preview Bill Folio (👁)"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" /> Preview Bill
                    </button>

                    <button
                      onClick={() => checkInGuest(booking.id)}
                      className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                    >
                      <LogIn className="w-4 h-4 stroke-[2.5]" />
                      <span>Complete Guest Check-In</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {displayArrivals.length === 0 && (
            <div className="p-12 text-center bg-slate-800/40 rounded-2xl border border-slate-700 text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-white">No pending check-ins found.</p>
              <p className="text-xs">All scheduled arrivals are checked in or no active bookings match search.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Check-out Desk */}
      {activeSubTab === 'checkout' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {displayInHouse.length} in-house guests currently staying. Checking out records final balance settlement and automatically sets the room to <strong className="text-amber-400">Cleaning</strong>.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayInHouse.map(booking => {
              const room = filteredRooms.find(r => r.id === booking.roomId);
              const isTodayDeparture = booking.checkOutDate === todayStr;

              return (
                <div
                  key={booking.id}
                  className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-5 space-y-4 hover:border-slate-600 transition-all flex flex-col justify-between text-xs"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">
                            {booking.customer.fullName}
                          </h3>
                          {isTodayDeparture && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                              Departing Today
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 mt-0.5">
                          Mobile: <span className="text-slate-200 font-medium">{booking.customer.mobileNumber}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-900 font-extrabold text-amber-400 text-sm border border-slate-700 block">
                          Room {room?.roomNumber || 'N/A'}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase capitalize">
                          {room?.roomType} • {booking.nights} Nights
                        </span>
                      </div>
                    </div>

                    {/* Stay Timings */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/60 text-slate-300">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Actual Check-in</span>
                        <span className="font-semibold text-white">
                          {booking.actualCheckIn ? new Date(booking.actualCheckIn).toLocaleDateString() : booking.checkInDate}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Scheduled Check-out</span>
                        <span className="font-semibold text-white">{booking.checkOutDate}</span> at {booking.checkOutTime}
                      </div>
                    </div>

                    {/* Financial details */}
                    <div className="mt-3 p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 space-y-1.5">
                      <div className="flex justify-between text-slate-400">
                        <span>Total Room Tariff:</span>
                        <span className="font-semibold text-slate-200">{currency}{booking.totalRoomCharges.toLocaleString()}</span>
                      </div>
                      {booking.extraCharges.length > 0 && (
                        <div className="flex justify-between text-slate-400">
                          <span>Extra Services / Dining ({booking.extraCharges.length} items):</span>
                          <span className="font-semibold text-slate-200">
                            +{currency}{booking.extraCharges.reduce((s, c) => s + c.amount, 0).toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-400">
                        <span>Paid So Far:</span>
                        <span className="font-semibold text-emerald-400">{currency}{booking.totalAmountReceived.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-slate-700 text-white">
                        <span>Remaining Balance Due:</span>
                        <span className={`text-base font-extrabold ${booking.remainingBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {currency}{booking.remainingBalance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onViewInvoice(booking)}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-700 text-amber-400 hover:text-white rounded-xl font-semibold transition-all flex items-center gap-1.5 border border-slate-700 shadow-sm"
                      title="Preview Bill Folio (👁)"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" /> Preview Bill
                    </button>

                    <button
                      onClick={() => handleStartCheckout(booking)}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-4 h-4 stroke-[2.5]" />
                      <span>Settle & Check-Out</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {displayInHouse.length === 0 && (
            <div className="p-12 text-center bg-slate-800/40 rounded-2xl border border-slate-700 text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="font-bold text-white">No occupied rooms currently in house.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Housekeeping Queue */}
      {activeSubTab === 'housekeeping' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Rooms placed in <strong>Cleaning</strong> status following guest checkout or scheduled housekeeping. Confirm readiness to make room available for immediate rebooking.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cleaningRoomsList.map(room => (
              <div
                key={room.id}
                className="bg-slate-800/80 rounded-2xl border border-amber-500/40 p-4 space-y-3 flex flex-col justify-between text-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-extrabold text-white text-base">
                      Room {room.roomNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Cleaning
                    </span>
                  </div>
                  <p className="text-slate-400 capitalize">
                    Floor {room.floor} • {room.roomType} ({room.isAC ? 'AC' : 'Non-AC'})
                  </p>
                  {room.notes && (
                    <p className="mt-2 text-[11px] text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                      {room.notes}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => markRoomCleaned(room.id)}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Cleaned & Ready</span>
                </button>
              </div>
            ))}
          </div>

          {cleaningRoomsList.length === 0 && (
            <div className="p-12 text-center bg-slate-800/40 rounded-2xl border border-slate-700 text-slate-400">
              <Sparkles className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-white">All rooms are sanitized and inspection complete!</p>
              <p className="text-xs">No rooms currently waiting for housekeeping.</p>
            </div>
          )}
        </div>
      )}

      {/* Settle at Checkout Modal */}
      {checkoutTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-xs">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700/80">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setCheckoutTarget(null)}
                  className="p-1.5 -ml-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/70 transition-colors"
                  title="Back to Front Desk"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <LogOut className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-white">Guest Checkout & Settle Folio</h3>
              </div>
              <div className="flex items-center gap-2">
                {onNavigateHome && (
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutTarget(null);
                      onNavigateHome();
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700/60 border border-slate-700/60 transition-colors flex items-center gap-1.5"
                    title="Exit to Dashboard / Home"
                  >
                    <Home className="w-3.5 h-3.5 text-amber-500" />
                    <span>Home</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setCheckoutTarget(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/70 transition-colors"
                  title="Exit / Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleConfirmCheckout} className="p-6 space-y-4">
              {/* Form Navigation / Away Options */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <button
                  type="button"
                  onClick={() => setCheckoutTarget(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700/70 transition-all group"
                  title="Back to front desk check-out list"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-colors" />
                  <span>Back to Desk</span>
                </button>

                <div className="flex items-center gap-2">
                  {onNavigateHome && (
                    <button
                      type="button"
                      onClick={() => {
                        setCheckoutTarget(null);
                        onNavigateHome();
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all"
                      title="Navigate away to Dashboard / Home"
                    >
                      <Home className="w-3.5 h-3.5 text-amber-500" />
                      <span>Home / Dashboard</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setCheckoutTarget(null)}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 px-2 py-1.5 rounded-lg hover:bg-rose-500/10 transition-all"
                    title="Exit checkout without changes"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Exit</span>
                  </button>
                </div>
              </div>

              <div>
                <span className="text-slate-400">Guest:</span>
                <p className="text-sm font-bold text-white">{checkoutTarget.customer.fullName}</p>
                <p className="text-slate-400">
                  Room: {filteredRooms.find(r => r.id === checkoutTarget.roomId)?.roomNumber} • Stayed {checkoutTarget.nights} Nights
                </p>
              </div>

              {/* Outstanding balance highlight */}
              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Final Bill Payable:</span>
                  <span className="font-semibold text-white">{currency}{checkoutTarget.finalPayableAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Previously Paid:</span>
                  <span className="font-semibold text-emerald-400">{currency}{checkoutTarget.totalAmountReceived.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-700 text-white">
                  <span>Due Balance:</span>
                  <span className={checkoutTarget.remainingBalance > 0 ? 'text-rose-400 font-extrabold' : 'text-emerald-400'}>
                    {currency}{checkoutTarget.remainingBalance.toLocaleString()}
                  </span>
                </div>
              </div>

              {checkoutTarget.remainingBalance > 0 && (
                <div className="space-y-3 pt-2">
                  <p className="text-amber-400 font-semibold">
                    Collect Settlement Payment at Desk:
                  </p>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Settlement Amount ({currency})</label>
                    <input
                      type="number"
                      min="0"
                      max={checkoutTarget.remainingBalance}
                      value={settlementAmount}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setSettlementAmount(isNaN(val) ? 0 : val);
                        setCheckoutError(null);
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Payment Method</label>
                    <select
                      value={settlementMethod}
                      onChange={e => setSettlementMethod(e.target.value as PaymentMethod)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="cash">Cash (Front Desk)</option>
                      <option value="upi">UPI / QR Code</option>
                      <option value="card">Card (POS Swiped)</option>
                      <option value="bank_transfer">Bank Transfer / NEFT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Receipt / Ref No</label>
                    <input
                      type="text"
                      value={settlementRef}
                      onChange={e => {
                        setSettlementRef(e.target.value);
                        setCheckoutError(null);
                      }}
                      placeholder="e.g. RCPT-123456"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Checkout / Settlement Notes */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Checkout Notes / Remarks (Optional)</label>
                <input
                  type="text"
                  value={checkoutNotes}
                  onChange={e => setCheckoutNotes(e.target.value)}
                  placeholder="e.g. Guest returned key cards, settled folio in full"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              {checkoutError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{checkoutError}</span>
                </div>
              )}

              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-[11px] flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>
                  Room will be automatically marked as <strong>Cleaning</strong> upon checkout until confirmed ready. Final bill is saved automatically to database.
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutTarget(null);
                      setCheckoutError(null);
                    }}
                    disabled={isSubmittingCheckout}
                    className="flex-1 sm:flex-none px-3.5 py-2 font-semibold text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                    title="Go back to front desk without saving"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                    <span>Back</span>
                  </button>
                  {onNavigateHome && (
                    <button
                      type="button"
                      onClick={() => {
                        setCheckoutTarget(null);
                        setCheckoutError(null);
                        onNavigateHome();
                      }}
                      disabled={isSubmittingCheckout}
                      className="flex-1 sm:flex-none px-3.5 py-2 font-semibold text-xs rounded-xl bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-700/70 transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                      title="Leave checkout and go to Dashboard"
                    >
                      <Home className="w-3.5 h-3.5 text-amber-500" />
                      <span>Home</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutTarget(null);
                      setCheckoutError(null);
                    }}
                    disabled={isSubmittingCheckout}
                    className="px-3 py-2 font-medium text-xs rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-50"
                    title="Exit modal"
                  >
                    Exit
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSubmittingCheckout}
                    className="flex-1 sm:flex-none px-5 py-2.5 font-bold text-xs rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                    title="Save checkout details, update room status, and generate final bill"
                  >
                    <Save className="w-4 h-4 stroke-[2.5]" />
                    <span>{isSubmittingCheckout ? 'Saving & Finalizing...' : 'Save & Complete Checkout'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post-Checkout Success & Final Bill Actions Dialog */}
      {completedCheckoutBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden text-xs">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-emerald-950/40 border-b border-emerald-500/30">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shadow-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Checkout Completed Successfully!</h3>
                  <p className="text-[11px] text-emerald-300">Room {completedRoomNumber} • Guest {completedGuestName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCompletedCheckoutBill(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bill Details Summary */}
            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Final Bill Number:</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">#{completedCheckoutBill.billNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Billed Amount:</span>
                  <span className="font-bold text-white">{currency}{completedCheckoutBill.grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Amount Settled:</span>
                  <span className="font-bold text-emerald-400">{currency}{completedCheckoutBill.paidAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-700/80">
                  <span className="text-slate-400">Outstanding Folio Balance:</span>
                  <span className={`font-bold ${completedCheckoutBill.balanceDue > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {currency}{completedCheckoutBill.balanceDue.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Payment Status:</span>
                  <span className="px-2 py-0.5 rounded-full uppercase tracking-wider font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {completedCheckoutBill.paymentStatus.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-[11px] flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  Room {completedRoomNumber} has transitioned to <strong>Cleaning</strong> queue. The bill has been securely archived in your Saved Bills ledger.
                </span>
              </div>

              {/* Action Buttons: Preview, Print, Share, PDF */}
              <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const bill = completedCheckoutBill;
                    setCompletedCheckoutBill(null);
                    if (onViewSavedBill) {
                      onViewSavedBill(bill);
                    } else {
                      const matched = filteredBookings.find(b => b.id === bill.bookingId);
                      if (matched) {
                        onViewInvoice(matched);
                      }
                    }
                  }}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-white rounded-xl font-bold flex flex-col items-center justify-center gap-1 border border-slate-700 transition-all text-center group cursor-pointer"
                  title="Preview complete bill folio (👁)"
                >
                  <Eye className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px]">Preview (👁)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const bill = completedCheckoutBill;
                    setCompletedCheckoutBill(null);
                    if (onViewSavedBill) {
                      onViewSavedBill(bill);
                    } else {
                      const matched = filteredBookings.find(b => b.id === bill.bookingId);
                      if (matched) {
                        onViewInvoice(matched);
                      }
                    }
                  }}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl font-bold flex flex-col items-center justify-center gap-1 border border-slate-700 transition-all text-center group cursor-pointer"
                  title="Print Bill on thermal or standard printer"
                >
                  <Printer className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px]">Print Bill</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const bill = completedCheckoutBill;
                    setCompletedCheckoutBill(null);
                    if (onViewSavedBill) {
                      onViewSavedBill(bill);
                    } else {
                      const matched = filteredBookings.find(b => b.id === bill.bookingId);
                      if (matched) {
                        onViewInvoice(matched);
                      }
                    }
                  }}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl font-bold flex flex-col items-center justify-center gap-1 border border-slate-700 transition-all text-center group cursor-pointer"
                  title="Download Bill as PDF document"
                >
                  <Download className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px]">PDF Download</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const bill = completedCheckoutBill;
                    setCompletedCheckoutBill(null);
                    if (onViewSavedBill) {
                      onViewSavedBill(bill);
                    } else {
                      const matched = filteredBookings.find(b => b.id === bill.bookingId);
                      if (matched) {
                        onViewInvoice(matched);
                      }
                    }
                  }}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl font-bold flex flex-col items-center justify-center gap-1 border border-slate-700 transition-all text-center group cursor-pointer"
                  title="Share Bill via WhatsApp / Email"
                >
                  <Share2 className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px]">Share Bill</span>
                </button>
              </div>

              {/* Close Button */}
              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setCompletedCheckoutBill(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-colors"
                >
                  Done & Return to Desk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

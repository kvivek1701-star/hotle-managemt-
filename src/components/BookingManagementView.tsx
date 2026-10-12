import React, { useState, useMemo } from 'react';
import { useHotel } from '../context/HotelContext';
import { Booking, BookingStatus, PaymentStatus } from '../types/hotel';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  ClipboardList,
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  IndianRupee,
  Utensils,
  XCircle,
  LogIn,
  LogOut,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
} from 'lucide-react';

interface BookingManagementViewProps {
  onOpenNewBooking: () => void;
  onEditBooking: (booking: Booking) => void;
  onViewInvoice: (booking: Booking) => void;
  onAddPayment: (booking: Booking) => void;
  onAddExtraCharge: (booking: Booking) => void;
  onCancelBooking: (booking: Booking) => void;
  onCheckIn: (booking: Booking) => void;
  onCheckOut: (booking: Booking) => void;
  initialStatusFilter?: string;
  initialPaymentFilter?: string;
}

export const BookingManagementView: React.FC<BookingManagementViewProps> = ({
  onOpenNewBooking,
  onEditBooking,
  onViewInvoice,
  onAddPayment,
  onAddExtraCharge,
  onCancelBooking,
  onCheckIn,
  onCheckOut,
  initialStatusFilter = 'all',
  initialPaymentFilter = 'all',
}) => {
  const { filteredBookings, filteredRooms, activeHotel, checkInGuest, deleteBooking } = useHotel();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [paymentFilter, setPaymentFilter] = useState<string>(initialPaymentFilter);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [isDeletingBooking, setIsDeletingBooking] = useState(false);

  React.useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  React.useEffect(() => {
    if (initialPaymentFilter) {
      setPaymentFilter(initialPaymentFilter);
    }
  }, [initialPaymentFilter]);

  const currency = activeHotel?.currency || '₹';

  const displayBookings = useMemo(() => {
    return filteredBookings.filter(b => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const room = filteredRooms.find(r => r.id === b.roomId);
        const matchesGuest = b.customer.fullName.toLowerCase().includes(term);
        const matchesPhone = b.customer.mobileNumber.toLowerCase().includes(term);
        const matchesRoom = room?.roomNumber.toLowerCase().includes(term);
        const matchesId = b.id.toLowerCase().includes(term);
        if (!matchesGuest && !matchesPhone && !matchesRoom && !matchesId) return false;
      }

      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (paymentFilter !== 'all' && b.paymentStatus !== paymentFilter) return false;

      return true;
    });
  }, [filteredBookings, filteredRooms, searchTerm, statusFilter, paymentFilter]);

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'reserved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Clock className="w-3 h-3" /> Reserved
          </span>
        );
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Checked-In
          </span>
        );
      case 'checked_out':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-700 text-slate-300">
            Checked-Out
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
    }
  };

  const getPaymentBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'paid_in_full':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Paid in Full
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Partially Paid
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300">
            Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            Payment Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-500" />
            Booking & Reservation Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Full registry of all reservations, live stay tracking, invoices, partial payments, and history.
          </p>
        </div>

        <button
          onClick={onOpenNewBooking}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create New Booking</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name, phone, booking ID, or room..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-slate-400">
              <Filter className="w-3.5 h-3.5" /> Booking Status:
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Statuses</option>
              <option value="reserved">Reserved</option>
              <option value="checked_in">Checked-In</option>
              <option value="checked_out">Checked-Out</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <div className="flex items-center gap-1 text-slate-400 ml-1">
              Payment Status:
            </div>
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Payments</option>
              <option value="paid_in_full">Paid in Full</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="payment_pending">Payment Pending</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 overflow-x-auto shadow-xl">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 font-semibold bg-slate-900/60">
              <th className="py-3 px-4">Booking Ref</th>
              <th className="py-3 px-4">Customer Details</th>
              <th className="py-3 px-4">Room & Type</th>
              <th className="py-3 px-4">Stay Dates</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Tariff</th>
              <th className="py-3 px-4 text-right">Paid</th>
              <th className="py-3 px-4 text-right">Due Balance</th>
              <th className="py-3 px-4 text-center">Payment Status</th>
              <th className="py-3 px-4 text-right">Action Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {displayBookings.map(booking => {
              const room = filteredRooms.find(r => r.id === booking.roomId);

              return (
                <tr key={booking.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-amber-400">
                    {booking.id.toUpperCase()}
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-bold text-white text-sm">{booking.customer.fullName}</p>
                    <p className="text-slate-400 text-[11px]">{booking.customer.mobileNumber}</p>
                    <p className="text-[10px] text-slate-500">
                      {booking.customer.idProofType.toUpperCase()}: {booking.customer.idProofNumber}
                    </p>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-bold text-white block">
                      Room {room?.roomNumber || 'N/A'}
                    </span>
                    <span className="text-[11px] text-slate-400 capitalize">
                      {room?.roomType} • {room?.isAC ? 'AC' : 'Non-AC'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-300">
                    <p className="font-semibold text-white">{booking.checkInDate} → {booking.checkOutDate}</p>
                    <p className="text-[11px] text-slate-400">{booking.nights} {booking.nights === 1 ? 'Night' : 'Nights'}</p>
                  </td>

                  <td className="py-3 px-4 text-center">
                    {getStatusBadge(booking.status)}
                  </td>

                  <td className="py-3 px-4 text-right font-medium text-slate-200">
                    {currency}{booking.finalPayableAmount.toLocaleString()}
                  </td>

                  <td className="py-3 px-4 text-right font-bold text-emerald-400">
                    {currency}{booking.totalAmountReceived.toLocaleString()}
                  </td>

                  <td className="py-3 px-4 text-right font-extrabold">
                    <span className={booking.remainingBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                      {currency}{booking.remainingBalance.toLocaleString()}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    {getPaymentBadge(booking.paymentStatus)}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Check-in button */}
                      {booking.status === 'reserved' && (
                        <button
                          onClick={() => onCheckIn(booking)}
                          className="px-2 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-[11px] transition-all flex items-center gap-1 shadow-sm"
                          title="Check-In Guest"
                        >
                          <LogIn className="w-3 h-3 stroke-[2.5]" /> In
                        </button>
                      )}

                      {/* Check-out button */}
                      {booking.status === 'checked_in' && (
                        <button
                          onClick={() => onCheckOut(booking)}
                          className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] transition-all flex items-center gap-1 shadow-sm"
                          title="Check-Out Guest & Settle Balance"
                        >
                          <LogOut className="w-3 h-3 stroke-[2.5]" /> Out
                        </button>
                      )}

                      {/* Add payment */}
                      {booking.status !== 'cancelled' && booking.remainingBalance > 0 && (
                        <button
                          onClick={() => onAddPayment(booking)}
                          className="p-1.5 bg-slate-900 hover:bg-slate-700 text-emerald-400 rounded-lg border border-slate-700"
                          title="Record Payment"
                        >
                          <IndianRupee className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Add extra service charge */}
                      {booking.status !== 'cancelled' && booking.status !== 'checked_out' && (
                        <button
                          onClick={() => onAddExtraCharge(booking)}
                          className="p-1.5 bg-slate-900 hover:bg-slate-700 text-cyan-400 rounded-lg border border-slate-700"
                          title="Add Service / Dining Charge"
                        >
                          <Utensils className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Preview Bill (👁) */}
                      <button
                        onClick={() => onViewInvoice(booking)}
                        className="p-1.5 bg-slate-900 hover:bg-slate-700 text-amber-400 hover:text-white rounded-lg border border-slate-700 transition-colors"
                        title="Preview Bill & Folio (👁)"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                      </button>

                      {/* Edit booking */}
                      {booking.status !== 'cancelled' && (
                        <button
                          onClick={() => onEditBooking(booking)}
                          className="p-1.5 bg-slate-900 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700"
                          title="Edit Booking"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Cancel booking */}
                      {booking.status === 'reserved' && (
                        <button
                          onClick={() => onCancelBooking(booking)}
                          className="p-1.5 bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700"
                          title="Cancel Booking"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Delete booking */}
                      <button
                        onClick={() => setBookingToDelete(booking)}
                        className="p-1.5 bg-slate-900 hover:bg-rose-950/70 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition-colors"
                        title="Delete Booking Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {displayBookings.length === 0 && (
        <div className="p-12 text-center bg-slate-800/40 rounded-2xl border border-slate-700 text-slate-400">
          <p className="font-bold text-white">No bookings match the selected search or filters.</p>
        </div>
      )}

      {/* Confirmation Dialog to Prevent Accidental Data Loss */}
      <ConfirmDeleteModal
        isOpen={!!bookingToDelete}
        title="Delete Booking Record"
        itemName={bookingToDelete ? `Booking #${bookingToDelete.id.slice(-6).toUpperCase()} • ${bookingToDelete.customer.fullName}` : undefined}
        message={`Are you sure you want to permanently delete this booking for ${bookingToDelete?.customer.fullName}? This will remove it from the reservation list, calendars, and guest rosters. Note: This action cannot be undone.`}
        confirmLabel="Delete Booking"
        isDeleting={isDeletingBooking}
        onConfirm={() => {
          if (bookingToDelete) {
            setIsDeletingBooking(true);
            const res = deleteBooking(bookingToDelete.id);
            setIsDeletingBooking(false);
            if (res.success) {
              setBookingToDelete(null);
            }
          }
        }}
        onCancel={() => setBookingToDelete(null)}
      />
    </div>
  );
};

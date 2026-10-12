import React, { useState, useMemo } from 'react';
import { useHotel } from '../context/HotelContext';
import { Booking, PaymentStatus, PaymentMethod } from '../types/hotel';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  CreditCard,
  Search,
  Filter,
  Plus,
  Eye,
  IndianRupee,
  Utensils,
  Tag,
  CheckCircle2,
  Clock,
  AlertTriangle,
  History,
  FileText,
  Printer,
  TrendingUp,
  Trash2,
} from 'lucide-react';

interface PaymentsLedgerViewProps {
  onAddPayment: (booking: Booking) => void;
  onAddExtraCharge: (booking: Booking) => void;
  onViewInvoice: (booking: Booking) => void;
  initialStatusFilter?: string;
}

export const PaymentsLedgerView: React.FC<PaymentsLedgerViewProps> = ({
  onAddPayment,
  onAddExtraCharge,
  onViewInvoice,
  initialStatusFilter = 'all',
}) => {
  const {
    filteredBookings,
    filteredRooms,
    activeHotel,
    deletePaymentTransaction,
    deleteExtraChargeFromBooking,
  } = useHotel();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);

  React.useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [deletePaymentTarget, setDeletePaymentTarget] = useState<{ bookingId: string; paymentId: string; amount: number; ref: string } | null>(null);
  const [deleteChargeTarget, setDeleteChargeTarget] = useState<{ bookingId: string; chargeId: string; title: string; amount: number } | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  const currency = activeHotel?.currency || '₹';

  // Overall financial summary
  const totalInvoiced = filteredBookings.reduce((sum, b) => {
    if (b.status === 'cancelled') return sum;
    return sum + b.finalPayableAmount;
  }, 0);

  const totalCollected = filteredBookings.reduce((sum, b) => {
    return sum + b.totalAmountReceived;
  }, 0);

  const totalOutstanding = filteredBookings.reduce((sum, b) => {
    if (b.status === 'cancelled') return sum;
    return sum + b.remainingBalance;
  }, 0);

  const paymentPendingCount = filteredBookings.filter(
    b => b.status !== 'cancelled' && b.remainingBalance > 0
  ).length;

  // Filtered
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

      if (statusFilter !== 'all' && b.paymentStatus !== statusFilter) return false;

      return true;
    });
  }, [filteredBookings, filteredRooms, searchTerm, statusFilter]);

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'paid_in_full':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Paid in Full
          </span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> Partially Paid
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-700 text-slate-300">
            Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> Payment Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-500" />
            Customer Payments, Pending Balances & Accounts Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Maintains individual accounts for each booking. Track room tariffs, dining add-ons, discounts, and immutable partial payment receipts.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80">
          <span className="text-xs text-slate-400 font-medium block mb-1">Total Billable Final Tariff</span>
          <p className="text-2xl font-black text-white">{currency}{totalInvoiced.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-1">Sum of room charges & services</p>
        </div>

        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80">
          <span className="text-xs text-slate-400 font-medium block mb-1">Total Collections Received</span>
          <p className="text-2xl font-black text-emerald-400">{currency}{totalCollected.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-1">Verified payments recorded</p>
        </div>

        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80">
          <span className="text-xs text-slate-400 font-medium block mb-1">Total Outstanding / Due</span>
          <p className="text-2xl font-black text-rose-400">{currency}{totalOutstanding.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-1">Across all unfinalized folios</p>
        </div>

        <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80">
          <span className="text-xs text-slate-400 font-medium block mb-1">Pending Balance Folios</span>
          <p className="text-2xl font-black text-amber-400">{paymentPendingCount} Stays</p>
          <p className="text-[11px] text-slate-400 mt-1">Require settlement at front desk</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name, mobile, booking ref, or room..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Payment Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Payment Accounts</option>
              <option value="paid_in_full">Paid in Full Only</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="payment_pending">Payment Pending</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Folios List */}
      <div className="space-y-4">
        {displayBookings.map(booking => {
          const room = filteredRooms.find(r => r.id === booking.roomId);
          const isExpanded = expandedBookingId === booking.id;

          return (
            <div
              key={booking.id}
              className="bg-slate-800/80 rounded-2xl border border-slate-700/80 overflow-hidden transition-all shadow-md"
            >
              {/* Main Ledger Row */}
              <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
                {/* Guest & Room */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-base">
                      {booking.customer.fullName}
                    </span>
                    <span className="font-mono text-[11px] bg-slate-900 text-amber-400 font-bold px-2 py-0.5 rounded border border-slate-700">
                      Room {room?.roomNumber || 'N/A'}
                    </span>
                    {getStatusBadge(booking.paymentStatus)}
                  </div>
                  <p className="text-slate-400">
                    Phone: {booking.customer.mobileNumber} • Stay: {booking.checkInDate} to {booking.checkOutDate} ({booking.nights} nights)
                  </p>
                </div>

                {/* Financial Pillars */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-700/60 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Room Charges</span>
                    <span className="font-bold text-slate-200">{currency}{booking.totalRoomCharges.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Extra Services</span>
                    <span className="font-bold text-slate-200">
                      +{currency}{booking.extraCharges.reduce((s, c) => s + c.amount, 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Total Paid</span>
                    <span className="font-extrabold text-emerald-400">{currency}{booking.totalAmountReceived.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Remaining Due</span>
                    <span className={`text-sm font-black ${booking.remainingBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {currency}{booking.remainingBalance.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {booking.status !== 'cancelled' && (
                    <>
                      <button
                        onClick={() => onAddPayment(booking)}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all flex items-center gap-1 shadow-sm"
                      >
                        <IndianRupee className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Add Payment</span>
                      </button>

                      <button
                        onClick={() => onAddExtraCharge(booking)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 rounded-xl font-semibold transition-all flex items-center gap-1"
                        title="Add Food / Laundry charge"
                      >
                        <Utensils className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Add Service</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => onViewInvoice(booking)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 hover:text-white rounded-xl font-semibold transition-all flex items-center gap-1 shadow-sm"
                    title="Preview Bill Folio (👁)"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>Preview Bill</span>
                  </button>

                  <button
                    onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                    className="p-1.5 bg-slate-900 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700"
                    title="Toggle transaction history breakdown"
                  >
                    <History className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Collapsible Detailed Ledger Breakdown */}
              {isExpanded && (
                <div className="bg-slate-900/90 border-t border-slate-700/80 p-5 space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Charges breakdown */}
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                        Charges Breakdown
                      </h4>
                      <div className="p-3 bg-slate-800/60 rounded-xl space-y-1.5 border border-slate-700/60">
                        <div className="flex justify-between text-slate-300">
                          <span>Base Room Tariff ({booking.nights} nights @ {currency}{booking.roomPricePerNight}):</span>
                          <span className="font-semibold">{currency}{(booking.nights * booking.roomPricePerNight).toLocaleString()}</span>
                        </div>
                        {booking.extraBeds > 0 && (
                          <div className="flex justify-between text-slate-300">
                            <span>Extra Bed Charges ({booking.extraBeds} bed):</span>
                            <span className="font-semibold">{currency}{(booking.extraBeds * 800 * booking.nights).toLocaleString()}</span>
                          </div>
                        )}
                        {booking.extraCharges.map(c => (
                          <div key={c.id} className="flex justify-between items-center text-slate-400 group">
                            <span>{c.title} ({c.category}):</span>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-200">{currency}{c.amount.toLocaleString()}</span>
                              <button
                                onClick={() => setDeleteChargeTarget({ bookingId: booking.id, chargeId: c.id, title: c.title, amount: c.amount })}
                                className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-700/60 rounded transition-colors"
                                title="Delete extra service charge"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {booking.discount > 0 && (
                          <div className="flex justify-between text-emerald-400 pt-1 border-t border-slate-700">
                            <span>Discount {booking.discountReason ? `(${booking.discountReason})` : ''}:</span>
                            <span className="font-semibold">-{currency}{booking.discount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-bold text-white pt-1.5 border-t border-slate-700">
                          <span>Final Payable Amount:</span>
                          <span className="text-amber-400 font-extrabold">{currency}{booking.finalPayableAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Payment Transactions Ledger (Immutable) */}
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center justify-between">
                        <span>Payment Transactions Ledger</span>
                        <span className="text-slate-400 font-normal">Audited ledger</span>
                      </h4>

                      {booking.payments.length === 0 ? (
                        <p className="p-3 bg-slate-800/40 rounded-xl text-slate-500 italic">
                          No payments recorded yet.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {booking.payments.map((p, idx) => (
                            <div
                              key={p.id}
                              className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between"
                            >
                              <div>
                                <span className="font-bold uppercase text-white mr-1.5">
                                  #{idx + 1} {p.method.replace('_', ' ')}
                                </span>
                                <span className="text-slate-400 font-mono text-[11px]">
                                  Ref: {p.referenceNo}
                                </span>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {new Date(p.date).toLocaleString()} • Rec: {p.recordedBy}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-emerald-400 text-sm">
                                  +{currency}{p.amount.toLocaleString()}
                                </span>
                                <button
                                  onClick={() => setDeletePaymentTarget({ bookingId: booking.id, paymentId: p.id, amount: p.amount, ref: p.referenceNo })}
                                  className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-700/60 rounded transition-colors"
                                  title="Void / Delete payment transaction"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {displayBookings.length === 0 && (
        <div className="p-12 text-center bg-slate-800/40 rounded-2xl border border-slate-700 text-slate-400">
          <p className="font-bold text-white">No payment accounts match the search or filter.</p>
        </div>
      )}

      {/* Confirmation Dialog: Delete Payment Transaction */}
      <ConfirmDeleteModal
        isOpen={!!deletePaymentTarget}
        title="Void Payment Transaction"
        itemName={deletePaymentTarget ? `Payment: ${currency}${deletePaymentTarget.amount.toLocaleString()} (Ref: ${deletePaymentTarget.ref})` : undefined}
        message="Are you sure you want to void and remove this payment transaction? The booking balance due and payment status will be updated immediately in real time."
        confirmLabel="Void Payment"
        isDeleting={isDeletingItem}
        onConfirm={() => {
          if (deletePaymentTarget) {
            setIsDeletingItem(true);
            deletePaymentTransaction(deletePaymentTarget.bookingId, deletePaymentTarget.paymentId);
            setIsDeletingItem(false);
            setDeletePaymentTarget(null);
          }
        }}
        onCancel={() => setDeletePaymentTarget(null)}
      />

      {/* Confirmation Dialog: Delete Extra Charge */}
      <ConfirmDeleteModal
        isOpen={!!deleteChargeTarget}
        title="Delete Extra Service Charge"
        itemName={deleteChargeTarget ? `${deleteChargeTarget.title} • ${currency}${deleteChargeTarget.amount.toLocaleString()}` : undefined}
        message="Are you sure you want to remove this service charge? The total invoice amount and remaining balance will recalculate in real time."
        confirmLabel="Delete Charge"
        isDeleting={isDeletingItem}
        onConfirm={() => {
          if (deleteChargeTarget) {
            setIsDeletingItem(true);
            deleteExtraChargeFromBooking(deleteChargeTarget.bookingId, deleteChargeTarget.chargeId);
            setIsDeletingItem(false);
            setDeleteChargeTarget(null);
          }
        }}
        onCancel={() => setDeleteChargeTarget(null)}
      />
    </div>
  );
};

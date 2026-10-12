import React, { useState } from 'react';
import { useHotel } from '../context/HotelContext';
import { Booking, PaymentMethod } from '../types/hotel';
import { CreditCard, X, Check, IndianRupee, AlertCircle, History } from 'lucide-react';

interface AddPaymentModalProps {
  booking: Booking;
  onClose: () => void;
}

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ booking, onClose }) => {
  const { addPaymentTransaction, activeHotel, rooms } = useHotel();
  const room = rooms.find(r => r.id === booking.roomId);

  const [amount, setAmount] = useState<number>(booking.remainingBalance > 0 ? booking.remainingBalance : 0);
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const currency = activeHotel?.currency || '₹';

  const handleSettleFull = () => {
    setAmount(booking.remainingBalance);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amount <= 0) {
      setError('Payment amount must be greater than zero.');
      return;
    }

    const res = addPaymentTransaction(
      booking.id,
      Number(amount),
      method,
      referenceNo || `${method.toUpperCase()}-${Date.now().toString().slice(-6)}`,
      notes
    );

    if (!res.success) {
      setError(res.error || 'Failed to record payment.');
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700/80">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-white">Record Customer Payment</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Booking Summary Box */}
          <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-white text-sm">{booking.customer.fullName}</p>
                <p className="text-slate-400">
                  Room {room?.roomNumber || 'N/A'} • Stay: {booking.checkInDate} to {booking.checkOutDate}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                booking.paymentStatus === 'paid_in_full' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {booking.paymentStatus.replace('_', ' ')}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-700/60 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Final Payable</p>
                <p className="font-bold text-slate-200">{currency}{booking.finalPayableAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Received So Far</p>
                <p className="font-bold text-emerald-400">{currency}{booking.totalAmountReceived.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Remaining Due</p>
                <p className="font-extrabold text-rose-400">{currency}{booking.remainingBalance.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Amount input */}
          <div className="text-xs space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-medium">Payment Amount ({currency}) *</label>
              {booking.remainingBalance > 0 && (
                <button
                  type="button"
                  onClick={handleSettleFull}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold underline"
                >
                  Pay Full Balance ({currency}{booking.remainingBalance})
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold">{currency}</span>
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          {/* Method selector */}
          <div className="text-xs space-y-1">
            <label className="text-slate-300 font-medium">Payment Method *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'cash', label: 'Cash' },
                { id: 'upi', label: 'UPI / QR' },
                { id: 'card', label: 'Card (POS)' },
                { id: 'bank_transfer', label: 'Bank / NEFT' },
              ].map(item => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setMethod(item.id as PaymentMethod)}
                  className={`p-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                    method === item.id
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reference No */}
          <div className="text-xs space-y-1">
            <label className="text-slate-300 font-medium">Transaction Reference / Receipt No</label>
            <input
              type="text"
              placeholder="e.g. UPI/3948201849 or Card Slip #4491"
              value={referenceNo}
              onChange={e => setReferenceNo(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Notes */}
          <div className="text-xs space-y-1">
            <label className="text-slate-300 font-medium">Internal Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Paid at front desk counter"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Past Payments Preview */}
          {booking.payments.length > 0 && (
            <div className="pt-2 border-t border-slate-800 text-xs text-slate-400">
              <span className="font-semibold text-slate-300 flex items-center gap-1 mb-1">
                <History className="w-3.5 h-3.5" /> Previous Payments ({booking.payments.length}):
              </span>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {booking.payments.map((p, idx) => (
                  <div key={p.id} className="flex justify-between text-[11px] bg-slate-800/40 px-2 py-1 rounded">
                    <span>
                      #{idx + 1} {p.method.toUpperCase()} ({p.referenceNo})
                    </span>
                    <span className="font-bold text-emerald-400">+{currency}{p.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 shadow-md transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" /> Record Payment Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

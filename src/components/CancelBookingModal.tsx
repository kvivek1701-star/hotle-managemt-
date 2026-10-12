import React, { useState } from 'react';
import { useHotel } from '../context/HotelContext';
import { Booking } from '../types/hotel';
import { AlertTriangle, X, Check } from 'lucide-react';

interface CancelBookingModalProps {
  booking: Booking;
  onClose: () => void;
}

export const CancelBookingModal: React.FC<CancelBookingModalProps> = ({ booking, onClose }) => {
  const { cancelBooking, activeHotel } = useHotel();
  const [fee, setFee] = useState<number>(0);
  const [refund, setRefund] = useState<number>(
    Math.max(0, booking.totalAmountReceived - 0)
  );
  const [reason, setReason] = useState<string>('');

  const currency = activeHotel?.currency || '₹';

  const handleFeeChange = (val: number) => {
    setFee(val);
    setRefund(Math.max(0, booking.totalAmountReceived - val));
  };

  const handleConfirm = () => {
    cancelBooking(booking.id, fee, refund, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-rose-950/40 border-b border-rose-900/60">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <h3 className="text-base font-bold text-white">Cancel Reservation</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-300">
            Are you sure you want to cancel the booking for <strong className="text-white">{booking.customer.fullName}</strong>?
            This will release the room back to available inventory.
          </p>

          <div className="p-3 bg-slate-800 rounded-xl space-y-1.5 border border-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Booking Tariff:</span>
              <span className="font-semibold text-white">{currency}{booking.finalPayableAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Advance Paid by Guest:</span>
              <span className="font-semibold text-emerald-400">{currency}{booking.totalAmountReceived.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Cancellation Charge / Fee ({currency})</label>
            <input
              type="number"
              min="0"
              max={booking.totalAmountReceived}
              value={fee}
              onChange={e => handleFeeChange(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Calculated Refund to Customer ({currency})</label>
            <input
              type="number"
              value={refund}
              readOnly
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-extrabold focus:outline-none cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Cancellation Reason</label>
            <input
              type="text"
              placeholder="e.g. Guest travel plan cancelled due to emergency"
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" /> Confirm Cancellation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

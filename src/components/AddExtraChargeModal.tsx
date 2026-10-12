import React, { useState } from 'react';
import { useHotel } from '../context/HotelContext';
import { Booking } from '../types/hotel';
import { Utensils, X, Check, AlertCircle } from 'lucide-react';

interface AddExtraChargeModalProps {
  booking: Booking;
  onClose: () => void;
}

export const AddExtraChargeModal: React.FC<AddExtraChargeModalProps> = ({ booking, onClose }) => {
  const { addExtraChargeToBooking, activeHotel } = useHotel();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'food' | 'laundry' | 'extra_bed' | 'minibar' | 'room_service' | 'other'>('food');
  const [amount, setAmount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const currency = activeHotel?.currency || '₹';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a charge description / title.');
      return;
    }
    if (amount <= 0) {
      setError('Charge amount must be greater than zero.');
      return;
    }

    const res = addExtraChargeToBooking(booking.id, {
      title: title.trim(),
      category,
      amount: Number(amount),
    });

    if (!res.success) {
      setError(res.error || 'Failed to add charge.');
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700/80">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-white">Add Service / Extra Charge</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <span className="text-slate-400">Guest:</span>
            <p className="text-sm font-bold text-white">{booking.customer.fullName}</p>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Service Category *</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="food">Food & Dining / Restaurant</option>
              <option value="room_service">Room Service</option>
              <option value="laundry">Laundry & Dry Cleaning</option>
              <option value="minibar">Mini Bar / Beverages</option>
              <option value="extra_bed">Extra Bed / Linen</option>
              <option value="other">Airport Transfer / Miscellaneous</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Item Title / Description *</label>
            <input
              type="text"
              placeholder="e.g. In-Room Buffet Dinner (2 Guests)"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Amount ({currency}) *</label>
            <input
              type="number"
              min="1"
              step="any"
              placeholder="0"
              value={amount || ''}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" /> Add to Folio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useHotel } from '../context/HotelContext';
import { Booking, Room, IdProofType, PaymentMethod } from '../types/hotel';
import { VisualRoomSelector } from './VisualRoomSelector';
import { X, Calendar, User, CreditCard, Bed, Check, AlertCircle, FileText, Sparkles } from 'lucide-react';

interface BookingModalProps {
  initialBooking?: Booking | null;
  defaultRoomId?: string;
  defaultDate?: string;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  initialBooking,
  defaultRoomId,
  defaultDate,
  onClose,
}) => {
  const {
    activeHotel,
    hotels,
    selectedHotelId,
    rooms,
    createBooking,
    updateBooking,
    currentUser,
  } = useHotel();

  // Selected hotel target
  const effectiveHotelId = initialBooking?.hotelId || (selectedHotelId !== 'all' ? selectedHotelId : hotels[0]?.id || 'hotel-1');
  const targetHotel = hotels.find(h => h.id === effectiveHotelId) || activeHotel || hotels[0];

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  // Form State
  const [customerName, setCustomerName] = useState(initialBooking?.customer.fullName || '');
  const [mobileNumber, setMobileNumber] = useState(initialBooking?.customer.mobileNumber || '');
  const [email, setEmail] = useState(initialBooking?.customer.email || '');
  const [idProofType, setIdProofType] = useState<IdProofType>(initialBooking?.customer.idProofType || 'national_id');
  const [idProofNumber, setIdProofNumber] = useState(initialBooking?.customer.idProofNumber || '');
  const [address, setAddress] = useState(initialBooking?.customer.address || '');

  const [checkInDate, setCheckInDate] = useState(initialBooking?.checkInDate || defaultDate || todayStr);
  const [checkInTime, setCheckInTime] = useState(initialBooking?.checkInTime || targetHotel.checkInTimeDefault || '14:00');
  const [checkOutDate, setCheckOutDate] = useState(initialBooking?.checkOutDate || tomorrowStr);
  const [checkOutTime, setCheckOutTime] = useState(initialBooking?.checkOutTime || targetHotel.checkOutTimeDefault || '11:00');

  const [adults, setAdults] = useState(initialBooking?.guestsCount.adults || 2);
  const [children, setChildren] = useState(initialBooking?.guestsCount.children || 0);
  const [extraBeds, setExtraBeds] = useState(initialBooking?.extraBeds || 0);

  const [selectedRoomId, setSelectedRoomId] = useState<string>(initialBooking?.roomId || defaultRoomId || '');
  const [discount, setDiscount] = useState<number>(initialBooking?.discount || 0);
  const [discountReason, setDiscountReason] = useState(initialBooking?.discountReason || '');
  const [specialRequests, setSpecialRequests] = useState(initialBooking?.specialRequests || '');

  // Advance Payment
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [advanceMethod, setAdvanceMethod] = useState<PaymentMethod>('upi');
  const [advanceRef, setAdvanceRef] = useState<string>('');
  const [markCheckedInNow, setMarkCheckedInNow] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected Room Object
  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  // Calculate nights
  const nights = React.useMemo(() => {
    if (!checkInDate || !checkOutDate) return 1;
    const start = new Date(checkInDate).getTime();
    const end = new Date(checkOutDate).getTime();
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  }, [checkInDate, checkOutDate]);

  // Rates calculation
  const roomRate = selectedRoom?.pricePerNight || 0;
  const extraBedTotal = (selectedRoom?.extraBedCharge || 800) * extraBeds * nights;
  const roomTariffTotal = roomRate * nights + extraBedTotal;
  const finalPayable = Math.max(0, roomTariffTotal - (discount || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim()) {
      setErrorMessage('Please provide customer full name.');
      return;
    }
    if (!mobileNumber.trim()) {
      setErrorMessage('Please provide customer mobile number.');
      return;
    }
    if (!idProofNumber.trim()) {
      setErrorMessage('Please provide customer ID proof number.');
      return;
    }
    if (!selectedRoomId) {
      setErrorMessage('Please select an available room from the visual room picker.');
      return;
    }

    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      setErrorMessage('Check-out date must be strictly after Check-in date.');
      return;
    }

    if (initialBooking) {
      // Edit mode
      const result = updateBooking(initialBooking.id, {
        roomId: selectedRoomId,
        customer: {
          fullName: customerName.trim(),
          mobileNumber: mobileNumber.trim(),
          email: email.trim() || undefined,
          idProofType,
          idProofNumber: idProofNumber.trim(),
          address: address.trim() || undefined,
        },
        checkInDate,
        checkInTime,
        checkOutDate,
        checkOutTime,
        guestsCount: { adults: Number(adults), children: Number(children) },
        extraBeds: Number(extraBeds),
        roomPricePerNight: roomRate,
        discount: Number(discount || 0),
        discountReason,
        specialRequests,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to update booking.');
        return;
      }
    } else {
      // Create mode
      const result = createBooking({
        hotelId: effectiveHotelId,
        roomId: selectedRoomId,
        customer: {
          fullName: customerName.trim(),
          mobileNumber: mobileNumber.trim(),
          email: email.trim() || undefined,
          idProofType,
          idProofNumber: idProofNumber.trim(),
          address: address.trim() || undefined,
        },
        checkInDate,
        checkInTime,
        checkOutDate,
        checkOutTime,
        adults: Number(adults),
        children: Number(children),
        extraBeds: Number(extraBeds),
        roomPricePerNight: roomRate,
        discount: Number(discount || 0),
        discountReason,
        advancePaymentAmount: Number(advanceAmount || 0),
        advancePaymentMethod: advanceMethod,
        advancePaymentReference: advanceRef,
        specialRequests,
        markCheckedInNow,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to create booking.');
        return;
      }
    }

    onClose();
  };

  const currency = targetHotel.currency || '₹';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700/80">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              {initialBooking ? 'Edit Booking Reservation' : 'New Guest Reservation & Booking'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Property: <span className="font-semibold text-slate-200">{targetHotel.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Dates & Duration */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> 1. Stay Schedule & Timing
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Check-in Date *</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={e => setCheckInDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Check-in Time</label>
                <input
                  type="time"
                  value={checkInTime}
                  onChange={e => setCheckInTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Check-out Date *</label>
                <input
                  type="date"
                  value={checkOutDate}
                  min={checkInDate}
                  onChange={e => setCheckOutDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Check-out Time</label>
                <input
                  type="time"
                  value={checkOutTime}
                  onChange={e => setCheckOutTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Calculated Stay Duration: <span className="font-bold text-white">{nights} {nights === 1 ? 'Night' : 'Nights'}</span>
              </span>
              {!initialBooking && checkInDate === todayStr && (
                <label className="inline-flex items-center gap-2 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                  <input
                    type="checkbox"
                    checked={markCheckedInNow}
                    onChange={e => setMarkCheckedInNow(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-slate-200 font-medium">Direct Express Check-in Now</span>
                </label>
              )}
            </div>
          </div>

          {/* Section 2: Visual Room Selector */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Bed className="w-4 h-4" /> 2. Select Room (Visual Grid & Conflict Detection)
              </h4>
              {selectedRoom && (
                <div className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Selected: Room {selectedRoom.roomNumber} ({selectedRoom.roomType.toUpperCase()} - {currency}{selectedRoom.pricePerNight}/night)
                </div>
              )}
            </div>

            <VisualRoomSelector
              hotelId={effectiveHotelId}
              checkInDate={checkInDate}
              checkOutDate={checkOutDate}
              selectedRoomId={selectedRoomId}
              onSelectRoom={room => setSelectedRoomId(room.id)}
              excludeBookingId={initialBooking?.id}
            />
          </div>

          {/* Section 3: Customer Details */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
              <User className="w-4 h-4" /> 3. Guest Profile & ID Verification
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Customer Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Sharma"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Mobile Number *</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={mobileNumber}
                  onChange={e => setMobileNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. guest@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">ID Proof Type *</label>
                <select
                  value={idProofType}
                  onChange={e => setIdProofType(e.target.value as IdProofType)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="national_id">National ID / Aadhaar</option>
                  <option value="passport">Passport</option>
                  <option value="driving_license">Driving License</option>
                  <option value="voter_id">Voter ID</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">ID Proof Number / Ref *</label>
                <input
                  type="text"
                  placeholder="e.g. AADHAAR 1234-5678-9012"
                  value={idProofNumber}
                  onChange={e => setIdProofNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">City / Address</label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai, Maharashtra"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Guests count */}
            <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-700/60 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Adults</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={adults}
                  onChange={e => setAdults(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Children</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={children}
                  onChange={e => setChildren(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Extra Beds</label>
                <input
                  type="number"
                  min="0"
                  max="3"
                  value={extraBeds}
                  onChange={e => setExtraBeds(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Billing & Financials */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" /> 4. Pricing, Discounts & Advance Payment
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Discount inputs */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Discount Amount ({currency})</label>
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={e => setDiscount(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Discount Reason</label>
                    <input
                      type="text"
                      placeholder="e.g. Corporate Rate"
                      value={discountReason}
                      onChange={e => setDiscountReason(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Special Requests / Preferences</label>
                  <input
                    type="text"
                    placeholder="e.g. Quiet room away from elevator, feather pillows"
                    value={specialRequests}
                    onChange={e => setSpecialRequests(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Price Calculation Card */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/80 space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Room Tariff ({nights} nights @ {currency}{roomRate}):</span>
                  <span className="font-medium text-slate-200">{currency}{(roomRate * nights).toLocaleString()}</span>
                </div>
                {extraBedTotal > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Extra Bed Charges ({extraBeds} bed x {nights} nights):</span>
                    <span className="font-medium text-slate-200">+{currency}{extraBedTotal.toLocaleString()}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount:</span>
                    <span className="font-medium">-{currency}{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-700 text-white">
                  <span>Final Payable Amount:</span>
                  <span className="text-amber-400 text-base font-extrabold">{currency}{finalPayable.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Advance payment inputs (for new booking) */}
            {!initialBooking && (
              <div className="mt-4 pt-3 border-t border-slate-700/60">
                <span className="text-xs font-semibold text-slate-300 block mb-2">
                  Collect Advance Payment (Optional):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Advance Amount ({currency})</label>
                    <input
                      type="number"
                      min="0"
                      max={finalPayable}
                      placeholder="0"
                      value={advanceAmount || ''}
                      onChange={e => setAdvanceAmount(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Payment Method</label>
                    <select
                      value={advanceMethod}
                      onChange={e => setAdvanceMethod(e.target.value as PaymentMethod)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                      <option value="card">Card (Debit / Credit)</option>
                      <option value="bank_transfer">Bank Transfer / IMPS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Transaction Ref / Cheque No</label>
                    <input
                      type="text"
                      placeholder="e.g. UPI/10294827"
                      value={advanceRef}
                      onChange={e => setAdvanceRef(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              {initialBooking ? 'Save Changes' : markCheckedInNow ? 'Confirm & Check-in Guest' : 'Confirm Reservation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

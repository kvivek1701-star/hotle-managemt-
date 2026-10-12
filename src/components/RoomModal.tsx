import React, { useState } from 'react';
import { useHotel } from '../context/HotelContext';
import { Room, RoomType, RoomStatus } from '../types/hotel';
import { Bed, X, Check, Wind, AlertCircle } from 'lucide-react';

interface RoomModalProps {
  initialRoom?: Room | null;
  onClose: () => void;
}

const COMMON_FACILITIES = [
  'High-speed WiFi',
  'King Bed',
  'Twin Beds',
  'Smart TV',
  'City View',
  'Ocean View',
  'Balcony',
  'Air Conditioning',
  'Mini Bar',
  'Rain Shower',
  'Jacuzzi Bathtub',
  'Work Desk',
  'Espresso Machine',
  'Safe Box',
  'Room Service',
];

export const RoomModal: React.FC<RoomModalProps> = ({ initialRoom, onClose }) => {
  const { addRoom, updateRoom, activeHotel, selectedHotelId, hotels } = useHotel();

  const effectiveHotelId = initialRoom?.hotelId || (selectedHotelId !== 'all' ? selectedHotelId : hotels[0]?.id || 'hotel-1');
  const targetHotel = hotels.find(h => h.id === effectiveHotelId) || activeHotel || hotels[0];

  const [roomNumber, setRoomNumber] = useState(initialRoom?.roomNumber || '');
  const [floor, setFloor] = useState<number>(initialRoom?.floor || 1);
  const [roomType, setRoomType] = useState<RoomType>(initialRoom?.roomType || 'deluxe');
  const [isAC, setIsAC] = useState<boolean>(initialRoom?.isAC ?? true);
  const [bedsCount, setBedsCount] = useState<number>(initialRoom?.bedsCount || 1);
  const [maxGuests, setMaxGuests] = useState<number>(initialRoom?.maxGuests || 2);
  const [pricePerNight, setPricePerNight] = useState<number>(initialRoom?.pricePerNight || 3500);
  const [extraBedCharge, setExtraBedCharge] = useState<number>(initialRoom?.extraBedCharge || 700);
  const [facilities, setFacilities] = useState<string[]>(initialRoom?.facilities || ['High-speed WiFi', 'Smart TV', 'Air Conditioning']);
  const [photoUrl, setPhotoUrl] = useState(initialRoom?.photoUrl || '');
  const [currentStatus, setCurrentStatus] = useState<RoomStatus>(initialRoom?.currentStatus || 'available');
  const [notes, setNotes] = useState(initialRoom?.notes || '');
  const [error, setError] = useState<string | null>(null);

  const toggleFacility = (item: string) => {
    setFacilities(prev =>
      prev.includes(item) ? prev.filter(f => f !== item) : [...prev, item]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim()) {
      setError('Please provide a Room Number.');
      return;
    }
    if (pricePerNight <= 0) {
      setError('Price per night must be greater than zero.');
      return;
    }

    if (initialRoom) {
      updateRoom(initialRoom.id, {
        roomNumber: roomNumber.trim(),
        floor: Number(floor),
        roomType,
        isAC,
        bedsCount: Number(bedsCount),
        maxGuests: Number(maxGuests),
        pricePerNight: Number(pricePerNight),
        extraBedCharge: Number(extraBedCharge),
        facilities,
        photoUrl: photoUrl.trim() || undefined,
        currentStatus,
        notes: notes.trim() || undefined,
      });
    } else {
      addRoom({
        hotelId: effectiveHotelId,
        roomNumber: roomNumber.trim(),
        floor: Number(floor),
        roomType,
        isAC,
        bedsCount: Number(bedsCount),
        maxGuests: Number(maxGuests),
        pricePerNight: Number(pricePerNight),
        extraBedCharge: Number(extraBedCharge),
        facilities,
        photoUrl: photoUrl.trim() || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80',
        currentStatus,
        notes: notes.trim() || undefined,
      });
    }

    onClose();
  };

  const currency = targetHotel?.currency || '₹';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700/80">
          <div className="flex items-center gap-2">
            <Bed className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-white">
              {initialRoom ? `Edit Room ${initialRoom.roomNumber}` : 'Add New Hotel Room'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Room Number / ID *</label>
              <input
                type="text"
                placeholder="e.g. 101, 204, P-102"
                value={roomNumber}
                onChange={e => setRoomNumber(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Floor Number *</label>
              <input
                type="number"
                min="0"
                max="50"
                value={floor}
                onChange={e => setFloor(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Room Category *</label>
              <select
                value={roomType}
                onChange={e => setRoomType(e.target.value as RoomType)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="single">Single Room</option>
                <option value="double">Double Room</option>
                <option value="deluxe">Deluxe Room</option>
                <option value="family">Family Suite</option>
                <option value="suite">Executive Suite</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Climate Control</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAC(true)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-semibold ${
                    isAC ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  AC
                </button>
                <button
                  type="button"
                  onClick={() => setIsAC(false)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-semibold ${
                    !isAC ? 'bg-slate-700 border-slate-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Non-AC
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Number of Beds</label>
              <input
                type="number"
                min="1"
                max="6"
                value={bedsCount}
                onChange={e => setBedsCount(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Max Guests</label>
              <input
                type="number"
                min="1"
                max="10"
                value={maxGuests}
                onChange={e => setMaxGuests(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Status</label>
              <select
                value={currentStatus}
                onChange={e => setCurrentStatus(e.target.value as RoomStatus)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 capitalize"
              >
                <option value="available">Available</option>
                <option value="booked">Booked</option>
                <option value="occupied">Occupied</option>
                <option value="cleaning">Cleaning</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Base Price / Night ({currency}) *</label>
              <input
                type="number"
                min="100"
                value={pricePerNight}
                onChange={e => setPricePerNight(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Extra Bed Charge / Night ({currency})</label>
              <input
                type="number"
                min="0"
                value={extraBedCharge}
                onChange={e => setExtraBedCharge(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Photo Image URL</label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={photoUrl}
              onChange={e => setPhotoUrl(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-2">Room Amenities & Facilities</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COMMON_FACILITIES.map(fac => {
                const checked = facilities.includes(fac);
                return (
                  <button
                    type="button"
                    key={fac}
                    onClick={() => toggleFacility(fac)}
                    className={`p-2 rounded-lg text-left text-[11px] border transition-all flex items-center justify-between ${
                      checked
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-medium'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span>{fac}</span>
                    {checked && <Check className="w-3 h-3 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Housekeeping / Maintenance Notes</label>
            <input
              type="text"
              placeholder="e.g. Recently repainted, new mattress"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
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
              <Check className="w-4 h-4 stroke-[2.5]" />
              {initialRoom ? 'Update Room' : 'Add Room to Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

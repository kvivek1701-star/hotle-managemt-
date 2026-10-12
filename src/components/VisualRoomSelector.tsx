import React, { useState, useMemo } from 'react';
import { useHotel } from '../context/HotelContext';
import { Room, RoomType } from '../types/hotel';
import { Check, AlertCircle, Sparkles, Wind, Users, BedDouble, Layers } from 'lucide-react';

interface VisualRoomSelectorProps {
  hotelId: string;
  checkInDate: string;
  checkOutDate: string;
  selectedRoomId: string;
  onSelectRoom: (room: Room) => void;
  excludeBookingId?: string;
}

export const VisualRoomSelector: React.FC<VisualRoomSelectorProps> = ({
  hotelId,
  checkInDate,
  checkOutDate,
  selectedRoomId,
  onSelectRoom,
  excludeBookingId,
}) => {
  const { rooms, isRoomAvailable, activeHotel } = useHotel();
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [acFilter, setAcFilter] = useState<string>('all');

  const hotelRooms = useMemo(() => {
    return rooms.filter(r => r.hotelId === hotelId);
  }, [rooms, hotelId]);

  // Distinct floors
  const floors = useMemo(() => {
    const list = Array.from(new Set(hotelRooms.map(r => r.floor))).sort((a, b) => a - b);
    return list;
  }, [hotelRooms]);

  // Check availability for each room
  const roomAvailabilityMap = useMemo(() => {
    const map = new Map<string, { available: boolean; reason?: string }>();
    if (!checkInDate || !checkOutDate) {
      hotelRooms.forEach(r => {
        map.set(r.id, {
          available: r.currentStatus !== 'maintenance',
          reason: r.currentStatus === 'maintenance' ? 'Room under maintenance' : undefined,
        });
      });
      return map;
    }

    hotelRooms.forEach(r => {
      const res = isRoomAvailable(r.id, checkInDate, checkOutDate, excludeBookingId);
      map.set(r.id, res);
    });
    return map;
  }, [hotelRooms, checkInDate, checkOutDate, isRoomAvailable, excludeBookingId]);

  // Filtered rooms
  const displayRooms = useMemo(() => {
    return hotelRooms.filter(r => {
      if (floorFilter !== 'all' && r.floor !== Number(floorFilter)) return false;
      if (typeFilter !== 'all' && r.roomType !== typeFilter) return false;
      if (acFilter === 'ac' && !r.isAC) return false;
      if (acFilter === 'non-ac' && r.isAC) return false;
      return true;
    });
  }, [hotelRooms, floorFilter, typeFilter, acFilter]);

  const currency = activeHotel?.currency || '₹';

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> Floor:
          </span>
          <button
            type="button"
            onClick={() => setFloorFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              floorFilter === 'all'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Floors
          </button>
          {floors.map(floor => (
            <button
              type="button"
              key={floor}
              onClick={() => setFloorFilter(String(floor))}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                floorFilter === String(floor)
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Floor {floor}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 font-medium">Type:</span>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Types</option>
            <option value="single">Single</option>
            <option value="double">Double</option>
            <option value="deluxe">Deluxe</option>
            <option value="family">Family</option>
            <option value="suite">Suite</option>
          </select>

          <span className="text-slate-400 font-medium ml-1">Climate:</span>
          <select
            value={acFilter}
            onChange={e => setAcFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All</option>
            <option value="ac">AC Only</option>
            <option value="non-ac">Non-AC</option>
          </select>
        </div>
      </div>

      {/* Date Notice */}
      {(!checkInDate || !checkOutDate) && (
        <div className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/30 px-3 py-2 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Select check-in and check-out dates above to check live room availability for your dates.</span>
        </div>
      )}

      {/* Rooms Visual Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[380px] overflow-y-auto pr-1">
        {displayRooms.map(room => {
          const availInfo = roomAvailabilityMap.get(room.id) || { available: true };
          const isSelected = selectedRoomId === room.id;
          const isAvailable = availInfo.available;

          return (
            <div
              key={room.id}
              onClick={() => {
                if (isAvailable) {
                  onSelectRoom(room);
                }
              }}
              className={`relative group rounded-xl p-3 border transition-all text-left ${
                isSelected
                  ? 'bg-amber-500/15 border-amber-500 shadow-md shadow-amber-500/10 ring-2 ring-amber-500/40'
                  : isAvailable
                  ? 'bg-slate-800/60 border-slate-700 hover:border-slate-500 hover:bg-slate-800 cursor-pointer'
                  : 'bg-slate-900/60 border-rose-900/40 opacity-60 cursor-not-allowed'
              }`}
            >
              {/* Top Row: Room Number, Floor, Badges */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white tracking-tight">
                      Room {room.roomNumber}
                    </span>
                    <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                      Floor {room.floor}
                    </span>
                  </div>
                  <span className="text-xs capitalize font-medium text-amber-400">
                    {room.roomType} Room
                  </span>
                </div>

                {/* Status / Selected Indicator */}
                <div className="text-right">
                  {isSelected ? (
                    <span className="inline-flex items-center gap-1 bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                      <Check className="w-3 h-3 stroke-[3]" /> Selected
                    </span>
                  ) : isAvailable ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Available
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      Unavailable
                    </span>
                  )}
                </div>
              </div>

              {/* Specs & Features */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-300 my-2">
                <span className="flex items-center gap-1">
                  <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                  {room.bedsCount} {room.bedsCount === 1 ? 'Bed' : 'Beds'}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  Max {room.maxGuests}
                </span>
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  room.isAC ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' : 'bg-slate-700 text-slate-300'
                }`}>
                  <Wind className="w-2.5 h-2.5" />
                  {room.isAC ? 'AC' : 'Non-AC'}
                </span>
              </div>

              {/* Price Row */}
              <div className="flex items-baseline justify-between pt-2 border-t border-slate-700/50 mt-2">
                <div>
                  <span className="text-sm font-bold text-emerald-400">
                    {currency}{room.pricePerNight.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-1">/ night</span>
                </div>
                {room.extraBedCharge > 0 && (
                  <span className="text-[10px] text-slate-400">
                    +{currency}{room.extraBedCharge} extra bed
                  </span>
                )}
              </div>

              {/* Reason for Unavailability */}
              {!isAvailable && availInfo.reason && (
                <div className="mt-2 text-[11px] text-rose-400 bg-rose-950/40 border border-rose-800/40 rounded p-1.5 flex items-start gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>{availInfo.reason}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {displayRooms.length === 0 && (
        <div className="p-8 text-center text-slate-400 bg-slate-800/40 rounded-xl border border-slate-700">
          No rooms match the selected floor or climate filters.
        </div>
      )}
    </div>
  );
};

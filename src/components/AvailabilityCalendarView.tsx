import React, { useState, useMemo } from 'react';
import { useHotel } from '../context/HotelContext';
import { Room, Booking } from '../types/hotel';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Wind,
  Bed,
  CheckCircle2,
  Sparkles,
  Wrench,
  Layers,
} from 'lucide-react';

interface AvailabilityCalendarViewProps {
  onSelectSlot: (roomId: string, dateStr: string) => void;
  onViewBooking: (booking: Booking) => void;
}

export const AvailabilityCalendarView: React.FC<AvailabilityCalendarViewProps> = ({
  onSelectSlot,
  onViewBooking,
}) => {
  const { filteredRooms, filteredBookings, activeHotel } = useHotel();

  // Current view date (year and month)
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [acFilter, setAcFilter] = useState<string>('all');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Days in month
  const daysInMonth = useMemo(() => {
    const days: Date[] = [];
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [year, month]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Distinct floors
  const floors = useMemo(() => {
    return Array.from(new Set(filteredRooms.map(r => r.floor))).sort((a, b) => a - b);
  }, [filteredRooms]);

  // Filtered rooms
  const displayRooms = useMemo(() => {
    return filteredRooms.filter(r => {
      if (floorFilter !== 'all' && r.floor !== Number(floorFilter)) return false;
      if (typeFilter !== 'all' && r.roomType !== typeFilter) return false;
      if (acFilter === 'ac' && !r.isAC) return false;
      if (acFilter === 'non-ac' && r.isAC) return false;
      return true;
    });
  }, [filteredRooms, floorFilter, typeFilter, acFilter]);

  // Helper to find booking covering room and date
  const getBookingForSlot = (roomId: string, dateStr: string) => {
    const slotTime = new Date(dateStr).getTime();
    return filteredBookings.find(b => {
      if (b.roomId !== roomId) return false;
      if (b.status === 'cancelled') return false;
      const start = new Date(b.checkInDate).getTime();
      const end = new Date(b.checkOutDate).getTime();
      return slotTime >= start && slotTime < end;
    });
  };

  const currency = activeHotel?.currency || '₹';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-amber-500" />
            Room Availability Matrix & Booking Calendar
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Visual month timeline showing occupied, reserved, cleaning, and available inventory. Click any empty slot to book.
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-white px-2 min-w-[130px] text-center">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-[11px] font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg ml-1"
          >
            Today
          </button>
        </div>
      </div>

      {/* Legend & Filter Bar */}
      <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Color Legend */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-slate-400 font-semibold">Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/50" />
              <span className="text-slate-300 text-[11px]">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-indigo-600 text-white" />
              <span className="text-slate-300 text-[11px]">Occupied / Checked-In</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-600 text-white" />
              <span className="text-slate-300 text-[11px]">Reserved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500 text-slate-950 font-bold" />
              <span className="text-slate-300 text-[11px]">Cleaning</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-600 text-white" />
              <span className="text-slate-300 text-[11px]">Maintenance</span>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={floorFilter}
              onChange={e => setFloorFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-amber-500 text-[11px]"
            >
              <option value="all">All Floors</option>
              {floors.map(f => (
                <option key={f} value={f}>Floor {f}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-amber-500 text-[11px]"
            >
              <option value="all">All Types</option>
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="deluxe">Deluxe</option>
              <option value="family">Family</option>
              <option value="suite">Suite</option>
            </select>

            <select
              value={acFilter}
              onChange={e => setAcFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-amber-500 text-[11px]"
            >
              <option value="all">All Climates</option>
              <option value="ac">AC</option>
              <option value="non-ac">Non-AC</option>
            </select>
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            {/* Header: Dates */}
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-700 text-xs">
                <th className="sticky left-0 z-20 bg-slate-900 py-3 px-4 font-bold text-white min-w-[170px] border-r border-slate-700">
                  Room / Capacity
                </th>
                {daysInMonth.map(day => {
                  const dateStr = day.toISOString().split('T')[0];
                  const isToday = dateStr === todayStr;
                  const dayName = day.toLocaleDateString('en-US', { weekday: 'narrow' });
                  const dayNum = day.getDate();

                  return (
                    <th
                      key={dateStr}
                      className={`py-2 px-1 text-center min-w-[38px] border-r border-slate-800 ${
                        isToday ? 'bg-amber-500/15 border-amber-500/50' : ''
                      }`}
                    >
                      <span className="text-[10px] uppercase text-slate-400 block font-semibold">
                        {dayName}
                      </span>
                      <span className={`text-xs font-bold block ${
                        isToday ? 'text-amber-400 font-extrabold' : 'text-slate-200'
                      }`}>
                        {dayNum}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Body: Room Rows */}
            <tbody className="divide-y divide-slate-800 text-xs">
              {displayRooms.map(room => (
                <tr key={room.id} className="hover:bg-slate-800/30 transition-colors">
                  {/* Sticky Room Label */}
                  <td className="sticky left-0 z-10 bg-slate-900/95 py-2.5 px-4 font-semibold text-white border-r border-slate-700 min-w-[170px]">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-sm text-white block">
                          Room {room.roomNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize">
                          Floor {room.floor} • {room.roomType}
                        </span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        room.isAC ? 'bg-cyan-500/15 text-cyan-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {room.isAC ? 'AC' : 'Non-AC'}
                      </span>
                    </div>
                  </td>

                  {/* Day Cells */}
                  {daysInMonth.map(day => {
                    const dateStr = day.toISOString().split('T')[0];
                    const isToday = dateStr === todayStr;
                    const booking = getBookingForSlot(room.id, dateStr);

                    // If room is in maintenance
                    if (room.currentStatus === 'maintenance') {
                      return (
                        <td
                          key={dateStr}
                          className="p-1 border-r border-slate-800/60 bg-rose-950/20 text-center"
                          title="Room under maintenance"
                        >
                          <div className="w-full h-8 rounded bg-rose-900/40 border border-rose-800/50 flex items-center justify-center">
                            <Wrench className="w-3 h-3 text-rose-400" />
                          </div>
                        </td>
                      );
                    }

                    // If room is in cleaning today
                    if (isToday && room.currentStatus === 'cleaning' && !booking) {
                      return (
                        <td
                          key={dateStr}
                          className="p-1 border-r border-slate-800/60 bg-amber-950/20 text-center"
                          title="Room under cleaning"
                        >
                          <div className="w-full h-8 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                          </div>
                        </td>
                      );
                    }

                    // If booked/occupied
                    if (booking) {
                      const isOccupied = booking.status === 'checked_in';
                      return (
                        <td
                          key={dateStr}
                          onClick={() => onViewBooking(booking)}
                          className="p-1 border-r border-slate-800/60 cursor-pointer"
                          title={`Booked by ${booking.customer.fullName} (${booking.checkInDate} to ${booking.checkOutDate})`}
                        >
                          <div
                            className={`w-full h-8 rounded px-1.5 flex flex-col justify-center text-[10px] font-semibold text-white truncate shadow-sm transition-transform hover:scale-105 ${
                              isOccupied
                                ? 'bg-indigo-600 hover:bg-indigo-500 border border-indigo-400'
                                : 'bg-blue-600 hover:bg-blue-500 border border-blue-400'
                            }`}
                          >
                            <span className="truncate leading-tight">{booking.customer.fullName}</span>
                          </div>
                        </td>
                      );
                    }

                    // Empty / Available slot
                    return (
                      <td
                        key={dateStr}
                        onClick={() => onSelectSlot(room.id, dateStr)}
                        className={`p-1 border-r border-slate-800/60 cursor-pointer group hover:bg-emerald-500/10 transition-colors ${
                          isToday ? 'bg-amber-500/5' : ''
                        }`}
                        title={`Room ${room.roomNumber} is Available on ${dateStr}. Click to create booking.`}
                      >
                        <div className="w-full h-8 rounded border border-transparent group-hover:border-emerald-500/50 group-hover:bg-emerald-500/20 flex items-center justify-center transition-all">
                          <Plus className="w-3.5 h-3.5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

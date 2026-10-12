import React, { useState, useMemo } from 'react';
import { useHotel } from '../context/HotelContext';
import { Room, RoomStatus, RoomType } from '../types/hotel';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  Bed,
  Plus,
  Filter,
  Wind,
  Users,
  CheckCircle2,
  Sparkles,
  Wrench,
  Trash2,
  Edit2,
  Layers,
  Search,
  BedDouble,
  IndianRupee,
  AlertCircle,
} from 'lucide-react';

interface RoomManagementViewProps {
  onOpenAddRoom: () => void;
  onEditRoom: (room: Room) => void;
  initialStatusFilter?: string;
}

export const RoomManagementView: React.FC<RoomManagementViewProps> = ({
  onOpenAddRoom,
  onEditRoom,
  initialStatusFilter = 'all',
}) => {
  const { filteredRooms, deleteRoom, markRoomCleaned, setRoomStatus, activeHotel, notify } = useHotel();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatusFilter);

  React.useEffect(() => {
    if (initialStatusFilter) {
      setSelectedStatus(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  const [selectedAC, setSelectedAC] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);

  const currency = activeHotel?.currency || '₹';

  // Distinct floors
  const floors = useMemo(() => {
    return Array.from(new Set(filteredRooms.map(r => r.floor))).sort((a, b) => a - b);
  }, [filteredRooms]);

  // Filtered
  const displayRooms = useMemo(() => {
    return filteredRooms.filter(r => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesNo = r.roomNumber.toLowerCase().includes(term);
        const matchesType = r.roomType.toLowerCase().includes(term);
        const matchesFacility = r.facilities.some(f => f.toLowerCase().includes(term));
        if (!matchesNo && !matchesType && !matchesFacility) return false;
      }
      if (selectedFloor !== 'all' && r.floor !== Number(selectedFloor)) return false;
      if (selectedType !== 'all' && r.roomType !== selectedType) return false;
      if (selectedStatus !== 'all' && r.currentStatus !== selectedStatus) return false;
      if (selectedAC === 'ac' && !r.isAC) return false;
      if (selectedAC === 'non-ac' && r.isAC) return false;
      return true;
    });
  }, [filteredRooms, searchTerm, selectedFloor, selectedType, selectedStatus, selectedAC]);

  const handleDelete = (room: Room) => {
    setRoomToDelete(room);
  };

  const handleConfirmDeleteRoom = () => {
    if (!roomToDelete) return;
    setIsDeletingRoom(true);
    const res = deleteRoom(roomToDelete.id);
    setIsDeletingRoom(false);
    if (!res.success) {
      notify(res.message, 'error');
    } else {
      notify(res.message, 'success');
      setRoomToDelete(null);
    }
  };

  const getStatusBadge = (status: RoomStatus) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Available
          </span>
        );
      case 'occupied':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            Occupied
          </span>
        );
      case 'booked':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            Booked
          </span>
        );
      case 'cleaning':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Sparkles className="w-3 h-3" /> Cleaning
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <Wrench className="w-3 h-3" /> Maintenance
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bed className="w-5 h-5 text-amber-500" />
            Room Inventory & Housekeeping Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage individual rooms, tariff rates, climate features, housekeeping status, and maintenance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenAddRoom}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> Add New Room
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Room number, category, or facility..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* View mode toggle */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                viewMode === 'grid' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Grid View
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                viewMode === 'table' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Table View
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-700/60 text-xs">
          <div className="flex items-center gap-1 text-slate-400">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </div>

          {/* Floor filter */}
          <select
            value={selectedFloor}
            onChange={e => setSelectedFloor(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Floors</option>
            {floors.map(f => (
              <option key={f} value={f}>Floor {f}</option>
            ))}
          </select>

          {/* Category */}
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Room Types</option>
            <option value="single">Single</option>
            <option value="double">Double</option>
            <option value="deluxe">Deluxe</option>
            <option value="family">Family</option>
            <option value="suite">Suite</option>
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available Only</option>
            <option value="occupied">Occupied</option>
            <option value="booked">Booked</option>
            <option value="cleaning">Cleaning</option>
            <option value="maintenance">Maintenance</option>
          </select>

          {/* AC */}
          <select
            value={selectedAC}
            onChange={e => setSelectedAC(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Climates</option>
            <option value="ac">AC Only</option>
            <option value="non-ac">Non-AC</option>
          </select>

          {(selectedFloor !== 'all' || selectedType !== 'all' || selectedStatus !== 'all' || selectedAC !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setSelectedFloor('all');
                setSelectedType('all');
                setSelectedStatus('all');
                setSelectedAC('all');
                setSearchTerm('');
              }}
              className="text-amber-400 hover:text-amber-300 font-semibold underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Grid Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayRooms.map(room => (
            <div
              key={room.id}
              className="bg-slate-800/80 rounded-2xl border border-slate-700/80 overflow-hidden hover:border-slate-600 transition-all group flex flex-col justify-between"
            >
              {/* Photo Banner with Badges */}
              <div className="relative h-40 bg-slate-900 overflow-hidden">
                <img
                  src={room.photoUrl || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80'}
                  alt={`Room ${room.roomNumber}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md text-white font-extrabold text-xs shadow-md">
                    Room {room.roomNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-900/80 backdrop-blur-md text-slate-300 font-semibold text-[10px]">
                    Floor {room.floor}
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  {getStatusBadge(room.currentStatus)}
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-400 uppercase block tracking-wider">
                      {room.roomType}
                    </span>
                    <span className="text-white text-base font-extrabold">
                      {currency}{room.pricePerNight.toLocaleString()}{' '}
                      <span className="text-xs text-slate-400 font-normal">/ night</span>
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    room.isAC ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {room.isAC ? 'AC' : 'Non-AC'}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between text-xs">
                <div>
                  <div className="flex items-center gap-3 text-slate-300 mb-2.5">
                    <span className="flex items-center gap-1">
                      <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                      {room.bedsCount} {room.bedsCount === 1 ? 'Bed' : 'Beds'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Max {room.maxGuests} Guests
                    </span>
                    {room.extraBedCharge > 0 && (
                      <span className="text-slate-400">
                        +{currency}{room.extraBedCharge} extra bed
                      </span>
                    )}
                  </div>

                  {/* Facilities preview */}
                  <div className="flex flex-wrap gap-1">
                    {room.facilities.slice(0, 3).map((f, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 bg-slate-900/60 rounded text-slate-400 border border-slate-800"
                      >
                        {f}
                      </span>
                    ))}
                    {room.facilities.length > 3 && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-900/60 rounded text-slate-500">
                        +{room.facilities.length - 3}
                      </span>
                    )}
                  </div>

                  {room.notes && (
                    <p className="mt-2 text-[11px] text-amber-300/80 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                      Note: {room.notes}
                    </p>
                  )}
                </div>

                {/* Housekeeping Action / Status quick controls */}
                <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2">
                  {room.currentStatus === 'cleaning' ? (
                    <button
                      onClick={() => markRoomCleaned(room.id)}
                      className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Ready & Clean
                    </button>
                  ) : room.currentStatus === 'available' ? (
                    <button
                      onClick={() => setRoomStatus(room.id, 'cleaning', 'Scheduled deep cleaning')}
                      className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" /> Clean Room
                    </button>
                  ) : (
                    <div className="text-[11px] text-slate-400 font-medium">
                      Status: <span className="capitalize text-white font-semibold">{room.currentStatus}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditRoom(room)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-all"
                      title="Edit Room"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(room)}
                      className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition-all"
                      title="Delete Room"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 font-semibold bg-slate-900/50">
                <th className="py-3 px-4">Room No</th>
                <th className="py-3 px-4">Floor</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Climate</th>
                <th className="py-3 px-4">Beds / Capacity</th>
                <th className="py-3 px-4 text-right">Price / Night</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {displayRooms.map(room => (
                <tr key={room.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">
                    Room {room.roomNumber}
                  </td>
                  <td className="py-3 px-4 text-slate-300">Floor {room.floor}</td>
                  <td className="py-3 px-4 font-semibold text-amber-400 capitalize">
                    {room.roomType}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      room.isAC ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-700 text-slate-300'
                    }`}>
                      {room.isAC ? 'AC' : 'Non-AC'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {room.bedsCount} Beds (Max {room.maxGuests})
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-white">
                    {currency}{room.pricePerNight.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {getStatusBadge(room.currentStatus)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {room.currentStatus === 'cleaning' && (
                        <button
                          onClick={() => markRoomCleaned(room.id)}
                          className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-emerald-400"
                        >
                          Mark Ready
                        </button>
                      )}
                      <button
                        onClick={() => onEditRoom(room)}
                        className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(room)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {displayRooms.length === 0 && (
        <div className="p-12 text-center bg-slate-800/40 rounded-2xl border border-slate-700 text-slate-400 space-y-2">
          <AlertCircle className="w-8 h-8 mx-auto text-slate-500" />
          <p className="font-semibold text-white">No rooms matched the selected filters.</p>
          <p className="text-xs">Adjust your search keyword or reset the floor/climate filters above.</p>
        </div>
      )}

      {/* Confirmation Dialog to Prevent Accidental Data Loss */}
      <ConfirmDeleteModal
        isOpen={!!roomToDelete}
        title="Delete Room"
        itemName={roomToDelete ? `Room ${roomToDelete.roomNumber} (${roomToDelete.roomType.toUpperCase()})` : undefined}
        message={`Are you sure you want to permanently delete Room ${roomToDelete?.roomNumber}? This will remove it from all room rosters, availability grids, and visual floor plans. Note: rooms with active or upcoming reservations cannot be deleted.`}
        confirmLabel="Delete Room"
        isDeleting={isDeletingRoom}
        onConfirm={handleConfirmDeleteRoom}
        onCancel={() => setRoomToDelete(null)}
      />
    </div>
  );
};

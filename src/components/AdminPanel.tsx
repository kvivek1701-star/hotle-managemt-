import React, { useState } from 'react';
import { useHotel } from '../context/HotelContext';
import { UserAccount, Hotel } from '../types/hotel';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  ShieldAlert,
  Users,
  Building2,
  Activity,
  Plus,
  UserCheck,
  UserX,
  Edit2,
  CheckCircle2,
  XCircle,
  Building,
  IndianRupee,
  TrendingUp,
  Clock,
  KeyRound,
  Shield,
  Trash2,
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const {
    currentUser,
    allUsers,
    hotels,
    rooms,
    bookings,
    auditLogs,
    createOwnerAccount,
    updateUserAccount,
    toggleUserStatus,
    deleteUserAccount,
    createHotel,
    updateHotel,
    setSelectedHotelId,
  } = useHotel();

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'owners' | 'hotels' | 'audit'>('overview');
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // New Owner Modal
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerHotelId, setOwnerHotelId] = useState(hotels[0]?.id || 'hotel-1');

  // New Hotel Modal
  const [hotelModalOpen, setHotelModalOpen] = useState(false);
  const [hotelName, setHotelName] = useState('');
  const [hotelCode, setHotelCode] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');
  const [hotelCity, setHotelCity] = useState('');
  const [hotelPhone, setHotelPhone] = useState('');
  const [hotelEmail, setHotelEmail] = useState('');
  const [hotelTax, setHotelTax] = useState('');
  const [hotelCurrency, setHotelCurrency] = useState('₹');

  // Hotel statistics
  const hotelMetrics = hotels.map(hotel => {
    const hotelRooms = rooms.filter(r => r.hotelId === hotel.id);
    const hotelBookings = bookings.filter(b => b.hotelId === hotel.id && b.status !== 'cancelled');
    const occupied = hotelRooms.filter(r => r.currentStatus === 'occupied' || r.currentStatus === 'booked').length;
    const occupancy = hotelRooms.length > 0 ? Math.round((occupied / hotelRooms.length) * 100) : 0;
    const revenue = hotelBookings.reduce((sum, b) => sum + b.totalAmountReceived, 0);
    const pending = hotelBookings.reduce((sum, b) => sum + b.remainingBalance, 0);
    const assignedOwners = allUsers.filter(u => u.role === 'hotel_owner' && u.assignedHotelId === hotel.id);

    return {
      hotel,
      totalRooms: hotelRooms.length,
      occupancy,
      revenue,
      pending,
      assignedOwners,
    };
  });

  const handleCreateOwner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerName.trim() || !ownerEmail.trim()) return;

    createOwnerAccount({
      name: ownerName.trim(),
      email: ownerEmail.trim(),
      phone: ownerPhone.trim() || '+91 98000 00000',
      role: 'hotel_owner',
      assignedHotelId: ownerHotelId,
      isActive: true,
    });

    setOwnerName('');
    setOwnerEmail('');
    setOwnerPhone('');
    setOwnerModalOpen(false);
  };

  const handleCreateHotel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelName.trim()) return;

    createHotel({
      name: hotelName.trim(),
      code: hotelCode.trim().toUpperCase() || 'HTL',
      address: hotelAddress.trim(),
      city: hotelCity.trim() || 'Mumbai',
      phone: hotelPhone.trim() || '+91 98000 11111',
      email: hotelEmail.trim() || 'contact@hotel.com',
      taxNumber: hotelTax.trim() || undefined,
      checkInTimeDefault: '14:00',
      checkOutTimeDefault: '11:00',
      currency: hotelCurrency,
    });

    setHotelName('');
    setHotelCode('');
    setHotelAddress('');
    setHotelCity('');
    setHotelPhone('');
    setHotelEmail('');
    setHotelModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950/30 p-6 rounded-2xl border border-slate-700/80 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
            Super Administrator Control
          </span>
          <span className="text-xs text-slate-400">Master Multi-Property Governance</span>
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-amber-500" />
          Central Hotel Owner & Multi-Property Administration
        </h2>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl">
          Super Admin has unrestricted access to all properties, room inventories, financial folios, and owner accounts. Hotel owners are strictly partitioned to their assigned property.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-800/80 p-2 rounded-2xl border border-slate-700/80 text-xs">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'overview'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
          }`}
        >
          <Building className="w-4 h-4" /> Multi-Property Comparison
        </button>

        <button
          onClick={() => setActiveSubTab('owners')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'owners'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
          }`}
        >
          <Users className="w-4 h-4" /> Hotel Owner Accounts ({allUsers.filter(u => u.role === 'hotel_owner').length})
        </button>

        <button
          onClick={() => setActiveSubTab('hotels')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'hotels'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
          }`}
        >
          <Building2 className="w-4 h-4" /> Hotels Registry ({hotels.length})
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'audit'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
          }`}
        >
          <Activity className="w-4 h-4" /> Activity & Audit Log Stream ({auditLogs.length})
        </button>
      </div>

      {/* SubTab 1: Multi-Property Overview */}
      {activeSubTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hotelMetrics.map(item => (
              <div
                key={item.hotel.id}
                className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-5 space-y-4 shadow-lg text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      {item.hotel.name}
                    </h3>
                    <p className="text-slate-400">
                      {item.hotel.city} • Code: <span className="font-mono text-amber-400">{item.hotel.code}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedHotelId(item.hotel.id)}
                    className="px-3 py-1 bg-slate-900 hover:bg-slate-700 text-amber-400 font-bold rounded-lg border border-slate-700"
                  >
                    Switch to Property
                  </button>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-4 gap-2 text-center p-3 bg-slate-900/80 rounded-xl border border-slate-700/60">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Total Rooms</span>
                    <span className="font-bold text-white text-sm">{item.totalRooms}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Occupancy</span>
                    <span className="font-bold text-amber-400 text-sm">{item.occupancy}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Revenue</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {item.hotel.currency}{item.revenue.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Pending Due</span>
                    <span className="font-bold text-rose-400 text-sm">
                      {item.hotel.currency}{item.pending.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Assigned Owners */}
                <div className="pt-2 border-t border-slate-700/60">
                  <span className="text-[11px] text-slate-400 block mb-1">
                    Assigned Property Owner(s):
                  </span>
                  {item.assignedOwners.length === 0 ? (
                    <span className="text-amber-400/80 italic text-[11px]">No active owner assigned yet.</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {item.assignedOwners.map(owner => (
                        <span
                          key={owner.id}
                          className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 ${
                            owner.isActive
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${owner.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          {owner.name} ({owner.email})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 2: Hotel Owner Accounts */}
      {activeSubTab === 'owners' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Manage Hotel Owner accounts. Admin can add new owners, assign them to hotels, and activate or deactivate access.
            </p>
            <button
              onClick={() => setOwnerModalOpen(true)}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Hotel Owner Account</span>
            </button>
          </div>

          <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 font-semibold bg-slate-900/60">
                  <th className="py-3 px-4">Owner Name</th>
                  <th className="py-3 px-4">Email & Phone</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Assigned Hotel Property</th>
                  <th className="py-3 px-4 text-center">Account Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {allUsers.map(user => {
                  const assignedHotel = hotels.find(h => h.id === user.assignedHotelId);
                  return (
                    <tr key={user.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-white">
                        {user.name}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <p>{user.email}</p>
                        <p className="text-[10px] text-slate-500">{user.phone}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          user.role === 'super_admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {user.role === 'super_admin' ? 'Super Admin' : 'Hotel Owner'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-200">
                        {user.role === 'super_admin' ? (
                          <span className="text-amber-400 font-semibold">All Properties (Master)</span>
                        ) : assignedHotel ? (
                          assignedHotel.name
                        ) : (
                          <span className="text-slate-500 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          user.isActive
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}>
                          {user.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {user.role !== 'super_admin' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => toggleUserStatus(user.id)}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                user.isActive
                                  ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60'
                                  : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60'
                              }`}
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => setUserToDelete(user)}
                              className="p-1.5 bg-slate-900 hover:bg-rose-950/70 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-700 transition-colors"
                              title="Delete Owner Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SubTab 3: Hotels Registry */}
      {activeSubTab === 'hotels' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Manage hotel entities and properties. Add new hotels to expand the multi-property management portfolio.
            </p>
            <button
              onClick={() => setHotelModalOpen(true)}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Hotel Property</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {hotels.map(h => (
              <div key={h.id} className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">{h.name}</h3>
                  <span className="font-mono font-bold text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                    {h.code}
                  </span>
                </div>
                <p className="text-slate-400">{h.address}, {h.city}</p>
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-900/60 rounded-xl text-slate-300">
                  <p>Phone: {h.phone}</p>
                  <p>Email: {h.email}</p>
                  <p>Check-In: {h.checkInTimeDefault}</p>
                  <p>Check-Out: {h.checkOutTimeDefault}</p>
                </div>
                {h.taxNumber && (
                  <p className="text-[11px] text-slate-400">
                    GST / Tax ID: <span className="font-mono text-slate-200">{h.taxNumber}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 4: Audit Stream */}
      {activeSubTab === 'audit' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            System activity and audit trail. Tracks every booking creation, checkout, room housekeeping transition, and payment recording.
          </p>

          <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-4 space-y-2 text-xs max-h-[500px] overflow-y-auto">
            {auditLogs.map(log => (
              <div
                key={log.id}
                className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 flex items-start justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-mono text-[11px] bg-slate-800 px-1.5 py-0.5 rounded text-amber-400">
                      {log.action}
                    </span>
                    <span className="font-semibold text-slate-300">
                      by {log.actorName} ({log.actorRole})
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs mt-1">{log.details}</p>
                </div>
                <span className="text-[10px] text-slate-500 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add Owner */}
      {ownerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm text-xs">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Create Hotel Owner Account</h3>
            <form onSubmit={handleCreateOwner} className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1">Owner Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Chandra"
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Email Address (Login) *</label>
                <input
                  type="email"
                  placeholder="e.g. ramesh@hotel.com"
                  value={ownerEmail}
                  onChange={e => setOwnerEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98200 11223"
                  value={ownerPhone}
                  onChange={e => setOwnerPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Assign to Hotel Property *</label>
                <select
                  value={ownerHotelId}
                  onChange={e => setOwnerHotelId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  {hotels.map(h => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setOwnerModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Hotel */}
      {hotelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm text-xs">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Register New Hotel Property</h3>
            <form onSubmit={handleCreateHotel} className="space-y-3">
              <div>
                <label className="block text-slate-300 mb-1">Hotel Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Orchid Heritage"
                  value={hotelName}
                  onChange={e => setHotelName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Short Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. ROH"
                    value={hotelCode}
                    onChange={e => setHotelCode(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">City *</label>
                  <input
                    type="text"
                    placeholder="e.g. Jaipur"
                    value={hotelCity}
                    onChange={e => setHotelCity(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Full Address</label>
                <input
                  type="text"
                  placeholder="e.g. 12 Palace Road"
                  value={hotelAddress}
                  onChange={e => setHotelAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 ..."
                    value={hotelPhone}
                    onChange={e => setHotelPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    value={hotelCurrency}
                    onChange={e => setHotelCurrency(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setHotelModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl hover:bg-amber-400"
                >
                  Register Hotel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog: Delete User Account */}
      <ConfirmDeleteModal
        isOpen={!!userToDelete}
        title="Delete Hotel Owner Account"
        itemName={userToDelete ? `${userToDelete.name} (${userToDelete.email})` : undefined}
        message={`Are you sure you want to permanently delete the account for ${userToDelete?.name}? This will revoke their PMS login access and remove their credentials from the system.`}
        confirmLabel="Delete Account"
        isDeleting={isDeletingUser}
        onConfirm={() => {
          if (userToDelete) {
            setIsDeletingUser(true);
            const res = deleteUserAccount(userToDelete.id);
            setIsDeletingUser(false);
            if (res.success) {
              setUserToDelete(null);
            }
          }
        }}
        onCancel={() => setUserToDelete(null)}
      />
    </div>
  );
};

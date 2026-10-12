import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Hotel,
  Room,
  Booking,
  UserAccount,
  AuditLog,
  ExpenseRecord,
  PaymentMethod,
  RoomStatus,
  ExtraCharge,
  SavedBill,
  SavedBillItem,
  PaymentStatus,
  BillPrintFormat,
} from '../types/hotel';
import {
  INITIAL_HOTELS,
  INITIAL_ROOMS,
  INITIAL_USERS,
  INITIAL_BOOKINGS,
  INITIAL_EXPENSES,
  INITIAL_AUDIT_LOGS,
  INITIAL_SAVED_BILLS,
  calculateBookingFinancials,
} from '../data/initialData';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface HotelContextType {
  // Notification Toast System
  toasts: ToastMessage[];
  notify: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;

  // Bills & Invoices
  savedBills: SavedBill[];
  filteredSavedBills: SavedBill[];
  saveBill: (bill: SavedBill) => { success: boolean; message: string };
  deleteSavedBill: (billId: string) => { success: boolean; message: string };
  updateSavedBill: (billId: string, updated: Partial<SavedBill>) => { success: boolean; message: string };
  generateBillFromBooking: (
    booking: Booking,
    customOptions?: { taxRate?: number; discount?: number; notes?: string; printFormat?: BillPrintFormat }
  ) => SavedBill;
  // Current user & authentication state
  currentUser: UserAccount;
  allUsers: UserAccount[];
  setCurrentUserById: (userId: string) => void;
  createOwnerAccount: (user: Omit<UserAccount, 'id' | 'createdAt'>) => void;
  updateUserAccount: (userId: string, data: Partial<UserAccount>) => void;
  toggleUserStatus: (userId: string) => void;
  deleteUserAccount: (userId: string) => { success: boolean; message: string };

  // Selected hotel (if super_admin, can be 'all' or specific hotel ID; if hotel_owner, locked to assigned hotel)
  selectedHotelId: string;
  setSelectedHotelId: (id: string) => void;
  activeHotel: Hotel | null;
  hotels: Hotel[];
  createHotel: (hotel: Omit<Hotel, 'id'>) => void;
  updateHotel: (id: string, data: Partial<Hotel>) => void;

  // Rooms
  rooms: Room[];
  filteredRooms: Room[];
  addRoom: (room: Omit<Room, 'id'>) => void;
  updateRoom: (roomId: string, data: Partial<Room>) => void;
  deleteRoom: (roomId: string) => { success: boolean; message: string };
  markRoomCleaned: (roomId: string) => void;
  setRoomStatus: (roomId: string, status: RoomStatus, notes?: string) => void;
  isRoomAvailable: (roomId: string, checkInDate: string, checkOutDate: string, excludeBookingId?: string) => {
    available: boolean;
    reason?: string;
  };

  // Bookings
  bookings: Booking[];
  filteredBookings: Booking[];
  createBooking: (bookingData: any) => { success: boolean; booking?: Booking; error?: string };
  updateBooking: (bookingId: string, bookingData: any) => { success: boolean; error?: string };
  checkInGuest: (bookingId: string) => { success: boolean; error?: string };
  checkOutGuest: (
    bookingId: string,
    settlementPayment?: { amount: number; method: PaymentMethod; referenceNo: string; notes?: string }
  ) => {
    success: boolean;
    error?: string;
    updatedBooking?: Booking;
    savedBill?: SavedBill;
  };
  cancelBooking: (bookingId: string, cancellationFee: number, refundAmount: number, reason?: string) => {
    success: boolean;
    error?: string;
  };
  deleteBooking: (bookingId: string) => { success: boolean; message: string };

  // Payments & Ledger
  addPaymentTransaction: (
    bookingId: string,
    amount: number,
    method: PaymentMethod,
    referenceNo: string,
    notes?: string
  ) => { success: boolean; error?: string };
  deletePaymentTransaction: (bookingId: string, paymentId: string) => { success: boolean; message: string };
  addExtraChargeToBooking: (
    bookingId: string,
    charge: Omit<ExtraCharge, 'id' | 'date'>
  ) => { success: boolean; error?: string };
  deleteExtraChargeFromBooking: (bookingId: string, chargeId: string) => { success: boolean; message: string };
  applyBookingDiscount: (bookingId: string, discount: number, reason?: string) => { success: boolean; error?: string };

  // Expenses
  expenses: ExpenseRecord[];
  filteredExpenses: ExpenseRecord[];
  addExpense: (expense: Omit<ExpenseRecord, 'id'>) => void;
  deleteExpense: (id: string) => { success: boolean; message: string };

  // Audit Logs
  auditLogs: AuditLog[];
  filteredAuditLogs: AuditLog[];

  // Utilities
  resetToDefaultData: () => void;
  exportDatabaseJson: () => string;
  importDatabaseJson: (jsonStr: string) => boolean;
}

const STORAGE_KEYS = {
  HOTELS: 'grandstay_hotels_v1',
  ROOMS: 'grandstay_rooms_v1',
  BOOKINGS: 'grandstay_bookings_v1',
  USERS: 'grandstay_users_v1',
  CURRENT_USER: 'grandstay_current_user_v1',
  SELECTED_HOTEL: 'grandstay_selected_hotel_v1',
  EXPENSES: 'grandstay_expenses_v1',
  AUDIT_LOGS: 'grandstay_audit_logs_v1',
  BILLS: 'grandstay_bills_v1',
};

const HotelContext = createContext<HotelContextType | undefined>(undefined);

export const HotelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load or initialize state
  const [hotels, setHotels] = useState<Hotel[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HOTELS);
    return saved ? JSON.parse(saved) : INITIAL_HOTELS;
  });

  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROOMS);
    return saved ? JSON.parse(saved) : INITIAL_ROOMS;
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
  });

  const [savedBills, setSavedBills] = useState<SavedBill[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BILLS);
    return saved ? JSON.parse(saved) : INITIAL_SAVED_BILLS;
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(savedBills));
  }, [savedBills]);

  const [allUsers, setAllUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return saved || 'user-owner-1'; // Default as active hotel owner
  });

  const [selectedHotelIdState, setSelectedHotelIdState] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_HOTEL);
    return saved || 'hotel-1';
  });

  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HOTELS, JSON.stringify(hotels));
  }, [hotels]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_HOTEL, selectedHotelIdState);
  }, [selectedHotelIdState]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Derived current user
  const currentUser = useMemo(() => {
    return allUsers.find(u => u.id === currentUserId) || allUsers[0] || INITIAL_USERS[0];
  }, [allUsers, currentUserId]);

  // Effective selected hotel ID: Hotel Owner CANNOT select other hotels
  const selectedHotelId = useMemo(() => {
    if (currentUser.role === 'hotel_owner') {
      return currentUser.assignedHotelId || hotels[0]?.id || 'hotel-1';
    }
    return selectedHotelIdState;
  }, [currentUser, selectedHotelIdState, hotels]);

  const activeHotel = useMemo(() => {
    if (selectedHotelId === 'all') return null;
    return hotels.find(h => h.id === selectedHotelId) || null;
  }, [hotels, selectedHotelId]);

  const logAudit = (action: string, details: string, hotelId?: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      hotelId: hotelId || (selectedHotelId !== 'all' ? selectedHotelId : undefined),
      timestamp: new Date().toISOString(),
      actorName: currentUser.name,
      actorRole: currentUser.role,
      action,
      details,
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const setSelectedHotelId = (id: string) => {
    if (currentUser.role === 'hotel_owner') {
      // Hotel owners cannot switch away from assigned hotel
      return;
    }
    setSelectedHotelIdState(id);
  };

  const setCurrentUserById = (userId: string) => {
    const target = allUsers.find(u => u.id === userId);
    if (target) {
      setCurrentUserId(userId);
      if (target.role === 'hotel_owner' && target.assignedHotelId) {
        setSelectedHotelIdState(target.assignedHotelId);
      }
      logAudit('USER_SWITCH', `Switched active session to ${target.name} (${target.role})`, target.assignedHotelId);
    }
  };

  const createOwnerAccount = (userData: Omit<UserAccount, 'id' | 'createdAt'>) => {
    const newId = `user-owner-${Date.now()}`;
    const newUser: UserAccount = {
      ...userData,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setAllUsers(prev => [...prev, newUser]);
    logAudit('CREATE_USER', `Created new ${userData.role} account for ${userData.name} (${userData.email})`, userData.assignedHotelId);
  };

  const updateUserAccount = (userId: string, data: Partial<UserAccount>) => {
    setAllUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, ...data } : u))
    );
    logAudit('UPDATE_USER', `Updated user account ID ${userId}`);
  };

  const toggleUserStatus = (userId: string) => {
    setAllUsers(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const nextState = !u.isActive;
          logAudit('TOGGLE_USER_STATUS', `Set user ${u.name} status to ${nextState ? 'Active' : 'Inactive'}`);
          return { ...u, isActive: nextState };
        }
        return u;
      })
    );
  };

  const deleteUserAccount = (userId: string): { success: boolean; message: string } => {
    const target = allUsers.find(u => u.id === userId);
    if (!target) return { success: false, message: 'User account not found.' };
    if (target.role === 'super_admin') {
      return { success: false, message: 'Super Admin account cannot be deleted!' };
    }
    if (target.id === currentUser.id) {
      return { success: false, message: 'Cannot delete the currently active user account!' };
    }

    setAllUsers(prev => prev.filter(u => u.id !== userId));
    logAudit('DELETE_USER', `Deleted owner account ${target.name} (${target.email})`, target.assignedHotelId);
    notify(`Account for ${target.name} deleted successfully.`, 'info');
    return { success: true, message: 'Account deleted successfully.' };
  };

  // Hotel creation
  const createHotel = (hotelData: Omit<Hotel, 'id'>) => {
    const newId = `hotel-${Date.now()}`;
    const newHotel: Hotel = { ...hotelData, id: newId };
    setHotels(prev => [...prev, newHotel]);
    logAudit('CREATE_HOTEL', `Added new hotel property: ${hotelData.name}`, newId);
  };

  const updateHotel = (id: string, data: Partial<Hotel>) => {
    setHotels(prev => prev.map(h => (h.id === id ? { ...h, ...data } : h)));
    logAudit('UPDATE_HOTEL', `Updated details for hotel property ID ${id}`, id);
  };

  // Filtered collections based on selectedHotelId
  const filteredRooms = useMemo(() => {
    if (selectedHotelId === 'all') return rooms;
    return rooms.filter(r => r.hotelId === selectedHotelId);
  }, [rooms, selectedHotelId]);

  const filteredBookings = useMemo(() => {
    if (selectedHotelId === 'all') return bookings;
    return bookings.filter(b => b.hotelId === selectedHotelId);
  }, [bookings, selectedHotelId]);

  const filteredExpenses = useMemo(() => {
    if (selectedHotelId === 'all') return expenses;
    return expenses.filter(e => e.hotelId === selectedHotelId);
  }, [expenses, selectedHotelId]);

  const filteredAuditLogs = useMemo(() => {
    if (selectedHotelId === 'all') return auditLogs;
    return auditLogs.filter(l => !l.hotelId || l.hotelId === selectedHotelId);
  }, [auditLogs, selectedHotelId]);

  // Conflict Checking Engine
  const isRoomAvailable = (
    roomId: string,
    checkInDate: string,
    checkOutDate: string,
    excludeBookingId?: string
  ): { available: boolean; reason?: string } => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return { available: false, reason: 'Room not found' };

    if (room.currentStatus === 'maintenance') {
      return { available: false, reason: 'Room is currently under Maintenance' };
    }

    const newStart = new Date(checkInDate).getTime();
    const newEnd = new Date(checkOutDate).getTime();

    if (isNaN(newStart) || isNaN(newEnd)) {
      return { available: false, reason: 'Invalid dates provided' };
    }

    if (newEnd <= newStart) {
      return { available: false, reason: 'Check-out date must be after Check-in date' };
    }

    // Check overlaps with active bookings
    const activeBookings = bookings.filter(
      b =>
        b.roomId === roomId &&
        (b.status === 'reserved' || b.status === 'checked_in') &&
        (!excludeBookingId || b.id !== excludeBookingId)
    );

    for (const b of activeBookings) {
      const bStart = new Date(b.checkInDate).getTime();
      const bEnd = new Date(b.checkOutDate).getTime();

      // Overlap formula: [newStart, newEnd) overlaps [bStart, bEnd) if newStart < bEnd and newEnd > bStart
      if (newStart < bEnd && newEnd > bStart) {
        return {
          available: false,
          reason: `Booked by ${b.customer.fullName} (${b.checkInDate} to ${b.checkOutDate})`,
        };
      }
    }

    return { available: true };
  };

  // Rooms CRUD
  const addRoom = (roomData: Omit<Room, 'id'>) => {
    const newId = `rm-${Date.now()}`;
    const newRoom: Room = {
      ...roomData,
      id: newId,
      currentStatus: roomData.currentStatus || 'available',
    };
    setRooms(prev => [...prev, newRoom]);
    logAudit('CREATE_ROOM', `Created Room ${newRoom.roomNumber} (${newRoom.roomType.toUpperCase()}, Floor ${newRoom.floor})`, newRoom.hotelId);
  };

  const updateRoom = (roomId: string, data: Partial<Room>) => {
    setRooms(prev => prev.map(r => (r.id === roomId ? { ...r, ...data } : r)));
    logAudit('UPDATE_ROOM', `Updated details for Room ID ${roomId}`);
  };

  const deleteRoom = (roomId: string) => {
    const hasActiveBooking = bookings.some(
      b => b.roomId === roomId && (b.status === 'reserved' || b.status === 'checked_in')
    );
    if (hasActiveBooking) {
      return { success: false, message: 'Cannot delete room with active or upcoming reservations!' };
    }
    const target = rooms.find(r => r.id === roomId);
    setRooms(prev => prev.filter(r => r.id !== roomId));
    if (target) {
      logAudit('DELETE_ROOM', `Deleted Room ${target.roomNumber}`, target.hotelId);
    }
    return { success: true, message: 'Room deleted successfully' };
  };

  const markRoomCleaned = (roomId: string) => {
    setRooms(prev =>
      prev.map(r => {
        if (r.id === roomId) {
          return {
            ...r,
            currentStatus: 'available',
            lastCleanedAt: new Date().toISOString(),
            notes: undefined,
          };
        }
        return r;
      })
    );
    const target = rooms.find(r => r.id === roomId);
    if (target) {
      logAudit('ROOM_CLEANED', `Housekeeping completed for Room ${target.roomNumber}. Marked ready & Available.`, target.hotelId);
      notify(`Room ${target.roomNumber} sanitized & ready for check-in!`, 'success');
    }
  };

  const setRoomStatus = (roomId: string, status: RoomStatus, notes?: string) => {
    setRooms(prev =>
      prev.map(r => (r.id === roomId ? { ...r, currentStatus: status, notes } : r))
    );
    const target = rooms.find(r => r.id === roomId);
    if (target) {
      logAudit('ROOM_STATUS_CHANGE', `Room ${target.roomNumber} status updated to ${status.toUpperCase()} ${notes ? `(${notes})` : ''}`, target.hotelId);
    }
  };

  // Booking CRUD
  const createBooking = (bookingData: any): { success: boolean; booking?: Booking; error?: string } => {
    const {
      hotelId,
      roomId,
      customer,
      checkInDate,
      checkInTime = '14:00',
      checkOutDate,
      checkOutTime = '11:00',
      adults = 1,
      children = 0,
      extraBeds = 0,
      roomPricePerNight,
      discount = 0,
      discountReason = '',
      advancePaymentAmount = 0,
      advancePaymentMethod = 'cash' as PaymentMethod,
      advancePaymentReference = '',
      specialRequests = '',
      markCheckedInNow = false,
    } = bookingData;

    // Check conflict
    const availability = isRoomAvailable(roomId, checkInDate, checkOutDate);
    if (!availability.available) {
      return { success: false, error: availability.reason || 'Room is not available for requested dates.' };
    }

    const room = rooms.find(r => r.id === roomId);
    if (!room) return { success: false, error: 'Selected room not found.' };

    const start = new Date(checkInDate).getTime();
    const end = new Date(checkOutDate).getTime();
    const nights = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));

    const rate = roomPricePerNight || room.pricePerNight;
    const extraBedCharges = extraBeds * room.extraBedCharge * nights;
    const totalRoomCharges = nights * rate + extraBedCharges;
    const finalPayable = Math.max(0, totalRoomCharges - Number(discount || 0));

    const bookingId = `bk-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const payments: any[] = [];
    if (advancePaymentAmount > 0) {
      payments.push({
        id: `pm-${Date.now()}`,
        bookingId,
        amount: Number(advancePaymentAmount),
        method: advancePaymentMethod,
        date: nowIso,
        referenceNo: advancePaymentReference || `ADV-${Date.now().toString().slice(-6)}`,
        notes: 'Advance booking payment',
        recordedBy: currentUser.name,
      });
    }

    const financials = calculateBookingFinancials({
      nights,
      roomPricePerNight: rate,
      extraBeds,
      extraCharges: [],
      discount: Number(discount || 0),
      payments,
      status: markCheckedInNow ? 'checked_in' : 'reserved',
    });

    const newBooking: Booking = {
      id: bookingId,
      hotelId: hotelId || room.hotelId,
      roomId,
      customer,
      guestsCount: { adults: Number(adults), children: Number(children) },
      extraBeds: Number(extraBeds),
      bookingDate: nowIso,
      checkInDate,
      checkInTime,
      checkOutDate,
      checkOutTime,
      actualCheckIn: markCheckedInNow ? nowIso : undefined,
      nights,
      roomPricePerNight: rate,
      totalRoomCharges,
      extraCharges: [],
      discount: Number(discount || 0),
      discountReason,
      finalPayableAmount: financials.finalPayableAmount,
      payments,
      totalAmountReceived: financials.totalAmountReceived,
      remainingBalance: financials.remainingBalance,
      status: markCheckedInNow ? 'checked_in' : 'reserved',
      paymentStatus: financials.paymentStatus,
      specialRequests,
      createdBy: currentUser.name,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setBookings(prev => [newBooking, ...prev]);

    // Update room status
    if (markCheckedInNow) {
      setRoomStatus(roomId, 'occupied');
    } else {
      // If booking starts today, mark as booked
      const todayStr = new Date().toISOString().split('T')[0];
      if (checkInDate === todayStr && room.currentStatus === 'available') {
        setRoomStatus(roomId, 'booked');
      }
    }

    logAudit(
      'BOOKING_CREATED',
      `Booking created for Room ${room.roomNumber} - Guest: ${customer.fullName} (${checkInDate} to ${checkOutDate}). Total: ₹${financials.finalPayableAmount}`,
      room.hotelId
    );

    return { success: true, booking: newBooking };
  };

  const updateBooking = (bookingId: string, bookingData: any): { success: boolean; error?: string } => {
    const existing = bookings.find(b => b.id === bookingId);
    if (!existing) return { success: false, error: 'Booking not found.' };

    const targetRoomId = bookingData.roomId || existing.roomId;
    const targetCheckIn = bookingData.checkInDate || existing.checkInDate;
    const targetCheckOut = bookingData.checkOutDate || existing.checkOutDate;

    // Check availability if room or dates changed
    if (
      targetRoomId !== existing.roomId ||
      targetCheckIn !== existing.checkInDate ||
      targetCheckOut !== existing.checkOutDate
    ) {
      const availability = isRoomAvailable(targetRoomId, targetCheckIn, targetCheckOut, bookingId);
      if (!availability.available) {
        return { success: false, error: availability.reason || 'Room is unavailable for requested dates.' };
      }
    }

    const start = new Date(targetCheckIn).getTime();
    const end = new Date(targetCheckOut).getTime();
    const nights = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));

    const rate = bookingData.roomPricePerNight ?? existing.roomPricePerNight;
    const extraBeds = bookingData.extraBeds ?? existing.extraBeds;
    const room = rooms.find(r => r.id === targetRoomId);
    const extraBedCharges = extraBeds * (room?.extraBedCharge || 800) * nights;
    const totalRoomCharges = nights * rate + extraBedCharges;

    const discount = bookingData.discount ?? existing.discount;
    const extraCharges = bookingData.extraCharges ?? existing.extraCharges;
    const payments = bookingData.payments ?? existing.payments;

    const financials = calculateBookingFinancials({
      nights,
      roomPricePerNight: rate,
      extraBeds,
      extraCharges,
      discount,
      payments,
      status: bookingData.status ?? existing.status,
    });

    const updated: Booking = {
      ...existing,
      ...bookingData,
      roomId: targetRoomId,
      checkInDate: targetCheckIn,
      checkOutDate: targetCheckOut,
      nights,
      roomPricePerNight: rate,
      totalRoomCharges,
      finalPayableAmount: financials.finalPayableAmount,
      totalAmountReceived: financials.totalAmountReceived,
      remainingBalance: financials.remainingBalance,
      paymentStatus: financials.paymentStatus,
      updatedAt: new Date().toISOString(),
    };

    setBookings(prev => prev.map(b => (b.id === bookingId ? updated : b)));
    logAudit('BOOKING_UPDATED', `Updated booking details for ${existing.customer.fullName} (ID: ${bookingId})`, existing.hotelId);
    return { success: true };
  };

  const checkInGuest = (bookingId: string): { success: boolean; error?: string } => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return { success: false, error: 'Booking not found.' };

    if (booking.status === 'checked_in') {
      return { success: false, error: 'Guest is already checked in.' };
    }
    if (booking.status === 'cancelled') {
      return { success: false, error: 'Cannot check in a cancelled booking.' };
    }

    const nowIso = new Date().toISOString();
    setBookings(prev =>
      prev.map(b =>
        b.id === bookingId
          ? {
              ...b,
              status: 'checked_in',
              actualCheckIn: nowIso,
              updatedAt: nowIso,
            }
          : b
      )
    );

    // Update room status to occupied
    setRoomStatus(booking.roomId, 'occupied');
    const room = rooms.find(r => r.id === booking.roomId);

    logAudit(
      'CHECK_IN_COMPLETED',
      `Guest ${booking.customer.fullName} checked into Room ${room?.roomNumber || booking.roomId}`,
      booking.hotelId
    );
    notify(`Guest ${booking.customer.fullName} checked into Room ${room?.roomNumber || ''}!`, 'success');
    return { success: true };
  };

  const checkOutGuest = (
    bookingId: string,
    settlementPayment?: { amount: number; method: PaymentMethod; referenceNo: string; notes?: string }
  ): { success: boolean; error?: string; updatedBooking?: Booking; savedBill?: SavedBill } => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return { success: false, error: 'Booking not found.' };

    if (booking.status === 'checked_out') {
      return { success: false, error: 'Guest is already checked out.' };
    }

    const nowIso = new Date().toISOString();
    let currentPayments = [...booking.payments];

    if (settlementPayment && settlementPayment.amount > 0) {
      const newPayment = {
        id: `pm-${Date.now()}`,
        bookingId,
        amount: settlementPayment.amount,
        method: settlementPayment.method,
        date: nowIso,
        referenceNo: settlementPayment.referenceNo || `CO-SETTLE-${Date.now().toString().slice(-6)}`,
        notes: settlementPayment.notes || 'Final settlement payment at checkout',
        recordedBy: currentUser.name,
      };
      currentPayments.push(newPayment);
    }

    const financials = calculateBookingFinancials({
      nights: booking.nights,
      roomPricePerNight: booking.roomPricePerNight,
      extraBeds: booking.extraBeds,
      extraCharges: booking.extraCharges,
      discount: booking.discount,
      payments: currentPayments,
      status: 'checked_out',
    });

    const updatedBooking: Booking = {
      ...booking,
      status: 'checked_out',
      actualCheckOut: nowIso,
      payments: currentPayments,
      totalAmountReceived: financials.totalAmountReceived,
      remainingBalance: financials.remainingBalance,
      paymentStatus: financials.paymentStatus,
      updatedAt: nowIso,
    };

    setBookings(prev =>
      prev.map(b => (b.id === bookingId ? updatedBooking : b))
    );

    // Room automatically transitions to "Cleaning" per PMS housekeeping workflow
    setRoomStatus(booking.roomId, 'cleaning', `Checked out at ${new Date().toLocaleTimeString()}`);
    const room = rooms.find(r => r.id === booking.roomId);

    // Automatically generate and securely persist final bill
    const finalBill = generateBillFromBooking(updatedBooking, {
      printFormat: 'standard',
      notes: settlementPayment?.notes || 'Settled and completed at front desk checkout.',
    });
    saveBill(finalBill);

    logAudit(
      'CHECK_OUT_COMPLETED',
      `Guest ${booking.customer.fullName} checked out of Room ${room?.roomNumber || 'N/A'}. Room marked for Cleaning. Remaining balance: ₹${financials.remainingBalance}. Final Bill #${finalBill.billNumber} created.`,
      booking.hotelId
    );
    notify(`Checkout completed for Room ${room?.roomNumber || ''}. Final Bill #${finalBill.billNumber} saved!`, 'success');

    return { success: true, updatedBooking, savedBill: finalBill };
  };

  const cancelBooking = (
    bookingId: string,
    cancellationFee: number,
    refundAmount: number,
    reason?: string
  ): { success: boolean; error?: string } => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return { success: false, error: 'Booking not found.' };

    const nowIso = new Date().toISOString();
    setBookings(prev =>
      prev.map(b =>
        b.id === bookingId
          ? {
              ...b,
              status: 'cancelled',
              cancellationCharge: cancellationFee,
              refundAmount,
              specialRequests: reason ? `Cancellation reason: ${reason}` : b.specialRequests,
              paymentStatus: refundAmount > 0 ? 'refund_pending' : b.paymentStatus,
              updatedAt: nowIso,
            }
          : b
      )
    );

    // Release room if it was reserved/booked
    const room = rooms.find(r => r.id === booking.roomId);
    if (room && (room.currentStatus === 'booked' || room.currentStatus === 'occupied')) {
      setRoomStatus(booking.roomId, 'available');
    }

    logAudit(
      'BOOKING_CANCELLED',
      `Booking ${bookingId} for ${booking.customer.fullName} cancelled. Fee: ₹${cancellationFee}, Refund: ₹${refundAmount}. Reason: ${reason || 'N/A'}`,
      booking.hotelId
    );

    return { success: true };
  };

  const deleteBooking = (bookingId: string): { success: boolean; message: string } => {
    const target = bookings.find(b => b.id === bookingId);
    if (!target) return { success: false, message: 'Booking not found.' };

    setBookings(prev => prev.filter(b => b.id !== bookingId));

    // If room is occupied/booked by this booking, restore room status to available if no other active booking
    const room = rooms.find(r => r.id === target.roomId);
    if (room && (room.currentStatus === 'occupied' || room.currentStatus === 'booked')) {
      const remainingForRoom = bookings.filter(
        b => b.id !== bookingId && b.roomId === target.roomId && (b.status === 'reserved' || b.status === 'checked_in')
      );
      if (remainingForRoom.length === 0) {
        setRoomStatus(target.roomId, 'available', 'Booking record deleted');
      }
    }

    logAudit(
      'DELETE_BOOKING',
      `Permanently deleted booking #${target.id.slice(-6).toUpperCase()} for ${target.customer.fullName} (Room ${room?.roomNumber || 'N/A'})`,
      target.hotelId
    );
    notify(`Booking for ${target.customer.fullName} permanently deleted.`, 'success');
    return { success: true, message: 'Booking deleted successfully.' };
  };

  // Payment transactions
  const addPaymentTransaction = (
    bookingId: string,
    amount: number,
    method: PaymentMethod,
    referenceNo: string,
    notes?: string
  ): { success: boolean; error?: string } => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return { success: false, error: 'Booking not found.' };
    if (amount <= 0) return { success: false, error: 'Payment amount must be greater than zero.' };

    const newPayment = {
      id: `pm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bookingId,
      amount,
      method,
      date: new Date().toISOString(),
      referenceNo: referenceNo || `TXN-${Date.now().toString().slice(-6)}`,
      notes,
      recordedBy: currentUser.name,
    };

    const updatedPayments = [...booking.payments, newPayment];
    const financials = calculateBookingFinancials({
      ...booking,
      payments: updatedPayments,
    });

    setBookings(prev =>
      prev.map(b =>
        b.id === bookingId
          ? {
              ...b,
              payments: updatedPayments,
              totalAmountReceived: financials.totalAmountReceived,
              remainingBalance: financials.remainingBalance,
              paymentStatus: financials.paymentStatus,
              updatedAt: new Date().toISOString(),
            }
          : b
      )
    );

    logAudit(
      'PAYMENT_RECORDED',
      `Recorded payment of ₹${amount} via ${method.toUpperCase()} (Ref: ${newPayment.referenceNo}) for ${booking.customer.fullName}`,
      booking.hotelId
    );

    return { success: true };
  };

  const deletePaymentTransaction = (bookingId: string, paymentId: string): { success: boolean; message: string } => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return { success: false, message: 'Booking not found.' };

    const payment = booking.payments.find(p => p.id === paymentId);
    if (!payment) return { success: false, message: 'Payment record not found.' };

    const updatedPayments = booking.payments.filter(p => p.id !== paymentId);
    const financials = calculateBookingFinancials({
      ...booking,
      payments: updatedPayments,
    });

    setBookings(prev =>
      prev.map(b =>
        b.id === bookingId
          ? {
              ...b,
              payments: updatedPayments,
              totalAmountReceived: financials.totalAmountReceived,
              remainingBalance: financials.remainingBalance,
              paymentStatus: financials.paymentStatus,
              updatedAt: new Date().toISOString(),
            }
          : b
      )
    );

    logAudit(
      'DELETE_PAYMENT',
      `Deleted payment of ₹${payment.amount} (Ref: ${payment.referenceNo}) for ${booking.customer.fullName}`,
      booking.hotelId
    );
    notify(`Payment of ₹${payment.amount} removed.`, 'info');
    return { success: true, message: 'Payment deleted.' };
  };

  const addExtraChargeToBooking = (
    bookingId: string,
    charge: Omit<ExtraCharge, 'id' | 'date'>
  ): { success: boolean; error?: string } => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return { success: false, error: 'Booking not found.' };

    const newCharge: ExtraCharge = {
      ...charge,
      id: `ec-${Date.now()}`,
      date: new Date().toISOString(),
    };

    const updatedExtraCharges = [...booking.extraCharges, newCharge];
    const financials = calculateBookingFinancials({
      ...booking,
      extraCharges: updatedExtraCharges,
    });

    setBookings(prev =>
      prev.map(b =>
        b.id === bookingId
          ? {
              ...b,
              extraCharges: updatedExtraCharges,
              finalPayableAmount: financials.finalPayableAmount,
              remainingBalance: financials.remainingBalance,
              paymentStatus: financials.paymentStatus,
              updatedAt: new Date().toISOString(),
            }
          : b
      )
    );

    logAudit(
      'EXTRA_CHARGE_ADDED',
      `Added extra charge "${charge.title}" (₹${charge.amount}) for ${booking.customer.fullName}`,
      booking.hotelId
    );

    return { success: true };
  };

  const deleteExtraChargeFromBooking = (bookingId: string, chargeId: string): { success: boolean; message: string } => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return { success: false, message: 'Booking not found.' };

    const charge = booking.extraCharges.find(c => c.id === chargeId);
    if (!charge) return { success: false, message: 'Extra charge not found.' };

    const updatedExtraCharges = booking.extraCharges.filter(c => c.id !== chargeId);
    const financials = calculateBookingFinancials({
      ...booking,
      extraCharges: updatedExtraCharges,
    });

    setBookings(prev =>
      prev.map(b =>
        b.id === bookingId
          ? {
              ...b,
              extraCharges: updatedExtraCharges,
              finalPayableAmount: financials.finalPayableAmount,
              remainingBalance: financials.remainingBalance,
              paymentStatus: financials.paymentStatus,
              updatedAt: new Date().toISOString(),
            }
          : b
      )
    );

    logAudit(
      'DELETE_EXTRA_CHARGE',
      `Deleted charge "${charge.title}" (₹${charge.amount}) for ${booking.customer.fullName}`,
      booking.hotelId
    );
    notify(`Charge "${charge.title}" removed.`, 'info');
    return { success: true, message: 'Charge removed.' };
  };

  const applyBookingDiscount = (
    bookingId: string,
    discount: number,
    reason?: string
  ): { success: boolean; error?: string } => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return { success: false, error: 'Booking not found.' };

    const financials = calculateBookingFinancials({
      ...booking,
      discount,
    });

    setBookings(prev =>
      prev.map(b =>
        b.id === bookingId
          ? {
              ...b,
              discount,
              discountReason: reason || b.discountReason,
              finalPayableAmount: financials.finalPayableAmount,
              remainingBalance: financials.remainingBalance,
              paymentStatus: financials.paymentStatus,
              updatedAt: new Date().toISOString(),
            }
          : b
      )
    );

    logAudit(
      'DISCOUNT_APPLIED',
      `Applied discount of ₹${discount} to booking ${bookingId} (${reason || 'No reason stated'})`,
      booking.hotelId
    );

    return { success: true };
  };

  // Expenses CRUD
  const addExpense = (expenseData: Omit<ExpenseRecord, 'id'>) => {
    const newExpense: ExpenseRecord = {
      ...expenseData,
      id: `exp-${Date.now()}`,
    };
    setExpenses(prev => [newExpense, ...prev]);
    logAudit(
      'EXPENSE_RECORDED',
      `Recorded expense: ${expenseData.description} (₹${expenseData.amount}) under ${expenseData.category.toUpperCase()}`,
      expenseData.hotelId
    );
  };

  const deleteExpense = (id: string): { success: boolean; message: string } => {
    const target = expenses.find(e => e.id === id);
    if (!target) return { success: false, message: 'Expense record not found.' };

    setExpenses(prev => prev.filter(e => e.id !== id));
    logAudit('EXPENSE_DELETED', `Deleted expense: ${target.description} (₹${target.amount})`, target.hotelId);
    notify(`Expense deleted: ${target.description}`, 'info');
    return { success: true, message: 'Expense deleted successfully.' };
  };

  // Bills & Invoices
  const filteredSavedBills = useMemo(() => {
    if (selectedHotelId === 'all') return savedBills;
    return savedBills.filter(b => b.hotelId === selectedHotelId);
  }, [savedBills, selectedHotelId]);

  const saveBill = (bill: SavedBill) => {
    const billToSave: SavedBill = {
      ...bill,
      savedAt: new Date().toISOString(),
    };

    setSavedBills(prev => {
      const idx = prev.findIndex(b => b.id === bill.id || b.billNumber === bill.billNumber);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = billToSave;
        return copy;
      }
      return [billToSave, ...prev];
    });

    logAudit(
      'BILL_SAVED',
      `Saved bill #${bill.billNumber} for ${bill.guestName} (${activeHotel?.currency || '₹'}${bill.grandTotal.toLocaleString()})`,
      bill.hotelId
    );
    notify(`Bill #${bill.billNumber} saved successfully!`, 'success');
    return { success: true, message: `Bill #${bill.billNumber} saved securely.` };
  };

  const deleteSavedBill = (billId: string): { success: boolean; message: string } => {
    const target = savedBills.find(b => b.id === billId);
    if (!target) return { success: false, message: 'Bill not found.' };

    setSavedBills(prev => prev.filter(b => b.id !== billId));
    logAudit('BILL_DELETED', `Deleted bill #${target.billNumber} for ${target.guestName}`, target.hotelId);
    notify(`Bill #${target.billNumber} deleted successfully.`, 'info');
    return { success: true, message: `Bill #${target.billNumber} deleted.` };
  };

  const updateSavedBill = (billId: string, updated: Partial<SavedBill>) => {
    setSavedBills(prev =>
      prev.map(b => (b.id === billId ? { ...b, ...updated, savedAt: new Date().toISOString() } : b))
    );
    notify(`Bill updated successfully!`, 'success');
    return { success: true, message: 'Bill updated.' };
  };

  const generateBillFromBooking = (
    booking: Booking,
    customOptions?: { taxRate?: number; discount?: number; notes?: string; printFormat?: BillPrintFormat }
  ): SavedBill => {
    const room = rooms.find(r => r.id === booking.roomId);
    const taxRate = customOptions?.taxRate ?? 12;
    const discount = customOptions?.discount ?? booking.discount ?? 0;

    const items: SavedBillItem[] = [];

    // Room charges
    items.push({
      id: 'item-tariff',
      description: `Room Tariff - Room ${room?.roomNumber || 'N/A'} (${room?.roomType?.toUpperCase() || 'STANDARD'} ${room?.isAC ? 'AC' : 'Non-AC'})`,
      category: 'accommodation',
      quantity: booking.nights,
      unitPrice: booking.roomPricePerNight,
      totalPrice: booking.nights * booking.roomPricePerNight,
    });

    // Extra bed charges
    if (booking.extraBeds > 0) {
      items.push({
        id: 'item-extra-beds',
        description: `Extra Bed Charges (${booking.extraBeds} bed${booking.extraBeds > 1 ? 's' : ''})`,
        category: 'accommodation',
        quantity: booking.extraBeds * booking.nights,
        unitPrice: 800,
        totalPrice: booking.extraBeds * 800 * booking.nights,
      });
    }

    // Extra charges (dining, laundry, minibar, etc.)
    booking.extraCharges.forEach((c, idx) => {
      items.push({
        id: `item-extra-${idx}`,
        description: c.title,
        category: c.category,
        quantity: c.quantity || 1,
        unitPrice: c.amount,
        totalPrice: c.amount,
      });
    });

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxAmount = Math.round((subtotal * taxRate) / 100);
    const grandTotal = Math.max(0, subtotal + taxAmount - discount);
    const paidAmount = booking.totalAmountReceived;
    const balanceDue = Math.max(0, grandTotal - paidAmount);

    let paymentStatus: PaymentStatus = 'payment_pending';
    if (balanceDue === 0 && paidAmount > 0) {
      paymentStatus = 'paid_in_full';
    } else if (paidAmount > 0) {
      paymentStatus = 'partially_paid';
    }

    const billNumber = `INV-${booking.id.replace('bk-', '')}-${new Date(booking.bookingDate || Date.now()).getFullYear()}`;

    return {
      id: `bill-${booking.id}`,
      hotelId: booking.hotelId,
      bookingId: booking.id,
      billNumber,
      createdAt: booking.bookingDate || new Date().toISOString(),
      savedAt: new Date().toISOString(),
      guestName: booking.customer.fullName,
      guestPhone: booking.customer.mobileNumber,
      guestEmail: booking.customer.email,
      guestIdProof: `${booking.customer.idProofType.replace('_', ' ').toUpperCase()}: ${booking.customer.idProofNumber}`,
      roomNumber: room?.roomNumber,
      roomType: room?.roomType,
      isAC: room?.isAC,
      checkInDate: booking.checkInDate,
      checkOutDate: booking.checkOutDate,
      nights: booking.nights,
      items,
      subtotal,
      taxRatePercent: taxRate,
      taxAmount,
      discount,
      discountReason: booking.discountReason,
      grandTotal,
      paidAmount,
      balanceDue,
      paymentStatus,
      paymentMethod: booking.payments[0]?.method || 'cash',
      paymentRef: booking.payments[0]?.referenceNo,
      notes: customOptions?.notes || booking.specialRequests,
      printFormat: customOptions?.printFormat || 'standard',
    };
  };

  // Reset to default
  const resetToDefaultData = () => {
    localStorage.clear();
    setHotels(INITIAL_HOTELS);
    setRooms(INITIAL_ROOMS);
    setBookings(INITIAL_BOOKINGS);
    setSavedBills(INITIAL_SAVED_BILLS);
    setAllUsers(INITIAL_USERS);
    setCurrentUserId('user-owner-1');
    setSelectedHotelIdState('hotel-1');
    setExpenses(INITIAL_EXPENSES);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    logAudit('DATA_RESET', 'System data restored to initial factory defaults.');
    notify('Reset to default system state successfully.', 'info');
  };

  const exportDatabaseJson = () => {
    return JSON.stringify(
      {
        hotels,
        rooms,
        bookings,
        savedBills,
        allUsers,
        expenses,
        auditLogs,
        exportedAt: new Date().toISOString(),
        version: '1.0',
      },
      null,
      2
    );
  };

  const importDatabaseJson = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.hotels && data.rooms && data.bookings) {
        setHotels(data.hotels);
        setRooms(data.rooms);
        setBookings(data.bookings);
        if (data.savedBills) setSavedBills(data.savedBills);
        if (data.allUsers) setAllUsers(data.allUsers);
        if (data.expenses) setExpenses(data.expenses);
        if (data.auditLogs) setAuditLogs(data.auditLogs);
        logAudit('DATA_IMPORTED', 'Imported database backup JSON successfully.');
        notify('Backup restored successfully!', 'success');
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  };

  return (
    <HotelContext.Provider
      value={{
        toasts,
        notify,
        dismissToast,
        savedBills,
        filteredSavedBills,
        saveBill,
        deleteSavedBill,
        updateSavedBill,
        generateBillFromBooking,
        currentUser,
        allUsers,
        setCurrentUserById,
        createOwnerAccount,
        updateUserAccount,
        toggleUserStatus,
        deleteUserAccount,
        selectedHotelId,
        setSelectedHotelId,
        activeHotel,
        hotels,
        createHotel,
        updateHotel,
        rooms,
        filteredRooms,
        addRoom,
        updateRoom,
        deleteRoom,
        markRoomCleaned,
        setRoomStatus,
        isRoomAvailable,
        bookings,
        filteredBookings,
        createBooking,
        updateBooking,
        checkInGuest,
        checkOutGuest,
        cancelBooking,
        deleteBooking,
        addPaymentTransaction,
        deletePaymentTransaction,
        addExtraChargeToBooking,
        deleteExtraChargeFromBooking,
        applyBookingDiscount,
        expenses,
        filteredExpenses,
        addExpense,
        deleteExpense,
        auditLogs,
        filteredAuditLogs,
        resetToDefaultData,
        exportDatabaseJson,
        importDatabaseJson,
      }}
    >
      {children}
    </HotelContext.Provider>
  );
};

export const useHotel = () => {
  const context = useContext(HotelContext);
  if (!context) {
    throw new Error('useHotel must be used within a HotelProvider');
  }
  return context;
};

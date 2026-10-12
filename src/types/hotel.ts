/**
 * Core Type Definitions for Hotel Owner & Admin Management System
 */

export type Role = 'super_admin' | 'hotel_owner';

export type RoomType = 'single' | 'double' | 'deluxe' | 'family' | 'suite';

export type RoomStatus = 'available' | 'booked' | 'occupied' | 'cleaning' | 'maintenance';

export type BookingStatus = 'reserved' | 'checked_in' | 'checked_out' | 'cancelled';

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank_transfer';

export type PaymentStatus = 'paid_in_full' | 'partially_paid' | 'payment_pending' | 'refund_pending' | 'refunded';

export type IdProofType = 'passport' | 'driving_license' | 'national_id' | 'voter_id';

export interface Hotel {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  taxNumber?: string; // GST / VAT
  checkInTimeDefault: string; // e.g. "12:00"
  checkOutTimeDefault: string; // e.g. "11:00"
  currency: string; // e.g. "₹"
  description?: string;
  logoUrl?: string;
}

export interface Room {
  id: string;
  hotelId: string;
  roomNumber: string; // e.g. "101"
  floor: number; // e.g. 1
  roomType: RoomType;
  isAC: boolean;
  bedsCount: number;
  maxGuests: number;
  pricePerNight: number;
  extraBedCharge: number;
  facilities: string[];
  photoUrl?: string;
  currentStatus: RoomStatus;
  lastCleanedAt?: string;
  notes?: string;
}

export interface Customer {
  fullName: string;
  mobileNumber: string;
  email?: string;
  idProofType: IdProofType;
  idProofNumber: string;
  address?: string;
}

export interface PaymentTransaction {
  id: string;
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  date: string; // ISO string
  referenceNo: string;
  notes?: string;
  recordedBy: string; // Name/Email of actor
}

export interface ExtraCharge {
  id: string;
  title: string;
  category: 'food' | 'laundry' | 'extra_bed' | 'minibar' | 'room_service' | 'other';
  amount: number;
  date: string;
  quantity?: number;
}

export interface Booking {
  id: string;
  hotelId: string;
  roomId: string;
  customer: Customer;
  guestsCount: {
    adults: number;
    children: number;
  };
  extraBeds: number;
  bookingDate: string; // ISO string
  checkInDate: string; // YYYY-MM-DD
  checkInTime: string; // HH:mm
  checkOutDate: string; // YYYY-MM-DD
  checkOutTime: string; // HH:mm
  actualCheckIn?: string; // ISO string
  actualCheckOut?: string; // ISO string
  nights: number;
  roomPricePerNight: number;
  totalRoomCharges: number;
  extraCharges: ExtraCharge[];
  discount: number;
  discountReason?: string;
  finalPayableAmount: number;
  payments: PaymentTransaction[];
  totalAmountReceived: number;
  remainingBalance: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  cancellationCharge?: number;
  refundAmount?: number;
  specialRequests?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: Role;
  assignedHotelId?: string; // for hotel_owner
  phone: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface AuditLog {
  id: string;
  hotelId?: string;
  timestamp: string;
  actorName: string;
  actorRole: Role;
  action: string;
  details: string;
}

export interface ExpenseRecord {
  id: string;
  hotelId: string;
  category: 'salaries' | 'utilities' | 'maintenance' | 'supplies' | 'laundry' | 'marketing' | 'other';
  description: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
}

export type BillPrintFormat = 'standard' | 'thermal80' | 'thermal58';

export interface SavedBillItem {
  id: string;
  description: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SavedBill {
  id: string;
  hotelId: string;
  bookingId?: string;
  billNumber: string;
  createdAt: string;
  savedAt: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  guestIdProof?: string;
  roomNumber?: string;
  roomType?: string;
  isAC?: boolean;
  checkInDate?: string;
  checkOutDate?: string;
  nights?: number;
  items: SavedBillItem[];
  subtotal: number;
  taxRatePercent: number; // e.g. 12% or 18% GST/VAT
  taxAmount: number;
  discount: number;
  discountReason?: string;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentRef?: string;
  notes?: string;
  printFormat: BillPrintFormat;
}

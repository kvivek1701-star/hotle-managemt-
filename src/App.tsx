import React, { useState, useEffect } from 'react';
import { HotelProvider, useHotel } from './context/HotelContext';
import { HRMSProvider } from './context/HRMSContext';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { RoomManagementView } from './components/RoomManagementView';
import { CheckInOutDeskView } from './components/CheckInOutDeskView';
import { BookingManagementView } from './components/BookingManagementView';
import { AvailabilityCalendarView } from './components/AvailabilityCalendarView';
import { PaymentsLedgerView } from './components/PaymentsLedgerView';
import { BillsManagementView } from './components/BillsManagementView';
import { ReportsAccountingView } from './components/ReportsAccountingView';
import { AdminPanel } from './components/AdminPanel';
import { BookingModal } from './components/BookingModal';
import { InvoiceModal } from './components/InvoiceModal';
import { AddPaymentModal } from './components/AddPaymentModal';
import { AddExtraChargeModal } from './components/AddExtraChargeModal';
import { CancelBookingModal } from './components/CancelBookingModal';
import { RoomModal } from './components/RoomModal';
import { RoleSwitcherModal } from './components/RoleSwitcherModal';
import { ToastContainer } from './components/ToastContainer';
import { Booking, Room, SavedBill } from './types/hotel';

// HRMS Imports
import { HRMSSidebar, HRMSTab } from './components/hrms/HRMSSidebar';
import { HRMSNavbar } from './components/hrms/HRMSNavbar';
import { HRMSDashboardView } from './components/hrms/HRMSDashboardView';
import { EmployeeDirectoryView } from './components/hrms/EmployeeDirectoryView';
import { AttendanceManagementView } from './components/hrms/AttendanceManagementView';
import { DutySchedulingView } from './components/hrms/DutySchedulingView';
import { ShiftManagementView } from './components/hrms/ShiftManagementView';
import { OffTimeBreaksView } from './components/hrms/OffTimeBreaksView';
import { OvertimeManagementView } from './components/hrms/OvertimeManagementView';
import { LeaveManagementView } from './components/hrms/LeaveManagementView';
import { HolidaysManagementView } from './components/hrms/HolidaysManagementView';
import { PayrollManagementView } from './components/hrms/PayrollManagementView';
import { PayslipsView } from './components/hrms/PayslipsView';
import { HRMSReportsView } from './components/hrms/HRMSReportsView';
import { HRMSNotificationsView } from './components/hrms/HRMSNotificationsView';
import { HRMSSettingsView } from './components/hrms/HRMSSettingsView';
import { EmployeeSelfServiceView } from './components/hrms/EmployeeSelfServiceView';
import { PayrollRecord } from './types/hrms';

function MainLayout() {
  const { filteredRooms, activeHotel, hotels, selectedHotelId, checkInGuest } = useHotel();

  // Active App Suite: Default to 'hrms' to immediately show the requested complete HRMS software
  const [appSuite, setAppSuite] = useState<'pms' | 'hrms'>(() => {
    try {
      const saved = localStorage.getItem('grandstay_active_suite');
      return (saved as 'pms' | 'hrms') || 'hrms';
    } catch {
      return 'hrms';
    }
  });

  useEffect(() => {
    localStorage.setItem('grandstay_active_suite', appSuite);
  }, [appSuite]);

  // Hotel PMS State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [roomsFilterStatus, setRoomsFilterStatus] = useState<string>('all');
  const [deskSubTab, setDeskSubTab] = useState<'checkin' | 'checkout' | 'housekeeping'>('checkin');
  const [paymentsFilterStatus, setPaymentsFilterStatus] = useState<string>('all');
  const [reportsTimeframe, setReportsTimeframe] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [bookingsFilterStatus, setBookingsFilterStatus] = useState<string>('all');

  const handleNavigateToTab = (
    tab: ActiveTab,
    options?: {
      roomStatus?: string;
      deskTab?: 'checkin' | 'checkout' | 'housekeeping';
      paymentStatus?: string;
      reportTimeframe?: 'today' | 'week' | 'month' | 'all';
      bookingStatus?: string;
    }
  ) => {
    if (options?.roomStatus) setRoomsFilterStatus(options.roomStatus);
    if (options?.deskTab) setDeskSubTab(options.deskTab);
    if (options?.paymentStatus) setPaymentsFilterStatus(options.paymentStatus);
    if (options?.reportTimeframe) setReportsTimeframe(options.reportTimeframe);
    if (options?.bookingStatus) setBookingsFilterStatus(options.bookingStatus);
    setActiveTab(tab);
  };

  // HRMS State
  const [activeHRMSTab, setActiveHRMSTab] = useState<HRMSTab>('dashboard');
  const [selectedPayslipRecord, setSelectedPayslipRecord] = useState<PayrollRecord | null>(null);

  // Global PMS Modals
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [slotRoomId, setSlotRoomId] = useState<string | undefined>(undefined);
  const [slotDate, setSlotDate] = useState<string | undefined>(undefined);

  const [invoiceModalBooking, setInvoiceModalBooking] = useState<Booking | null>(null);
  const [invoiceModalSavedBill, setInvoiceModalSavedBill] = useState<SavedBill | null>(null);
  const [isGeneratingCustomBill, setIsGeneratingCustomBill] = useState(false);
  const [paymentModalBooking, setPaymentModalBooking] = useState<Booking | null>(null);
  const [extraChargeBooking, setExtraChargeBooking] = useState<Booking | null>(null);
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);

  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);

  // Helper for invoice modal
  const invoiceRoom = invoiceModalBooking
    ? filteredRooms.find(r => r.id === invoiceModalBooking.roomId)
    : null;
  const invoiceHotel = invoiceModalBooking
    ? hotels.find(h => h.id === invoiceModalBooking.hotelId) || activeHotel || hotels[0]
    : invoiceModalSavedBill
    ? hotels.find(h => h.id === invoiceModalSavedBill.hotelId) || activeHotel || hotels[0]
    : activeHotel || hotels[0];

  // If in HRMS mode, render the HRMS layout
  if (appSuite === 'hrms') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Top HRMS Navbar */}
        <HRMSNavbar
          onSwitchToPMS={() => setAppSuite('pms')}
          onOpenNotifications={() => setActiveHRMSTab('notifications')}
          onOpenSelfService={() => setActiveHRMSTab('self_service')}
        />

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* HRMS Sidebar */}
          <HRMSSidebar
            activeTab={activeHRMSTab}
            onSelectTab={tab => setActiveHRMSTab(tab)}
            onSwitchToPMS={() => setAppSuite('pms')}
          />

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-950">
            <div className="max-w-7xl mx-auto">
              {activeHRMSTab === 'dashboard' && (
                <HRMSDashboardView
                  onNavigateTab={tab => setActiveHRMSTab(tab)}
                  onOpenAddEmployee={() => setActiveHRMSTab('employees')}
                />
              )}

              {activeHRMSTab === 'employees' && (
                <EmployeeDirectoryView />
              )}

              {activeHRMSTab === 'attendance' && (
                <AttendanceManagementView />
              )}

              {activeHRMSTab === 'schedule' && (
                <DutySchedulingView />
              )}

              {activeHRMSTab === 'shifts' && (
                <ShiftManagementView />
              )}

              {activeHRMSTab === 'breaks' && (
                <OffTimeBreaksView />
              )}

              {activeHRMSTab === 'overtime' && (
                <OvertimeManagementView />
              )}

              {activeHRMSTab === 'leaves' && (
                <LeaveManagementView />
              )}

              {activeHRMSTab === 'holidays' && (
                <HolidaysManagementView />
              )}

              {activeHRMSTab === 'payroll' && (
                <PayrollManagementView
                  onOpenPayslip={rec => {
                    setSelectedPayslipRecord(rec);
                    setActiveHRMSTab('payslips');
                  }}
                  onNavigateTab={tab => setActiveHRMSTab(tab)}
                />
              )}

              {activeHRMSTab === 'payslips' && (
                <PayslipsView initialRecord={selectedPayslipRecord} />
              )}

              {activeHRMSTab === 'reports' && (
                <HRMSReportsView />
              )}

              {activeHRMSTab === 'notifications' && (
                <HRMSNotificationsView />
              )}

              {activeHRMSTab === 'settings' && (
                <HRMSSettingsView />
              )}

              {activeHRMSTab === 'self_service' && (
                <EmployeeSelfServiceView
                  onNavigateToPayslipsTab={() => setActiveHRMSTab('payslips')}
                />
              )}
            </div>
          </main>
        </div>

        {/* Global Real-Time Toast Notifications */}
        <ToastContainer />
      </div>
    );
  }

  // Otherwise, render the Hotel PMS layout
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navbar */}
      <Navbar
        onOpenNewBooking={() => {
          setEditingBooking(null);
          setSlotRoomId(undefined);
          setSlotDate(undefined);
          setBookingModalOpen(true);
        }}
        onOpenNewBill={() => {
          setInvoiceModalBooking(null);
          setInvoiceModalSavedBill(null);
          setIsGeneratingCustomBill(true);
        }}
        onOpenRoleSwitcher={() => setRoleSwitcherOpen(true)}
        onSwitchToHRMS={() => setAppSuite('hrms')}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={tab => {
            if (tab === 'rooms') setRoomsFilterStatus('all');
            if (tab === 'desk') setDeskSubTab('checkin');
            if (tab === 'payments') setPaymentsFilterStatus('all');
            if (tab === 'bookings') setBookingsFilterStatus('all');
            setActiveTab(tab);
          }}
          onSwitchToHRMS={() => setAppSuite('hrms')}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-950">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                onOpenNewBooking={() => {
                  setEditingBooking(null);
                  setSlotRoomId(undefined);
                  setSlotDate(undefined);
                  setBookingModalOpen(true);
                }}
                onOpenCheckIn={booking => checkInGuest(booking.id)}
                onOpenCheckOut={booking => {
                  setDeskSubTab('checkout');
                  setActiveTab('desk');
                }}
                onViewInvoice={booking => setInvoiceModalBooking(booking)}
                onEditBooking={booking => {
                  setEditingBooking(booking);
                  setBookingModalOpen(true);
                }}
                onNavigateToTab={handleNavigateToTab}
              />
            )}

            {activeTab === 'desk' && (
              <CheckInOutDeskView
                onViewInvoice={booking => {
                  setInvoiceModalBooking(booking);
                  setInvoiceModalSavedBill(null);
                  setIsGeneratingCustomBill(false);
                }}
                onViewSavedBill={bill => {
                  setInvoiceModalSavedBill(bill);
                  setInvoiceModalBooking(null);
                  setIsGeneratingCustomBill(false);
                }}
                onOpenNewBooking={() => {
                  setEditingBooking(null);
                  setSlotRoomId(undefined);
                  setSlotDate(undefined);
                  setBookingModalOpen(true);
                }}
                onNavigateHome={() => setActiveTab('dashboard')}
                initialSubTab={deskSubTab}
              />
            )}

            {activeTab === 'rooms' && (
              <RoomManagementView
                onOpenAddRoom={() => {
                  setEditingRoom(null);
                  setRoomModalOpen(true);
                }}
                onEditRoom={room => {
                  setEditingRoom(room);
                  setRoomModalOpen(true);
                }}
                initialStatusFilter={roomsFilterStatus}
              />
            )}

            {activeTab === 'bookings' && (
              <BookingManagementView
                onOpenNewBooking={() => {
                  setEditingBooking(null);
                  setSlotRoomId(undefined);
                  setSlotDate(undefined);
                  setBookingModalOpen(true);
                }}
                onEditBooking={booking => {
                  setEditingBooking(booking);
                  setBookingModalOpen(true);
                }}
                onViewInvoice={booking => setInvoiceModalBooking(booking)}
                onAddPayment={booking => setPaymentModalBooking(booking)}
                onAddExtraCharge={booking => setExtraChargeBooking(booking)}
                onCancelBooking={booking => setCancelModalBooking(booking)}
                onCheckIn={booking => checkInGuest(booking.id)}
                onCheckOut={booking => {
                  setDeskSubTab('checkout');
                  setActiveTab('desk');
                }}
                initialStatusFilter={bookingsFilterStatus}
              />
            )}

            {activeTab === 'calendar' && (
              <AvailabilityCalendarView
                onSelectSlot={(roomId, dateStr) => {
                  setEditingBooking(null);
                  setSlotRoomId(roomId);
                  setSlotDate(dateStr);
                  setBookingModalOpen(true);
                }}
                onViewBooking={booking => setInvoiceModalBooking(booking)}
              />
            )}

            {activeTab === 'payments' && (
              <PaymentsLedgerView
                onAddPayment={booking => setPaymentModalBooking(booking)}
                onAddExtraCharge={booking => setExtraChargeBooking(booking)}
                onViewInvoice={booking => {
                  setInvoiceModalBooking(booking);
                  setInvoiceModalSavedBill(null);
                  setIsGeneratingCustomBill(false);
                }}
                initialStatusFilter={paymentsFilterStatus}
              />
            )}

            {activeTab === 'bills' && (
              <BillsManagementView
                onOpenBillPreview={bill => {
                  setInvoiceModalSavedBill(bill);
                  setInvoiceModalBooking(null);
                  setIsGeneratingCustomBill(false);
                }}
                onOpenCreateNewBill={() => {
                  setInvoiceModalBooking(null);
                  setInvoiceModalSavedBill(null);
                  setIsGeneratingCustomBill(true);
                }}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsAccountingView initialTimeframe={reportsTimeframe} />
            )}

            {activeTab === 'admin' && <AdminPanel />}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      {bookingModalOpen && (
        <BookingModal
          initialBooking={editingBooking}
          defaultRoomId={slotRoomId}
          defaultDate={slotDate}
          onClose={() => {
            setBookingModalOpen(false);
            setEditingBooking(null);
            setSlotRoomId(undefined);
            setSlotDate(undefined);
          }}
        />
      )}

      {(invoiceModalBooking || invoiceModalSavedBill || isGeneratingCustomBill) && invoiceHotel && (
        <InvoiceModal
          booking={invoiceModalBooking}
          savedBill={invoiceModalSavedBill}
          hotel={invoiceHotel}
          roomNumber={invoiceRoom?.roomNumber || invoiceModalSavedBill?.roomNumber || '101'}
          roomType={invoiceRoom?.roomType || invoiceModalSavedBill?.roomType || 'standard'}
          isAC={invoiceRoom?.isAC ?? invoiceModalSavedBill?.isAC ?? true}
          onClose={() => {
            setInvoiceModalBooking(null);
            setInvoiceModalSavedBill(null);
            setIsGeneratingCustomBill(false);
          }}
        />
      )}

      {paymentModalBooking && (
        <AddPaymentModal
          booking={paymentModalBooking}
          onClose={() => setPaymentModalBooking(null)}
        />
      )}

      {extraChargeBooking && (
        <AddExtraChargeModal
          booking={extraChargeBooking}
          onClose={() => setExtraChargeBooking(null)}
        />
      )}

      {cancelModalBooking && (
        <CancelBookingModal
          booking={cancelModalBooking}
          onClose={() => setCancelModalBooking(null)}
        />
      )}

      {roomModalOpen && (
        <RoomModal
          initialRoom={editingRoom}
          onClose={() => {
            setRoomModalOpen(false);
            setEditingRoom(null);
          }}
        />
      )}

      {roleSwitcherOpen && (
        <RoleSwitcherModal onClose={() => setRoleSwitcherOpen(false)} />
      )}

      {/* Global Real-Time Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <HotelProvider>
      <HRMSProvider>
        <MainLayout />
      </HRMSProvider>
    </HotelProvider>
  );
}

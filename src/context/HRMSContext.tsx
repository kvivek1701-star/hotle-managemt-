import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Employee,
  Shift,
  DutySchedule,
  AttendanceRecord,
  AttendanceCorrectionRequest,
  OvertimeRecord,
  LeaveRequest,
  LeaveBalance,
  Holiday,
  PayrollRecord,
  HRMSNotification,
  HRMSSettings,
  HRMSAuditLog,
  HRMSUserRole,
  Department,
  LeaveType,
} from '../types/hrms';

export interface HRMSStats {
  totalEmployees: number;
  activeEmployees: number;
  absentEmployees: number;
  onLeaveEmployees: number;
  todayPresentCount: number;
  todayClockedInCount: number;
  todayOnBreakCount: number;
  todayLateCount: number;
  totalRegularHoursToday: number;
  totalOvertimeHoursToday: number;
  pendingLeaveRequestsCount: number;
  pendingOvertimeApprovalsCount: number;
  pendingCorrectionRequestsCount: number;
  monthlyPayrollEstimatedTotal: number;
  upcomingDisbursementsCount: number;
}

export interface HRMSContextType {
  // Current user persona
  hrmsRole: HRMSUserRole;
  setHRMSRole: (role: HRMSUserRole) => void;
  currentEmployeeUser: Employee;
  setCurrentEmployeeUser: (emp: Employee) => void;
  
  // Data lists
  employees: Employee[];
  shifts: Shift[];
  dutySchedules: DutySchedule[];
  attendanceRecords: AttendanceRecord[];
  correctionRequests: AttendanceCorrectionRequest[];
  overtimeRecords: OvertimeRecord[];
  leaveRequests: LeaveRequest[];
  leaveBalances: Record<string, LeaveBalance>; // keyed by employeeId
  holidays: Holiday[];
  payrollRecords: PayrollRecord[];
  notifications: HRMSNotification[];
  settings: HRMSSettings;
  auditLogs: HRMSAuditLog[];

  // Stats
  stats: HRMSStats;

  // Employee methods
  addEmployee: (emp: Omit<Employee, 'id'>) => { success: boolean; message: string; employee?: Employee };
  updateEmployee: (id: string, data: Partial<Employee>) => { success: boolean; message: string };
  deleteEmployee: (id: string) => { success: boolean; message: string };
  toggleEmployeeStatus: (id: string) => void;

  // Attendance & Punch Clock methods
  clockIn: (employeeId: string, location?: string) => { success: boolean; message: string };
  clockOut: (employeeId: string) => { success: boolean; message: string };
  startBreak: (employeeId: string) => { success: boolean; message: string };
  endBreak: (employeeId: string) => { success: boolean; message: string };
  addAttendanceRecord: (record: Omit<AttendanceRecord, 'id'>) => { success: boolean; message: string };
  updateAttendanceRecord: (id: string, data: Partial<AttendanceRecord>) => { success: boolean; message: string };
  deleteAttendanceRecord: (id: string) => { success: boolean; message: string };
  submitCorrectionRequest: (data: Omit<AttendanceCorrectionRequest, 'id' | 'status' | 'requestedAt'>) => { success: boolean; message: string };
  approveCorrectionRequest: (id: string, reviewerNotes?: string) => { success: boolean; message: string };
  rejectCorrectionRequest: (id: string, reviewerNotes?: string) => { success: boolean; message: string };
  deleteCorrectionRequest: (id: string) => { success: boolean; message: string };

  // Shifts & Duty Schedule methods
  addShift: (shift: Omit<Shift, 'id'>) => { success: boolean; message: string };
  updateShift: (id: string, data: Partial<Shift>) => { success: boolean; message: string };
  deleteShift: (id: string) => { success: boolean; message: string };
  assignDutySchedule: (schedule: Omit<DutySchedule, 'id'>) => { success: boolean; message: string };
  bulkAssignDutySchedules: (schedules: Omit<DutySchedule, 'id'>[]) => { success: boolean; message: string };
  updateDutySchedule: (id: string, data: Partial<DutySchedule>) => { success: boolean; message: string };
  deleteDutySchedule: (id: string) => { success: boolean; message: string };
  detectScheduleConflicts: (employeeId: string, date: string, shiftId: string) => string | null;

  // Overtime methods
  submitOvertimeRequest: (record: Omit<OvertimeRecord, 'id' | 'status' | 'requestedAt' | 'calculatedAmount'>) => { success: boolean; message: string };
  approveOvertimeRequest: (id: string) => { success: boolean; message: string };
  rejectOvertimeRequest: (id: string, reason?: string) => { success: boolean; message: string };
  deleteOvertimeRecord: (id: string) => { success: boolean; message: string };

  // Leave methods
  submitLeaveRequest: (req: Omit<LeaveRequest, 'id' | 'status' | 'appliedAt'>) => { success: boolean; message: string };
  approveLeaveRequest: (id: string, notes?: string) => { success: boolean; message: string };
  rejectLeaveRequest: (id: string, notes?: string) => { success: boolean; message: string };
  deleteLeaveRequest: (id: string) => { success: boolean; message: string };
  getEmployeeLeaveBalance: (employeeId: string) => LeaveBalance;

  // Holiday methods
  addHoliday: (holiday: Omit<Holiday, 'id'>) => { success: boolean; message: string };
  updateHoliday: (id: string, data: Partial<Holiday>) => { success: boolean; message: string };
  deleteHoliday: (id: string) => { success: boolean; message: string };

  // Payroll methods
  generateMonthlyPayroll: (monthStr: string, department?: string) => { success: boolean; message: string; count: number };
  updatePayrollRecord: (id: string, data: Partial<PayrollRecord>) => { success: boolean; message: string };
  approvePayrollRecord: (id: string) => { success: boolean; message: string };
  markPayrollPaid: (id: string, method?: 'bank_transfer' | 'direct_deposit' | 'cheque' | 'cash', ref?: string) => { success: boolean; message: string };
  deletePayrollRecord: (id: string) => { success: boolean; message: string };

  // Settings & Notifications
  updateSettings: (newSettings: Partial<HRMSSettings>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => { success: boolean; message: string };
  addNotification: (title: string, message: string, type: HRMSNotification['type'], targetEmployeeId?: string) => void;
  addAuditLog: (action: string, details: string) => void;
}

const HRMSContext = createContext<HRMSContextType | undefined>(undefined);

// Initial Mock Data
const INITIAL_SETTINGS: HRMSSettings = {
  companyName: 'GrandStay Resort & Hospitality Group',
  legalEntityName: 'GrandStay Hospitality International Ltd.',
  companyAddress: 'Ocean Drive Boulevard, Grand Bay Marina, Suite 400',
  companyPhone: '+1 (800) 555-4726',
  companyEmail: 'hr@grandstayhospitality.com',
  taxRegistrationNumber: 'GST-US-99281744-X',
  standardDailyHours: 8,
  standardWeeklyHours: 40,
  overtimeRateWeekday: 1.5,
  overtimeRateWeekendOrHoliday: 2.0,
  defaultGracePeriodMinutes: 15,
  monthlyPayrollCutoffDay: 28,
  currency: '₹',
  unpaidLunchBreakMinutes: 30,
  paidTeaBreakMinutes: 15,
};

const INITIAL_SHIFTS: Shift[] = [
  {
    id: 'shift-1',
    name: 'Morning Shift',
    code: 'MS',
    startTime: '06:00',
    endTime: '14:30',
    isOvernight: false,
    breakMinutes: 30,
    requiredWorkingHours: 8,
    color: '#0284c7', // Sky
    activeDays: [1, 2, 3, 4, 5],
    description: 'Front desk morning check-ins, breakfast buffet culinary, housekeeping morning floor run',
  },
  {
    id: 'shift-2',
    name: 'General Day Shift',
    code: 'GS',
    startTime: '09:00',
    endTime: '17:30',
    isOvernight: false,
    breakMinutes: 30,
    requiredWorkingHours: 8,
    color: '#10b981', // Emerald
    activeDays: [1, 2, 3, 4, 5],
    description: 'Management, HR, Finance, and primary operations schedule',
  },
  {
    id: 'shift-3',
    name: 'Evening Shift',
    code: 'ES',
    startTime: '14:00',
    endTime: '22:30',
    isOvernight: false,
    breakMinutes: 30,
    requiredWorkingHours: 8,
    color: '#f59e0b', // Amber
    activeDays: [1, 2, 3, 4, 5, 6],
    description: 'Dinner culinary service, evening arrivals, room turn-down service',
  },
  {
    id: 'shift-4',
    name: 'Night / Overnight Shift',
    code: 'NS',
    startTime: '22:00',
    endTime: '06:30',
    isOvernight: true,
    breakMinutes: 30,
    requiredWorkingHours: 8,
    color: '#8b5cf6', // Violet
    activeDays: [0, 1, 2, 3, 4, 5, 6],
    description: 'Night audit, overnight security perimeter, urgent guest assistance',
  },
];

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    employeeId: 'EMP-1001',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@grandstay.com',
    phone: '+1 (555) 234-5671',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    department: 'Front Desk',
    jobTitle: 'Front Office Manager',
    joiningDate: '2022-03-15',
    employmentType: 'full_time',
    status: 'active',
    assignedManagerId: 'emp-6',
    assignedManagerName: 'Alexander Vance',
    workLocation: 'Main Resort Tower',
    defaultShiftId: 'shift-1',
    salaryType: 'monthly',
    payRate: 4800,
    bankDetails: {
      bankName: 'Chase Manhattan Bank',
      accountNumber: '**** **** 4819',
      ifscOrRouting: 'CHASUS33',
      taxIdOrPan: 'SSN-XXX-45-9012',
    },
    emergencyContact: {
      name: 'Michael Jenkins',
      relation: 'Spouse',
      phone: '+1 (555) 890-1234',
    },
    documents: [
      { id: 'doc-1', name: 'Employment_Agreement.pdf', type: 'PDF', uploadDate: '2022-03-15', fileSize: '1.2 MB' },
      { id: 'doc-2', name: 'Hospitality_Degree_Cert.pdf', type: 'PDF', uploadDate: '2022-03-15', fileSize: '850 KB' },
    ],
    notes: 'Handles high-profile VIP guest coordination and front office staff schedules.',
  },
  {
    id: 'emp-2',
    employeeId: 'EMP-1002',
    name: 'David Chen',
    email: 'david.chen@grandstay.com',
    phone: '+1 (555) 345-6782',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    department: 'Housekeeping',
    jobTitle: 'Executive Housekeeper',
    joiningDate: '2021-08-01',
    employmentType: 'full_time',
    status: 'active',
    assignedManagerId: 'emp-6',
    assignedManagerName: 'Alexander Vance',
    workLocation: 'Main Resort Tower',
    defaultShiftId: 'shift-1',
    salaryType: 'monthly',
    payRate: 4200,
    bankDetails: {
      bankName: 'Bank of America',
      accountNumber: '**** **** 9043',
      ifscOrRouting: 'BOFAUS3N',
      taxIdOrPan: 'SSN-XXX-78-4321',
    },
    emergencyContact: {
      name: 'Mei Chen',
      relation: 'Sister',
      phone: '+1 (555) 765-4321',
    },
    documents: [
      { id: 'doc-3', name: 'Contract_2021.pdf', type: 'PDF', uploadDate: '2021-08-01', fileSize: '980 KB' },
      { id: 'doc-4', name: 'Safety_Training_Card.pdf', type: 'PDF', uploadDate: '2024-01-10', fileSize: '420 KB' },
    ],
    notes: 'Oversees 24 floor attendants and daily room turnover standards.',
  },
  {
    id: 'emp-3',
    employeeId: 'EMP-1003',
    name: 'Maria Rodriguez',
    email: 'maria.rodriguez@grandstay.com',
    phone: '+1 (555) 456-7893',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    department: 'Kitchen & Culinary',
    jobTitle: 'Executive Chef',
    joiningDate: '2020-11-10',
    employmentType: 'full_time',
    status: 'active',
    assignedManagerId: 'emp-6',
    assignedManagerName: 'Alexander Vance',
    workLocation: 'Harbor Grill & Bistro',
    defaultShiftId: 'shift-3',
    salaryType: 'monthly',
    payRate: 5600,
    bankDetails: {
      bankName: 'Wells Fargo',
      accountNumber: '**** **** 3218',
      ifscOrRouting: 'WFBIUS6S',
      taxIdOrPan: 'SSN-XXX-33-8899',
    },
    emergencyContact: {
      name: 'Carlos Rodriguez',
      relation: 'Brother',
      phone: '+1 (555) 998-7766',
    },
    documents: [
      { id: 'doc-5', name: 'Culinary_Mastery_Diploma.pdf', type: 'PDF', uploadDate: '2020-11-10', fileSize: '2.1 MB' },
    ],
    notes: 'Award-winning culinary director overseeing banquet and dining outlets.',
  },
  {
    id: 'emp-4',
    employeeId: 'EMP-1004',
    name: 'James O’Connor',
    email: 'james.oconnor@grandstay.com',
    phone: '+1 (555) 567-8904',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    department: 'Security & Safety',
    jobTitle: 'Chief Security Officer',
    joiningDate: '2023-01-20',
    employmentType: 'full_time',
    status: 'active',
    assignedManagerId: 'emp-6',
    assignedManagerName: 'Alexander Vance',
    workLocation: 'Resort Campus Wide',
    defaultShiftId: 'shift-4',
    salaryType: 'monthly',
    payRate: 4100,
    bankDetails: {
      bankName: 'Citibank',
      accountNumber: '**** **** 7711',
      ifscOrRouting: 'CITIUS33',
      taxIdOrPan: 'SSN-XXX-12-6543',
    },
    emergencyContact: {
      name: 'Eileen O’Connor',
      relation: 'Spouse',
      phone: '+1 (555) 321-9876',
    },
    documents: [
      { id: 'doc-6', name: 'Security_License_Class_A.pdf', type: 'PDF', uploadDate: '2023-01-20', fileSize: '1.4 MB' },
    ],
    notes: 'CCTV surveillance, incident reporting, and guest safety audits.',
  },
  {
    id: 'emp-5',
    employeeId: 'EMP-1005',
    name: 'Emily Watson',
    email: 'emily.watson@grandstay.com',
    phone: '+1 (555) 678-9015',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    department: 'Human Resources',
    jobTitle: 'HR & Talent Specialist',
    joiningDate: '2023-06-01',
    employmentType: 'full_time',
    status: 'active',
    assignedManagerId: 'emp-6',
    assignedManagerName: 'Alexander Vance',
    workLocation: 'Corporate Suite',
    defaultShiftId: 'shift-2',
    salaryType: 'monthly',
    payRate: 4600,
    bankDetails: {
      bankName: 'Chase Manhattan Bank',
      accountNumber: '**** **** 5522',
      ifscOrRouting: 'CHASUS33',
      taxIdOrPan: 'SSN-XXX-90-1122',
    },
    emergencyContact: {
      name: 'Arthur Watson',
      relation: 'Father',
      phone: '+1 (555) 443-2211',
    },
    documents: [
      { id: 'doc-7', name: 'HRCI_Certification.pdf', type: 'PDF', uploadDate: '2023-06-01', fileSize: '650 KB' },
    ],
    notes: 'Manages employee onboarding, compliance, and benefit schemes.',
  },
  {
    id: 'emp-6',
    employeeId: 'EMP-1000',
    name: 'Alexander Vance',
    email: 'alexander.vance@grandstay.com',
    phone: '+1 (555) 123-4560',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    department: 'Management',
    jobTitle: 'General Manager / Director of Operations',
    joiningDate: '2019-04-01',
    employmentType: 'full_time',
    status: 'active',
    workLocation: 'Executive HQ',
    defaultShiftId: 'shift-2',
    salaryType: 'monthly',
    payRate: 8500,
    bankDetails: {
      bankName: 'Morgan Stanley Wealth',
      accountNumber: '**** **** 1100',
      ifscOrRouting: 'MSWDUS33',
      taxIdOrPan: 'SSN-XXX-00-1199',
    },
    emergencyContact: {
      name: 'Victoria Vance',
      relation: 'Spouse',
      phone: '+1 (555) 777-8899',
    },
    documents: [
      { id: 'doc-8', name: 'Executive_Contract.pdf', type: 'PDF', uploadDate: '2019-04-01', fileSize: '3.2 MB' },
    ],
    notes: 'Operational oversight across rooms, food & beverage, and hotel assets.',
  },
  {
    id: 'emp-7',
    employeeId: 'EMP-1007',
    name: 'Liam Gallagher',
    email: 'liam.gallagher@grandstay.com',
    phone: '+1 (555) 789-0126',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    department: 'Maintenance & Facilities',
    jobTitle: 'HVAC & Facilities Technician',
    joiningDate: '2022-09-12',
    employmentType: 'full_time',
    status: 'active',
    assignedManagerId: 'emp-6',
    assignedManagerName: 'Alexander Vance',
    workLocation: 'Resort Campus Wide',
    defaultShiftId: 'shift-1',
    salaryType: 'hourly',
    payRate: 350, // ₹350/hr
    bankDetails: {
      bankName: 'PNC Bank',
      accountNumber: '**** **** 8844',
      ifscOrRouting: 'PNCCUS33',
      taxIdOrPan: 'SSN-XXX-44-3322',
    },
    emergencyContact: {
      name: 'Sean Gallagher',
      relation: 'Brother',
      phone: '+1 (555) 888-9999',
    },
    documents: [
      { id: 'doc-9', name: 'HVAC_Certified_Cert.pdf', type: 'PDF', uploadDate: '2022-09-12', fileSize: '1.1 MB' },
    ],
    notes: 'Electrical systems, chilled water cooling loops, and room plumbing.',
  },
  {
    id: 'emp-8',
    employeeId: 'EMP-1008',
    name: 'Jessica Taylor',
    email: 'jessica.taylor@grandstay.com',
    phone: '+1 (555) 890-1237',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    department: 'Front Desk',
    jobTitle: 'Guest Relations Associate',
    joiningDate: '2023-10-05',
    employmentType: 'full_time',
    status: 'on_leave',
    assignedManagerId: 'emp-1',
    assignedManagerName: 'Sarah Jenkins',
    workLocation: 'Main Resort Tower',
    defaultShiftId: 'shift-1',
    salaryType: 'monthly',
    payRate: 3600,
    bankDetails: {
      bankName: 'Capital One',
      accountNumber: '**** **** 6621',
      ifscOrRouting: 'COAFUS33',
      taxIdOrPan: 'SSN-XXX-66-7788',
    },
    emergencyContact: {
      name: 'Robert Taylor',
      relation: 'Father',
      phone: '+1 (555) 222-3344',
    },
    documents: [
      { id: 'doc-10', name: 'Resume_Jessica.pdf', type: 'PDF', uploadDate: '2023-10-05', fileSize: '520 KB' },
    ],
    notes: 'Currently on scheduled annual leave until end of the week.',
  },
];

const INITIAL_HOLIDAYS: Holiday[] = [
  { id: 'hol-1', name: 'New Year’s Day', date: '2026-01-01', type: 'public', description: 'Statutory public holiday' },
  { id: 'hol-2', name: 'Memorial Day', date: '2026-05-25', type: 'public', description: 'National public observance' },
  { id: 'hol-3', name: 'Independence Day', date: '2026-07-04', type: 'public', description: 'National holiday' },
  { id: 'hol-4', name: 'Labor Day', date: '2026-09-07', type: 'public', description: 'Public recognition holiday' },
  { id: 'hol-5', name: 'GrandStay Hospitality Foundation Day', date: '2026-10-24', type: 'company', description: 'Annual company anniversary gala' },
  { id: 'hol-6', name: 'Thanksgiving Day', date: '2026-11-26', type: 'public', description: 'National holiday' },
  { id: 'hol-7', name: 'Christmas Day', date: '2026-12-25', type: 'public', description: 'Statutory festive holiday' },
];

const TODAY = new Date().toISOString().split('T')[0];

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-1',
    employeeId: 'emp-1',
    employeeName: 'Sarah Jenkins',
    department: 'Front Desk',
    date: TODAY,
    clockIn: '05:55',
    clockOut: undefined,
    breakStart: undefined,
    breakEnd: undefined,
    totalBreakMinutes: 0,
    regularHours: 6.5,
    overtimeHours: 0,
    status: 'present',
    isLate: false,
    lateMinutes: 0,
    isEarlyDeparture: false,
    earlyDepartureMinutes: 0,
    location: 'Main Desk Terminal',
    notes: 'Clocked in on time for morning turnover',
  },
  {
    id: 'att-2',
    employeeId: 'emp-2',
    employeeName: 'David Chen',
    department: 'Housekeeping',
    date: TODAY,
    clockIn: '06:18',
    clockOut: undefined,
    breakStart: '10:30',
    breakEnd: '11:00',
    totalBreakMinutes: 30,
    regularHours: 5.5,
    overtimeHours: 0,
    status: 'late',
    isLate: true,
    lateMinutes: 18,
    isEarlyDeparture: false,
    earlyDepartureMinutes: 0,
    location: 'Staff Locker Bay',
    notes: 'Arrived 18 mins late due to transit delay',
  },
  {
    id: 'att-3',
    employeeId: 'emp-3',
    employeeName: 'Maria Rodriguez',
    department: 'Kitchen & Culinary',
    date: TODAY,
    clockIn: '13:50',
    clockOut: undefined,
    breakStart: undefined,
    breakEnd: undefined,
    totalBreakMinutes: 0,
    regularHours: 4.0,
    overtimeHours: 0,
    status: 'present',
    isLate: false,
    lateMinutes: 0,
    isEarlyDeparture: false,
    earlyDepartureMinutes: 0,
    location: 'Kitchen Station A',
    notes: 'Prep shift for dinner banquets',
  },
  {
    id: 'att-4',
    employeeId: 'emp-4',
    employeeName: 'James O’Connor',
    department: 'Security & Safety',
    date: TODAY,
    clockIn: undefined,
    clockOut: undefined,
    totalBreakMinutes: 0,
    regularHours: 0,
    overtimeHours: 0,
    status: 'scheduled',
    isLate: false,
    lateMinutes: 0,
    isEarlyDeparture: false,
    earlyDepartureMinutes: 0,
    location: 'Security Gate 1',
    notes: 'Scheduled for night shift 22:00',
  } as unknown as AttendanceRecord,
  {
    id: 'att-5',
    employeeId: 'emp-5',
    employeeName: 'Emily Watson',
    department: 'Human Resources',
    date: TODAY,
    clockIn: '08:52',
    clockOut: undefined,
    breakStart: undefined,
    breakEnd: undefined,
    totalBreakMinutes: 0,
    regularHours: 7.0,
    overtimeHours: 0,
    status: 'present',
    isLate: false,
    lateMinutes: 0,
    isEarlyDeparture: false,
    earlyDepartureMinutes: 0,
    location: 'Corporate HQ Office',
    notes: 'On duty',
  },
  {
    id: 'att-6',
    employeeId: 'emp-6',
    employeeName: 'Alexander Vance',
    department: 'Management',
    date: TODAY,
    clockIn: '08:30',
    clockOut: undefined,
    breakStart: undefined,
    breakEnd: undefined,
    totalBreakMinutes: 0,
    regularHours: 7.5,
    overtimeHours: 0,
    status: 'present',
    isLate: false,
    lateMinutes: 0,
    isEarlyDeparture: false,
    earlyDepartureMinutes: 0,
    location: 'Executive Suite',
    notes: 'Executive inspections completed',
  },
  {
    id: 'att-7',
    employeeId: 'emp-7',
    employeeName: 'Liam Gallagher',
    department: 'Maintenance & Facilities',
    date: TODAY,
    clockIn: '06:00',
    clockOut: '14:30',
    breakStart: '10:00',
    breakEnd: '10:30',
    totalBreakMinutes: 30,
    regularHours: 8.0,
    overtimeHours: 1.5,
    status: 'present',
    isLate: false,
    lateMinutes: 0,
    isEarlyDeparture: false,
    earlyDepartureMinutes: 0,
    location: 'Chiller Plant Room',
    notes: 'Completed 1.5h emergency chiller maintenance overtime',
  },
  {
    id: 'att-8',
    employeeId: 'emp-8',
    employeeName: 'Jessica Taylor',
    department: 'Front Desk',
    date: TODAY,
    clockIn: undefined,
    clockOut: undefined,
    totalBreakMinutes: 0,
    regularHours: 0,
    overtimeHours: 0,
    status: 'on_leave',
    isLate: false,
    lateMinutes: 0,
    isEarlyDeparture: false,
    earlyDepartureMinutes: 0,
    notes: 'On approved annual leave',
  },
];

const INITIAL_OVERTIME: OvertimeRecord[] = [
  {
    id: 'ot-1',
    employeeId: 'emp-7',
    employeeName: 'Liam Gallagher',
    department: 'Maintenance & Facilities',
    date: TODAY,
    hours: 1.5,
    rateMultiplier: 1.5,
    hourlyRate: 26,
    calculatedAmount: 58.5,
    reason: 'Emergency chiller loop pressure regulator repair during peak hotel occupancy.',
    status: 'pending',
    requestedAt: `${TODAY} 14:35`,
  },
  {
    id: 'ot-2',
    employeeId: 'emp-3',
    employeeName: 'Maria Rodriguez',
    department: 'Kitchen & Culinary',
    date: '2026-10-09',
    hours: 2.0,
    rateMultiplier: 1.5,
    hourlyRate: 35,
    calculatedAmount: 105.0,
    reason: 'Presidential banquet private catering service extension.',
    status: 'approved',
    requestedAt: '2026-10-09 22:45',
    approvedBy: 'Alexander Vance',
    approvedAt: '2026-10-10 09:15',
  },
  {
    id: 'ot-3',
    employeeId: 'emp-2',
    employeeName: 'David Chen',
    department: 'Housekeeping',
    date: '2026-10-08',
    hours: 2.5,
    rateMultiplier: 2.0, // Sunday holiday OT
    hourlyRate: 26.25,
    calculatedAmount: 131.25,
    reason: 'Sunday turnaround for 35 corporate group checkouts.',
    status: 'approved',
    requestedAt: '2026-10-08 17:10',
    approvedBy: 'Alexander Vance',
    approvedAt: '2026-10-08 18:30',
  },
];

const INITIAL_LEAVES: LeaveRequest[] = [
  {
    id: 'leave-1',
    employeeId: 'emp-8',
    employeeName: 'Jessica Taylor',
    department: 'Front Desk',
    leaveType: 'annual',
    startDate: TODAY,
    endDate: '2026-10-16',
    totalDays: 5,
    reason: 'Family reunion trip planned in advance.',
    status: 'approved',
    appliedAt: '2026-10-01 10:00',
    reviewedBy: 'Emily Watson',
    reviewNotes: 'Cover shift arranged with Sarah Jenkins.',
  },
  {
    id: 'leave-2',
    employeeId: 'emp-1',
    employeeName: 'Sarah Jenkins',
    department: 'Front Desk',
    leaveType: 'casual',
    startDate: '2026-10-22',
    endDate: '2026-10-23',
    totalDays: 2,
    reason: 'Attending regional hotel management summit.',
    status: 'pending',
    appliedAt: `${TODAY} 08:30`,
  },
  {
    id: 'leave-3',
    employeeId: 'emp-4',
    employeeName: 'James O’Connor',
    department: 'Security & Safety',
    leaveType: 'sick',
    startDate: '2026-10-05',
    endDate: '2026-10-06',
    totalDays: 2,
    reason: 'Dental surgery and prescribed recovery.',
    status: 'approved',
    appliedAt: '2026-10-04 19:20',
    reviewedBy: 'Emily Watson',
    reviewNotes: 'Medical certificate on file.',
  },
];

const INITIAL_DUTY_SCHEDULES: DutySchedule[] = [
  { id: 'sch-1', employeeId: 'emp-1', employeeName: 'Sarah Jenkins', department: 'Front Desk', shiftId: 'shift-1', shiftName: 'Morning Shift', date: TODAY, startTime: '06:00', endTime: '14:30', status: 'scheduled' },
  { id: 'sch-2', employeeId: 'emp-2', employeeName: 'David Chen', department: 'Housekeeping', shiftId: 'shift-1', shiftName: 'Morning Shift', date: TODAY, startTime: '06:00', endTime: '14:30', status: 'scheduled' },
  { id: 'sch-3', employeeId: 'emp-3', employeeName: 'Maria Rodriguez', department: 'Kitchen & Culinary', shiftId: 'shift-3', shiftName: 'Evening Shift', date: TODAY, startTime: '14:00', endTime: '22:30', status: 'scheduled' },
  { id: 'sch-4', employeeId: 'emp-4', employeeName: 'James O’Connor', department: 'Security & Safety', shiftId: 'shift-4', shiftName: 'Night / Overnight Shift', date: TODAY, startTime: '22:00', endTime: '06:30', status: 'scheduled' },
  { id: 'sch-5', employeeId: 'emp-5', employeeName: 'Emily Watson', department: 'Human Resources', shiftId: 'shift-2', shiftName: 'General Day Shift', date: TODAY, startTime: '09:00', endTime: '17:30', status: 'scheduled' },
  { id: 'sch-6', employeeId: 'emp-6', employeeName: 'Alexander Vance', department: 'Management', shiftId: 'shift-2', shiftName: 'General Day Shift', date: TODAY, startTime: '09:00', endTime: '17:30', status: 'scheduled' },
  { id: 'sch-7', employeeId: 'emp-7', employeeName: 'Liam Gallagher', department: 'Maintenance & Facilities', shiftId: 'shift-1', shiftName: 'Morning Shift', date: TODAY, startTime: '06:00', endTime: '14:30', status: 'scheduled' },
  { id: 'sch-8', employeeId: 'emp-8', employeeName: 'Jessica Taylor', department: 'Front Desk', shiftId: 'shift-1', shiftName: 'Morning Shift', date: TODAY, startTime: '06:00', endTime: '14:30', status: 'leave' },
];

const INITIAL_CORRECTIONS: AttendanceCorrectionRequest[] = [
  {
    id: 'corr-1',
    employeeId: 'emp-2',
    employeeName: 'David Chen',
    department: 'Housekeeping',
    date: '2026-10-10',
    requestedClockIn: '06:00',
    requestedClockOut: '14:30',
    reason: 'Card reader at employee turnstile was flashing error offline when I entered.',
    status: 'pending',
    requestedAt: `${TODAY} 07:15`,
  },
];

const INITIAL_NOTIFICATIONS: HRMSNotification[] = [
  {
    id: 'notif-1',
    title: 'New Overtime Request Pending',
    message: 'Liam Gallagher submitted 1.5h Overtime request for Chiller Maintenance.',
    type: 'overtime',
    date: `${TODAY} 14:36`,
    isRead: false,
  },
  {
    id: 'notif-2',
    title: 'Leave Application Received',
    message: 'Sarah Jenkins applied for Casual Leave on 2026-10-22 to 2026-10-23.',
    type: 'leave',
    date: `${TODAY} 08:31`,
    isRead: false,
  },
  {
    id: 'notif-3',
    title: 'Attendance Correction Submitted',
    message: 'David Chen requested turnstile punch correction for 2026-10-10.',
    type: 'attendance',
    date: `${TODAY} 07:16`,
    isRead: false,
  },
  {
    id: 'notif-4',
    title: 'Shift Schedule Published',
    message: 'Weekly duty roster for week of October 12-18 has been published.',
    type: 'shift',
    date: '2026-10-10 18:00',
    isRead: true,
  },
];

const INITIAL_PAYROLL: PayrollRecord[] = [
  {
    id: 'pr-1',
    payrollMonth: '2026-09',
    employeeId: 'emp-1',
    employeeName: 'Sarah Jenkins',
    department: 'Front Desk',
    jobTitle: 'Front Office Manager',
    salaryType: 'monthly',
    basePay: 4800,
    workingDaysInMonth: 22,
    actualPresentDays: 22,
    paidLeaveDays: 0,
    unpaidLeaveDays: 0,
    payableHours: 176,
    overtimeHours: 4.0,
    overtimePay: 163.64,
    allowances: [
      { name: 'Housing & Relocation Allowance', amount: 450 },
      { name: 'Transport Allowance', amount: 150 },
      { name: 'Quarterly Service Quality Bonus', amount: 300 },
    ],
    deductions: [
      { name: 'Income Tax (Withholding)', amount: 620 },
      { name: 'Social Security / PF (6%)', amount: 288 },
      { name: 'Health Insurance Plan', amount: 120 },
    ],
    grossSalary: 5863.64,
    totalDeductions: 1028.0,
    netSalary: 4835.64,
    paymentStatus: 'paid',
    paidAt: '2026-09-30',
    paymentMethod: 'bank_transfer',
    transactionRef: 'WIRE-99218204-CHASE',
    notes: 'Approved and disbursed directly to Chase Manhattan Bank account.',
  },
  {
    id: 'pr-2',
    payrollMonth: '2026-09',
    employeeId: 'emp-2',
    employeeName: 'David Chen',
    department: 'Housekeeping',
    jobTitle: 'Executive Housekeeper',
    salaryType: 'monthly',
    basePay: 4200,
    workingDaysInMonth: 22,
    actualPresentDays: 21,
    paidLeaveDays: 1,
    unpaidLeaveDays: 0,
    payableHours: 176,
    overtimeHours: 6.5,
    overtimePay: 232.67,
    allowances: [
      { name: 'Housing Allowance', amount: 400 },
      { name: 'Uniform & Laundry Allowance', amount: 100 },
    ],
    deductions: [
      { name: 'Income Tax (Withholding)', amount: 510 },
      { name: 'Social Security / PF (6%)', amount: 252 },
      { name: 'Health Insurance Plan', amount: 110 },
    ],
    grossSalary: 4932.67,
    totalDeductions: 872.0,
    netSalary: 4060.67,
    paymentStatus: 'paid',
    paidAt: '2026-09-30',
    paymentMethod: 'bank_transfer',
    transactionRef: 'WIRE-99218205-BOFA',
    notes: 'Disbursed via direct bank transfer.',
  },
  {
    id: 'pr-3',
    payrollMonth: '2026-09',
    employeeId: 'emp-3',
    employeeName: 'Maria Rodriguez',
    department: 'Kitchen & Culinary',
    jobTitle: 'Executive Chef',
    salaryType: 'monthly',
    basePay: 5600,
    workingDaysInMonth: 22,
    actualPresentDays: 22,
    paidLeaveDays: 0,
    unpaidLeaveDays: 0,
    payableHours: 176,
    overtimeHours: 8.0,
    overtimePay: 381.82,
    allowances: [
      { name: 'Executive Kitchen Allowance', amount: 600 },
      { name: 'Culinary Incentive', amount: 350 },
    ],
    deductions: [
      { name: 'Income Tax (Withholding)', amount: 780 },
      { name: 'Social Security / PF (6%)', amount: 336 },
      { name: 'Health Insurance Plan', amount: 150 },
    ],
    grossSalary: 6931.82,
    totalDeductions: 1266.0,
    netSalary: 5665.82,
    paymentStatus: 'paid',
    paidAt: '2026-09-30',
    paymentMethod: 'bank_transfer',
    transactionRef: 'WIRE-99218206-WF',
    notes: 'Disbursed via direct bank transfer.',
  },
];

const INITIAL_AUDIT_LOGS: HRMSAuditLog[] = [
  {
    id: 'log-1',
    timestamp: `${TODAY} 08:30:15`,
    actorName: 'Sarah Jenkins',
    actorRole: 'employee',
    action: 'LEAVE_REQUEST_SUBMITTED',
    details: 'Submitted Casual Leave application for 2026-10-22 (2 days).',
  },
  {
    id: 'log-2',
    timestamp: `${TODAY} 07:15:20`,
    actorName: 'David Chen',
    actorRole: 'employee',
    action: 'CORRECTION_REQUEST_SUBMITTED',
    details: 'Requested attendance correction for 2026-10-10.',
  },
  {
    id: 'log-3',
    timestamp: '2026-10-10 18:00:00',
    actorName: 'Alexander Vance',
    actorRole: 'super_admin',
    action: 'ROSTER_PUBLISHED',
    details: 'Published weekly shift roster for 8 staff members.',
  },
  {
    id: 'log-4',
    timestamp: '2026-09-30 17:45:00',
    actorName: 'Alexander Vance',
    actorRole: 'super_admin',
    action: 'PAYROLL_DISBURSED',
    details: 'Disbursed September 2026 payroll batch for 3 employees (₹14,562.13 total).',
  },
];

export const HRMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current user persona
  const [hrmsRole, setHRMSRole] = useState<HRMSUserRole>('super_admin');
  
  // Storage keys
  const STORAGE_KEY = 'grandstay_hrms_data_v2';

  // Load from local storage or defaults
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_employees`);
      return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
    } catch {
      return INITIAL_EMPLOYEES;
    }
  });

  const [currentEmployeeUser, setCurrentEmployeeUser] = useState<Employee>(() => {
    return employees[0] || INITIAL_EMPLOYEES[0];
  });

  const [shifts, setShifts] = useState<Shift[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_shifts`);
      return saved ? JSON.parse(saved) : INITIAL_SHIFTS;
    } catch {
      return INITIAL_SHIFTS;
    }
  });

  const [dutySchedules, setDutySchedules] = useState<DutySchedule[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_schedules`);
      return saved ? JSON.parse(saved) : INITIAL_DUTY_SCHEDULES;
    } catch {
      return INITIAL_DUTY_SCHEDULES;
    }
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_attendance`);
      return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
    } catch {
      return INITIAL_ATTENDANCE;
    }
  });

  const [correctionRequests, setCorrectionRequests] = useState<AttendanceCorrectionRequest[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_corrections`);
      return saved ? JSON.parse(saved) : INITIAL_CORRECTIONS;
    } catch {
      return INITIAL_CORRECTIONS;
    }
  });

  const [overtimeRecords, setOvertimeRecords] = useState<OvertimeRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_overtime`);
      return saved ? JSON.parse(saved) : INITIAL_OVERTIME;
    } catch {
      return INITIAL_OVERTIME;
    }
  });

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_leaves`);
      return saved ? JSON.parse(saved) : INITIAL_LEAVES;
    } catch {
      return INITIAL_LEAVES;
    }
  });

  const [leaveBalances, setLeaveBalances] = useState<Record<string, LeaveBalance>>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_leave_balances`);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    const balances: Record<string, LeaveBalance> = {};
    INITIAL_EMPLOYEES.forEach(emp => {
      balances[emp.id] = {
        employeeId: emp.id,
        annual: 18,
        annualUsed: emp.id === 'emp-8' ? 5 : 2,
        sick: 12,
        sickUsed: emp.id === 'emp-4' ? 2 : 0,
        casual: 7,
        casualUsed: 1,
        emergency: 5,
        emergencyUsed: 0,
        unpaidUsed: 0,
      };
    });
    return balances;
  });

  const [holidays, setHolidays] = useState<Holiday[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_holidays`);
      return saved ? JSON.parse(saved) : INITIAL_HOLIDAYS;
    } catch {
      return INITIAL_HOLIDAYS;
    }
  });

  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_payroll`);
      return saved ? JSON.parse(saved) : INITIAL_PAYROLL;
    } catch {
      return INITIAL_PAYROLL;
    }
  });

  const [notifications, setNotifications] = useState<HRMSNotification[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_notifications`);
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [settings, setSettings] = useState<HRMSSettings>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.currency || parsed.currency === '$') {
          parsed.currency = '₹';
        }
        return parsed;
      }
      return INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  const [auditLogs, setAuditLogs] = useState<HRMSAuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_audit`);
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  // Keep localStorage updated
  useEffect(() => { localStorage.setItem(`${STORAGE_KEY}_employees`, JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem(`${STORAGE_KEY}_shifts`, JSON.stringify(shifts)); }, [shifts]);
  useEffect(() => { localStorage.setItem(`${STORAGE_KEY}_schedules`, JSON.stringify(dutySchedules)); }, [dutySchedules]);
  useEffect(() => { localStorage.setItem(`${STORAGE_KEY}_attendance`, JSON.stringify(attendanceRecords)); }, [attendanceRecords]);
  useEffect(() => { localStorage.setItem(`${STORAGE_KEY}_corrections`, JSON.stringify(correctionRequests)); }, [correctionRequests]);
  useEffect(() => { localStorage.setItem(`${STORAGE_KEY}_overtime`, JSON.stringify(overtimeRecords)); }, [overtimeRecords]);
  useEffect(() => { localStorage.setItem(`${STORAGE_KEY}_leaves`, JSON.stringify(leaveRequests)); }, [leaveRequests]);
  useEffect(() => { localStorage.setItem(`${STORAGE_KEY}_leave_balances`, JSON.stringify(leaveBalances)); }, [leaveBalances]);
  useEffect(() => { localStorage.setItem(`${STORAGE_KEY}_holidays`, JSON.stringify(holidays)); }, [holidays]);
  useEffect(() => { localStorage.setItem(`${STORAGE_KEY}_payroll`, JSON.stringify(payrollRecords)); }, [payrollRecords]);
  useEffect(() => { localStorage.setItem(`${STORAGE_KEY}_notifications`, JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem(`${STORAGE_KEY}_audit`, JSON.stringify(auditLogs)); }, [auditLogs]);

  // Sync current employee user when employees change
  useEffect(() => {
    if (employees.length > 0) {
      const found = employees.find(e => e.id === currentEmployeeUser.id);
      if (found) {
        setCurrentEmployeeUser(found);
      } else {
        setCurrentEmployeeUser(employees[0]);
      }
    }
  }, [employees]);

  // Helper to add audit log
  const addAuditLog = (action: string, details: string) => {
    const newLog: HRMSAuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actorName: currentEmployeeUser?.name || 'Administrator',
      actorRole: hrmsRole,
      action,
      details,
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Helper to add notification
  const addNotification = (title: string, message: string, type: HRMSNotification['type'], targetEmployeeId?: string) => {
    const newNotif: HRMSNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      isRead: false,
      targetEmployeeId,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Computed Real-Time Stats
  const stats: HRMSStats = useMemo(() => {
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.status === 'active').length;
    const onLeaveEmployees = employees.filter(e => e.status === 'on_leave').length;

    const todayRecords = attendanceRecords.filter(r => r.date === TODAY);
    const todayPresentCount = todayRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    const todayClockedInCount = todayRecords.filter(r => r.clockIn && !r.clockOut).length;
    const todayOnBreakCount = todayRecords.filter(r => r.breakStart && !r.breakEnd).length;
    const todayLateCount = todayRecords.filter(r => r.isLate).length;
    const absentEmployees = Math.max(0, activeEmployees - todayPresentCount - onLeaveEmployees);

    const totalRegularHoursToday = todayRecords.reduce((acc, r) => acc + (r.regularHours || 0), 0);
    const totalOvertimeHoursToday = todayRecords.reduce((acc, r) => acc + (r.overtimeHours || 0), 0);

    const pendingLeaveRequestsCount = leaveRequests.filter(l => l.status === 'pending').length;
    const pendingOvertimeApprovalsCount = overtimeRecords.filter(o => o.status === 'pending').length;
    const pendingCorrectionRequestsCount = correctionRequests.filter(c => c.status === 'pending').length;

    // Monthly payroll estimate
    const monthlyPayrollEstimatedTotal = employees
      .filter(e => e.status === 'active' || e.status === 'on_leave')
      .reduce((sum, e) => {
        if (e.salaryType === 'monthly') return sum + e.payRate;
        if (e.salaryType === 'hourly') return sum + (e.payRate * 160);
        if (e.salaryType === 'daily') return sum + (e.payRate * 22);
        return sum + e.payRate;
      }, 0);

    const upcomingDisbursementsCount = employees.filter(e => e.status === 'active').length;

    return {
      totalEmployees,
      activeEmployees,
      absentEmployees,
      onLeaveEmployees,
      todayPresentCount,
      todayClockedInCount,
      todayOnBreakCount,
      todayLateCount,
      totalRegularHoursToday: parseFloat(totalRegularHoursToday.toFixed(1)),
      totalOvertimeHoursToday: parseFloat(totalOvertimeHoursToday.toFixed(1)),
      pendingLeaveRequestsCount,
      pendingOvertimeApprovalsCount,
      pendingCorrectionRequestsCount,
      monthlyPayrollEstimatedTotal,
      upcomingDisbursementsCount,
    };
  }, [employees, attendanceRecords, leaveRequests, overtimeRecords, correctionRequests]);

  // Employee Methods
  const addEmployee = (empData: Omit<Employee, 'id'>) => {
    const newId = `emp-${Date.now()}`;
    const newEmp: Employee = {
      ...empData,
      id: newId,
    };
    setEmployees(prev => [newEmp, ...prev]);

    // Initialize leave balance
    setLeaveBalances(prev => ({
      ...prev,
      [newId]: {
        employeeId: newId,
        annual: 18,
        annualUsed: 0,
        sick: 12,
        sickUsed: 0,
        casual: 7,
        casualUsed: 0,
        emergency: 5,
        emergencyUsed: 0,
        unpaidUsed: 0,
      },
    }));

    addAuditLog('EMPLOYEE_CREATED', `Added new employee ${newEmp.name} (${newEmp.employeeId}) in ${newEmp.department}.`);
    addNotification('New Employee Onboarded', `${newEmp.name} joined as ${newEmp.jobTitle} in ${newEmp.department}.`, 'announcement');

    return { success: true, message: `Employee ${newEmp.name} added successfully.`, employee: newEmp };
  };

  const updateEmployee = (id: string, data: Partial<Employee>) => {
    const existing = employees.find(e => e.id === id);
    if (!existing) return { success: false, message: 'Employee not found.' };

    setEmployees(prev =>
      prev.map(emp => (emp.id === id ? { ...emp, ...data } : emp))
    );

    addAuditLog('EMPLOYEE_UPDATED', `Updated details for ${existing.name} (${existing.employeeId}).`);
    return { success: true, message: `Employee ${existing.name} updated successfully.` };
  };

  const deleteEmployee = (id: string): { success: boolean; message: string } => {
    const existing = employees.find(e => e.id === id);
    if (!existing) return { success: false, message: 'Employee not found.' };

    setEmployees(prev => prev.filter(e => e.id !== id));
    // Also remove / cascade from schedules and future records
    setDutySchedules(prev => prev.filter(s => s.employeeId !== id));

    addAuditLog('EMPLOYEE_DELETED', `Deleted employee record for ${existing.name} (${existing.employeeId}).`);
    addNotification('Employee Record Removed', `${existing.name} was removed from the workforce directory.`, 'announcement');

    return { success: true, message: `Employee ${existing.name} deleted successfully.` };
  };

  const toggleEmployeeStatus = (id: string) => {
    const existing = employees.find(e => e.id === id);
    if (!existing) return;

    const nextStatus = existing.status === 'active' ? 'inactive' : 'active';
    setEmployees(prev =>
      prev.map(e => (e.id === id ? { ...e, status: nextStatus } : e))
    );

    addAuditLog('EMPLOYEE_STATUS_TOGGLED', `Changed status of ${existing.name} to ${nextStatus}.`);
  };

  // Live Punch Clock
  const clockIn = (employeeId: string, location?: string): { success: boolean; message: string } => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return { success: false, message: 'Employee not found.' };

    const todayStr = new Date().toISOString().split('T')[0];
    const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    // Check if already clocked in today
    const existingRecord = attendanceRecords.find(r => r.employeeId === employeeId && r.date === todayStr);
    if (existingRecord && existingRecord.clockIn && !existingRecord.clockOut) {
      return { success: false, message: `${emp.name} is already clocked in today at ${existingRecord.clockIn}.` };
    }

    // Determine shift start time
    const shift = shifts.find(s => s.id === emp.defaultShiftId) || shifts[0];
    let isLate = false;
    let lateMinutes = 0;

    if (shift) {
      const [shiftHour, shiftMin] = shift.startTime.split(':').map(Number);
      const [nowHour, nowMin] = nowTimeStr.split(':').map(Number);
      const shiftMinutesTotal = shiftHour * 60 + shiftMin;
      const nowMinutesTotal = nowHour * 60 + nowMin;

      if (nowMinutesTotal > shiftMinutesTotal + settings.defaultGracePeriodMinutes) {
        isLate = true;
        lateMinutes = nowMinutesTotal - shiftMinutesTotal;
      }
    }

    if (existingRecord) {
      // update existing
      setAttendanceRecords(prev =>
        prev.map(r =>
          r.id === existingRecord.id
            ? {
                ...r,
                clockIn: nowTimeStr,
                clockOut: undefined,
                status: isLate ? 'late' : 'present',
                isLate,
                lateMinutes,
                location: location || emp.workLocation,
              }
            : r
        )
      );
    } else {
      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        date: todayStr,
        clockIn: nowTimeStr,
        totalBreakMinutes: 0,
        regularHours: 0,
        overtimeHours: 0,
        status: isLate ? 'late' : 'present',
        isLate,
        lateMinutes,
        isEarlyDeparture: false,
        earlyDepartureMinutes: 0,
        location: location || emp.workLocation,
        notes: isLate ? `Clocked in ${lateMinutes} minutes late` : 'On time attendance punch',
      };
      setAttendanceRecords(prev => [newRecord, ...prev]);
    }

    addAuditLog('ATTENDANCE_CLOCK_IN', `${emp.name} clocked in at ${nowTimeStr} (${isLate ? `${lateMinutes}m Late` : 'On Time'}).`);
    if (isLate) {
      addNotification('Late Arrival Alert', `${emp.name} clocked in ${lateMinutes}m late today at ${nowTimeStr}.`, 'attendance');
    }

    return {
      success: true,
      message: `${emp.name} successfully clocked in at ${nowTimeStr} ${isLate ? `(${lateMinutes} mins late)` : ''}`,
    };
  };

  const clockOut = (employeeId: string): { success: boolean; message: string } => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return { success: false, message: 'Employee not found.' };

    const todayStr = new Date().toISOString().split('T')[0];
    const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    const record = attendanceRecords.find(r => r.employeeId === employeeId && r.date === todayStr);
    if (!record || !record.clockIn) {
      return { success: false, message: `Cannot clock out: ${emp.name} has not clocked in yet today.` };
    }
    if (record.clockOut) {
      return { success: false, message: `${emp.name} has already clocked out at ${record.clockOut}.` };
    }

    // If on break, end break first
    let totalBreaks = record.totalBreakMinutes || 0;
    if (record.breakStart && !record.breakEnd) {
      const [bStartH, bStartM] = record.breakStart.split(':').map(Number);
      const [nowH, nowM] = nowTimeStr.split(':').map(Number);
      const diffMin = Math.max(0, (nowH * 60 + nowM) - (bStartH * 60 + bStartM));
      totalBreaks += diffMin;
    }

    // Calculate total hours
    const [inH, inM] = record.clockIn.split(':').map(Number);
    const [outH, outM] = nowTimeStr.split(':').map(Number);
    let totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
    if (totalMinutes < 0) totalMinutes += 24 * 60; // overnight shift

    // Subtract unpaid breaks
    const netWorkedMinutes = Math.max(0, totalMinutes - totalBreaks);
    const netWorkedHours = parseFloat((netWorkedMinutes / 60).toFixed(2));

    const standardHours = settings.standardDailyHours;
    const regularHours = Math.min(standardHours, netWorkedHours);
    const overtimeHours = Math.max(0, parseFloat((netWorkedHours - standardHours).toFixed(2)));

    setAttendanceRecords(prev =>
      prev.map(r =>
        r.id === record.id
          ? {
              ...r,
              clockOut: nowTimeStr,
              breakEnd: record.breakStart && !record.breakEnd ? nowTimeStr : r.breakEnd,
              totalBreakMinutes: totalBreaks,
              regularHours,
              overtimeHours,
            }
          : r
      )
    );

    addAuditLog('ATTENDANCE_CLOCK_OUT', `${emp.name} clocked out at ${nowTimeStr}. Worked: ${netWorkedHours} hrs (Regular: ${regularHours}h, OT: ${overtimeHours}h).`);

    // If significant overtime, generate notification
    if (overtimeHours > 0) {
      addNotification('Overtime Worked', `${emp.name} clocked out with ${overtimeHours}h of potential overtime.`, 'overtime');
    }

    return {
      success: true,
      message: `${emp.name} clocked out at ${nowTimeStr}. Total net work: ${netWorkedHours} hrs.`,
    };
  };

  const startBreak = (employeeId: string): { success: boolean; message: string } => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return { success: false, message: 'Employee not found.' };

    const todayStr = new Date().toISOString().split('T')[0];
    const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    const record = attendanceRecords.find(r => r.employeeId === employeeId && r.date === todayStr);
    if (!record || !record.clockIn) {
      return { success: false, message: 'Employee must clock in before starting a break.' };
    }
    if (record.clockOut) {
      return { success: false, message: 'Employee has already clocked out for the day.' };
    }
    if (record.breakStart && !record.breakEnd) {
      return { success: false, message: 'Employee is already currently on a break.' };
    }

    setAttendanceRecords(prev =>
      prev.map(r =>
        r.id === record.id
          ? {
              ...r,
              breakStart: nowTimeStr,
              breakEnd: undefined,
            }
          : r
      )
    );

    addAuditLog('BREAK_STARTED', `${emp.name} started break at ${nowTimeStr}.`);
    return { success: true, message: `${emp.name} started break at ${nowTimeStr}.` };
  };

  const endBreak = (employeeId: string): { success: boolean; message: string } => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return { success: false, message: 'Employee not found.' };

    const todayStr = new Date().toISOString().split('T')[0];
    const nowTimeStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    const record = attendanceRecords.find(r => r.employeeId === employeeId && r.date === todayStr);
    if (!record || !record.breakStart || record.breakEnd) {
      return { success: false, message: 'No active break found to end.' };
    }

    const [bStartH, bStartM] = record.breakStart.split(':').map(Number);
    const [bEndH, bEndM] = nowTimeStr.split(':').map(Number);
    let diffMinutes = (bEndH * 60 + bEndM) - (bStartH * 60 + bStartM);
    if (diffMinutes < 0) diffMinutes += 24 * 60;

    const accumulatedBreaks = (record.totalBreakMinutes || 0) + diffMinutes;

    setAttendanceRecords(prev =>
      prev.map(r =>
        r.id === record.id
          ? {
              ...r,
              breakEnd: nowTimeStr,
              totalBreakMinutes: accumulatedBreaks,
            }
          : r
      )
    );

    addAuditLog('BREAK_ENDED', `${emp.name} ended break at ${nowTimeStr} (Duration: ${diffMinutes} mins).`);
    return { success: true, message: `Break ended. Duration: ${diffMinutes} mins.` };
  };

  const addAttendanceRecord = (record: Omit<AttendanceRecord, 'id'>) => {
    const newRecord: AttendanceRecord = {
      ...record,
      id: `att-${Date.now()}`,
    };
    setAttendanceRecords(prev => [newRecord, ...prev]);
    addAuditLog('MANUAL_ATTENDANCE_ADDED', `Admin added attendance record for ${record.employeeName} on ${record.date}.`);
    return { success: true, message: 'Attendance record saved successfully.' };
  };

  const updateAttendanceRecord = (id: string, data: Partial<AttendanceRecord>) => {
    setAttendanceRecords(prev =>
      prev.map(r => (r.id === id ? { ...r, ...data } : r))
    );
    addAuditLog('ATTENDANCE_UPDATED', `Updated attendance record ID ${id}.`);
    return { success: true, message: 'Attendance record updated successfully.' };
  };

  const deleteAttendanceRecord = (id: string): { success: boolean; message: string } => {
    const target = attendanceRecords.find(r => r.id === id);
    if (!target) return { success: false, message: 'Attendance record not found.' };

    setAttendanceRecords(prev => prev.filter(r => r.id !== id));
    addAuditLog('ATTENDANCE_DELETED', `Deleted attendance record for ${target.employeeName} on ${target.date}.`);
    return { success: true, message: 'Attendance record deleted successfully.' };
  };

  const submitCorrectionRequest = (data: Omit<AttendanceCorrectionRequest, 'id' | 'status' | 'requestedAt'>) => {
    const newReq: AttendanceCorrectionRequest = {
      ...data,
      id: `corr-${Date.now()}`,
      status: 'pending',
      requestedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setCorrectionRequests(prev => [newReq, ...prev]);
    addAuditLog('CORRECTION_REQUESTED', `${data.employeeName} requested attendance punch correction for ${data.date}.`);
    addNotification('Correction Request', `${data.employeeName} requested attendance punch correction for ${data.date}.`, 'attendance');
    return { success: true, message: 'Attendance correction request submitted to manager/HR for review.' };
  };

  const approveCorrectionRequest = (id: string, reviewerNotes?: string) => {
    const req = correctionRequests.find(r => r.id === id);
    if (!req) return { success: false, message: 'Request not found.' };

    setCorrectionRequests(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, status: 'approved', reviewedBy: currentEmployeeUser?.name || 'HR Manager', reviewNotes: reviewerNotes }
          : r
      )
    );

    // Apply the correction to the attendance record
    const existing = attendanceRecords.find(a => a.employeeId === req.employeeId && a.date === req.date);
    if (existing) {
      setAttendanceRecords(prev =>
        prev.map(a =>
          a.id === existing.id
            ? {
                ...a,
                clockIn: req.requestedClockIn,
                clockOut: req.requestedClockOut,
                isManualCorrection: true,
                correctionStatus: 'approved',
                correctionReason: req.reason,
                status: 'present',
                isLate: false,
                regularHours: 8,
              }
            : a
        )
      );
    } else {
      const newAtt: AttendanceRecord = {
        id: `att-${Date.now()}`,
        employeeId: req.employeeId,
        employeeName: req.employeeName,
        department: req.department,
        date: req.date,
        clockIn: req.requestedClockIn,
        clockOut: req.requestedClockOut,
        totalBreakMinutes: 30,
        regularHours: 8,
        overtimeHours: 0,
        status: 'present',
        isLate: false,
        lateMinutes: 0,
        isEarlyDeparture: false,
        earlyDepartureMinutes: 0,
        isManualCorrection: true,
        correctionStatus: 'approved',
        correctionReason: req.reason,
      };
      setAttendanceRecords(prev => [newAtt, ...prev]);
    }

    addAuditLog('CORRECTION_APPROVED', `Approved attendance correction for ${req.employeeName} on ${req.date}.`);
    addNotification('Correction Request Approved', `Your attendance correction for ${req.date} has been approved.`, 'attendance', req.employeeId);

    return { success: true, message: `Approved correction for ${req.employeeName}. Attendance updated.` };
  };

  const rejectCorrectionRequest = (id: string, reviewerNotes?: string) => {
    const req = correctionRequests.find(r => r.id === id);
    if (!req) return { success: false, message: 'Request not found.' };

    setCorrectionRequests(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, status: 'rejected', reviewedBy: currentEmployeeUser?.name || 'HR Manager', reviewNotes: reviewerNotes }
          : r
      )
    );

    addAuditLog('CORRECTION_REJECTED', `Rejected attendance correction for ${req.employeeName} on ${req.date}.`);
    addNotification('Correction Request Rejected', `Your attendance correction for ${req.date} was rejected: ${reviewerNotes || 'Not approved'}`, 'attendance', req.employeeId);

    return { success: true, message: `Correction request rejected.` };
  };

  const deleteCorrectionRequest = (id: string): { success: boolean; message: string } => {
    setCorrectionRequests(prev => prev.filter(r => r.id !== id));
    return { success: true, message: 'Correction request deleted.' };
  };

  // Shift & Duty Scheduling
  const addShift = (shiftData: Omit<Shift, 'id'>) => {
    const newShift: Shift = {
      ...shiftData,
      id: `shift-${Date.now()}`,
    };
    setShifts(prev => [...prev, newShift]);
    addAuditLog('SHIFT_CREATED', `Created new shift: ${newShift.name} (${newShift.startTime} - ${newShift.endTime}).`);
    return { success: true, message: `Shift ${newShift.name} created successfully.` };
  };

  const updateShift = (id: string, data: Partial<Shift>) => {
    setShifts(prev => prev.map(s => (s.id === id ? { ...s, ...data } : s)));
    addAuditLog('SHIFT_UPDATED', `Updated shift configuration ID ${id}.`);
    return { success: true, message: 'Shift updated successfully.' };
  };

  const deleteShift = (id: string): { success: boolean; message: string } => {
    const target = shifts.find(s => s.id === id);
    if (!target) return { success: false, message: 'Shift not found.' };

    setShifts(prev => prev.filter(s => s.id !== id));
    addAuditLog('SHIFT_DELETED', `Deleted shift: ${target.name}.`);
    return { success: true, message: `Shift ${target.name} deleted successfully.` };
  };

  const detectScheduleConflicts = (employeeId: string, date: string, shiftId: string): string | null => {
    // Check if employee already has an active duty scheduled on that date
    const existing = dutySchedules.find(s => s.employeeId === employeeId && s.date === date && s.status === 'scheduled');
    if (existing && existing.shiftId !== shiftId) {
      return `Conflict: Employee is already scheduled for ${existing.shiftName} on ${date}.`;
    }

    // Check if employee has approved leave on that date
    const leave = leaveRequests.find(l => l.employeeId === employeeId && l.status === 'approved' && date >= l.startDate && date <= l.endDate);
    if (leave) {
      return `Conflict: Employee is on approved ${leave.leaveType.toUpperCase()} leave on ${date}.`;
    }

    return null;
  };

  const assignDutySchedule = (scheduleData: Omit<DutySchedule, 'id'>) => {
    const conflict = detectScheduleConflicts(scheduleData.employeeId, scheduleData.date, scheduleData.shiftId);
    if (conflict) {
      return { success: false, message: conflict };
    }

    const newSchedule: DutySchedule = {
      ...scheduleData,
      id: `sch-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    };
    // Replace any existing schedule for this employee on this date
    setDutySchedules(prev => [
      ...prev.filter(s => !(s.employeeId === scheduleData.employeeId && s.date === scheduleData.date)),
      newSchedule,
    ]);

    addAuditLog('DUTY_SCHEDULE_ASSIGNED', `Assigned ${scheduleData.shiftName} to ${scheduleData.employeeName} on ${scheduleData.date}.`);
    addNotification('Shift Schedule Update', `You have been assigned to ${scheduleData.shiftName} on ${scheduleData.date}.`, 'shift', scheduleData.employeeId);

    return { success: true, message: `Assigned shift to ${scheduleData.employeeName}.` };
  };

  const bulkAssignDutySchedules = (schedules: Omit<DutySchedule, 'id'>[]) => {
    const newItems: DutySchedule[] = schedules.map(s => ({
      ...s,
      id: `sch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    }));

    setDutySchedules(prev => {
      // Remove overlapping employee+date combos
      const keys = new Set(newItems.map(i => `${i.employeeId}_${i.date}`));
      const filtered = prev.filter(p => !keys.has(`${p.employeeId}_${p.date}`));
      return [...filtered, ...newItems];
    });

    addAuditLog('BULK_ROSTER_SAVED', `Bulk scheduled ${schedules.length} shifts across workforce.`);
    addNotification('Roster Published', `The updated weekly duty schedule has been published for all departments.`, 'shift');

    return { success: true, message: `Successfully assigned ${schedules.length} duty shifts.` };
  };

  const updateDutySchedule = (id: string, data: Partial<DutySchedule>) => {
    setDutySchedules(prev => prev.map(s => (s.id === id ? { ...s, ...data } : s)));
    return { success: true, message: 'Duty schedule updated.' };
  };

  const deleteDutySchedule = (id: string): { success: boolean; message: string } => {
    const target = dutySchedules.find(s => s.id === id);
    if (!target) return { success: false, message: 'Schedule entry not found.' };

    setDutySchedules(prev => prev.filter(s => s.id !== id));
    addAuditLog('DUTY_SCHEDULE_DELETED', `Removed schedule for ${target.employeeName} on ${target.date}.`);
    return { success: true, message: 'Duty schedule removed.' };
  };

  // Overtime Methods
  const submitOvertimeRequest = (recordData: Omit<OvertimeRecord, 'id' | 'status' | 'requestedAt' | 'calculatedAmount'>) => {
    // Prevent duplicate OT request for same employee on same date
    const dup = overtimeRecords.find(o => o.employeeId === recordData.employeeId && o.date === recordData.date && o.status !== 'rejected');
    if (dup) {
      return { success: false, message: 'An overtime record or pending request already exists for this employee on this date.' };
    }

    const calculatedAmount = parseFloat((recordData.hours * recordData.hourlyRate * recordData.rateMultiplier).toFixed(2));
    const newOt: OvertimeRecord = {
      ...recordData,
      id: `ot-${Date.now()}`,
      status: 'pending',
      calculatedAmount,
      requestedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    setOvertimeRecords(prev => [newOt, ...prev]);
    addAuditLog('OVERTIME_SUBMITTED', `${recordData.employeeName} requested ${recordData.hours}h overtime on ${recordData.date}.`);
    addNotification('New Overtime Request', `${recordData.employeeName} requested ${recordData.hours}h Overtime (₹${calculatedAmount}).`, 'overtime');

    return { success: true, message: 'Overtime request submitted for manager review.' };
  };

  const approveOvertimeRequest = (id: string) => {
    const record = overtimeRecords.find(o => o.id === id);
    if (!record) return { success: false, message: 'Overtime record not found.' };

    const approvedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const approvedBy = currentEmployeeUser?.name || 'Operations Manager';

    setOvertimeRecords(prev =>
      prev.map(o => (o.id === id ? { ...o, status: 'approved', approvedBy, approvedAt } : o))
    );

    addAuditLog('OVERTIME_APPROVED', `Approved ${record.hours}h overtime for ${record.employeeName} (₹${record.calculatedAmount}).`);
    addNotification('Overtime Approved', `Your ${record.hours}h overtime request for ${record.date} was approved (₹${record.calculatedAmount}).`, 'overtime', record.employeeId);

    return { success: true, message: `Approved overtime request for ${record.employeeName}.` };
  };

  const rejectOvertimeRequest = (id: string, reason?: string) => {
    const record = overtimeRecords.find(o => o.id === id);
    if (!record) return { success: false, message: 'Overtime record not found.' };

    setOvertimeRecords(prev =>
      prev.map(o => (o.id === id ? { ...o, status: 'rejected', rejectionReason: reason || 'Not approved by policy' } : o))
    );

    addAuditLog('OVERTIME_REJECTED', `Rejected overtime for ${record.employeeName} on ${record.date}.`);
    addNotification('Overtime Request Declined', `Your overtime request for ${record.date} was declined: ${reason || 'Does not meet criteria'}`, 'overtime', record.employeeId);

    return { success: true, message: 'Overtime request rejected.' };
  };

  const deleteOvertimeRecord = (id: string): { success: boolean; message: string } => {
    const target = overtimeRecords.find(o => o.id === id);
    if (!target) return { success: false, message: 'Overtime record not found.' };

    setOvertimeRecords(prev => prev.filter(o => o.id !== id));
    addAuditLog('OVERTIME_DELETED', `Deleted overtime record for ${target.employeeName} on ${target.date}.`);
    return { success: true, message: 'Overtime record deleted successfully.' };
  };

  // Leave Methods
  const getEmployeeLeaveBalance = (employeeId: string): LeaveBalance => {
    if (leaveBalances[employeeId]) return leaveBalances[employeeId];
    return {
      employeeId,
      annual: 18,
      annualUsed: 0,
      sick: 12,
      sickUsed: 0,
      casual: 7,
      casualUsed: 0,
      emergency: 5,
      emergencyUsed: 0,
      unpaidUsed: 0,
    };
  };

  const submitLeaveRequest = (reqData: Omit<LeaveRequest, 'id' | 'status' | 'appliedAt'>) => {
    // Check overlapping approved/pending leaves for this employee
    const overlap = leaveRequests.find(
      l =>
        l.employeeId === reqData.employeeId &&
        l.status !== 'rejected' &&
        ((reqData.startDate >= l.startDate && reqData.startDate <= l.endDate) ||
          (reqData.endDate >= l.startDate && reqData.endDate <= l.endDate))
    );

    if (overlap) {
      return { success: false, message: `Conflicting leave exists from ${overlap.startDate} to ${overlap.endDate}.` };
    }

    // Check balance
    const balance = getEmployeeLeaveBalance(reqData.employeeId);
    let remaining = 0;
    if (reqData.leaveType === 'annual') remaining = balance.annual - balance.annualUsed;
    if (reqData.leaveType === 'sick') remaining = balance.sick - balance.sickUsed;
    if (reqData.leaveType === 'casual') remaining = balance.casual - balance.casualUsed;
    if (reqData.leaveType === 'emergency') remaining = balance.emergency - balance.emergencyUsed;

    if (reqData.leaveType !== 'unpaid' && remaining < reqData.totalDays) {
      return {
        success: false,
        message: `Insufficient ${reqData.leaveType.toUpperCase()} leave balance. Available: ${remaining} days, Requested: ${reqData.totalDays} days.`,
      };
    }

    const newReq: LeaveRequest = {
      ...reqData,
      id: `leave-${Date.now()}`,
      status: 'pending',
      appliedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    setLeaveRequests(prev => [newReq, ...prev]);
    addAuditLog('LEAVE_REQUESTED', `${reqData.employeeName} applied for ${reqData.totalDays} days ${reqData.leaveType} leave (${reqData.startDate} to ${reqData.endDate}).`);
    addNotification('New Leave Application', `${reqData.employeeName} applied for ${reqData.totalDays} days ${reqData.leaveType} leave.`, 'leave');

    return { success: true, message: 'Leave application submitted successfully.' };
  };

  const approveLeaveRequest = (id: string, notes?: string) => {
    const req = leaveRequests.find(l => l.id === id);
    if (!req) return { success: false, message: 'Leave request not found.' };

    const reviewer = currentEmployeeUser?.name || 'HR Manager';

    // Update status
    setLeaveRequests(prev =>
      prev.map(l => (l.id === id ? { ...l, status: 'approved', reviewedBy: reviewer, reviewNotes: notes } : l))
    );

    // Deduct from leave balance
    setLeaveBalances(prev => {
      const current = prev[req.employeeId] || getEmployeeLeaveBalance(req.employeeId);
      const updated = { ...current };

      if (req.leaveType === 'annual') updated.annualUsed += req.totalDays;
      else if (req.leaveType === 'sick') updated.sickUsed += req.totalDays;
      else if (req.leaveType === 'casual') updated.casualUsed += req.totalDays;
      else if (req.leaveType === 'emergency') updated.emergencyUsed += req.totalDays;
      else if (req.leaveType === 'unpaid') updated.unpaidUsed += req.totalDays;

      return { ...prev, [req.employeeId]: updated };
    });

    // Mark today or future duty schedules as 'leave'
    setDutySchedules(prev =>
      prev.map(s => {
        if (s.employeeId === req.employeeId && s.date >= req.startDate && s.date <= req.endDate) {
          return { ...s, status: 'leave', notes: `Approved ${req.leaveType} leave` };
        }
        return s;
      })
    );

    addAuditLog('LEAVE_APPROVED', `Approved ${req.totalDays}d ${req.leaveType} leave for ${req.employeeName}.`);
    addNotification('Leave Request Approved', `Your ${req.leaveType} leave (${req.startDate} to ${req.endDate}) has been approved.`, 'leave', req.employeeId);

    return { success: true, message: `Approved leave for ${req.employeeName}. Leave balance updated.` };
  };

  const rejectLeaveRequest = (id: string, notes?: string) => {
    const req = leaveRequests.find(l => l.id === id);
    if (!req) return { success: false, message: 'Leave request not found.' };

    const reviewer = currentEmployeeUser?.name || 'HR Manager';
    setLeaveRequests(prev =>
      prev.map(l => (l.id === id ? { ...l, status: 'rejected', reviewedBy: reviewer, reviewNotes: notes } : l))
    );

    addAuditLog('LEAVE_REJECTED', `Rejected leave request for ${req.employeeName}. Reason: ${notes || 'Not approved'}.`);
    addNotification('Leave Request Declined', `Your leave request from ${req.startDate} to ${req.endDate} was declined. Reason: ${notes || 'Staffing requirements'}`, 'leave', req.employeeId);

    return { success: true, message: 'Leave request rejected.' };
  };

  const deleteLeaveRequest = (id: string): { success: boolean; message: string } => {
    const target = leaveRequests.find(l => l.id === id);
    if (!target) return { success: false, message: 'Leave request not found.' };

    setLeaveRequests(prev => prev.filter(l => l.id !== id));
    addAuditLog('LEAVE_DELETED', `Deleted leave record for ${target.employeeName} (${target.startDate} to ${target.endDate}).`);
    return { success: true, message: 'Leave request deleted.' };
  };

  // Holidays
  const addHoliday = (holidayData: Omit<Holiday, 'id'>) => {
    const newHol: Holiday = {
      ...holidayData,
      id: `hol-${Date.now()}`,
    };
    setHolidays(prev => [...prev, newHol]);
    addAuditLog('HOLIDAY_ADDED', `Added holiday: ${newHol.name} on ${newHol.date}.`);
    addNotification('Holiday Calendar Updated', `${newHol.name} added for ${newHol.date}.`, 'announcement');
    return { success: true, message: `Holiday ${newHol.name} added successfully.` };
  };

  const updateHoliday = (id: string, data: Partial<Holiday>) => {
    setHolidays(prev => prev.map(h => (h.id === id ? { ...h, ...data } : h)));
    addAuditLog('HOLIDAY_UPDATED', `Updated holiday ID ${id}.`);
    return { success: true, message: 'Holiday updated.' };
  };

  const deleteHoliday = (id: string): { success: boolean; message: string } => {
    const target = holidays.find(h => h.id === id);
    if (!target) return { success: false, message: 'Holiday not found.' };

    setHolidays(prev => prev.filter(h => h.id !== id));
    addAuditLog('HOLIDAY_DELETED', `Deleted holiday: ${target.name}.`);
    return { success: true, message: `Holiday ${target.name} deleted.` };
  };

  // Payroll Methods
  const generateMonthlyPayroll = (monthStr: string, department?: string): { success: boolean; message: string; count: number } => {
    const activeEmps = employees.filter(e => {
      if (e.status !== 'active' && e.status !== 'on_leave') return false;
      if (department && department !== 'All' && e.department !== department) return false;
      return true;
    });

    if (activeEmps.length === 0) {
      return { success: false, message: 'No eligible employees found for this department or filter.', count: 0 };
    }

    let createdCount = 0;
    const newRecords: PayrollRecord[] = [];

    activeEmps.forEach(emp => {
      // Check if already processed for this month
      const existing = payrollRecords.find(p => p.employeeId === emp.id && p.payrollMonth === monthStr);
      if (existing) return;

      const workingDaysInMonth = 22; // Standard monthly working days
      
      // Calculate approved attendance & OT for this month
      const monthPrefix = monthStr; // e.g. "2026-10"
      const empAttendance = attendanceRecords.filter(a => a.employeeId === emp.id && a.date.startsWith(monthPrefix));
      const presentDays = empAttendance.length > 0 ? empAttendance.length : 22;

      const empLeaves = leaveRequests.filter(l => l.employeeId === emp.id && l.status === 'approved' && l.startDate.startsWith(monthPrefix));
      const paidLeaveDays = empLeaves.filter(l => l.leaveType !== 'unpaid').reduce((sum, l) => sum + l.totalDays, 0);
      const unpaidLeaveDays = empLeaves.filter(l => l.leaveType === 'unpaid').reduce((sum, l) => sum + l.totalDays, 0);

      // Approved Overtime
      const empOts = overtimeRecords.filter(o => o.employeeId === emp.id && o.status === 'approved' && o.date.startsWith(monthPrefix));
      const overtimeHours = empOts.reduce((sum, o) => sum + o.hours, 0);
      const overtimePay = empOts.reduce((sum, o) => sum + o.calculatedAmount, 0);

      // Base pay & allowances
      let basePay = emp.payRate;
      let payableHours = 176;

      if (emp.salaryType === 'hourly') {
        payableHours = presentDays * 8;
        basePay = emp.payRate * payableHours;
      } else if (emp.salaryType === 'daily') {
        basePay = emp.payRate * presentDays;
      }

      const allowances = [
        { name: 'Standard Housing / Accommodation Allowance', amount: Math.round(basePay * 0.1) },
        { name: 'Hospitality Transport Allowance', amount: 150 },
      ];

      // Deductions
      const taxDeduction = Math.round(basePay * 0.12);
      const socialSecurityDeduction = Math.round(basePay * 0.06);
      const unpaidLeaveDeduction = unpaidLeaveDays > 0 ? Math.round((basePay / 22) * unpaidLeaveDays) : 0;

      const deductions = [
        { name: 'Income Tax Withholding (12%)', amount: taxDeduction },
        { name: 'Social Security / Pension Fund (6%)', amount: socialSecurityDeduction },
        { name: 'Group Medical Insurance', amount: 120 },
      ];
      if (unpaidLeaveDeduction > 0) {
        deductions.push({ name: `Loss of Pay (${unpaidLeaveDays}d Unpaid Leave)`, amount: unpaidLeaveDeduction });
      }

      const totalAllowances = allowances.reduce((sum, a) => sum + a.amount, 0);
      const grossSalary = parseFloat((basePay + overtimePay + totalAllowances).toFixed(2));
      const totalDeductions = parseFloat(deductions.reduce((sum, d) => sum + d.amount, 0).toFixed(2));
      const netSalary = parseFloat((grossSalary - totalDeductions).toFixed(2));

      const newRecord: PayrollRecord = {
        id: `pr-${Date.now()}-${emp.id}`,
        payrollMonth: monthStr,
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        jobTitle: emp.jobTitle,
        salaryType: emp.salaryType,
        basePay,
        workingDaysInMonth,
        actualPresentDays: presentDays,
        paidLeaveDays,
        unpaidLeaveDays,
        payableHours,
        overtimeHours,
        overtimePay,
        allowances,
        deductions,
        grossSalary,
        totalDeductions,
        netSalary,
        paymentStatus: 'draft',
        notes: `Computed for ${monthStr}. Attendance days: ${presentDays}/${workingDaysInMonth}.`,
      };

      newRecords.push(newRecord);
      createdCount++;
    });

    if (createdCount === 0) {
      return { success: false, message: `Payroll for ${monthStr} has already been processed for all selected employees.`, count: 0 };
    }

    setPayrollRecords(prev => [...newRecords, ...prev]);
    addAuditLog('PAYROLL_GENERATED', `Generated draft payroll batch for ${monthStr} (${createdCount} records).`);
    addNotification('Payroll Batch Generated', `Monthly payroll draft created for ${monthStr} (${createdCount} employees).`, 'payroll');

    return { success: true, message: `Successfully computed payroll for ${createdCount} employees for ${monthStr}.`, count: createdCount };
  };

  const updatePayrollRecord = (id: string, data: Partial<PayrollRecord>) => {
    setPayrollRecords(prev => prev.map(p => (p.id === id ? { ...p, ...data } : p)));
    return { success: true, message: 'Payroll record updated.' };
  };

  const approvePayrollRecord = (id: string) => {
    const p = payrollRecords.find(item => item.id === id);
    if (!p) return { success: false, message: 'Payroll record not found.' };

    setPayrollRecords(prev =>
      prev.map(item => (item.id === id ? { ...item, paymentStatus: 'approved' } : item))
    );

    addAuditLog('PAYROLL_APPROVED', `Approved salary statement for ${p.employeeName} (${p.payrollMonth}) - Net: ₹${p.netSalary}.`);
    return { success: true, message: `Approved salary statement for ${p.employeeName}.` };
  };

  const markPayrollPaid = (id: string, method: PayrollRecord['paymentMethod'] = 'bank_transfer', ref?: string) => {
    const p = payrollRecords.find(item => item.id === id);
    if (!p) return { success: false, message: 'Payroll record not found.' };

    const paidAt = new Date().toISOString().split('T')[0];
    const transactionRef = ref || `WIRE-${Math.floor(10000000 + Math.random() * 90000000)}`;

    setPayrollRecords(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              paymentStatus: 'paid',
              paidAt,
              paymentMethod: method,
              transactionRef,
            }
          : item
      )
    );

    addAuditLog('SALARY_DISBURSED', `Disbursed salary for ${p.employeeName} (${p.payrollMonth}) via ${method}. Ref: ${transactionRef}.`);
    addNotification('Salary Disbursed', `Your salary for ${p.payrollMonth} of ₹${p.netSalary} has been credited via ${method}.`, 'payroll', p.employeeId);

    return { success: true, message: `Salary marked as PAID for ${p.employeeName}. Ref: ${transactionRef}` };
  };

  const deletePayrollRecord = (id: string): { success: boolean; message: string } => {
    const target = payrollRecords.find(p => p.id === id);
    if (!target) return { success: false, message: 'Payroll record not found.' };

    setPayrollRecords(prev => prev.filter(p => p.id !== id));
    addAuditLog('PAYROLL_RECORD_DELETED', `Deleted payroll statement for ${target.employeeName} (${target.payrollMonth}).`);
    return { success: true, message: `Payroll record for ${target.employeeName} deleted.` };
  };

  // Settings
  const updateSettings = (newSettings: Partial<HRMSSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    addAuditLog('SETTINGS_UPDATED', 'Updated HRMS workforce policies and payroll parameters.');
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string): { success: boolean; message: string } => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    return { success: true, message: 'Notification dismissed.' };
  };

  return (
    <HRMSContext.Provider
      value={{
        hrmsRole,
        setHRMSRole,
        currentEmployeeUser,
        setCurrentEmployeeUser,
        employees,
        shifts,
        dutySchedules,
        attendanceRecords,
        correctionRequests,
        overtimeRecords,
        leaveRequests,
        leaveBalances,
        holidays,
        payrollRecords,
        notifications,
        settings,
        auditLogs,
        stats,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        toggleEmployeeStatus,
        clockIn,
        clockOut,
        startBreak,
        endBreak,
        addAttendanceRecord,
        updateAttendanceRecord,
        deleteAttendanceRecord,
        submitCorrectionRequest,
        approveCorrectionRequest,
        rejectCorrectionRequest,
        deleteCorrectionRequest,
        addShift,
        updateShift,
        deleteShift,
        assignDutySchedule,
        bulkAssignDutySchedules,
        updateDutySchedule,
        deleteDutySchedule,
        detectScheduleConflicts,
        submitOvertimeRequest,
        approveOvertimeRequest,
        rejectOvertimeRequest,
        deleteOvertimeRecord,
        submitLeaveRequest,
        approveLeaveRequest,
        rejectLeaveRequest,
        deleteLeaveRequest,
        getEmployeeLeaveBalance,
        addHoliday,
        updateHoliday,
        deleteHoliday,
        generateMonthlyPayroll,
        updatePayrollRecord,
        approvePayrollRecord,
        markPayrollPaid,
        deletePayrollRecord,
        updateSettings,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        addNotification,
        addAuditLog,
      }}
    >
      {children}
    </HRMSContext.Provider>
  );
};

export const useHRMS = () => {
  const context = useContext(HRMSContext);
  if (!context) {
    throw new Error('useHRMS must be used within an HRMSProvider');
  }
  return context;
};

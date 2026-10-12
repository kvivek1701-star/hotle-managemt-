export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'temporary';
export type EmployeeStatus = 'active' | 'on_leave' | 'inactive' | 'terminated';
export type SalaryType = 'monthly' | 'hourly' | 'daily' | 'contract';
export type Department = 
  | 'Front Desk'
  | 'Housekeeping'
  | 'Food & Beverage'
  | 'Kitchen & Culinary'
  | 'Maintenance & Facilities'
  | 'Security & Safety'
  | 'Finance & Accounts'
  | 'Human Resources'
  | 'Management';

export type HRMSUserRole = 
  | 'super_admin'
  | 'hr_manager'
  | 'manager'
  | 'payroll_officer'
  | 'employee';

export interface EmployeeDocument {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  fileSize: string;
}

export interface Employee {
  id: string;
  employeeId: string; // e.g. "EMP-1001"
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  department: Department;
  jobTitle: string;
  joiningDate: string; // YYYY-MM-DD
  employmentType: EmploymentType;
  status: EmployeeStatus;
  assignedManagerId?: string;
  assignedManagerName?: string;
  workLocation: string; // e.g. "Main Resort", "Beachfront Wing", "Downtown Tower"
  defaultShiftId: string;
  salaryType: SalaryType;
  payRate: number; // monthly salary amount or hourly/daily rate
  bankDetails: {
    bankName: string;
    accountNumber: string;
    ifscOrRouting: string;
    taxIdOrPan: string;
  };
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  documents: EmployeeDocument[];
  notes?: string;
}

export interface Shift {
  id: string;
  name: string; // e.g. "Morning Shift"
  code: string; // "MS"
  startTime: string; // "06:00"
  endTime: string; // "14:00"
  isOvernight: boolean; // crosses midnight (e.g. 22:00 - 06:00)
  breakMinutes: number; // 30
  requiredWorkingHours: number; // 7.5
  color: string; // hex or tailwind token
  activeDays: number[]; // 0=Sun, 1=Mon... 6=Sat
  description?: string;
}

export type DutyScheduleStatus = 'scheduled' | 'weekly_off' | 'holiday' | 'leave';

export interface DutySchedule {
  id: string;
  employeeId: string;
  employeeName: string;
  department: Department;
  shiftId: string;
  shiftName: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  status: DutyScheduleStatus;
  notes?: string;
}

export type AttendanceStatus = 'present' | 'late' | 'half_day' | 'absent' | 'on_leave' | 'holiday' | 'weekly_off';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: Department;
  date: string; // YYYY-MM-DD
  clockIn?: string; // "08:58"
  clockOut?: string; // "17:05"
  breakStart?: string;
  breakEnd?: string;
  totalBreakMinutes: number;
  regularHours: number; // e.g. 8
  overtimeHours: number; // e.g. 1.5
  status: AttendanceStatus;
  isLate: boolean;
  lateMinutes: number;
  isEarlyDeparture: boolean;
  earlyDepartureMinutes: number;
  location?: string;
  notes?: string;
  isManualCorrection?: boolean;
  correctionStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  correctionReason?: string;
}

export interface AttendanceCorrectionRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: Department;
  date: string;
  requestedClockIn: string;
  requestedClockOut: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface OvertimeRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: Department;
  date: string; // YYYY-MM-DD
  hours: number;
  rateMultiplier: number; // 1.5x on normal, 2.0x on holiday/weekend
  hourlyRate: number;
  calculatedAmount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export type LeaveType = 
  | 'annual'
  | 'sick'
  | 'casual'
  | 'paid'
  | 'unpaid'
  | 'emergency'
  | 'maternity_paternity';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: Department;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface LeaveBalance {
  employeeId: string;
  annual: number;
  annualUsed: number;
  sick: number;
  sickUsed: number;
  casual: number;
  casualUsed: number;
  emergency: number;
  emergencyUsed: number;
  unpaidUsed: number;
}

export interface Holiday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  type: 'public' | 'company' | 'optional';
  description?: string;
}

export interface PayrollSalaryComponent {
  name: string;
  amount: number;
  type: 'earning' | 'deduction';
}

export interface PayrollRecord {
  id: string;
  payrollMonth: string; // "2026-10"
  employeeId: string;
  employeeName: string;
  department: Department;
  jobTitle: string;
  salaryType: SalaryType;
  basePay: number;
  workingDaysInMonth: number;
  actualPresentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  payableHours: number;
  overtimeHours: number;
  overtimePay: number;
  allowances: { name: string; amount: number }[]; // HRA, Transport, Meal, Bonus
  deductions: { name: string; amount: number }[]; // Tax, Provident Fund, Insurance, Unpaid Leave
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  paymentStatus: 'draft' | 'reviewed' | 'approved' | 'paid';
  paidAt?: string;
  paymentMethod?: 'bank_transfer' | 'direct_deposit' | 'cheque' | 'cash';
  transactionRef?: string;
  notes?: string;
}

export interface HRMSNotification {
  id: string;
  title: string;
  message: string;
  type: 'shift' | 'leave' | 'overtime' | 'attendance' | 'payroll' | 'announcement';
  date: string;
  isRead: boolean;
  targetEmployeeId?: string; // if null, for all/managers
}

export interface HRMSSettings {
  companyName: string;
  legalEntityName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  taxRegistrationNumber: string;
  standardDailyHours: number;
  standardWeeklyHours: number;
  overtimeRateWeekday: number; // 1.5
  overtimeRateWeekendOrHoliday: number; // 2.0
  defaultGracePeriodMinutes: number; // 15
  monthlyPayrollCutoffDay: number; // 28
  currency: string;
  unpaidLunchBreakMinutes: number;
  paidTeaBreakMinutes: number;
}

export interface HRMSAuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: string;
  details: string;
}
